# chat_core.py
import os, re, json, pathlib
from datetime import datetime
from typing import Dict, List, Optional, Tuple
from dotenv import load_dotenv
import google.generativeai as genai

# =========================================
# 텍스트 후처리: 모델 응답을 깔끔하게 정리
# - [ ... ] 대괄호를 제거(안의 글자는 남김)
# - 마크다운 강조 제거: **굵게**, __굵게__, *기울임*, _기울임_
# - 라인 전체가 큰따옴표로만 감싸져 있으면 제거
# - 완전히 동일한 라인은 한 번만 유지
# - 연속된 빈 줄은 1개로 축약
# =========================================
def normalize_model_text(text: str) -> str:
    # 1) [내용] -> 내용  (줄바꿈은 제외해 과매칭 방지)
    text = re.sub(r"\[([^\[\]\n]+)\]", r"\1", text)

    # 2) 마크다운 강조 제거
    text = re.sub(r"\*\*([^\*\n]+)\*\*", r"\1", text)     # **bold**
    text = re.sub(r"__([^_\n]+)__", r"\1", text)          # __bold__
    text = re.sub(r"(?<!\*)\*([^\*\n]+)\*(?!\*)", r"\1", text)  # *italic*
    text = re.sub(r"(?<!_)_([^_\n]+)_(?!_)", r"\1", text)       # _italic_

    # 3) 라인 전체가 큰따옴표로만 감싸져 있으면 바깥 따옴표 제거
    def strip_wrapping_quotes(line: str) -> str:
        s = line.strip()
        if len(s) >= 2 and s[0] == '"' and s[-1] == '"':
            return s[1:-1]
        return line

    lines = [ln.rstrip() for ln in text.splitlines()]
    lines = [strip_wrapping_quotes(ln) for ln in lines]

    # 4) 라인 단위 중복 제거
    seen = set()
    out_lines = []
    for ln in lines:
        if ln.strip() == "":
            out_lines.append("")
            continue
        if ln not in seen:
            out_lines.append(ln)
            seen.add(ln)

    # 5) 연속 빈 줄 축약
    compact = []
    for ln in out_lines:
        if ln == "":
            if not compact or compact[-1] != "":
                compact.append("")
        else:
            compact.append(ln)

    return "\n".join(compact).strip()


# -------- 상수/설정 (cli_chat.py와 동일) --------
SESS_DIR = pathlib.Path("sessions"); SESS_DIR.mkdir(exist_ok=True)
REPORT_DIR = pathlib.Path("reports"); REPORT_DIR.mkdir(exist_ok=True)

SCENARIOS: Dict[str, str] = {
    "국세청 환급 사칭": (
        "보이스피싱 훈련 역할극. 불법 조장 금지, 민감정보 수집 금지.\n"
        "너는 '국세청 환급 전담팀' 사칭 범인. 환급을 미끼로 정보 유도.\n"
        "실제 정보 대신 [계좌번호], [카드번호] 같은 자리표시자만 허용.\n"
        "정중하지만 촉박함/압류/형사처벌을 암시하는 톤."
    ),
    "은행 본인인증 사칭": (
        "보이스피싱 훈련 역할극. 불법/민감정보 금지.\n"
        "너는 X은행 보안센터 상담원 사칭. 이상거래 빌미로 본인인증/앱설치 유도.\n"
        "자리표시자만 허용. 원격앱/실링크/실결제 유도 금지."
    ),
    "택배·관세 사칭": (
        "보이스피싱 훈련 역할극. 불법/민감정보 금지.\n"
        "국제택배/관세청 사칭. 미납 관세/배송지 오류 빌미로 결제 정보 유도."
    ),
    "가족 납치·사고 협박": (
        "보이스피싱 훈련 역할극. 불법/폭력선동 금지.\n"
        "가족 급박상황(사고/납치) 연출로 금전 요구. 자리표시자만 허용."
    ),
    "고수익 아르바이트/투자": (
        "보이스피싱 훈련 역할극. 불법 조장 금지.\n"
        "단기 고수익/검증 방 유혹. 실 앱/링크 제공 금지, 자리표시자만."
    ),
}
OPENERS: Dict[str, str] = {
    "국세청 환급 사칭": "안녕하세요, 국세청 환급 전담팀입니다. 고객님 성함 확인 후 신속히 환급 도와드리겠습니다.",
    "은행 본인인증 사칭": "고객님, X은행 보안센터입니다. 방금 해외에서 의심 거래가 감지되어 계정 보호를 위해 본인 확인이 필요합니다.",
    "택배·관세 사칭": "국제특송 관세 안내 드립니다. 고객님의 화물이 통관 보류되어 소액 관세 정산 절차가 필요합니다.",
    "가족 납치·사고 협박": "지금 침착히 들으세요. 가족분이 사고로 위급한 상황이라 당장 조치가 필요합니다.",
    "고수익 아르바이트/투자": "안녕하세요. 초단기 검증된 수익 프로그램 안내드립니다. 오늘 등록자에 한해 수익 보장을 제공합니다.",
}

