# require requests module
import requests
import json
import re

# -- define constant --

# key
API_KEY = "AIzaSyBESHoPV8F7L3dKc1dDDOnyvOpGQ0mh5OE"

# endpoint 
API_URL = f"https://safebrowsing.googleapis.com/v4/threatMatches:find?key={API_KEY}"

# client info
CLIENT_ID = "my_python_app"
CLIENT_VERSION = "1.0.0"

# url 감지
# (https?:\/\/[^\s]+) : http 또는 https 감지
# (www\.[^\s]+) : www. 감지
URL_REGEX = r'(https?:\/\/[^\s]+|www\.[^\s]+)'

# test case
test_case1 = (
    """
    제가 자주 방문하는 사이트는 https://www.google.com 입니다.
    또한 www.naver.com 도 유용하며,
    http://anothersite.net/path 이나 단순히 www.dev-blog.net/post/latest 도 괜찮습니다.
    http://testsafebrowsing.appspot.com/s/malware.html 는 위험한 사이트입니다.
    """
)

test_case2 = (
    """
    안전한 사이트 접속: https://www.google.com/search.
    악성코드 테스트: http://testsafebrowsing.appspot.com/s/malware.html
    중간에 다른 사이트: www.another-safe-site.org.
    피싱 테스트: http://testsafebrowsing.appspot.com/s/phishing.html
    문서 링크: https://doc.example.com/file.pdf
    """
)

# ----

# 조건에 맞는 url들의 tuple을 반환한다. 
def GetUrlList(text):
    return re.findall(URL_REGEX, text)

# api payload 생성
def MakePayload(urls):
    return {
        "client": {
            "clientId": CLIENT_ID,
            "clientVersion": CLIENT_VERSION
        },
        "threatInfo": {
            "threatTypes": [
                "MALWARE", 
                "SOCIAL_ENGINEERING", 
                "UNWANTED_SOFTWARE", 
                "POTENTIALLY_HARMFUL_APPLICATION"
            ],
            "platformTypes": ["ANY_PLATFORM"],
            "threatEntryTypes": ["URL"],
            "threatEntries": [{"url": url} for url in urls]
        }
    }


# Text에 있는 url이 안전한지 검사하는 함수
#   param: str나 str을 리스트로 가지고 있는 문자 매시지.
#   return: 각 url을 key로, 판정 결과를 value로 가지고 있는 딕셔너리
def JudgeUrls(text):

    # text에서 url 추출
    urls = GetUrlList(text)

    # API 요청 본문 (JSON Payload) 구성
    payload = MakePayload(urls)

    try:
        # POST 요청 보내기
        response = requests.post(API_URL, json=payload)
        response.raise_for_status() # HTTP 오류가 발생하면 예외 발생

        # 응답 데이터 파싱
        result = response.json()
        
        # 위험 일치(Match) 항목이 있는지 확인
        if "matches" in result:
            # 위험 목록에 있는 URL을 추출하여 집합(Set)으로 저장합니다.
            unsafe_urls = [match["threat"]["url"] for match in result["matches"]]
            unsafe_set = set(unsafe_urls) # <-- Set 이름 및 용도 수정
        else:
            # 일치하는 위험 항목이 없으면 빈 Set
            unsafe_set = set()

        # --- 반환 딕셔너리 생성 ---
        # "url in unsafe_set"는 '위험 집합에 포함되어 있는가?'를 판단합니다.
        # 포함되어 있으면 True (위험), 아니면 False (안전).
        url_safety_dict = {
            url: url in unsafe_set
            for url in urls
        }

    except requests.exceptions.RequestException as e:
        print(f"API 요청 중 오류 발생: {e}")
    except json.JSONDecodeError:
        print("응답 JSON 디코딩 오류 발생.")

    # 위험 딕셔너리 생성
    print(url_safety_dict)
    return url_safety_dict

if __name__ == "__main__":
    print("\n----------\n")
    JudgeUrls(test_case1)
    print("\n----------\n")
    JudgeUrls(test_case2)
    print("\n----------\n")