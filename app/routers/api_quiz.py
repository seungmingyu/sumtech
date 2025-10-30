# app/routers/api_quiz.py
from fastapi import APIRouter, Query
from pydantic import BaseModel
from typing import List, Literal, Optional, Dict, Any
import random

# 업로드한 파이썬 파일들에서 QUIZ 가져오기
from app.services.quiz.delivery_quiz import QUIZ as DELIVERY
from app.services.quiz.family_quiz import QUIZ as FAMILY
from app.services.quiz.finance_quiz import QUIZ as FINANCE
from app.services.quiz.public_quiz import QUIZ as PUBLIC
from app.services.quiz.voice_quiz import QUIZ as VOICE

router = APIRouter(prefix="/api/quiz", tags=["quiz"])

# 토픽 레지스트리
TOPICS: Dict[str, Dict[str, Any]] = {
    "delivery": {"title": "🚚 택배 스미싱", "bank": DELIVERY},
    "finance":  {"title": "💰 금융/대출 사칭", "bank": FINANCE},
    "family":   {"title": "👩‍👧 가족/지인 사칭", "bank": FAMILY},
    "public":   {"title": "🏛️ 공공기관 사칭", "bank": PUBLIC},
    "voice":    {"title": "📞 보이스피싱 심화", "bank": VOICE},
}

class QuizItem(BaseModel):
    q: str
    options: List[str]
    answer: int
    explain: Optional[str] = None

class QuizResponse(BaseModel):
    topic: str
    topic_title: str
    total: int
    items: List[QuizItem]

@router.get("/topics")
def get_topics():
    """토픽 목록"""
    return [
        {"key": k, "title": v["title"], "count": len(v["bank"])}
        for k, v in TOPICS.items()
    ] + [{"key": "all", "title": "🎲 전체(랜덤)", "count": sum(len(v["bank"]) for v in TOPICS.values())}]

@router.get("", response_model=QuizResponse)
def get_quiz(
    topic: Literal["all", "delivery", "finance", "family", "public", "voice"] = "all",
    n: int = Query(10, ge=1, le=50),
    seed: Optional[int] = None,
):
    """토픽별 또는 전체 랜덤 퀴즈 제공"""
    rng = random.Random(seed)

    def _wrap(topic_key: str, row: dict) -> dict:
        # 파이썬 파일의 딕셔너리 키를 바로 신뢰 (q/options/answer/explain)
        return row

    if topic == "all":
        merged = []
        for k, v in TOPICS.items():
            merged.extend([_wrap(k, r) for r in v["bank"]])
        rng.shuffle(merged)
        items = merged[:n]
        t_title = "🎲 전체(랜덤)"
    else:
        bank = TOPICS[topic]["bank"][:]
        rng.shuffle(bank)
        items = bank[:n]
        t_title = TOPICS[topic]["title"]

    return QuizResponse(
        topic=topic,
        topic_title=t_title,
        total=len(items),
        items=[QuizItem(**it) for it in items],
    )
