import json
from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.templating import Jinja2Templates
from fastapi.requests import Request
from fastapi.responses import HTMLResponse, JSONResponse
from LLM.gemini import generate_rag_answer_from_audio
from starlette.concurrency import run_in_threadpool

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
        raise HTTPException(
            status_code=400,
            detail=f"오디오 파일만 업로드하세요. content_type={file.content_type}",
        )

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

    data["_transcript"] = transcript
    data["_filename"] = file.filename
    print(json.dumps(data, ensure_ascii=False, indent=2))
    return JSONResponse(content=data, media_type="application/json")
