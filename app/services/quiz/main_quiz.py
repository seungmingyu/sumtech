# -*- coding: utf-8 -*-
# ==========================================
# 📚 보이스피싱 상식 퀴즈 — 통합 실행기 (CLI)
# ==========================================
# 실행: python main_quiz.py
# ==========================================

import random
import sys

# ------------------------------------------
# 각 주제 모듈 import (같은 폴더 내 위치)
# ------------------------------------------
import delivery_quiz
import public_quiz
import family_quiz
import finance_quiz
import voice_quiz

TOPICS = [
    (delivery_quiz.TITLE, delivery_quiz.QUIZ),
    (public_quiz.TITLE,   public_quiz.QUIZ),
    (family_quiz.TITLE,   family_quiz.QUIZ),
    (finance_quiz.TITLE,  finance_quiz.QUIZ),
    (voice_quiz.TITLE,    voice_quiz.QUIZ),
]

# ------------------------------------------
# 신고/상담 링크 (✅ 프로그램 종료 시 한 번만 출력)
# ------------------------------------------
def append_links():
    return (
        "\n📞 신고/상담 안내\n"
        " - 경찰청 112 (긴급신고)\n"
        " - 금융감독원 1332 (금융사기)\n"
        " - KISA 118 / 스팸신고: https://spam.kisa.or.kr\n"
        " - 사이버범죄신고: https://ecrm.police.go.kr\n"
        " - 보이스피싱 지킴이: https://www.police.go.kr/crime/phishing.jsp\n"
    )

# ------------------------------------------
# 입력 유틸
# ------------------------------------------
def input_text(prompt):
    """문자 입력용"""
    v = input(prompt).strip()
    if v.lower() in ("q", "quit", "exit"):
        print("\n🚪 프로그램을 종료합니다. 안전하게 지내세요!")
        print(append_links())
        sys.exit(0)
    return v

def input_int(prompt, min_v, max_v):
    """정수 입력용 (범위 검증 포함)"""
    while True:
        try:
            v = input_text(prompt)
            n = int(v)
            if min_v <= n <= max_v:
                return n
            print(f"→ {min_v}~{max_v} 사이의 숫자를 입력하세요.")
        except ValueError:
            print("→ 숫자를 입력하세요. (종료:q)")

# ------------------------------------------
# 퀴즈 실행 (10문제씩 끊어서 진행)
# ------------------------------------------
def run_quiz(topic_title, quiz_items):
    print("\n" + "="*46)
    print(f"🧩 {topic_title} — 보이스피싱 상식 퀴즈 ({len(quiz_items)}문항)")
    print("="*46 + "\n")

    questions = quiz_items[:]
    random.shuffle(questions)

    score = 0
    total = len(questions)
    batch_size = 10
    start_index = 0

    while start_index < total:
        end_index = min(start_index + batch_size, total)
        batch = questions[start_index:end_index]

        print(f"\n📘 {start_index+1}~{end_index}번 문제를 풉니다!\n")

        for i, q in enumerate(batch, start_index + 1):
            print(f"{i}. {q['q']}")
            for j, opt in enumerate(q["options"], 1):
                print(f"  {j}. {opt}")
            ans = input_int("답 ▶ ", 1, len(q["options"]))
            if ans == q["answer"]:
                print("✅ 정답입니다!")
                score += 1
            else:
                print(f"❌ 오답입니다. 정답은 {q['answer']}번 ({q['options'][q['answer']-1]})")
            print("💬 해설:", q["explain"])
            input("엔터 ▶ 다음 문제\n")

        start_index += batch_size

        # 아직 남은 문제가 있으면 계속 여부 묻기
        if start_index < total:
            cont = input_text("➡️ 10문제 더 푸시겠습니까? (Y/N): ").lower()
            if cont != "y":
                break

    # ✅ 결과 출력
    print("\n" + "="*42)
    print(f"🎯 최종 점수: {score} / {start_index}")
    if score >= int(start_index * 0.8):
        print("🎉 훌륭해요! 당신은 피싱 대처 전문가입니다.")
    elif score >= int(start_index * 0.6):
        print("👍 좋아요. 대부분 상황에서 안전하게 대응할 수 있어요.")
    else:
        print("⚠️ 조금 더 학습이 필요해요. 의심 연락·링크는 즉시 차단하고, 꼭 공식 채널로 재확인하는 습관을 가지세요.")
    print("="*42 + "\n")

# ------------------------------------------
# 메인 실행기
# ------------------------------------------
def main():
    print("="*48)
    print("📚 보이스피싱 상식 퀴즈 — 통합 실행기 (CLI)")
    print("="*48 + "\n")

    while True:
        print("학습할 주제를 선택하세요:")
        for i, (title, _) in enumerate(TOPICS, 1):
            print(f" {i}. {title}")
        print(" q. 종료")

        sel = input_text("\n▶ 번호 입력: ")
        if sel.lower() in ("q", "quit", "exit"):
            break

        if not sel.isdigit() or not (1 <= int(sel) <= len(TOPICS)):
            print("⚠️ 올바른 번호를 입력하세요.\n")
            continue

        idx = int(sel) - 1
        topic_title, quiz_items = TOPICS[idx]
        run_quiz(topic_title, quiz_items)

        again = input_text("\n다른 주제를 풀까요? (Y/N): ").lower()
        if again != "y":
            break

    print("\n🛑 프로그램을 종료합니다. 수고하셨습니다!")
    print(append_links())


if __name__ == "__main__":
    main()