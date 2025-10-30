# ==========================================
# 🛡️ SafeTalk CLI — 보이스피싱·스미싱 종합 예방 학습 프로그램
# ==========================================
# 실행: python safetalk_cli.py
# ==========================================

import random, sys

# --------------------------
# 공통 신고/상담 링크
# --------------------------
def append_links():
    return (
        "\n📞 신고/상담 안내:\n"
        " - 경찰청: 112\n"
        " - 금융감독원: 1332\n"
        " - KISA 스팸신고센터: https://spam.kisa.or.kr\n"
        " - 사이버범죄신고시스템: https://ecrm.police.go.kr\n"
        " - 보이스피싱 지킴이: https://www.police.go.kr/crime/phishing.jsp"
    )

# --------------------------
# 입력 유틸
# --------------------------
def input_text(prompt):
    v = input(prompt).strip()
    if v.lower() in ("q","quit","exit"):
        print("\n🚪 프로그램을 종료합니다. 안전하게 지내세요.")
        sys.exit(0)
    return v

def input_int(prompt, min_v, max_v):
    while True:
        try:
            v = input_text(prompt)
            n = int(v)
            if min_v <= n <= max_v:
                return n
            print(f"→ {min_v}~{max_v} 사이 숫자 입력")
        except ValueError:
            print("→ 숫자를 입력하세요. (종료:q)")

# --------------------------
# 각 시나리오 퀴즈 데이터
# (간략 요약 — 실제 버전은 앞서 만든 상세 데이터 import 가능)
# --------------------------

scenarios = {
    "택배 스미싱": [
        {"q":"‘CJ대한통운입니다. 배송지 오류로 반송 중입니다.’ 문자를 받았다면?",
         "options":["링크 클릭","고객센터 문의","친구 공유"],"answer":2,
         "explain":"택배사는 문자 링크로 주소 수정을 요구하지 않습니다. 공식 앱이나 고객센터에서만 확인하세요."},
        {"q":"스미싱 문자에서 자주 쓰는 심리는?",
         "options":["긴급함·불안감","기쁨","자신감"],"answer":1,
         "explain":"긴급하거나 불안한 감정을 자극해 판단력을 흐리게 만듭니다."},
        {"q":"‘배송 오류로 반송 중입니다’ 문장의 목적은?",
         "options":["불안감 유도","기쁨 유발","관심 끌기"],"answer":1,
         "explain":"‘오류’, ‘반송’ 등 부정 단어로 긴급 반응을 유도합니다."},
    ],
    "공공기관 사칭": [
        {"q":"‘귀하의 명의가 범죄에 이용되었습니다.’ 전화를 받았다면?",
         "options":["직접 경찰청 번호로 확인","송금","주민번호 제공"],"answer":1,
         "explain":"경찰·검찰은 전화로 송금을 요구하지 않습니다. 직접 번호로 확인하세요."},
        {"q":"공공기관은 전화로 어떤 요청을 절대 하지 않는가?",
         "options":["송금 요청","문의 응답","홍보 안내"],"answer":1,
         "explain":"전화로 송금 요청하는 기관은 없습니다."},
        {"q":"국세청은 세금 납부 안내를 어떤 경로로 할까?",
         "options":["홈택스 공식 알림","문자 링크","전화"],"answer":1,
         "explain":"홈택스에서만 세금 관련 안내를 확인할 수 있습니다."},
    ],
    "가족/지인 사칭": [
        {"q":"‘엄마 나 휴대폰 고장났어. 돈 좀 보내줘.’ 문자를 받았다면?",
         "options":["보낸 번호로 송금","전화로 직접 확인","카톡 확인"],"answer":2,
         "explain":"가족이나 지인일지라도 반드시 본인 통화로 확인하세요."},
        {"q":"가족 사칭 스미싱이 자주 노리는 대상은?",
         "options":["중장년층","청소년","직장인"],"answer":1,
         "explain":"가족 신뢰와 긴급성을 악용하기 때문에 주로 중장년층이 표적입니다."},
        {"q":"‘급하게 돈 필요’ 문장의 심리는?",
         "options":["긴급성·신뢰 악용","호기심","흥분"],"answer":1,
         "explain":"긴급성과 가족 사랑을 악용해 송금을 유도합니다."},
    ],
    "금융/대출 사칭": [
        {"q":"‘정부 긴급대출 신청하세요’ 문자를 받았다면?",
         "options":["스미싱 가능성 높음","정부 공식 안내","은행 이벤트"],"answer":1,
         "explain":"정부기관은 문자로 대출을 받지 않습니다. 모두 사칭입니다."},
        {"q":"‘오늘 마감’ 문구가 포함된 대출 문자의 심리전략은?",
         "options":["긴급성 유도","정보제공","감사표현"],"answer":1,
         "explain":"‘지금 안 하면 손해’ 심리를 자극합니다."},
        {"q":"‘금리 인하 재대출’ 문자의 목적은?",
         "options":["정보 탈취","금리 안내","실제 대출"],"answer":1,
         "explain":"기존 고객의 개인정보를 다시 빼내기 위한 수법입니다."},
    ],
    "보이스피싱 심화": [
        {"q":"‘귀하의 계좌가 범죄에 이용되었습니다’ 전화의 의도는?",
         "options":["금전 탈취","계좌 보호","조사 협조"],"answer":1,
         "explain":"수사기관은 절대 전화로 송금을 요구하지 않습니다."},
        {"q":"AI 음성 보이스피싱의 주요 특징은?",
         "options":["실제 인물처럼 들림","단조로운 목소리","통화 불가"],"answer":1,
         "explain":"AI는 억양까지 복제하여 실제 가족처럼 들립니다."},
        {"q":"‘비밀 유지하라’는 말의 의도는?",
         "options":["고립 유도","신뢰 강화","안심"],"answer":1,
         "explain":"피해자가 주변과 상의하지 못하게 만들어 통제합니다."},
    ]
}

