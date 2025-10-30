import os
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()
API_KEY = os.getenv("GEMINI_API_KEY")
if not API_KEY:
    raise RuntimeError("GEMINI_API_KEY missing in .env")

client = genai.Client(api_key=API_KEY)
MODEL = "gemini-2.5-flash"

def analyze_smishing_message(message_content: str, url_check_result: str):
    """
    🎯 스미싱 문자 탐지 분석 함수
    입력:
      - message_content: 문자 본문 내용 (예: "국민은행입니다. 보안문제 발생...")
      - url_check_result: URL 분석 결과 ("True" / "False" / "N/A")
    출력:
      - Gemini 모델의 분석 결과 텍스트 (지정된 형식)
    """

    contents = [
        types.Content(
            role="user",
            parts=[
                types.Part.from_text(
                    text=f"""
당신은 '스미싱(Smishing)' 탐지 전문 AI 보안 분석가입니다. 당신의 임무는 제공되는 (1)문자 메시지 내용과 (2)메시지 내 URL에 대한 사전 분석 결과를 토대로, 종합적인 스미싱 위험도를 평가하고, 근거를 제시하며, 대처 방안을 안내하는 것입니다.

### 입력 정보

1. **URL 분석 결과:** {url_check_result}
   * (설명: `True`=비정상/악성 URL 탐지, `False`=정상 URL로 판단, `N/A`=URL 없음)

2. **[문자내용시작]**
{message_content}
**[문자내용종료]**

---

### 분석 지침

* URL 분석 결과가 `True`이면 문자 내용과 관계없이 위험도 등급은 '위험' 또는 '매우 위험'이어야 합니다.
* URL 분석 결과가 `False`이더라도, 문자 내용(예: 공공기관/금융/택배 사칭, 심리적 압박, 개인정보 요구, 앱 설치 유도)이 의심스러우면 위험도 등급을 '의심' 또는 '위험'으로 판단해야 합니다.
* URL 분석 결과가 `N/A`이면 순수하게 문자 내용만으로 위험도를 판단합니다.

---

### 출력 형식 (반드시 준수)

## 🛡️ 스미싱 위험도 분석

**1. 위험도 등급:** [안전 / 의심 / 위험 / 매우 위험 중 하나]

**2. 위험 확률:** [0~100%의 구체적인 확률(%)]

**3. 분석 근거:**
* [위험도를 판단한 첫 번째 핵심 근거 (예: URL 사전 분석 결과가 'True' (악성 의심))]
* [두 번째 근거 (예: [택배] 배송지 불명확, 주소지 확인을 이유로 URL 클릭 유도)]
* [세 번째 근거 (예: 출처가 불분명한 단축 URL 사용)]

**4. 권고 대처 방안:**
* [가장 즉각적이고 중요한 대처 방안 (예: 문자 내 포함된 URL 절대 클릭 금지)]
* [두 번째 대처 방안 (예: 즉시 해당 문자 메시지 삭제)]
* [세 번째 대처 방안 (예: 앱 설치(.apk)를 유도하는 경우 절대 응하지 말 것)]
                    """
                )
            ],
        )
    ]

    config = types.GenerateContentConfig(
        temperature=0.1,
        thinking_config=types.ThinkingConfig(thinking_budget=-1),
        system_instruction=[
            types.Part.from_text(
                text="한국어로만 답변하고, 지정된 출력 형식 외 문장은 절대 추가하지 마."
            )
        ],
    )

    print("🔍 Gemini 스미싱 분석 중...\n")
    output_text = ""
    for chunk in client.models.generate_content_stream(
        model=MODEL,
        contents=contents,
        config=config,
    ):
        if chunk.text:
            print(chunk.text, end="")
            output_text += chunk.text

    print("\n\n✅ 분석 완료")
    return output_text


# ✅ 예시 실행
if __name__ == "__main__":
    analyze_smishing_message(
        message_content="[국민은행] 보안인증 만료로 계정이 잠깁니다. 아래 링크로 인증해주세요. http://bank-verify.info",
        url_check_result="True"
    )
