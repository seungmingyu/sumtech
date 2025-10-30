// voice-analysis.js — SumTech Voice Phishing Detector (API 연동, no transcript card)

let selectedFile = null;
let lastApiResult = null;

// ===== DOM =====
const audioFileInput    = document.getElementById('audioFileInput');
const fileInfo          = document.getElementById('fileInfo');
const fileNameEl        = document.getElementById('fileName');
const removeFileBtn     = document.getElementById('removeFile');
const analyzeBtn        = document.getElementById('analyzeBtn');

const uploadZone        = document.getElementById('uploadZone');
const processingStatus  = document.getElementById('processingStatus');
const progressFill      = document.getElementById('progressFill');
const statusText        = document.getElementById('statusText');

const analysisResult    = document.getElementById('analysisResult');
const newAnalysisBtn    = document.getElementById('newAnalysisBtn');
const downloadReportBtn = document.getElementById('downloadReport');
const reportScamBtn     = document.getElementById('reportScam');

const deepfakeBadge     = document.getElementById('deepfakeBadge'); // voice.html result-header에 존재

// 결과 섹션 요소들 (※ 'transcriptionText'는 더 이상 사용하지 않음)
const suspiciousKeywords = document.getElementById('suspiciousKeywords');
const riskFactors        = document.getElementById('riskFactors');
const recommendations    = document.getElementById('recommendations');

// 위험도 카드
const meterFill         = document.getElementById('meterFill');
const riskPercentageEl  = document.getElementById('riskPercentage');
const riskLabelEl       = document.getElementById('riskLabel');
const riskDescriptionEl = document.getElementById('riskDescription');
const riskScoreCard     = document.querySelector('.risk-score-card');

// ===== Utilities =====
function escapeHtml(s) {
  return String(s).replace(/[&<>"'`=\/]/g, ch => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;','/':'&#x2F;','`':'&#x60;','=':'&#x3D;'
  }[ch]));
}
function setProgress(p, text) {
  progressFill.style.width = `${Math.max(0, Math.min(100, p))}%`;
  if (text) statusText.textContent = text;
}
function isPlaceholder(text) {
  if (text == null) return true;
  const s = String(text).trim();
  if (!s) return true;
  // evidence_spans_0, span_3, e12 같은 키/플레이스홀더 제거
  return (
    /^evidence(_spans)?(_\d+)?$/i.test(s) ||
    /^span(_\d+)?$/i.test(s) ||
    /^e\d+$/i.test(s) ||
    s === '-' || s === '•' || s.length <= 1
  );
}
function pretty(text) {
  return String(text).replace(/_/g, ' ').replace(/\s+/g, ' ').trim();
}
function uniq(arr) {
  return Array.from(new Set(arr.filter(Boolean)));
}

// ===== File selection =====
audioFileInput.addEventListener('change', (e) => {
  const file = e.target.files?.[0];
  if (!file) return;

  const validTypes = ['audio/mpeg','audio/wav','audio/mp3','audio/m4a','audio/x-m4a','audio/aac','audio/webm','audio/ogg'];
  if (!validTypes.includes(file.type) && !file.name.match(/\.(mp3|wav|m4a|aac|webm|ogg)$/i)) {
    alert('지원하지 않는 파일 형식입니다. MP3, WAV, M4A, OGG, WEBM, AAC만 지원합니다.');
    return;
  }
  if (file.size > 50 * 1024 * 1024) {
    alert('파일 크기가 너무 큽니다. 50MB 이하로 업로드해주세요.');
    return;
  }

  selectedFile = file;
  fileNameEl.textContent = file.name;
  fileInfo.style.display = 'flex';
  analyzeBtn.style.display = 'inline-flex';
});

removeFileBtn.addEventListener('click', resetAnalysis);

// ===== Drag & Drop =====
uploadZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  uploadZone.style.borderColor = 'var(--accent-teal)';
  uploadZone.style.background = 'rgba(26, 139, 141, 0.05)';
});
uploadZone.addEventListener('dragleave', (e) => {
  e.preventDefault();
  uploadZone.style.borderColor = 'var(--gray)';
  uploadZone.style.background = 'var(--white)';
});
uploadZone.addEventListener('drop', (e) => {
  e.preventDefault();
  uploadZone.style.borderColor = 'var(--gray)';
  uploadZone.style.background = 'var(--white)';
  const file = e.dataTransfer.files?.[0];
  if (!file) return;
  if (!(file.type.startsWith('audio/') || file.name.match(/\.(mp3|wav|m4a|aac|webm|ogg)$/i))) {
    alert('오디오 파일만 업로드 가능합니다.');
    return;
  }
  selectedFile = file;
  fileNameEl.textContent = file.name;
  fileInfo.style.display = 'flex';
  analyzeBtn.style.display = 'inline-flex';
});

