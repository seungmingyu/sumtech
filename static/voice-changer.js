// 음성 분석 대시보드 스크립트
let analysisTimer = null;
let analysisProgress = 0;
let isAnalyzing = false;
let uploadedFile = null;

const DEFAULT_STATE = {
  verdict: "근거 부족",
  summary: "증거 자료가 부족하여 판별할 수 없습니다.",
  transcript: "",
  evidence: "",
  response: ""
};

document.addEventListener("DOMContentLoaded", () => {
  const startBtn = document.getElementById("startAnalysisBtn");
  const resetBtn = document.getElementById("resetAnalysisBtn");
  const fileInput = document.getElementById("audioFileInput");
  const selectFileBtn = document.getElementById("selectFileBtn");
  const uploadArea = document.getElementById("uploadArea");
  const uploadInfo = document.getElementById("uploadInfo");
  const removeFileBtn = document.getElementById("removeFileBtn");

  startBtn.addEventListener("click", () => startAnalysis(startBtn));
  resetBtn.addEventListener("click", () => resetDashboard(startBtn));
  selectFileBtn.addEventListener("click", () => fileInput.click());
  uploadArea.addEventListener("click", () => fileInput.click());
  fileInput.addEventListener("change", (e) => handleFileSelect(e.target.files[0]));

  uploadArea.addEventListener("dragover", (e) => {
    e.preventDefault();
    uploadArea.classList.add("dragover");
  });
  uploadArea.addEventListener("dragleave", () => uploadArea.classList.remove("dragover"));
  uploadArea.addEventListener("drop", (e) => {
    e.preventDefault();
    uploadArea.classList.remove("dragover");
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("audio/")) handleFileSelect(file);
    else alert("오디오 파일만 업로드할 수 있습니다.");
  });

  removeFileBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    removeFile();
  });

  document.querySelectorAll(".quick-action").forEach((button) => {
    button.addEventListener("click", () => handleQuickAction(button.dataset.action));
  });

  resetDashboard(startBtn);
});

async function startAnalysis(startButton) {
  if (isAnalyzing) return;
  if (!uploadedFile) {
    alert("먼저 음성 파일을 업로드해주세요.");
    return;
  }

  isAnalyzing = true;
  analysisProgress = 0;
  updateProgress(analysisProgress);
  startButton.disabled = true;
  startButton.textContent = "분석 중…";
  startProgressAnimation();

  try {
    const formData = new FormData();
    formData.append("file", uploadedFile);

    const res = await fetch("/scan/voice", { method: "POST", body: formData });
    if (!res.ok) {
      let msg = "서버 오류: " + res.status;
      try {
        const j = await res.json();
        if (j && j.detail) msg = j.detail;
      } catch {}
      throw new Error(msg);
    }

    const data = await res.json();
    completeAnalysis(startButton, data);
  } catch (err) {
    clearInterval(analysisTimer);
    isAnalyzing = false;
    startButton.textContent = "분석 시작";
    startButton.disabled = false;
    alert("분석 오류: " + (err?.message || String(err)));
    console.error(err);
  }
}

function startProgressAnimation() {
  const checkpoints = [15, 30, 55, 80, 95];
  let step = 0;

  analysisTimer = setInterval(() => {
    if (analysisProgress >= checkpoints[step]) step++;
    const target = checkpoints[Math.min(step, checkpoints.length - 1)];
    analysisProgress = Math.min(analysisProgress + Math.random() * 5, target);
    updateProgress(analysisProgress);
  }, 400);
}

function completeAnalysis(startButton, apiData) {
  clearInterval(analysisTimer);
  analysisProgress = 100;

  const result = parseApiResponse(apiData);
  updateProgress(analysisProgress, result);
  window.__lastApiData = apiData;

  startButton.textContent = "분석 완료";
  startButton.disabled = false;
  isAnalyzing = false;
}

function parseApiResponse(data) {
  const prob = toInt(data?.probability, 0);
  const isPhish = data?.is_phishing;
  const verdict = toVerdict(isPhish, prob);
  const summary = data?.explanation || data?.notes || "AI 분석이 완료되었습니다.";
  const transcript = data?._transcript || data?.transcript || "";

  const evidenceText = buildEvidenceText(data);
  const responseText = buildActionText(data);

  return {
    verdict,
    summary,
    transcript: transcript || JSON.stringify(data, null, 2),
    evidence: evidenceText,
    response: responseText,
    _rawData: data
  };
}

function buildEvidenceText(data) {
  if (typeof data?.evidence === "string" && data.evidence.trim()) return data.evidence;

  const reasons = Array.isArray(data?.top_k_reasons) ? data.top_k_reasons : [];
  if (!reasons.length) return "근거 없음";

  return reasons.map((r) => {
    const title = (r?.reason || "").trim();
    const evid = Array.isArray(r?.evidence) ? r.evidence.filter(Boolean) : [];
    const evidLines = evid.length ? "\n  - " + evid.join("\n  - ") : "";
    return `• ${title}${evidLines}`;
  }).join("\n\n");
}

function buildActionText(data) {
  if (typeof data?.solution === "string" && data.solution.trim()) return data.solution;

  const actions = Array.isArray(data?.recommended_actions) ? data.recommended_actions : [];
  if (!actions.length) return "대응 가이드 없음";

  return actions.map((a) => {
    const tag = a?.priority ? `[${a.priority}] ` : "";
    const line = (a?.action || "").trim();
    const why = a?.reason ? `\n  - 이유: ${a.reason}` : "";
    return `${tag}${line}${why}`;
  }).join("\n\n");
}

function toInt(v, d = 0) {
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) ? n : d;
}