# --------------------------
# 퀴즈 실행 함수
# --------------------------
def run_quiz(scenario_name, questions):
    print(f"\n🧩 {scenario_name} 퀴즈를 시작합니다! (총 {len(questions)}문항)\n")
    random.shuffle(questions)
    score = 0

    for i, q in enumerate(questions, 1):
        print(f"\n{i}. {q['q']}")
        for j,opt in enumerate(q["options"],1):
            print(f"  {j}. {opt}")
        ans = input_int("답 ▶ ", 1, len(q["options"]))
        if ans == q["answer"]:
            print("✅ 정답입니다!")
            score += 1
        else:
            print(f"❌ 오답입니다. 정답은 {q['answer']}번 ({q['options'][q['answer']-1]})")
        print("💬 해설:", q["explain"])
        print(append_links())
        input("\n엔터 ▶ 다음 문제")

    print("\n====================================")
    print(f"🎯 최종 점수: {score} / {len(questions)}")
    if score >= len(questions)*0.8:
        print("🎉 훌륭해요! 피싱 탐지 전문가 수준입니다.")
    elif score >= len(questions)*0.6:
        print("👍 좋습니다. 대부분의 수법을 구별할 수 있어요.")
    else:
        print("⚠️ 주의! 의심 연락은 절대 링크 클릭 금지입니다.")
    print("====================================\n")

# --------------------------
# 메인 루프
# --------------------------
def main():
    print("==========================================")
    print("🛡️ SafeTalk CLI — 보이스피싱·스미싱 예방 통합 학습")
    print("==========================================\n")

    names = list(scenarios.keys())

    while True:
        print("학습할 주제를 선택하세요:")
        for i, n in enumerate(names, 1):
            print(f" {i}. {n}")
        print(" q. 종료")

        sel = input_text("\n▶ 번호 입력: ")
        if sel.lower() in ("q","quit","exit"):
            print("\n🛑 프로그램을 종료합니다. 안전하게 지내세요!")
            break

        if not sel.isdigit() or int(sel) not in range(1, len(names)+1):
            print("⚠️ 올바른 번호를 입력하세요.\n")
            continue

        scenario = names[int(sel)-1]
        run_quiz(scenario, scenarios[scenario])

        again = input_text("\n다른 주제도 학습하시겠습니까? (Y/N): ").lower()
        if again != "y":
            print("\n✅ 학습을 종료합니다. 수고하셨습니다!")
            break

if __name__ == "__main__":
    main()