REPLACEMENTS = [
    (re.compile(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b"), "[이메일]"),
    (re.compile(r"\bhttps?://\S+\b"), "[URL]"),
    (re.compile(r"\b\d{6}-?\d{7}\b"), "[주민번호]"),
    (re.compile(r"\b\d{4}-?\d{4}-?\d{4}-?\d{4}\b"), "[카드번호]"),
    (re.compile(r"\b\d{2,4}-?\d{3,4}-?\d{4}\b"), "[전화번호]"),
    (re.compile(r"\b\d{10,14}\b"), "[계좌번호]"),
]
def redact(text: str) -> str:
    out = text
    for pat, repl in REPLACEMENTS:
        out = pat.sub(repl, out)
    out = re.sub(r"\b\d{4,}\b", "[민감정보]", out)
    return out


# -------- 모델 준비 --------
load_dotenv()
_API_KEY = os.getenv("GEMINI_API_KEY")
_MODEL_NAME = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
if not _API_KEY:
    raise RuntimeError("GEMINI_API_KEY가 .env에 없습니다.")
genai.configure(api_key=_API_KEY)

def _system_prompt(scenario: str) -> str:
    base = (
        "보이스피싱 **훈련용 역할극**. 불법 조장 금지, 민감정보 요구/수집/저장 금지. "
        "실제 정보는 절대 요청/저장하지 말고 [자리표시자]만 허용.\n"
    )
    return base + SCENARIOS.get(scenario, "")

def _model_for(scenario: str):
    return genai.GenerativeModel(_MODEL_NAME, system_instruction=_system_prompt(scenario))

def _sess_path(sid: int) -> pathlib.Path:
    return SESS_DIR / f"session_{sid:04d}.jsonl"

def new_session_id() -> int:
    ids = []
    for p in SESS_DIR.glob("session_*.jsonl"):
        try:
            ids.append(int(p.stem.split("_")[1]))
        except:
            pass
    return (max(ids) + 1) if ids else 1

def save_event(sid: int, role: str, text: str, scenario: Optional[str] = None) -> None:
    rec = {"t": datetime.now().isoformat(timespec="seconds"), "role": role, "text": text}
    if scenario is not None:
        rec["scenario"] = scenario
    with _sess_path(sid).open("a", encoding="utf-8") as f:
        f.write(json.dumps(rec, ensure_ascii=False) + "\n")

def load_history_for_chat(sid: int) -> List[Dict[str, str]]:
    hist = []
    p = _sess_path(sid)
    if not p.exists():
        return hist
    with p.open("r", encoding="utf-8") as f:
        for line in f:
            try:
                rec = json.loads(line)
                if rec["role"] in ("user", "model"):
                    hist.append({"role": rec["role"], "parts": rec["text"]})
            except:
                pass
    return hist

def load_full_transcript(sid: int) -> List[Dict]:
    rows = []
    p = _sess_path(sid)
    if not p.exists():
        return rows
    with p.open("r", encoding="utf-8") as f:
        for line in f:
            try:
                rec = json.loads(line)
                if rec["role"] in ("user", "model"):
                    rows.append(rec)
            except:
                pass
    return rows


# ========= 여기부터 공개 API(함수) =========

def list_scenarios() -> Dict[str, str]:
    """시나리오 설명 사전 반환"""
    return dict(SCENARIOS)

def get_opener(scenario: str) -> str:
    return OPENERS.get(scenario, "전화드렸습니다. 본인 확인을 위해 잠시만요.")

def start_session(scenario: str, sid: Optional[int] = None) -> Tuple[int, Dict]:
    """
    세션을 시작하고 첫 봇 멘트를 생성.
    return: (sid, {"text": first_line})
    """
    if scenario not in SCENARIOS:
        raise ValueError("알 수 없는 시나리오")
    sid = sid or new_session_id()
    save_event(sid, "system", f"scenario={scenario}", scenario=scenario)

    model = _model_for(scenario)
    chat = model.start_chat(history=[
        {"role": "user", "parts": "훈련을 시작해."},
        {"role": "model", "parts": "네, 훈련 규칙을 준수하며 진행하겠습니다."}
    ])
    begin_prompt = (
        "지금부터 '전화가 막 연결된 상황'으로 시작한다. "
        "너(사기범)가 먼저 1~2문장으로 자연스럽게 전화를 시작해라. "
        "훈련 규칙(불법/민감정보 금지, 자리표시자만)을 지켜라.\n"
        f"- 상황 힌트: {get_opener(scenario)}"
    )
    try:
        resp = chat.send_message(begin_prompt)
        first_line_raw = resp.text or ""
        first_line = normalize_model_text(first_line_raw)
    except Exception as e:
        first_line = f"(오류) {e}"
    save_event(sid, "model", first_line)
    return sid, {"text": first_line}

def send_user_message(sid: int, scenario: str, user_text: str) -> Dict:
    """
    사용자 입력을 기록하고 모델 응답을 반환.
    history는 세션 파일에서 자동 로드.
    """
    if scenario not in SCENARIOS:
        raise ValueError("알 수 없는 시나리오")
    safe_user = redact(user_text or "")
    save_event(sid, "user", safe_user)

    model = _model_for(scenario)
    chat = model.start_chat(history=load_history_for_chat(sid) or [
        {"role": "user", "parts": "훈련을 시작해."},
        {"role": "model", "parts": "네, 훈련 규칙을 준수하며 진행하겠습니다."}
    ])
    try:
        resp = chat.send_message(safe_user)
        text_raw = resp.text or ""
        text = normalize_model_text(text_raw)
    except Exception as e:
        text = f"(오류) {e}"
    save_event(sid, "model", text)
    return {"text": text}

def analyze_session_report(sid: int, scenario: str) -> pathlib.Path:
    """
    세션 전체를 분석해 Markdown 리포트를 파일로 저장하고 경로를 반환.
    """
    rows = load_full_transcript(sid)
    if not rows:
        raise RuntimeError("분석할 대화가 없습니다.")

    # 사람이 보기 쉬운 원문
    transcript_md = []
    for r in rows:
        role = "사용자" if r["role"] == "user" else "사기범(시뮬레이터)"
        transcript_md.append(f"- **{role}**: {r['text']}")
    transcript_text = "\n".join(transcript_md)

    # 코치 모델 (cli_chat.py의 ‘짧은 리포트’ 버전이 필요하면 여기 프롬프트를 바꾸면 됨)
    coach = genai.GenerativeModel(
        _MODEL_NAME,
        system_instruction=(
            "너는 보이스피싱 예방 코치다. 아래 훈련 대화(사용자 vs 사기범 시뮬레이터)를 평가해라.\n"
            "- 목적: 사용자가 보이스피싱 정황을 인지하고 안전하게 대응하도록 훈련.\n"
            "- 금칙: 실제 법률 자문처럼 단정 금지. 개인정보 재요구 금지.\n"
            "- 산출: 한국어 Markdown으로 간결·구조화하여 제공.\n"
            "섹션:\n"
            "1) 요약(2~3문장)\n"
            "2) 잘한 점(불릿 3~6)\n"
            "3) 개선할 점(불릿 3~6)\n"
            "4) 위험 신호 포착 순간(대화 일부를 인용 → 왜 위험한지)\n"
            "5) 다음에 이렇게 말해보세요(대안 멘트 3~5개)\n"
            "6) 종합 점수(0~100)와 레벨(초급/중급/상급)\n"
            "7) 즉시 실행 체크리스트(최대 3개)\n"
        )
    )

    prompt = (
        f"[시나리오] {scenario}\n\n"
        "다음은 세션 전체 대화입니다. 이를 바탕으로 평가/피드백을 만들어 주세요.\n"
        "민감정보는 자리표시자만 유지하세요.\n"
        "----- 대화 시작 -----\n"
        f"{transcript_text}\n"
        "----- 대화 끝 -----\n"
    )
    try:
        resp = coach.generate_content(prompt)
        report_md_raw = resp.text or "(빈 응답)"
        report_md = normalize_model_text(report_md_raw)  # 리포트도 가볍게 정리
    except Exception as e:
        raise RuntimeError(f"분석 중 오류: {e}")

    out_path = REPORT_DIR / f"report_session_{sid:04d}.md"
    with out_path.open("w", encoding="utf-8") as f:
        f.write(f"# 보이스 피싱 훈련 리포트 — 세션 #{sid:04d}\n\n")
        f.write(f"**시나리오:** {scenario}\n\n")
        f.write(report_md)
        f.write("\n\n---\n## 부록: 대화 원문\n")
        f.write(transcript_text)
        f.write("\n")
    return out_path
