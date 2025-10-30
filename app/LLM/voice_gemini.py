import os, json
from dotenv import load_dotenv
from google import genai
from google.genai import types

load_dotenv()
_API_KEY = os.getenv("GEMINI_API_KEY")
if not _API_KEY:
    raise RuntimeError("GEMINI_API_KEY missing")
_client = genai.Client(api_key=_API_KEY)
_MODEL = "gemini-2.5-flash"

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

def generate_rag_answer_from_audio(audio_bytes: bytes, mime_type: str | None = None, k: int = 3):
    mime = mime_type or "audio/mp4"

    stt_contents = [
        types.Content(
            role="user",
            parts=[
                types.Part.from_text(text="다음 오디오를 한국어 평문으로만 정확히 전사하세요. 다른 문장 금지."),
                types.Part.from_bytes(data=audio_bytes, mime_type=mime),
            ],
        )
    ]
    transcript = _gen_text(stt_contents, system_instruction="한국어. 전사 텍스트만 출력.")

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

[transcript]
{transcript}
"""
    analysis_contents = [
        types.Content(
            role="user",
            parts=[types.Part.from_text(text=analysis_prompt)],
        )
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
