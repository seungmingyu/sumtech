// Quiz JavaScript (로컬 버전)
document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const quizStartScreen = document.getElementById('quizStartScreen');
    const quizProgressScreen = document.getElementById('quizProgressScreen');
    const quizResultScreen = document.getElementById('quizResultScreen');
    const quizReviewScreen = document.getElementById('quizReviewScreen');
    
    const topicSelectContainer = document.getElementById('topicSelectContainer');
    const startQuizBtn = document.getElementById('startQuizBtn');
    const nextQuestionBtn = document.getElementById('nextQuestionBtn');
    const prevQuestionBtn = document.getElementById('prevQuestionBtn');
    const submitQuizBtn = document.getElementById('submitQuizBtn');
    const retryQuizBtn = document.getElementById('retryQuizBtn');
    const reviewAnswersBtn = document.getElementById('reviewAnswersBtn');
    const backToResultBtn = document.getElementById('backToResultBtn');

    // Quiz State
    let selectedTopic = 'all';
    let quizData = [];
    let currentQuestion = 0;
    let score = 0;
    let userAnswers = [];

    // ==========================================
    // 로컬 퀴즈 데이터
    // ==========================================

    const quizDatabase = {
        delivery: [
            {
                q: '"택배가 주소 불명으로 보관 중입니다. 링크를 클릭하여 확인하세요." 라는 문자를 받았습니다. 가장 적절한 대응은?',
                options: [
                    '링크를 클릭하여 택배 정보를 확인한다',
                    '택배 회사 공식 앱이나 홈페이지에서 직접 확인한다',
                    '문자에 있는 연락처로 전화해서 문의한다',
                    '일단 무시하고 택배가 올 때까지 기다린다'
                ],
                answer: 2,
                category: '택배 스미싱',
                explain: '의심스러운 링크는 절대 클릭하지 말고, 택배 회사 공식 앱이나 홈페이지에서 직접 확인하는 것이 안전합니다.'
            },
            {
                q: '택배 배송 지연 문자에 짧은 URL(bit.ly)이 포함되어 있습니다. 어떻게 해야 할까요?',
                options: [
                    '짧은 URL이니까 안전할 것 같아서 클릭한다',
                    'URL을 복사해서 바이러스 검사 사이트에서 확인한다',
                    '택배 회사에 직접 전화해서 확인한다',
                    '친구에게 먼저 클릭해보라고 한다'
                ],
                answer: 3,
                category: '택배 스미싱',
                explain: '짧은 URL은 악성 링크를 숨기는 데 자주 사용됩니다. 택배 회사에 직접 전화로 확인하는 것이 가장 안전합니다.'
            },
            {
                q: '실제로 택배를 기다리고 있는 상황에서 택배 관련 문자를 받았습니다. 어떻게 대응해야 할까요?',
                options: [
                    '기다리던 택배니까 바로 링크를 클릭한다',
                    '송장번호를 공식 앱에 직접 입력해서 확인한다',
                    '문자 내용을 그대로 믿고 요구사항을 따른다',
                    '발신번호로 전화를 걸어 확인한다'
                ],
                answer: 2,
                category: '택배 스미싱',
                explain: '보이스피싱범들은 사람들이 택배를 기다리는 심리를 이용합니다. 송장번호를 공식 앱에 직접 입력해서 확인하세요.'
            },
            {
                q: '"관세청입니다. 해외직구 물품 통관 보류, 추가 세금 납부 필요" 문자를 받았습니다. 올바른 대응은?',
                options: [
                    '링크를 클릭해서 세금을 즉시 납부한다',
                    '관세청 공식 홈페이지(customs.go.kr)에서 확인한다',
                    '문자에 적힌 번호로 전화한다',
                    '세금이 더 늘어날까봐 빨리 납부한다'
                ],
                answer: 2,
                category: '택배 스미싱',
                explain: '관세청은 문자로 링크를 보내지 않습니다. 공식 홈페이지나 125번으로 직접 확인하세요.'
            },
            {
                q: '우체국을 사칭한 문자에 "소포 손상, 보상금 신청"이라는 링크가 있습니다. 어떻게 해야 할까요?',
                options: [
                    '보상금을 받기 위해 링크를 클릭한다',
                    '우체국(1588-1300)에 직접 전화해서 확인한다',
                    '일단 링크를 클릭해서 손상 정도를 확인한다',
                    '문자 내용을 캡처해서 친구들에게 공유한다'
                ],
                answer: 2,
                category: '택배 스미싱',
                explain: '우체국은 보상금을 문자로 안내하지 않습니다. 반드시 공식 번호로 확인하세요.'
            },
            {
                q: '"택배 보관료 3,000원 미납, 오늘까지 결제 안 하면 반송" 문자를 받았습니다. 올바른 대응은?',
                options: [
                    '3,000원은 적은 금액이니 바로 결제한다',
                    '택배회사 앱이나 고객센터로 직접 확인한다',
                    '보관료가 더 늘어날까봐 빨리 결제한다',
                    '링크를 열어서 금액부터 확인한다'
                ],
                answer: 2,
                category: '택배 스미싱',
                explain: '택배 보관료를 문자 링크로 결제하게 하는 것은 스미싱입니다. 공식 앱에서 확인하세요.'
            },
            {
                q: 'CJ대한통운을 사칭한 문자에 "배송 확인" 버튼이 있습니다. 클릭하면 어떻게 될까요?',
                options: [
                    '택배 위치를 확인할 수 있다',
                    '악성 앱이 설치되거나 개인정보가 유출될 수 있다',
                    '실제 택배 회사 페이지로 연결된다',
                    '아무 일도 일어나지 않는다'
                ],
                answer: 2,
                category: '택배 스미싱',
                explain: '스미싱 링크는 악성 앱 설치나 개인정보 입력 페이지로 연결됩니다. 절대 클릭하지 마세요.'
            },
            {
                q: '택배 관련 문자의 발신번호가 실제 택배회사 번호와 비슷합니다. 어떻게 판단해야 할까요?',
                options: [
                    '발신번호가 비슷하니까 안전하다',
                    '발신번호는 조작 가능하므로 링크는 클릭하지 않는다',
                    '발신번호를 검색해본 후 안전하면 클릭한다',
                    '친구에게 먼저 확인해달라고 한다'
                ],
                answer: 2,
                category: '택배 스미싱',
                explain: '발신번호는 쉽게 조작될 수 있습니다. 번호만 보고 판단하지 말고 공식 앱을 이용하세요.'
            },
            {
                q: '택배 기사님이 "문 앞에 두고 갑니다" 라는 문자와 함께 사진 링크를 보냈습니다. 클릭해도 될까요?',
                options: [
                    '사진을 확인하기 위해 링크를 클릭한다',
                    '일단 밖에 나가서 택배가 있는지 직접 확인한다',
                    '문자에 회신해서 어디 뒀는지 물어본다',
                    '링크를 클릭해서 사진부터 확인한다'
                ],
                answer: 2,
                category: '택배 스미싱',
                explain: '실제 택배기사는 문자로 사진 링크를 보내지 않습니다. 직접 확인하거나 택배회사에 문의하세요.'
            },
            {
                q: '"국제택배 세관 통관 지연, 신분증 사본 필요" 문자를 받았습니다. 어떻게 대응해야 할까요?',
                options: [
                    '신분증 사본을 이메일로 보낸다',
                    '신분증 앞면만 사진 찍어서 보낸다',
                    '절대 신분증을 보내지 않고 세관(125)에 직접 확인한다',
                    '링크에 들어가서 신분증을 업로드한다'
                ],
                answer: 3,
                category: '택배 스미싱',
                explain: '세관은 문자로 신분증을 요구하지 않습니다. 신분증 사본은 명의도용에 악용될 수 있습니다.'
            }
        ],
        finance: [
            {
                q: '금융감독원을 사칭하며 "계좌가 범죄에 악용되고 있으니 안전계좌로 이체하라"고 합니다. 올바른 대응은?',
                options: [
                    '금융감독원이니까 믿고 안전계좌로 이체한다',
                    '전화를 끊고 금융감독원(1332)에 직접 전화한다',
                    '일단 일부 금액만 이체해본다',
                    '상대방이 요구하는 개인정보를 알려준다'
                ],
                answer: 2,
                category: '금융/대출 사칭',
                explain: '금융감독원이나 경찰은 절대 안전계좌 이체를 요구하지 않습니다. 전화를 끊고 공식 번호로 확인하세요.'
            },
            {
                q: '저금리 대출 광고 문자를 받았습니다. "승인 완료, 지금 바로 링크 클릭"이라고 합니다. 어떻게 해야 할까요?',
                options: [
                    '저금리라서 좋으니 바로 클릭한다',
                    '링크를 무시하고 은행 앱에서 직접 대출을 확인한다',
                    '일단 클릭해서 얼마나 받을 수 있는지 확인한다',
                    '친구들에게도 공유해준다'
                ],
                answer: 2,
                category: '금융/대출 사칭',
                explain: '승인하지 않은 대출 문자는 피싱입니다. 필요하다면 은행 앱에서 직접 확인하세요.'
            },
            {
                q: '은행 직원을 사칭하며 "보안 문제로 계좌 비밀번호 확인이 필요합니다"라고 합니다. 올바른 대응은?',
                options: [
                    '은행 직원이니까 비밀번호를 알려준다',
                    '비밀번호 앞 두 자리만 알려준다',
                    '전화를 끊고 은행 공식 번호로 다시 전화한다',
                    'OTP 번호를 알려준다'
                ],
                answer: 3,
                category: '금융/대출 사칭',
                explain: '은행은 절대 비밀번호나 OTP를 전화로 묻지 않습니다. 전화를 끊고 은행에 직접 확인하세요.'
            },
            {
                q: '"대출 한도 1억원 승인! 24시간 내 실행하세요" 카카오톡 메시지를 받았습니다. 올바른 대응은?',
                options: [
                    '한도가 높으니 바로 신청한다',
                    '사기일 가능성이 높으니 무시하고 삭제한다',
                    '일단 클릭해서 조건을 확인한다',
                    '금리를 비교해본 후 결정한다'
                ],
                answer: 2,
                category: '금융/대출 사칭',
                explain: '신청하지 않은 대출 승인은 100% 사기입니다. 메시지를 무시하고 삭제하세요.'
            },
            {
                q: '은행에서 "계좌 정지 예정, 본인 확인 필요" 문자가 왔습니다. 어떻게 해야 할까요?',
                options: [
                    '링크를 클릭해서 본인 확인을 한다',
                    '은행 앱에서 직접 확인하거나 은행에 전화한다',
                    '문자에 적힌 번호로 전화한다',
                    '일단 링크를 열어서 무슨 내용인지 확인한다'
                ],
                answer: 2,
                category: '금융/대출 사칭',
                explain: '은행은 계좌 정지를 문자로 통보하지 않습니다. 은행 앱이나 공식 번호로 확인하세요.'
            },
            {
                q: '"신용등급 상승! 무료 조회" 광고를 봤습니다. 개인정보를 입력해야 한다고 합니다. 어떻게 해야 할까요?',
                options: [
                    '무료니까 개인정보를 입력한다',
                    '신용평가사 공식 사이트에서 조회한다',
                    '일단 이름과 생년월일만 입력한다',
                    '전화번호만 입력하고 확인한다'
                ],
                answer: 2,
                category: '금융/대출 사칭',
                explain: '신용등급은 나이스, KCB 등 신용평가사 공식 사이트에서만 조회하세요.'
            },
            {
                q: '카드사를 사칭해 "부정사용 감지, 카드번호 확인 필요" 전화가 왔습니다. 올바른 대응은?',
                options: [
                    '카드번호 뒷 4자리를 알려준다',
                    '전화를 끊고 카드 뒷면의 공식 번호로 전화한다',
                    'CVV 번호를 알려준다',
                    '유효기간만 알려준다'
                ],
                answer: 2,
                category: '금융/대출 사칭',
                explain: '카드사는 전화로 카드번호를 묻지 않습니다. 카드 뒷면의 공식 번호로 확인하세요.'
            },
            {
                q: '"정부 재난지원금 미신청자 추가 지급" 문자를 받았습니다. 링크를 클릭하라고 합니다. 어떻게 해야 할까요?',
                options: [
                    '지원금을 받기 위해 링크를 클릭한다',
                    '정부24나 관할 구청 홈페이지에서 직접 확인한다',
                    '일단 링크를 열어서 진짜인지 확인한다',
                    '친구들에게 이 링크를 공유한다'
                ],
                answer: 2,
                category: '금융/대출 사칭',
                explain: '정부 지원금은 문자 링크로 신청하지 않습니다. 정부24 또는 구청에서 직접 확인하세요.'
            },
            {
                q: '"보험금 미수령자 조회" 광고에서 주민번호 입력을 요구합니다. 어떻게 해야 할까요?',
                options: [
                    '보험금을 받을 수 있으니 주민번호를 입력한다',
                    '보험개발원 공식 사이트에서 조회한다',
                    '주민번호 앞자리만 입력한다',
                    '이름과 생년월일만 입력한다'
                ],
                answer: 2,
                category: '금융/대출 사칭',
                explain: '보험금 조회는 금융감독원이나 보험개발원 공식 사이트에서만 하세요.'
            },
            {
                q: '투자 상담사가 "100% 수익 보장, 소액 투자 가능" 전화를 했습니다. 올바른 대응은?',
                options: [
                    '소액이니까 투자해본다',
                    '100% 수익 보장은 불가능하므로 거절한다',
                    '일단 소액만 투자해보고 결정한다',
                    '친구에게 추천해서 같이 투자한다'
                ],
                answer: 2,
                category: '금융/대출 사칭',
                explain: '100% 수익 보장은 불가능하며 이는 전형적인 투자 사기입니다. 즉시 거절하세요.'
            }
        ],
        family: [
            {
                q: '"엄마 나야, 급하게 돈이 필요해. 친구 폰으로 연락해"라는 문자를 받았습니다. 어떻게 해야 할까요?',
                options: [
                    '급한 것 같으니 바로 송금한다',
                    '자녀의 원래 번호로 직접 전화해서 확인한다',
                    '문자로 받은 번호로 전화해서 확인한다',
                    '일단 적은 금액만 보내본다'
                ],
                answer: 2,
                category: '가족/지인 사칭',
                explain: '가족을 사칭한 보이스피싱입니다. 반드시 원래 알던 번호로 직접 확인하세요.'
            },
            {
                q: '지인 이름으로 카카오톡이 와서 "급하게 돈 좀 빌려줄 수 있어?"라고 합니다. 올바른 대응은?',
                options: [
                    '친구니까 바로 계좌번호를 물어본다',
                    '전화로 직접 통화해서 본인 확인을 한다',
                    '얼마가 필요한지 먼저 물어본다',
                    '계좌번호를 받아서 바로 송금한다'
                ],
                answer: 2,
                category: '가족/지인 사칭',
                explain: '메신저 계정이 해킹되었을 수 있습니다. 반드시 전화로 본인 확인을 하세요.'
            },
            {
                q: '아들을 사칭한 전화로 "엄마, 사고 났어. 합의금이 필요해"라고 합니다. 가장 적절한 대응은?',
                options: [
                    '사고가 났다니 바로 돈을 보낸다',
                    '전화를 끊고 아들에게 직접 전화한다',
                    '얼마가 필요한지 먼저 확인한다',
                    '상대방이 알려준 병원으로 찾아간다'
                ],
                answer: 2,
                category: '가족/지인 사칭',
                explain: '보이스피싱범이 급박한 상황을 만들어 판단력을 흐리게 합니다. 반드시 본인에게 직접 확인하세요.'
            },
            {
                q: '모르는 번호로 "이모, 저 ○○○에요. 휴대폰 고장나서 새 번호로 연락드려요" 문자가 왔습니다. 어떻게 해야 할까요?',
                options: [
                    '조카가 맞는 것 같으니 답장한다',
                    '조카 이름을 먼저 물어본다',
                    '무시하고 조카의 원래 번호로 직접 전화한다',
                    '계좌번호를 물어본다'
                ],
                answer: 3,
                category: '가족/지인 사칭',
                explain: '가족 사칭 보이스피싱의 전형적인 수법입니다. 원래 알던 번호로 반드시 확인하세요.'
            },
            {
                q: '친구 페이스북 계정에서 "유학 중인데 돈이 급해. 계좌 좀 빌려줄래?" 메시지가 왔습니다. 올바른 대응은?',
                options: [
                    '친구니까 계좌를 빌려준다',
                    '전화나 영상통화로 본인 확인을 한다',
                    '일단 소액만 송금해본다',
                    '다른 친구들에게도 물어본다'
                ],
                answer: 2,
                category: '가족/지인 사칭',
                explain: 'SNS 계정 해킹 후 지인을 사칭하는 수법입니다. 반드시 전화로 본인 확인하세요.'
            },
            {
                q: '"선생님 저예요, 갑자기 병원비가 필요해요" 문자를 받았습니다. 학생 이름은 없습니다. 어떻게 해야 할까요?',
                options: [
                    '선생님이니까 학생을 도와야 한다',
                    '이름을 물어보고 학부모에게 먼저 확인한다',
                    '소액이면 일단 송금한다',
                    '직접 병원으로 찾아간다'
                ],
                answer: 2,
                category: '가족/지인 사칭',
                explain: '교사를 대상으로 한 보이스피싱입니다. 반드시 학부모에게 확인하세요.'
            },
            {
                q: '할머니께 "손자 ○○이가 사고 났대요. 변호사인데 합의금 보내주세요" 전화가 왔습니다. 올바른 대응은?',
                options: [
                    '손자를 위해 바로 송금한다',
                    '전화를 끊고 손자에게 직접 전화한다',
                    '변호사 신분증을 확인한 후 송금한다',
                    '일단 일부만 송금한다'
                ],
                answer: 2,
                category: '가족/지인 사칭',
                explain: '손자를 사칭한 전형적인 보이스피싱입니다. 반드시 손자에게 직접 확인하세요.'
            },
            {
                q: '회사 상사 이름으로 "급하게 회의비용 필요, 먼저 입금해줄 수 있나?" 카톡이 왔습니다. 어떻게 해야 할까요?',
                options: [
                    '상사 명령이니까 바로 입금한다',
                    '전화로 직접 통화해서 확인한다',
                    '일단 소액만 입금한다',
                    '다른 직원들에게 물어본다'
                ],
                answer: 2,
                category: '가족/지인 사칭',
                explain: '직장 상사를 사칭한 메신저 해킹 사기입니다. 반드시 전화로 확인하세요.'
            },
            {
                q: '"아빠, 휴대폰 바꿔서 새 번호야. 급한 일 있어" 메시지를 받았습니다. 어떻게 해야 할까요?',
                options: [
                    '자녀가 맞는지 먼저 확인한다',
                    '원래 번호로 전화해서 확인한다',
                    '무슨 일인지 먼저 물어본다',
                    '계좌번호를 물어본다'
                ],
                answer: 2,
                category: '가족/지인 사칭',
                explain: '자녀 사칭 보이스피싱의 시작입니다. 원래 번호로 반드시 확인하세요.'
            },
            {
                q: '동창회 단톡방에 "○○야, 계좌 좀 빌려줄래? 급해" 메시지가 왔습니다. 올바른 대응은?',
                options: [
                    '동창이니까 도와준다',
                    '전화로 직접 통화해서 본인 확인한다',
                    '다른 동창들에게 먼저 물어본다',
                    '소액이면 빌려준다'
                ],
                answer: 2,
                category: '가족/지인 사칭',
                explain: '단톡방도 해킹될 수 있습니다. 반드시 개인 전화로 본인 확인하세요.'
            }
        ],
        public: [
            {
                q: '경찰청을 사칭하며 "범죄 연루 의심, 즉시 조사 협조 필요"라고 합니다. 올바른 대응은?',
                options: [
                    '경찰이니까 협조하겠다고 하고 요구사항을 따른다',
                    '전화를 끊고 112로 직접 전화해서 확인한다',
                    '일단 개인정보를 알려주고 조사에 협조한다',
                    '약속 장소로 찾아가서 직접 만난다'
                ],
                answer: 2,
                category: '공공기관 사칭',
                explain: '경찰은 전화로 금전 요구나 개인정보를 요구하지 않습니다. 112로 직접 확인하세요.'
            },
            {
                q: '검찰청을 사칭하며 "명의도용 사건 조사 중, 통장 사본 필요"라고 합니다. 어떻게 해야 할까요?',
                options: [
                    '검찰청이니까 통장 사본을 보내준다',
                    '전화를 끊고 가까운 경찰서를 방문한다',
                    '계좌번호만 알려준다',
                    '이메일로 통장 사본을 보내준다'
                ],
                answer: 2,
                category: '공공기관 사칭',
                explain: '검찰이나 경찰은 전화로 통장 사본이나 개인정보를 요구하지 않습니다. 경찰서를 직접 방문하세요.'
            },
            {
                q: '국세청을 사칭하며 "세금 체납으로 압류 예정"이라는 문자에 링크가 있습니다. 올바른 대응은?',
                options: [
                    '급한 일이니 링크를 클릭해서 확인한다',
                    '국세청 홈택스나 126번으로 직접 확인한다',
                    '링크를 클릭해서 일단 체납 금액을 확인한다',
                    '문자에 적힌 번호로 전화해서 문의한다'
                ],
                answer: 2,
                category: '공공기관 사칭',
                explain: '국세청은 문자로 링크를 보내지 않습니다. 홈택스나 126번으로 직접 확인하세요.'
            },
            {
                q: '법원을 사칭해 "소환장 발부, 출석 안 하면 강제 구인" 문자를 받았습니다. 올바른 대응은?',
                options: [
                    '법원이니까 링크를 클릭해서 확인한다',
                    '가까운 법원에 직접 방문하거나 전화로 확인한다',
                    '무서우니까 링크에서 요구하는 대로 한다',
                    '변호사를 바로 선임한다'
                ],
                answer: 2,
                category: '공공기관 사칭',
                explain: '법원은 공식 우편으로 소환장을 보냅니다. 문자 링크는 100% 사기입니다.'
            },
            {
                q: '"건강보험공단입니다. 환급금이 있어요" 전화를 받았습니다. 어떻게 해야 할까요?',
                options: [
                    '환급금을 받기 위해 계좌번호를 알려준다',
                    '전화를 끊고 건강보험공단(1577-1000)으로 확인한다',
                    '주민번호를 알려준다',
                    '링크를 클릭해서 환급 신청한다'
                ],
                answer: 2,
                category: '공공기관 사칭',
                explain: '건강보험공단은 환급금을 전화로 안내하지 않습니다. 공식 번호로 확인하세요.'
            },
            {
                q: '국민연금공단을 사칭해 "수급 자격 재확인 필요" 문자를 받았습니다. 올바른 대응은?',
                options: [
                    '자격이 박탈될까봐 바로 링크를 클릭한다',
                    '국민연금공단(1355)에 직접 전화해서 확인한다',
                    '개인정보를 입력한다',
                    '문자에 적힌 번호로 전화한다'
                ],
                answer: 2,
                category: '공공기관 사칭',
                explain: '국민연금공단은 자격 재확인을 문자로 요구하지 않습니다. 1355로 확인하세요.'
            },
            {
                q: '"출입국관리사무소입니다. 비자 문제로 출국 금지 예정" 전화가 왔습니다. 어떻게 해야 할까요?',
                options: [
                    '출국 금지가 무서워서 요구사항을 따른다',
                    '전화를 끊고 출입국관리사무소에 직접 확인한다',
                    '벌금을 즉시 납부한다',
                    '변호사에게 상담한다'
                ],
                answer: 2,
                category: '공공기관 사칭',
                explain: '출입국관리사무소는 전화로 출국 금지를 통보하지 않습니다. 직접 확인하세요.'
            },
            {
                q: '경찰청 사이버수사대를 사칭해 "명의도용 범죄 피해자 조사"라고 합니다. 올바른 대응은?',
                options: [
                    '피해자니까 조사에 협조한다',
                    '112로 전화해서 실제 수사 여부를 확인한다',
                    '요구하는 서류를 이메일로 보낸다',
                    '약속 장소로 찾아간다'
                ],
                answer: 2,
                category: '공공기관 사칭',
                explain: '사이버수사대는 전화로 갑자기 조사하지 않습니다. 112로 확인하세요.'
            },
            {
                q: '질병관리청을 사칭해 "코로나 방역 지원금 신청" 문자를 받았습니다. 올바른 대응은?',
                options: [
                    '지원금을 받기 위해 링크를 클릭한다',
                    '질병관리청 또는 보건소에 직접 확인한다',
                    '개인정보를 입력한다',
                    '친구들에게도 공유한다'
                ],
                answer: 2,
                category: '공공기관 사칭',
                explain: '지원금은 문자 링크로 신청하지 않습니다. 질병관리청이나 보건소에 확인하세요.'
            },
            {
                q: '"지방법원입니다. 채무 미이행으로 재산 압류 진행 중" 문자를 받았습니다. 어떻게 해야 할까요?',
                options: [
                    '급하니까 링크를 클릭해서 확인한다',
                    '가까운 법원이나 대법원(1544-9053)에 직접 확인한다',
                    '변제금을 즉시 납부한다',
                    '문자에 적힌 번호로 전화한다'
                ],
                answer: 2,
                category: '공공기관 사칭',
                explain: '법원은 우편으로 공식 통지합니다. 문자는 사기이니 법원에 직접 확인하세요.'
            }
        ],
        voice: [
            {
                q: '전화로 "보안 강화를 위해 휴대폰 본인인증이 필요합니다. 받으신 인증번호를 알려주세요"라고 합니다. 올바른 대응은?',
                options: [
                    '보안을 위한 거니까 인증번호를 알려준다',
                    '인증번호는 절대 알려주지 않고 전화를 끊는다',
                    '뒷자리만 알려준다',
                    '먼저 상대방의 신원을 확인한 후 알려준다'
                ],
                answer: 2,
                category: '음성/통화 보이스피싱',
                explain: '인증번호는 절대 타인에게 알려주면 안 됩니다. 이는 명의도용에 악용될 수 있습니다.'
            },
            {
                q: '전화로 "금융거래 확인차 생년월일과 계좌번호를 확인하겠습니다"라고 합니다. 어떻게 해야 할까요?',
                options: [
                    '확인 절차니까 생년월일과 계좌번호를 알려준다',
                    '전화를 끊고 해당 기관 공식 번호로 다시 전화한다',
                    '계좌번호만 알려준다',
                    '생년월일만 알려준다'
                ],
                answer: 2,
                category: '음성/통화 보이스피싱',
                explain: '금융기관은 전화로 계좌번호나 생년월일을 확인하지 않습니다. 전화를 끊고 공식 번호로 확인하세요.'
            },
            {
                q: '전화로 "스마트폰 원격 진단이 필요합니다. 앱을 설치해주세요"라고 합니다. 올바른 대응은?',
                options: [
                    '진단을 위해 앱을 설치한다',
                    '절대 앱을 설치하지 않고 전화를 끊는다',
                    '나중에 설치하겠다고 한다',
                    '어떤 앱인지 먼저 확인한다'
                ],
                answer: 2,
                category: '음성/통화 보이스피싱',
                explain: '원격 제어 앱은 범죄자가 당신의 스마트폰을 조작할 수 있게 합니다. 절대 설치하지 마세요.'
            },
            {
                q: '전화로 "경찰청입니다. 보안을 위해 현금을 안전한 장소로 옮기세요" 라고 합니다. 올바른 대응은?',
                options: [
                    '경찰이 시키는 대로 현금을 옮긴다',
                    '즉시 전화를 끊고 112로 신고한다',
                    '일부 현금만 옮긴다',
                    '가족과 상의한 후 결정한다'
                ],
                answer: 2,
                category: '음성/통화 보이스피싱',
                explain: '경찰은 절대 현금을 옮기라고 지시하지 않습니다. 즉시 전화를 끊고 112에 신고하세요.'
            },
            {
                q: '전화로 "카드 도용 의심, 지금 바로 카드번호 확인 필요"라고 합니다. 어떻게 해야 할까요?',
                options: [
                    '카드번호 16자리를 알려준다',
                    '전화를 끊고 카드 뒷면 번호로 카드사에 직접 전화한다',
                    'CVV 번호만 알려준다',
                    '카드번호 뒷 4자리만 알려준다'
                ],
                answer: 2,
                category: '음성/통화 보이스피싱',
                explain: '카드사는 전화로 카드번호를 묻지 않습니다. 카드 뒷면의 공식 번호로 직접 확인하세요.'
            },
            {
                q: '"귀하의 명의로 대포통장이 개설되었습니다. 피해를 막으려면 지금 바로..." 올바른 대응은?',
                options: [
                    '피해를 막기 위해 요구사항을 따른다',
                    '전화를 끊고 경찰(112)에 직접 신고한다',
                    '일단 개인정보를 알려준다',
                    '친구에게 상담한다'
                ],
                answer: 2,
                category: '음성/통화 보이스피싱',
                explain: '대포통장 피해 방지를 빌미로 한 보이스피싱입니다. 전화를 끊고 112에 신고하세요.'
            },
            {
                q: '전화로 "보이스피싱 피해 구제 센터입니다. 피해금 돌려드립니다" 라고 합니다. 올바른 대응은?',
                options: [
                    '피해금을 돌려받기 위해 협조한다',
                    '2차 피해 가능성이 높으니 전화를 끊는다',
                    '일단 얼마나 돌려받는지 물어본다',
                    '계좌번호를 알려준다'
                ],
                answer: 2,
                category: '음성/통화 보이스피싱',
                explain: '보이스피싱 피해자를 대상으로 한 2차 피해 수법입니다. 즉시 전화를 끊으세요.'
            },
            {
                q: '전화로 "ATM기 앞으로 가세요. 안내에 따라 조작하면 됩니다" 라고 합니다. 올바른 대응은?',
                options: [
                    '안내대로 ATM기로 간다',
                    '100% 보이스피싱이므로 즉시 전화를 끊는다',
                    '가족과 함께 ATM기로 간다',
                    'ATM기에서 무슨 일이 있는지 확인한다'
                ],
                answer: 2,
                category: '음성/통화 보이스피싱',
                explain: 'ATM기로 유도하는 것은 전형적인 보이스피싱입니다. 절대 따라하지 마세요.'
            },
            {
                q: '전화로 "통장을 비대면으로 개설해주시면 수수료 드립니다" 라고 합니다. 올바른 대응은?',
                options: [
                    '수수료를 받기 위해 통장을 개설한다',
                    '대포통장 범죄이므로 즉시 거절하고 신고한다',
                    '조건을 먼저 확인한다',
                    '친구에게 추천한다'
                ],
                answer: 2,
                category: '음성/통화 보이스피싱',
                explain: '통장 대여는 불법이며 본인도 범죄자가 됩니다. 즉시 거절하고 경찰에 신고하세요.'
            },
            {
                q: '전화 중 "지금 말씀드리는 내용을 녹음하고 계십니까?" 라고 물어봅니다. 어떻게 대응해야 할까요?',
                options: [
                    '정직하게 녹음 여부를 알려준다',
                    '보이스피싱 의심이므로 즉시 전화를 끊는다',
                    '녹음하지 않는다고 거짓말한다',
                    '왜 그런지 물어본다'
                ],
                answer: 2,
                category: '음성/통화 보이스피싱',
                explain: '녹음 여부를 확인하는 것은 보이스피싱범의 특징입니다. 즉시 전화를 끊으세요.'
            }
        ]
    };

    // 초기화
    initializeTopicSelect();

    // ==========================================
    // 로컬 퀴즈 로직
    // ==========================================

    function initializeTopicSelect() {
        const topicSelect = document.getElementById('topicSelect');
        if (topicSelect) {
            topicSelect.addEventListener('change', function(e) {
                selectedTopic = e.target.value;
            });
        }
    }

    function loadQuiz(topic, count = 10) {
        let allQuestions = [];
        
        if (topic === 'all') {
            // 모든 주제에서 문제 가져오기
            Object.values(quizDatabase).forEach(questions => {
                allQuestions = allQuestions.concat(questions);
            });
        } else {
            // 특정 주제 문제 가져오기
            allQuestions = quizDatabase[topic] || [];
        }
        
        // 랜덤하게 섞기
        const shuffled = allQuestions.sort(() => Math.random() - 0.5);
        
        // 요청한 개수만큼 반환
        return shuffled.slice(0, Math.min(count, shuffled.length));
    }

    // ==========================================
    // Event Listeners
    // ==========================================

    startQuizBtn.addEventListener('click', startQuiz);
    nextQuestionBtn.addEventListener('click', nextQuestion);
    prevQuestionBtn.addEventListener('click', prevQuestion);
    submitQuizBtn.addEventListener('click', submitQuiz);
    retryQuizBtn.addEventListener('click', retryQuiz);
    reviewAnswersBtn.addEventListener('click', showReview);
    backToResultBtn.addEventListener('click', backToResult);

    // ==========================================
    // Quiz Functions
    // ==========================================

    function startQuiz() {
        // 퀴즈 데이터 로드
        quizData = loadQuiz(selectedTopic, 10);
        
        if (quizData.length === 0) {
            alert('퀴즈를 불러올 수 없습니다.');
            return;
        }

        currentQuestion = 0;
        score = 0;
        userAnswers = [];

        quizStartScreen.style.display = 'none';
        quizProgressScreen.style.display = 'block';
        
        document.getElementById('totalQuestions').textContent = quizData.length;
        
        loadQuestion();
    }

    function loadQuestion() {
        const question = quizData[currentQuestion];
        
        document.getElementById('currentQuestionNum').textContent = currentQuestion + 1;
        document.getElementById('questionCategory').innerHTML = `<i class="fas fa-tag"></i><span>${question.category}</span>`;
        document.getElementById('questionText').textContent = '다음 질문에 답하세요.';
        document.getElementById('questionScenario').textContent = question.q;
        
        // Load options
        const optionsContainer = document.getElementById('quizOptions');
        optionsContainer.innerHTML = '';
        
        question.options.forEach((option, index) => {
            const optionDiv = document.createElement('div');
            optionDiv.className = 'quiz-option';
            optionDiv.dataset.index = index;
            
            // Check if already answered
            if (userAnswers[currentQuestion] !== undefined && userAnswers[currentQuestion] === index) {
                optionDiv.classList.add('selected');
            }
            
            optionDiv.innerHTML = `
                <div class="option-number">${index + 1}</div>
                <div class="option-text">${option}</div>
            `;
            
            optionDiv.addEventListener('click', selectOption);
            optionsContainer.appendChild(optionDiv);
        });
        
        // Update progress bar
        const progress = ((currentQuestion + 1) / quizData.length) * 100;
        document.getElementById('progressBarFill').style.width = `${progress}%`;
        
        // Update buttons
        updateButtons();
        
        // Hide feedback
        document.getElementById('answerFeedback').style.display = 'none';
    }

    function selectOption(e) {
        const optionDiv = e.currentTarget;
        const index = parseInt(optionDiv.dataset.index);
        
        // Remove previous selection
        document.querySelectorAll('.quiz-option').forEach(opt => {
            opt.classList.remove('selected');
        });
        
        // Add selection
        optionDiv.classList.add('selected');
        
        // Save answer
        userAnswers[currentQuestion] = index;
        
        // Show feedback
        showFeedback(index);
        
        // Enable next button
        nextQuestionBtn.disabled = false;
        if (currentQuestion === quizData.length - 1) {
            submitQuizBtn.disabled = false;
        }
    }

    function showFeedback(selectedIndex) {
        const question = quizData[currentQuestion];
        const isCorrect = selectedIndex === (question.answer - 1);
        
        const feedbackEl = document.getElementById('answerFeedback');
        const feedbackIcon = document.getElementById('feedbackIcon');
        const feedbackTitle = document.getElementById('feedbackTitle');
        const feedbackExplanation = document.getElementById('feedbackExplanation');
        
        feedbackEl.style.display = 'block';
        
        if (isCorrect) {
            feedbackIcon.innerHTML = '<i class="fas fa-check-circle"></i>';
            feedbackIcon.className = 'feedback-icon correct';
            feedbackTitle.textContent = '정답입니다!';
        } else {
            feedbackIcon.innerHTML = '<i class="fas fa-times-circle"></i>';
            feedbackIcon.className = 'feedback-icon wrong';
            feedbackTitle.textContent = '오답입니다';
        }
        
        feedbackExplanation.textContent = question.explain;
        
        // Mark options
        document.querySelectorAll('.quiz-option').forEach((opt, idx) => {
            opt.classList.add('disabled');
            if (idx === (question.answer - 1)) {
                opt.classList.add('correct');
            } else if (idx === selectedIndex && !isCorrect) {
                opt.classList.add('wrong');
            }
        });
    }

    function nextQuestion() {
        if (currentQuestion < quizData.length - 1) {
            currentQuestion++;
            loadQuestion();
        }
    }

    function prevQuestion() {
        if (currentQuestion > 0) {
            currentQuestion--;
            loadQuestion();
        }
    }

    function updateButtons() {
        // Previous button
        prevQuestionBtn.style.display = currentQuestion > 0 ? 'block' : 'none';
        
        // Next/Submit buttons
        if (currentQuestion === quizData.length - 1) {
            nextQuestionBtn.style.display = 'none';
            submitQuizBtn.style.display = 'block';
            submitQuizBtn.disabled = userAnswers[currentQuestion] === undefined;
        } else {
            nextQuestionBtn.style.display = 'block';
            submitQuizBtn.style.display = 'none';
            nextQuestionBtn.disabled = userAnswers[currentQuestion] === undefined;
        }
    }

    function submitQuiz() {
        if (userAnswers.length < quizData.length) {
            alert('모든 문제에 답해주세요.');
            return;
        }
        
        // Calculate score
        score = 0;
        userAnswers.forEach((answer, index) => {
            if ((answer + 1) === quizData[index].answer) {
                score += 10;
            }
        });
        
        showResults();
    }

    function showResults() {
        quizProgressScreen.style.display = 'none';
        quizResultScreen.style.display = 'block';
        
        const correctCount = userAnswers.filter((answer, index) => 
            (answer + 1) === quizData[index].answer
        ).length;
        const wrongCount = quizData.length - correctCount;
        
        document.getElementById('finalScore').textContent = score;
        document.getElementById('correctCount').textContent = correctCount;
        document.getElementById('wrongCount').textContent = wrongCount;
        
        // Animate score circle
        const scoreCircle = document.getElementById('scoreCircle');
        const circumference = 565.48;
        const offset = circumference - (score / 100) * circumference;
        
        setTimeout(() => {
            scoreCircle.style.strokeDashoffset = offset;
        }, 100);
        
        // Grade
        let grade, comment;
        if (score >= 90) {
            grade = 'A+';
            comment = '보이스피싱 대응 능력이 매우 우수합니다!';
        } else if (score >= 80) {
            grade = 'A';
            comment = '보이스피싱 대응 능력이 우수합니다!';
        } else if (score >= 70) {
            grade = 'B+';
            comment = '보이스피싱 대응 능력이 양호합니다.';
        } else if (score >= 60) {
            grade = 'B';
            comment = '보이스피싱 대응에 대한 학습이 필요합니다.';
        } else {
            grade = 'C';
            comment = '보이스피싱 대응 능력 향상이 시급합니다.';
        }
        
        document.getElementById('gradeBadge').textContent = grade;
        document.getElementById('gradeComment').textContent = comment;
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function retryQuiz() {
        quizResultScreen.style.display = 'none';
        quizStartScreen.style.display = 'block';
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function showReview() {
        quizResultScreen.style.display = 'none';
        quizReviewScreen.style.display = 'block';
        
        const reviewList = document.getElementById('reviewList');
        reviewList.innerHTML = '';
        
        // Show only wrong answers
        userAnswers.forEach((answer, index) => {
            if ((answer + 1) !== quizData[index].answer) {
                const question = quizData[index];
                const reviewItem = document.createElement('div');
                reviewItem.className = 'review-item';
                reviewItem.innerHTML = `
                    <div class="review-item-header">
                        <span class="review-item-number">문제 ${index + 1}</span>
                        <span class="review-item-category">${question.category}</span>
                    </div>
                    <div class="review-question">${question.q}</div>
                    <div class="review-answer">
                        <div class="review-answer-item wrong-answer">
                            <span class="review-answer-label wrong">내 답변:</span>
                            <span>${question.options[answer]}</span>
                        </div>
                        <div class="review-answer-item correct-answer">
                            <span class="review-answer-label correct">정답:</span>
                            <span>${question.options[question.answer - 1]}</span>
                        </div>
                    </div>
                    <div class="review-explanation">
                        <strong>해설</strong>
                        ${question.explain}
                    </div>
                `;
                reviewList.appendChild(reviewItem);
            }
        });
        
        if (reviewList.children.length === 0) {
            reviewList.innerHTML = '<div style="text-align: center; padding: 3rem; color: var(--dark-gray);">모든 문제를 맞추셨습니다! 🎉</div>';
        }
        
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function backToResult() {
        quizReviewScreen.style.display = 'none';
        quizResultScreen.style.display = 'block';
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
});

console.log('Quiz System Ready! 🎯');