// ===== Analyze =====
analyzeBtn.addEventListener('click', async () => {
  if (!selectedFile) return;

  // UI 전환
  uploadZone.style.display = 'none';
  processingStatus.style.display = 'block';
  setProgress(5, '업로드 준비 중...');

  try {
    const form = new FormData();
    form.append('file', selectedFile);

    setProgress(20, '파일 업로드 중...');
    const res = await fetch(`/scan/voice?k=5`, { method: 'POST', body: form });

    setProgress(60, 'AI 분석 중...');
    if (!res.ok) {
      let msg = `분석 실패 (HTTP ${res.status})`;
      try {
        const err = await res.json();
        if (err?.detail) msg = err.detail;
      } catch (_) {}
      throw new Error(msg);
    }

    const data = await res.json();
    lastApiResult = data;

    setProgress(90, '결과 정리 중...');
    renderResultFromApi(data);

    setProgress(100, '분석 완료!');
    processingStatus.style.display = 'none';
    analysisResult.style.display = 'block';
    setTimeout(() => analysisResult.scrollIntoView({ behavior: 'smooth', block: 'start' }), 150);

  } catch (err) {
    alert(`분석 중 오류: ${err.message}`);
    resetAnalysis();
  }
});

// ===== Render =====
function renderResultFromApi(data) {
  // 1) 위험도 (probability: 0~100 가정)
  const prob = Math.max(0, Math.min(100, parseInt(data.probability ?? 0, 10)));
  updateRiskScore(prob);

  // 2) 탐지 근거 / 키워드 / 대응
  suspiciousKeywords.innerHTML = '';
  riskFactors.innerHTML = '';
  recommendations.innerHTML = '';

  // 근거 수집: top_k_reasons 우선, 없으면 formatted_evidence / evidence 사용
  let reasons = [];
  if (Array.isArray(data.top_k_reasons)) {
    reasons = data.top_k_reasons.map(r => ({
      reason: pretty(r.reason || '탐지 근거'),
      evidence: Array.isArray(r.evidence) ? r.evidence.map(pretty) : []
    }));
  } else if (typeof data.formatted_evidence === 'string' && data.formatted_evidence.trim()) {
    const lines = data.formatted_evidence.split(/\n+/).map(pretty);
    reasons = [{ reason: '탐지 근거', evidence: lines }];
  } else if (typeof data.evidence === 'string' && data.evidence.trim()) {
    const lines = data.evidence.split(/\n+/).map(pretty);
    reasons = [{ reason: '탐지 근거', evidence: lines }];
  }

  // placeholder/키 제거 + 중복 제거
  reasons = reasons.map(r => {
    const ev = uniq(
      (r.evidence || [])
        .map(pretty)
        .filter(x => !isPlaceholder(x))
        .filter(x => x && x !== '-' && x !== '•')
    );
    return { reason: r.reason, evidence: ev };
  }).filter(r => r.reason || (r.evidence && r.evidence.length));

  if (reasons.length) {
    riskFactors.innerHTML =
      '<ol>' +
      reasons.map((r, idx) => {
        const sub = (r.evidence && r.evidence.length)
          ? '<ul>' + r.evidence.map(e => `<li>${escapeHtml(e)}</li>`).join('') + '</ul>'
          : '';
        return `<li><strong>${escapeHtml(r.reason || `근거 ${idx + 1}`)}</strong>${sub}</li>`;
      }).join('') +
      '</ol>';
  } else {
    riskFactors.textContent = '근거 없음';
  }

  // 키워드: 근거에서 추출하여 10개 제한
  const kwPool = uniq(
    reasons.flatMap(r => r.evidence || [])
      .map(x => x.replace(/[^\p{L}\p{N}\s\-.,]/gu, '')) // 이모지/특수기호 제거
      .map(pretty)
      .filter(x => !isPlaceholder(x))
      .filter(x => x.length >= 2 && x.length <= 40)
  );
  suspiciousKeywords.innerHTML = kwPool.length
    ? kwPool.slice(0, 10).map(k => `<span class="keyword-tag">${escapeHtml(k)}</span>`).join('')
    : '<span class="keyword-tag">의심 키워드 없음</span>';

  // 대응 방법
  if (typeof data.formatted_actions === 'string' && data.formatted_actions.trim()) {
    const lines = data.formatted_actions.split(/\n+/).map(pretty).filter(Boolean);
    recommendations.innerHTML = lines.map(l => `<p>${escapeHtml(l)}</p>`).join('');
  } else if (Array.isArray(data.recommended_actions)) {
    const items = data.recommended_actions.map(a => {
      const p = a.priority ? `[${escapeHtml(a.priority)}] ` : '';
      const line = `${p}${escapeHtml(pretty(a.action || ''))}`;
      const rsn = a.reason ? `<br>- 이유: ${escapeHtml(pretty(a.reason))}` : '';
      return `<p>${line}${rsn}</p>`;
    });
    recommendations.innerHTML = items.length ? items.join('') : '대응 가이드 없음';
  } else if (typeof data.solution === 'string' && data.solution.trim()) {
    const lines = data.solution.split(/\n+/).map(pretty).filter(Boolean);
    recommendations.innerHTML = lines.map(l => `<p>${escapeHtml(l)}</p>`).join('');
  } else {
    recommendations.textContent = '대응 가이드 없음';
  }

  // 3) 딥페이크 배지
  const df = data.deepfake_check;
  if (df && typeof df.detected !== 'undefined' && df.detected !== null) {
    deepfakeBadge.style.display = 'inline-flex';
    if (String(df.detected) === '1' || df.detected === 1 || df.detected === true) {
      deepfakeBadge.textContent = '딥페이크 의심';
      deepfakeBadge.classList.remove('safe');
      deepfakeBadge.classList.add('danger');
    } else {
      deepfakeBadge.textContent = '딥페이크 아님';
      deepfakeBadge.classList.remove('danger');
      deepfakeBadge.classList.add('safe');
    }
  } else {
    deepfakeBadge.style.display = 'none';
  }
}

