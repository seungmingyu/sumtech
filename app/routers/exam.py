from fastapi import APIRouter, HTTPException, Request
from typing import Any, Dict
from app.LLM.chat_core import list_scenarios, get_opener, start_session, send_user_message, analyze_session_report
from fastapi.responses import HTMLResponse, FileResponse, JSONResponse
from fastapi.templating import Jinja2Templates

router = APIRouter(prefix="/api", tags=["chat"])
templates = Jinja2Templates(directory="templates")

@router.get("/chat-bot", response_class=HTMLResponse)
def voice_page(request: Request):
    return templates.TemplateResponse("chatbot.html", {"request": request})

@router.get("/meta")
def meta():
    sc = list_scenarios()
    opens = {k: get_opener(k) for k in sc.keys()}
    return {"scenarios": sc, "openers": opens, "model": "gemini-2.5-flash"} 

@router.post("/begin")
def begin(payload: Dict[str, Any]):
    scenario = payload.get("scenario")
    if scenario not in list_scenarios():
        raise HTTPException(400, "알 수 없는 시나리오")
    sid, first = start_session(scenario)
    return {"sid": sid, "text": first["text"]}

@router.post("/chat")
def chat(payload: Dict[str, Any]):
    sid = int(payload.get("sid") or 0)
    scenario = payload.get("scenario")
    message = payload.get("message", "")
    if sid <= 0:
        raise HTTPException(400, "sid가 필요합니다.")
    if scenario not in list_scenarios():
        raise HTTPException(400, "알 수 없는 시나리오")
    out = send_user_message(sid, scenario, message)
    return {"sid": sid, "text": out["text"]}

@router.post("/analyze")
def analyze_download(payload: Dict[str, Any]):
    """
    Markdown 리포트를 파일로 직접 내려줌 (브라우저 다운로드).
    """
    sid = int(payload.get("sid") or 0)
    scenario = payload.get("scenario") or ""
    if sid <= 0:
        raise HTTPException(400, "sid가 필요합니다.")
    if scenario not in list_scenarios():
        raise HTTPException(400, "알 수 없는 시나리오")

    path = analyze_session_report(sid, scenario)
    return FileResponse(path, filename=path.name, media_type="text/markdown")

@router.post("/analyze_json")
def analyze_json(payload: Dict[str, Any]):
    """
    모달용: Markdown 텍스트를 JSON으로 반환.
    """
    sid = int(payload.get("sid") or 0)
    scenario = payload.get("scenario") or ""
    if sid <= 0:
        raise HTTPException(400, "sid가 필요합니다.")
    if scenario not in list_scenarios():
        raise HTTPException(400, "알 수 없는 시나리오")

    path = analyze_session_report(sid, scenario)
    md = path.read_text(encoding="utf-8")
    return JSONResponse({"sid": sid, "path": str(path), "markdown": md})




@router.get("/quiz", response_class=HTMLResponse)
def voice_page(request: Request):
    return templates.TemplateResponse("quiz.html", {"request": request})
