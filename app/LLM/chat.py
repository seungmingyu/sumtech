# cli_chat.py
import os, sys, json, re, time, pathlib
from datetime import datetime
from dotenv import load_dotenv
import google.generativeai as genai

def normalize_model_text(text: str) -> str:
    """
    - [ ... ] 대괄호를 모두 제거(안의 글자는 남김)
    - 마크다운 강조 제거: **굵게**, __굵게__, *기울임*, _기울임_
    - 라인 시작·끝의 큰따옴표만 감싸고 있으면 제거
    - 완전히 동일한 라인은 한 번만 유지
    - 연속된 빈 줄은 1개로 축약
    """
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
    # 3-1) 따옴표 처리
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
        # 이미 본 라인은 스킵

    # 5) 연속 빈 줄 축약
    compact = []
    for ln in out_lines:
        if ln == "":
            if not compact or compact[-1] != "":
                compact.append("")
        else:
            compact.append(ln)

    return "\n".join(compact).strip()

# ---------- 기본 설정 ----------
SESS_DIR = pathlib.Path("sessions")
SESS_DIR.mkdir(exist_ok=True)
REPORT_DIR = pathlib.Path("reports")
REPORT_DIR.mkdir(exist_ok=True)

SCENARIOS = {
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

OPENERS = {
    "국세청 환급 사칭": "안녕하세요, 국세청 환급 전담팀입니다. 고객님 성함 확인 후 신속히 환급 도와드리겠습니다.",
    "은행 본인인증 사칭": "고객님, X은행 보안센터입니다. 방금 해외에서 의심 거래가 감지되어 계정 보호를 위해 본인 확인이 필요합니다.",
    "택배·관세 사칭": "국제특송 관세 안내 드립니다. 고객님의 화물이 통관 보류되어 소액 관세 정산 절차가 필요합니다.",
    "가족 납치·사고 협박": "지금 침착히 들으세요. 가족분이 사고로 위급한 상황이라 당장 조치가 필요합니다.",
    "고수익 아르바이트/투자": "안녕하세요. 초단기 검증된 수익 프로그램 안내드립니다. 오늘 등록자에 한해 수익 보장을 제공합니다.",
}

REPLACEMENTS = {
    r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b": "[이메일]",
    r"\bhttps?://\S+\b": "[URL]",
    r"\b\d{6}-?\d{7}\b": "[주민번호]",
    r"\b\d{4}-?\d{4}-?\d{4}-?\d{4}\b": "[카드번호]",
    r"\b\d{2,4}-?\d{3,4}-?\d{4}\b": "[전화번호]",
    r"\b\d{10,14}\b": "[계좌번호]",
}
def redact(text: str) -> str:
    out = text
    for pat, repl in REPLACEMENTS.items():
        out = re.sub(pat, repl, out)
    out = re.sub(r"\b\d{4,}\b", "[민감정보]", out)
    return out

# ---------- 모델 준비 ----------
load_dotenv()
API_KEY = os.getenv("GEMINI_API_KEY")
MODEL_NAME = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
if not API_KEY:
    print("GEMINI_API_KEY가 .env에 없습니다."); sys.exit(1)
genai.configure(api_key=API_KEY)

def new_session_id() -> int:
    ids = []
    for p in SESS_DIR.glob("session_*.jsonl"):
        try: ids.append(int(p.stem.split("_")[1]))
        except: pass
    return (max(ids) + 1) if ids else 1

def session_path(sid: int) -> pathlib.Path:
    return SESS_DIR / f"session_{sid:04d}.jsonl"

def save_event(sid: int, role: str, text: str, scenario: str = None):
    rec = {"t": datetime.now().isoformat(timespec="seconds"), "role": role, "text": text}
    if scenario is not None:
        rec["scenario"] = scenario
    with session_path(sid).open("a", encoding="utf-8") as f:
        f.write(json.dumps(rec, ensure_ascii=False) + "\n")

def load_history_for_chat(sid: int):
    hist = []
    p = session_path(sid)
    if not p.exists(): return hist
    with p.open("r", encoding="utf-8") as f:
        for line in f:
            try:
                rec = json.loads(line)
                if rec["role"] in ("user","model"):
                    hist.append({"role": rec["role"], "parts": rec["text"]})
            except: pass
    return hist

def load_full_transcript(sid: int):
    """UI 없이 전체 리포트용으로 시각적 트랜스크립트를 구성"""
    rows = []
    p = session_path(sid)
    if not p.exists(): return rows
    with p.open("r", encoding="utf-8") as f:
        for line in f:
            try:
                rec = json.loads(line)
                if rec["role"] in ("user","model"):
                    rows.append(rec)
            except: pass
    return rows

def pick_scenario() -> str:
    print("\n[시나리오 선택]")
    keys = list(SCENARIOS.keys())
    for i,k in enumerate(keys, 1):
        print(f"  {i}. {k}")
    while True:
        sel = input("\n번호를 선택하세요: ").strip()
        if sel.isdigit() and 1 <= int(sel) <= len(keys):
            return keys[int(sel)-1]
        print("다시 입력해주세요.")

HELP = """\
명령어:
  /new            새 세션 생성
  /list           세션 파일 목록
  /switch N       N번 세션으로 전환
  /scenario       현재 시나리오 다시 표시
  /analyze        현 세션 대화 전체를 분석(잘한 점/개선할 점/대안/점수)하고 보고서 저장 한줄 요약
  /help           도움말
  /quit           종료

  메시지를 입력하면 챗봇과 대화합니다.
"""

def start_call_and_print(chat, sid: int, scenario: str):
    opener = OPENERS.get(scenario, "전화드렸습니다. 본인 확인을 위해 잠시만요.")
    begin_prompt = (
        "지금부터 '전화가 막 연결된 상황'으로 시작한다. "
        "너(사기범)가 먼저 1~2문장으로 자연스럽게 전화를 시작해라. "
        "훈련 규칙(불법/민감정보 금지, 자리표시자만)을 지켜라.\n"
        f"- 상황 힌트: {opener}"
    )

    try:
        resp = chat.send_message(begin_prompt)
        first_line = normalize_model_text(resp.text)  # ← 후처리 적용
    except Exception as e:
        first_line = f"(오류) {e}"

    print(f"[#{sid}] Scam> {first_line}")
    save_event(sid, "model", first_line)

def make_chat_for_scenario(scenario: str, prev_history=None):
    sys_prompt = (
        "보이스피싱 **훈련용 역할극**. 불법 조장 금지, 민감정보 요구/수집/저장 금지. "
        "실제 정보는 절대 요청/저장하지 말고 [자리표시자]만 허용.\n"
        + SCENARIOS[scenario]
    )
    model = genai.GenerativeModel(MODEL_NAME, system_instruction=sys_prompt)
    history = prev_history if prev_history else [
        {"role":"user","parts":"훈련을 시작해."},
        {"role":"model","parts":"네, 훈련 규칙을 준수하며 진행하겠습니다."}
    ]
    return model.start_chat(history=history)

def analyze_session(sid: int, scenario: str):
    """
    세션 전체 대화를 코치 프롬프트로 분석하고 Markdown 리포트로 저장/출력
    """
    rows = load_full_transcript(sid)
    if not rows:
        print("분석할 대화가 없습니다.")
        return

    # 사람이 보기 쉬운 대화 원문 생성 (타임스탬프 제외)
    transcript_md = []
    for r in rows:
        role = "사용자" if r["role"] == "user" else "사기범(시뮬레이터)"
        transcript_md.append(f"- **{role}**: {r['text']}")
    transcript_text = "\n".join(transcript_md)

    # 코치 모델
    coach = genai.GenerativeModel(
        MODEL_NAME,
        system_instruction=(
            "너는 보이스피싱 예방 코치다. 아래 훈련 대화를 짧게 평가한다.\n"
            "- 목적: 사용자가 정황을 인지하고 안전하게 대응하도록 돕기.\n"
            "- 금칙: 실제 법률 자문처럼 단정 금지, 개인정보 재요구 금지.\n"
            "- 형식: 한국어 Markdown, 간결하게.\n"
            "섹션:\n"
            "1) 한줄 요약(1문장)\n"
            "2) 잘한 점(불릿 최대 3개, 각 1문장)\n"
            "3) 개선할 점(불릿 최대 3개, 각 1문장)\n"
            "4) 다음에 이렇게 말해보세요(불릿 3개, 각 1문장)\n"
            "5) 점수(0~100)와 레벨(초/중/상)\n"
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
        report_md = resp.text
    except Exception as e:
        print("분석 중 오류:", e)
        return

    # 저장
    out_path = REPORT_DIR / f"report_session_{sid:04d}.md"
    with out_path.open("w", encoding="utf-8") as f:
        f.write(f"# 보이스 피싱 훈련 리포트 — 세션 #{sid:04d}\n\n")
        f.write(f"**시나리오:** {scenario}\n\n")
        f.write(report_md)
        f.write("\n\n---\n## 부록: 대화 원문\n")
        f.write(transcript_text)
        f.write("\n")

    print("\n=== 분석 결과 (요약 출력) ===")
    # 화면에는 상단 60줄만 간단히 보여줌
    lines = (f"# 세션 #{sid:04d} 분석\n\n" + report_md).splitlines()
    for ln in lines[:60]:
        print(ln)
    if len(lines) > 60:
        print("... (생략)")

    print(f"\n완료: Markdown 리포트 저장 → {out_path.resolve()}")

def main():
    print("\n=== 보이스 피싱 훈련 챗봇 ===\n")
    print(HELP)

    sid = new_session_id()
    scenario = pick_scenario()
    print(f"[세션 #{sid}] 시나리오 = {scenario}")

    chat = make_chat_for_scenario(scenario, prev_history=load_history_for_chat(sid))
    save_event(sid, "system", f"scenario={scenario}", scenario=scenario)
    start_call_and_print(chat, sid, scenario)

    while True:
        user = input(f"[#{sid}] You> ").strip()
        if not user:
            continue
        if user.startswith("/"):
            cmd, *rest = user.split()
            if cmd == "/quit":
                print("안녕!")
                break
            elif cmd == "/help":
                print(HELP)
            elif cmd == "/list":
                for p in sorted(SESS_DIR.glob("session_*.jsonl")):
                    print(" ", p.name)
            elif cmd == "/new":
                sid = new_session_id()
                scenario = pick_scenario()
                print(f"[새 세션 #{sid}] 시나리오 = {scenario}")
                chat = make_chat_for_scenario(scenario)
                save_event(sid, "system", f"scenario={scenario}", scenario=scenario)
                start_call_and_print(chat, sid, scenario)
            elif cmd == "/switch":
                if not rest or not rest[0].isdigit():
                    print("사용법: /switch N")
                    continue
                new_sid = int(rest[0])
                if not session_path(new_sid).exists():
                    print(f"세션 #{new_sid}가 없습니다.")
                    continue
                sid = new_sid
                # 최근 시나리오
                scenario_found = None
                with session_path(sid).open("r", encoding="utf-8") as f:
                    for line in f:
                        try:
                            rec = json.loads(line)
                            if rec.get("scenario"):
                                scenario_found = rec["scenario"]
                        except: pass
                scenario = scenario_found or pick_scenario()
                print(f"[세션 전환 #{sid}] 시나리오 = {scenario}")
                chat = make_chat_for_scenario(scenario, prev_history=load_history_for_chat(sid))
                start_call_and_print(chat, sid, scenario)
            elif cmd == "/scenario":
                print(f"[#{sid}] 현재 시나리오:\n{scenario}\n---\n{SCENARIOS[scenario]}")
            elif cmd == "/analyze":
                analyze_session(sid, scenario)
            else:
                print("알 수 없는 명령입니다. /help 를 입력하세요.")
            continue

        # 일반 메시지
        safe_user = redact(user)
        save_event(sid, "user", safe_user)
        try:
            resp = chat.send_message(safe_user)
            text = normalize_model_text(resp.text)
        except Exception as e:
            text = f"(오류) {e}"
        print(f"[#{sid}] Scam> {text}")
        save_event(sid, "model", text)

if __name__ == "__main__":
    main()