// ===== Risk score meter =====
function updateRiskScore(score) {
  let cur = 0;
  const target = Math.round(score);
  const step = Math.max(1, Math.floor(target / 30)); // ~30틱
  const timer = setInterval(() => {
    cur = Math.min(target, cur + step);
    riskPercentageEl.textContent = `${cur}%`;
    if (cur >= target) clearInterval(timer);
  }, 16);

  if (score >= 70) {
    riskLabelEl.textContent = '높은 위험';
    riskDescriptionEl.textContent = '보이스피싱일 가능성이 매우 높습니다';
    riskScoreCard.style.background = 'linear-gradient(135deg, #4a0000, #8b0000)';
    meterFill.style.stroke = '#ff4444';
  } else if (score >= 40) {
    riskLabelEl.textContent = '주의 필요';
    riskDescriptionEl.textContent = '의심스러운 요소가 발견되었습니다';
    riskScoreCard.style.background = 'linear-gradient(135deg, #4a3800, #8b6914)';
    meterFill.style.stroke = '#fbbf24';
  } else {
    riskLabelEl.textContent = '낮은 위험';
    riskDescriptionEl.textContent = '안전한 통화로 판단됩니다';
    riskScoreCard.style.background = 'linear-gradient(135deg, #001a2e, #002e4f)';
    meterFill.style.stroke = '#00d9ff';
  }

  const circumference = 251.2;
  const offset = circumference - (score / 100) * circumference;
  meterFill.style.strokeDasharray = `${circumference} ${circumference}`;
  meterFill.style.strokeDashoffset = offset;
}

// ===== Result actions =====
newAnalysisBtn?.addEventListener('click', () => resetAnalysis());
downloadReportBtn?.addEventListener('click', () => {
  if (!lastApiResult) return alert('다운로드할 결과가 없습니다.');
  const name = (lastApiResult._filename || 'voice_analysis_result').replace(/\s+/g, '_');
  const blob = new Blob([JSON.stringify(lastApiResult, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `${name}.json`;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
});
reportScamBtn?.addEventListener('click', () => {
  const ok = confirm('보이스피싱 신고 페이지로 이동하시겠습니까?\n\n신고 번호:\n• 경찰청: 112\n• 금융감독원: 1332\n• 보이스피싱 전용: 1588-2112');
  if (ok) alert('신고가 접수되었습니다. 담당자가 확인 후 연락드리겠습니다.');
});

// ===== Reset =====
function resetAnalysis() {
  selectedFile = null;
  lastApiResult = null;

  audioFileInput.value = '';
  fileInfo.style.display = 'none';
  analyzeBtn.style.display = 'none';

  uploadZone.style.display = 'block';
  processingStatus.style.display = 'none';
  analysisResult.style.display = 'none';

  progressFill.style.width = '0%';
  statusText.textContent = '';

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

console.log('Voice Analysis (API-connected, no transcript section) ✅');
