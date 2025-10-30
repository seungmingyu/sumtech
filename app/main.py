from fastapi import FastAPI, Request
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse
from app.routers import scan, exam
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles


app = FastAPI()
templates = Jinja2Templates(directory="templates")
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/", response_class=HTMLResponse)
def index_page( request: Request):

    return templates.TemplateResponse("index.html", {"request": request})



app.include_router(scan.router)
app.include_router(exam.router)