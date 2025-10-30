// Chat Simulation JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const scenarioSelect = document.getElementById('scenarioSelect');
    const openingPreview = document.getElementById('openingPreview');
    const startSimulationBtn = document.getElementById('startSimulationBtn');
    const viewResultBtn = document.getElementById('viewResultBtn');
    const chatMessages = document.getElementById('chatMessages');
    const chatInput = document.getElementById('chatInput');
    const sendMessageBtn = document.getElementById('sendMessageBtn');
    const chatStatusText = document.getElementById('chatStatusText');
    const chatStatusIcon = document.getElementById('chatStatusIcon');

    let currentScenario = null;
    let conversationHistory = [];
    let isSimulationActive = false;

    // 시나리오 데이터
    const scenarios = {
        scenario1: {
            name: '택배 배송 사칭',
            opening: '[Web발신]\n고객님의 택배가 주소 불명으로 보관중입니다.\n확인하시려면 아래 링크를 클릭해주세요.\nhttps://fake-delivery-link.com',
            firstMessage: '안녕하세요, 고객님. CJ대한통운입니다. 고객님 앞으로 온 택배가 주소 불명으로 반송 예정입니다.'
        },
        scenario2: {
            name: '금융감독원 사칭',
            opening: '고객님의 계좌가 보이스피싱에 악용되고 있습니다.\n금융감독원에서 긴급 연락드립니다.\n본인 확인을 위해 개인정보를 입력해주세요.',
            firstMessage: '금융감독원 조사팀입니다. 고객님 명의의 계좌가 보이스피싱 범죄에 악용되고 있어 긴급히 연락드렸습니다.'
        },
        scenario3: {
            name: '경찰청 사칭',
            opening: '귀하는 금융범죄 사건에 연루되어 있습니다.\n서울지방경찰청 금융범죄수사대입니다.\n즉시 연락 바랍니다.',
            firstMessage: '서울지방경찰청 금융범죄수사대 김철수 경위입니다. 귀하의 명의로 개설된 계좌가 범죄에 사용되고 있습니다.'
        },
        scenario4: {
            name: '가족 사칭',
            opening: '엄마 나야. 급하게 돈이 필요해.\n휴대폰이 고장나서 친구 폰으로 연락해.\n이 계좌로 200만원 급하게 보내줘.',
            firstMessage: '엄마, 나 지금 큰일났어. 친구 폰 빌려서 연락하는데 급하게 돈이 필요해.'
        },
        scenario5: {
            name: '은행원 사칭',
            opening: '고객님의 대출이 승인되었습니다.\n신한은행입니다.\n대출금 수령을 위해 본인 인증이 필요합니다.',
            firstMessage: '안녕하세요, 신한은행 여신팀 이영희입니다. 고객님께서 신청하신 대출이 승인되었습니다.'
        }
    };

    // 초기 상태 업데이트
    updateChatStatus('대기 중', '#94a3b8');
    startSimulationBtn.disabled = true;
    viewResultBtn.disabled = true;

    // 시나리오 선택 이벤트
    scenarioSelect.addEventListener('change', function() {
        const selectedValue = this.value;
        
        if (selectedValue && scenarios[selectedValue]) {
            currentScenario = scenarios[selectedValue];
            openingPreview.textContent = currentScenario.opening;
            startSimulationBtn.disabled = false;
            updateChatStatus('시나리오 선택됨 - 시작 준비', '#10b981');
        } else {
            currentScenario = null;
            openingPreview.textContent = '시나리오를 선택하면 오프닝 멘트가 표시됩니다.';
            startSimulationBtn.disabled = true;
            updateChatStatus('대기 중', '#94a3b8');
        }
    });

    // 시뮬레이션 시작 버튼
    startSimulationBtn.addEventListener('click', function() {
        if (!currentScenario) return;
        
        startSimulation();
    });

    // 메시지 전송 (Enter 키)
    chatInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    // 메시지 전송 버튼
    sendMessageBtn.addEventListener('click', function() {
        sendMessage();
    });

    // 결과 보기 버튼
    viewResultBtn.addEventListener('click', function() {
        showResults();
    });

    // 시뮬레이션 시작
    function startSimulation() {
        isSimulationActive = true;
        
        // 채팅 영역 초기화
        chatMessages.innerHTML = '';
        conversationHistory = [];
        
        // 입력 활성화
        chatInput.disabled = false;
        sendMessageBtn.disabled = false;
        chatInput.focus();
        
        // 버튼 상태 변경
        startSimulationBtn.disabled = true;
        viewResultBtn.disabled = false;
        
        // 상태 업데이트
        updateChatStatus('시뮬레이션 진행 중', '#10b981');
        
        // 첫 메시지 표시 (약간의 지연 후)
        setTimeout(() => {
            addScammerMessage(currentScenario.firstMessage);
        }, 1000);
    }

    // 메시지 전송
    function sendMessage() {
        const message = chatInput.value.trim();
        
        if (!message || !isSimulationActive) return;
        
        // 사용자 메시지 추가
        addUserMessage(message);
        conversationHistory.push({ role: 'user', content: message });
        
        // 입력창 초기화
        chatInput.value = '';
        chatInput.style.height = 'auto';
        
        // 입력 비활성화 (응답 대기)
        chatInput.disabled = true;
        sendMessageBtn.disabled = true;
        
        // AI 응답 시뮬레이션 (실제로는 API 호출)
        setTimeout(() => {
            generateScammerResponse(message);
            
            // 입력 다시 활성화
            chatInput.disabled = false;
            sendMessageBtn.disabled = false;
            chatInput.focus();
        }, 1500 + Math.random() * 1000);
    }

    // 사용자 메시지 추가
    function addUserMessage(message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'chat-message user';
        messageDiv.innerHTML = `
            <div class="message-avatar user">
                <i class="fas fa-user"></i>
            </div>
            <div class="message-content">
                <div class="message-bubble">${escapeHtml(message)}</div>
                <div class="message-time">${getCurrentTime()}</div>
            </div>
        `;
        chatMessages.appendChild(messageDiv);
        scrollToBottom();
    }

    // 보이스피싱범 메시지 추가
    function addScammerMessage(message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'chat-message scammer';
        messageDiv.innerHTML = `
            <div class="message-avatar scammer">
                <i class="fas fa-user-secret"></i>
            </div>
            <div class="message-content">
                <div class="message-bubble">${escapeHtml(message)}</div>
                <div class="message-time">${getCurrentTime()}</div>
            </div>
        `;
        chatMessages.appendChild(messageDiv);
        conversationHistory.push({ role: 'scammer', content: message });
        scrollToBottom();
    }

    // AI 응답 생성 (시뮬레이션)
    function generateScammerResponse(userMessage) {
        // 실제로는 API를 통해 Gemini AI 응답을 받아야 함
        // 여기서는 시뮬레이션용 간단한 응답
        const responses = [
            '네, 정확한 확인을 위해 고객님의 성함과 생년월일을 말씀해주시겠습니까?',
            '고객님, 시간이 얼마 없습니다. 빠른 조치가 필요합니다.',
            '제가 안내해드린 절차대로 진행하시면 문제가 해결됩니다.',
            '고객님의 안전을 위해 지금 즉시 조치가 필요합니다.',
            '다른 방법은 없습니다. 저희 안내를 따라주셔야 합니다.'
        ];
        
        const randomResponse = responses[Math.floor(Math.random() * responses.length)];
        addScammerMessage(randomResponse);
    }

    // 결과 표시
    function showResults() {
        if (conversationHistory.length === 0) {
            alert('아직 진행된 대화가 없습니다.');
            return;
        }
        
        // 실제로는 분석 결과 페이지로 이동하거나 모달 표시
        alert('대화 분석 결과 페이지로 이동합니다.\n\n이 기능은 API 연동 후 구현됩니다.');
    }

    // 채팅 상태 업데이트
    function updateChatStatus(text, color) {
        chatStatusText.textContent = text;
        chatStatusIcon.style.color = color;
    }

    // 현재 시간 가져오기
    function getCurrentTime() {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        return `${hours}:${minutes}`;
    }

    // HTML 이스케이프
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // 스크롤 하단으로
    function scrollToBottom() {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // textarea 자동 높이 조절
    chatInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = Math.min(this.scrollHeight, 120) + 'px';
    });
});