function toVerdict(isPhish, prob) {
  if (isPhish === true) {
    if (prob >= 85) return "매우 위험";
    if (prob >= 60) return "위험";
    return "의심 통화";
  }
  if (isPhish === false) {
    if (prob <= 30) return "안전";
    return "의심 통화";
  }
  if (prob >= 70) return "위험";
  if (prob >= 40) return "의심 통화";
  return "근거 부족";
}

function resetDashboard(startButton) {
  clearInterval(analysisTimer);
  analysisProgress = 0;
  isAnalyzing = false;
  updateProgress(analysisProgress, DEFAULT_STATE);
  startButton.textContent = "분석 시작";
  startButton.disabled = false;
}

function updateProgress(value, result = null) {
  const percent = Math.round(value);
  const bar = document.getElementById("analysisProgressBar");
  const percentLabel = document.getElementById("analysisProgressPercent");
  const circle = document.getElementById("analysisProgressCircle");
  const valueLabel = circle.querySelector(".progress-value");
  const verdictLabel = document.getElementById("analysisVerdict");
  const summaryLabel = document.getElementById("analysisSummary");

  bar.style.width = `${percent}%`;
  percentLabel.textContent = `${percent}%`;
  circle.style.setProperty("--progress", `${percent * 3.6}deg`);
  valueLabel.textContent = `${percent}%`;

  if (result) {
    verdictLabel.textContent = result.verdict;
    summaryLabel.textContent = result.summary;
    circle.style.setProperty("--progress-color", result.verdict.includes("위험") ? "#ef4444" : "#38bdf8");
    updateResultFields(result);
  } else {
    verdictLabel.textContent = DEFAULT_STATE.verdict;
    summaryLabel.textContent = DEFAULT_STATE.summary;
    circle.style.setProperty("--progress-color", "#38bdf8");
    updateResultFields(DEFAULT_STATE);
  }
}

function updateResultFields(result) {
  const transcriptEl = document.getElementById("transcriptResult");
  const evList = document.getElementById("evidenceList");
  const actList = document.getElementById("actionList");

  transcriptEl.textContent = result.transcript || "";
  renderEvidenceList(evList, result._rawData || result);
  renderActionList(actList, result._rawData || result);
}

function renderEvidenceList(ul, data) {
  ul.innerHTML = "";
  const reasons = Array.isArray(data?.top_k_reasons) ? data.top_k_reasons : [];

  if (!reasons.length) {
    ul.innerHTML = `<li><span class="sub">근거 없음</span></li>`;
    return;
  }

  for (const r of reasons) {
    const li = document.createElement("li");
    const title = document.createElement("div");
    title.className = "title";
    title.textContent = (r?.reason || "").trim();
    li.appendChild(title);

    const evidArr = Array.isArray(r?.evidence) ? r.evidence.filter(Boolean) : [];
    if (evidArr.length) {
      const sub = document.createElement("div");
      sub.className = "sub";
      sub.innerHTML = evidArr.map(t => `• ${escapeHTML(String(t))}`).join("<br>");
      li.appendChild(sub);
    }
    ul.appendChild(li);
  }
}

function renderActionList(ul, data) {
  ul.innerHTML = "";
  const actions = Array.isArray(data?.recommended_actions) ? data.recommended_actions : [];

  if (!actions.length) {
    ul.innerHTML = `<li><span class="sub">대응 가이드 없음</span></li>`;
    return;
  }

  for (const a of actions) {
    const li = document.createElement("li");
    const title = document.createElement("div");
    title.className = "title";

    if (a?.priority) {
      const badge = document.createElement("span");
      badge.className = "badge red";
      badge.textContent = a.priority;
      title.appendChild(badge);
    }
    const t = document.createElement("span");
    t.textContent = a?.action || "";
    title.appendChild(t);
    li.appendChild(title);

    if (a?.reason) {
      const sub = document.createElement("div");
      sub.className = "sub";
      sub.textContent = `이유: ${a.reason}`;
      li.appendChild(sub);
    }
    ul.appendChild(li);
  }
}

function escapeHTML(s) {
  return s.replace(/[&<>"']/g, m => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[m]));
}

function handleFileSelect(file) {
  if (!file) return;
  uploadedFile = file;
  const uploadArea = document.getElementById("uploadArea");
  const uploadInfo = document.getElementById("uploadInfo");
  const fileName = document.getElementById("fileName");
  const fileSize = document.getElementById("fileSize");
  const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
  fileName.textContent = file.name;
  fileSize.textContent = `${sizeMB} MB`;
  uploadArea.style.display = "none";
  uploadInfo.style.display = "block";
}

function removeFile() {
  const uploadArea = document.getElementById("uploadArea");
  const uploadInfo = document.getElementById("uploadInfo");
  const fileInput = document.getElementById("audioFileInput");
  uploadedFile = null;
  fileInput.value = "";
  uploadArea.style.display = "block";
  uploadInfo.style.display = "none";
}

function handleQuickAction(action) {
  if (action === "police") {
    window.location.href = "tel:112";
    return;
  }
  if (action === "financial") {
    window.open("https://www.fss.or.kr/", "_blank");
    return;
  }
  if (action === "report") {
    const raw = document.getElementById("transcriptResult")?.textContent || "";
    const data = window.__lastApiData || {};
    const payload = {
      generated_at: new Date().toISOString(),
      probability: data?.probability ?? null,
      is_phishing: data?.is_phishing ?? null,
      transcript: raw,
      top_k_reasons: data?.top_k_reasons ?? [],
      recommended_actions: data?.recommended_actions ?? [],
      explanation: data?.explanation ?? ""
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "voicephishing_report.json";
    a.click();
    URL.revokeObjectURL(url);
    return;
  }
  if (action === "faq") {
    alert("전문 상담원 연결 신청 페이지로 이동합니다.");
    return;
  }
}
