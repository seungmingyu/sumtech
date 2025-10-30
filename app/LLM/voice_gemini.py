import os
import json
import base64
from dotenv import load_dotenv
from google import genai
from google.genai import types

load_dotenv()
_API_KEY = os.getenv("GEMINI_API_KEY")
if not _API_KEY:
    raise RuntimeError("GEMINI_API_KEY missing")
_client = genai.Client(api_key=_API_KEY)
_MODEL = "gemini-2.5-flash"

def _ensure_bytes(x):
    if isinstance(x, (bytes, bytearray, memoryview)):
        return bytes(x)
    if isinstance(x, str):
        try:
            return base64.b64decode(x, validate=True)
        except Exception:
            raise TypeError("audio_bytes must be bytes; got str. 파일을 읽어서 bytes로 전달하세요.")
    raise TypeError(f"audio_bytes must be bytes; got {type(x)}")

def _gen_text(contents, system_instruction=None, temperature=0.1) -> str:
    cfg = types.GenerateContentConfig(
        temperature=temperature,
        system_instruction=([types.Part.from_text(text=system_instruction)] if system_instruction else None),
    )
    out = []
    for ch in _client.models.generate_content_stream(model=_MODEL, contents=contents, config=cfg):
        if ch.text:
            out.append(ch.text)
    return "".join(out).strip()

def generate_rag_answer_from_audio(
    audio_bytes: bytes,
    mime_type: str | None = None,
    k: int = 3,
    deepfake_status: int | None = None
):
    mime = mime_type or "audio/mp4"
    audio_bytes = _ensure_bytes(audio_bytes)

    stt_contents = [
        types.Content(
            role="user",
            parts=[
                types.Part.from_text(text="다음 오디오를 한국어 평문으로만 정확히 전사하세요. 다른 문장 금지."),
                types.Part.from_bytes(data=audio_bytes, mime_type=mime),
            ],
        )
    ]
    transcript = _gen_text(stt_contents, system_instruction="한국어. 전사 텍스트만 출력.", temperature=0.1)

    policy_lines = []
    if deepfake_status == 1:
        policy_lines.append("- 이 통화는 딥페이크 가능성이 매우 높음으로 전제한다. 답변 전반에서 이를 명시하고 보수적으로 판단하라.")
    elif deepfake_status == 0:
        policy_lines.append("- 딥페이크 언급을 절대 하지 마라. 일반 통화 전제로 분석하라.")
    policy_text = "\n".join(policy_lines)

    analysis_prompt = f"""
아래 전사(transcript)를 분석하여 JSON으로만 결과를 반환하라.
형식:
{{
  "is_phishing": true|false|null,
  "probability": 0,
  "top_k_reasons": [{{"rank":1,"reason":"...","evidence":[]}}],
  "evidence_spans": [{{"text":"...","start":"00:00:12","end":"00:00:18"}}],
  "recommended_actions": [{{"priority":"즉시","action":"...","reason":"..."}}],
  "explanation": "...",
  "notes": "..."
}}
규칙:
- 확률은 0~100 정수.
- 근거는 간결하고 명확하게.
- 타임스탬프가 불명확하면 evidence에 인덱스 표기(index_7 등) 가능.
- 기준 예: >=70 true, 40~69 null, <40 false.
{policy_text}

[transcript]
{transcript}
""".strip()

    analysis_contents = [
        types.Content(role="user", parts=[types.Part.from_text(text=analysis_prompt)])
    ]
    rag_json = _gen_text(
        analysis_contents,
        system_instruction="오직 유효한 JSON만 출력. 코드블록/설명 금지.",
        temperature=0.1,
    )

    s, e = rag_json.find("{"), rag_json.rfind("}")
    if s != -1 and e != -1 and e > s:
        rag_json = rag_json[s:e+1]
    try:
        json.loads(rag_json)
    except Exception:
        rag_json = json.dumps({
            "is_phishing": None,
            "probability": 0,
            "top_k_reasons": [],
            "evidence_spans": [],
            "recommended_actions": [],
            "explanation": "모델 출력 파싱 실패",
            "notes": "원문을 확인하세요"
        }, ensure_ascii=False)

    return transcript, rag_json
