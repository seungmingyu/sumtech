import json
from fastapi import APIRouter, UploadFile, File, HTTPException, Form
from fastapi.templating import Jinja2Templates
from fastapi.requests import Request
from fastapi.responses import HTMLResponse, JSONResponse
from app.LLM.voice_gemini import generate_rag_answer_from_audio
from starlette.concurrency import run_in_threadpool
from app.services.url_checker import JudgeUrls
from app.LLM.message_gemini import analyze_smishing_message

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

    transcript, rag_json = await run_in_threadpool(
        generate_rag_answer_from_audio,
        audio_bytes,
        file.content_type,
        k
    )

    try:
        data = json.loads(rag_json)
    except Exception:
        data = {
            "is_phishing": None,
            "evidence": "LLM 응답 파싱 실패",
            "solution": "기관 공식 대표번호로 재확인하고, 의심 시 112 또는 1332(금감원)로 문의하세요.",
            "reference_chunk_id": [],
        }

    if isinstance(data, dict):
        if "evidence" not in data:
            reasons = data.get("top_k_reasons") or []
            evidence_texts = []
            for r in reasons:
                rank = r.get("rank")
                reason = r.get("reason")
                evs = r.get("evidence") or []
                line = f"#{rank}. {reason}" if rank is not None else f"{reason}"
                if evs:
                    line += f"\n - 근거: {', '.join(evs)}"
                if reason:
                    evidence_texts.append(line)
            data["evidence"] = "\n\n".join(evidence_texts) if evidence_texts else "근거 없음"
        if "solution" not in data:
            actions = data.get("recommended_actions") or []
            action_texts = []
            for a in actions:
                pr = a.get("priority")
                act = a.get("action")
                rsn = a.get("reason")
                line = f"{f'[{pr}] ' if pr else ''}{act}" if act else ""
                if rsn:
                    line += f"\n - 이유: {rsn}"
                if line:
                    action_texts.append(line)
            data["solution"] = "\n\n".join(action_texts) if action_texts else "대응 가이드 없음"

    data["_transcript"] = transcript
    data["_filename"] = file.filename
    print(json.dumps(data, ensure_ascii=False, indent=2))
    return JSONResponse(content=data, media_type="application/json")

@router.post("/message")
def scan_message(text: str = Form(...)):
    if not text.strip():
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
