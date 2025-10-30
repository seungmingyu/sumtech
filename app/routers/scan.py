import json
from fastapi import APIRouter, UploadFile, File, HTTPException, Request
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse, JSONResponse
from starlette.concurrency import run_in_threadpool

from app.LLM.voice_gemini import generate_rag_answer_from_audio
from app.services.deepfake_checker import IsDeepfakeAudioFile

router = APIRouter(prefix="/scan")
templates = Jinja2Templates(directory="templates")

@router.get("/voice", response_class=HTMLResponse)
def voice_page(request: Request):
    return templates.TemplateResponse("voice.html", {"request": request})

@router.post("/voice")
async def scan_voice(file: UploadFile = File(...), k: int = 5):
    if not file.content_type or not file.content_type.startswith("audio/"):
        raise HTTPException(status_code=400, detail=f"오디오 파일만 업로드하세요. content_type={file.content_type}")

    audio_bytes = await file.read()
    if not isinstance(audio_bytes, (bytes, bytearray)) or len(audio_bytes) == 0:
        raise HTTPException(status_code=400, detail="비어있거나 잘못된 오디오 데이터입니다.")

    deepfake_raw = await run_in_threadpool(IsDeepfakeAudioFile, bytes(audio_bytes))
    deepfake_status = deepfake_raw if deepfake_raw in (0, 1) else None

    transcript, rag_json = await run_in_threadpool(
        generate_rag_answer_from_audio,
        bytes(audio_bytes),
        file.content_type or "audio/mp4",
        k,
        deepfake_status
    )

    try:
        data = json.loads(rag_json)
    except Exception:
        data = {
            "is_phishing": None,
            "probability": 0,
            "top_k_reasons": [],
            "evidence_spans": [],
            "recommended_actions": [],
            "explanation": "LLM 응답 파싱 실패",
            "notes": "원문을 확인하십시오."
        }

    if isinstance(data, dict):
        reasons = data.get("top_k_reasons", [])
        cleaned_reasons = []
        for r in reasons:
            if isinstance(r, dict):
                reason_text = r.get("reason") or ""
                evs = r.get("evidence") or []
            else:
                reason_text, evs = "", []
            human_evs = [e for e in evs if not (isinstance(e, str) and e.startswith("index_"))] or []
            cleaned_reasons.append({"reason": reason_text, "evidence": human_evs})
        data["top_k_reasons"] = cleaned_reasons

        action_list = data.get("recommended_actions", [])
        cleaned_actions = []
        for a in action_list:
            pr = a.get("priority") if isinstance(a, dict) else ""
            act = a.get("action") if isinstance(a, dict) else ""
            rsn = a.get("reason") if isinstance(a, dict) else ""
            cleaned_actions.append({"priority": pr or "", "action": act or "", "reason": rsn or ""})
        data["recommended_actions"] = cleaned_actions

        evidence_texts = []
        for idx, r in enumerate(data.get("top_k_reasons", []), start=1):
            title = r.get("reason") or f"근거 {idx}"
            evid = r.get("evidence") or []
            evidence_texts.append(f"{idx}. {title}\n  - " + ("\n  - ".join(evid) if evid else "근거 없음"))
        data["evidence"] = "\n\n".join(evidence_texts) if evidence_texts else "근거 없음"

        action_texts = []
        for a in data.get("recommended_actions", []):
            pr = f"[{a.get('priority')}]" if a.get("priority") else ""
            act = a.get("action") or ""
            rsn = a.get("reason") or ""
            action_texts.append(f"{pr} {act}\n  - 이유: {rsn}" if rsn else f"{pr} {act}")
        data["solution"] = "\n\n".join([t for t in action_texts if t]) or "대응 가이드 없음"

    data["_transcript"] = transcript
    data["_filename"] = file.filename
    data["deepfake_check"] = {
        "detected": deepfake_status,
        "raw": deepfake_raw,
        "model": "mo-thecreator/Deepfake-audio-detection"
    }

    return JSONResponse(content=data, media_type="application/json")
