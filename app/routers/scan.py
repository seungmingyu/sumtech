import json
from fastapi import APIRouter, UploadFile, File, HTTPException, Form, Request
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse, JSONResponse, FileResponse
from starlette.concurrency import run_in_threadpool
from app.LLM.voice_gemini import generate_rag_answer_from_audio
from app.LLM.message_gemini import analyze_smishing_message
from app.services.url_checker import JudgeUrls

router = APIRouter(prefix="/scan")
templates = Jinja2Templates(directory="templates")

@router.get("/voice", response_class=HTMLResponse)
def voice_page(request: Request):
    return templates.TemplateResponse("voice.html", {"request": request})

@router.get("/message", response_class=HTMLResponse)
def message_page(request: Request):
    return templates.TemplateResponse("message.html", {"request": request})

@router.post("/voice")
async def scan_voice(file: UploadFile = File(...), k: int = 5):
    if not file.content_type or not file.content_type.startswith("audio/"):
        raise HTTPException(status_code=400, detail=f"오디오 파일만 업로드하세요. content_type={file.content_type}")
    audio_bytes = await file.read()
    if not audio_bytes:
        raise HTTPException(status_code=400, detail="비어있는 파일입니다.")
    transcript, rag_json = await run_in_threadpool(generate_rag_answer_from_audio, audio_bytes, file.content_type, k)
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
            reason_text = r.get("reason") or ""
            evs = r.get("evidence") or []
            human_evs = [e for e in evs if not (isinstance(e, str) and e.startswith("index_"))]
            if not human_evs:
                human_evs = []
            cleaned_reasons.append({"reason": reason_text, "evidence": human_evs})
        data["top_k_reasons"] = cleaned_reasons

        action_list = data.get("recommended_actions", [])
        cleaned_actions = []
        for a in action_list:
            pr = a.get("priority") or ""
            act = a.get("action") or ""
            rsn = a.get("reason") or ""
            cleaned_actions.append({"priority": pr, "action": act, "reason": rsn})
        data["recommended_actions"] = cleaned_actions

        evidence_texts = []
        for idx, r in enumerate(data.get("top_k_reasons", []), start=1):
            title = r.get("reason") or f"근거 {idx}"
            evid = r.get("evidence") or []
            if evid:
                evid_lines = "\n  - ".join(evid)
                evidence_texts.append(f"{idx}. {title}\n  - {evid_lines}")
            else:
                evidence_texts.append(f"{idx}. {title}\n  - 근거 없음")
        data["evidence"] = "\n\n".join(evidence_texts) if evidence_texts else "근거 없음"

        action_texts = []
        for a in data.get("recommended_actions", []):
            pr = f"[{a.get('priority')}]" if a.get("priority") else ""
            act = a.get("action") or ""
            rsn = a.get("reason") or ""
            if rsn:
                action_texts.append(f"{pr} {act}\n  - 이유: {rsn}")
            else:
                action_texts.append(f"{pr} {act}")
        data["solution"] = "\n\n".join(a for a in action_texts if a) or "대응 가이드 없음"

    data["_transcript"] = transcript
    data["_filename"] = file.filename
    print(json.dumps(data, ensure_ascii=False, indent=2))
    return JSONResponse(content=data, media_type="application/json")

@router.post("/message")
def scan_message(text: str = Form(...)):
    if not text or not text.strip():
        raise HTTPException(status_code=400, detail="text is empty")
    dic = JudgeUrls(text)
    if any(dic.values()):
        url_check_result = "True"
    elif len(dic) == 0:
        url_check_result = "N/A"
    else:
        url_check_result = "False"
    gemini_output = analyze_smishing_message(text, url_check_result)
    result = {
        "url_analysis": dic,
        "url_overall": url_check_result,
        "gemini_result": gemini_output,
    }
    return JSONResponse(content=result, media_type="application/json")
