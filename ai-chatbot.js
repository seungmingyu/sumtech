// AI 챗봇 기능
let chatHistory = [];

// 메시지 전송
function sendMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    
    if (message) {
        addMessage(message, 'user');
        input.value = '';
        
        // AI 응답 시뮬레이션
        setTimeout(() => {
            const response = generateAIResponse(message);
            addMessage(response, 'bot');
        }, 1000);
    }
}

// 빠른 질문
function askQuickQuestion(question) {
    addMessage(question, 'user');
    
    setTimeout(() => {
        const response = generateAIResponse(question);
        addMessage(response, 'bot');
    }, 1000);
}

// 메시지 추가
function addMessage(text, sender) {
    const messagesContainer = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message`;
    
    const currentTime = new Date().toLocaleTimeString('ko-KR', {
        hour: '2-digit',
        minute: '2-digit'
    });
    
    messageDiv.innerHTML = `
        <div class="message-avatar">${sender === 'user' ? '👤' : '🤖'}</div>
        <div class="message-content">
            <div class="message-text">${text}</div>
            <div class="message-time">${currentTime}</div>
        </div>
    `;
    
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    // 채팅 히스토리에 추가
    chatHistory.push({ text, sender, time: currentTime });
}

// AI 응답 생성
function generateAIResponse(message) {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('의심스러운 전화') || lowerMessage.includes('전화가 왔어요')) {
        return `🚨 의심스러운 전화를 받으셨군요!\n\n즉시 다음과 같이 대응하세요:\n\n1️⃣ 전화를 즉시 끊으세요\n2️⃣ 개인정보를 절대 알려주지 마세요\n3️⃣ 해당 기관에 직접 전화하여 확인하세요\n4️⃣ 의심스러우면 112에 신고하세요\n\n더 자세한 도움이 필요하시면 언제든 말씀해주세요! 🛡️`;
    }
    
    if (lowerMessage.includes('개인정보') && lowerMessage.includes('알려줬')) {
        return `😰 개인정보를 알려주셨다면 즉시 조치가 필요합니다!\n\n🚨 긴급 대응 순서:\n\n1️⃣ 112에 즉시 신고\n2️⃣ 모든 금융 비밀번호 변경\n3️⃣ 카드회사에 연락하여 카드 재발급\n4️⃣ 은행에 연락하여 계좌 모니터링 강화\n5️⃣ 신용정보 조회 서비스 신청\n\n빠른 대응이 피해를 최소화할 수 있습니다. 추가 도움이 필요하시면 말씀해주세요!`;
    }
    
    if (lowerMessage.includes('신고') || lowerMessage.includes('어디에')) {
        return `📞 보이스피싱 신고 연락처를 안내해드릴게요!\n\n🚨 긴급 신고:\n• 112 (경찰청)\n• 1588-2112 (보이스피싱 신고센터)\n\n🏛️ 관련 기관:\n• 1332 (금융감독원)\n• 182 (사이버수사대)\n\n🌐 온라인 신고:\n• ecrm.police.go.kr (사이버경찰청)\n\n신고 시 통화 내역, 송금 정보 등을 준비하시면 도움이 됩니다. 24시간 언제든 신고 가능합니다! 💪`;
    }
    
    if (lowerMessage.includes('피해') && (lowerMessage.includes('당했') || lowerMessage.includes('대응'))) {
        return `💔 피해를 당하셨다니 정말 안타깝습니다. 하지만 포기하지 마세요!\n\n🆘 즉시 해야 할 일:\n\n1️⃣ 112 신고 (가장 중요!)\n2️⃣ 은행 연락하여 계좌 지급정지\n3️⃣ 카드회사 연락하여 카드 정지\n4️⃣ 모든 비밀번호 변경\n5️⃣ 증거 자료 보관 (통화 기록, 문자 등)\n\n💰 피해 회복 방법:\n• 금융감독원 피해 환급 신청\n• 보이스피싱 피해자 지원 제도 활용\n• 민사소송 검토\n\n빠른 신고가 피해 회복의 열쇠입니다! 힘내세요! 🤝`;
    }
    
    // 기본 응답
    return `안녕하세요! 보이스피싱 예방에 관한 질문을 해주세요. 😊\n\n다음과 같은 도움을 드릴 수 있어요:\n• 의심스러운 상황 판단\n• 피해 발생 시 대응 방법\n• 예방 수칙 안내\n• 신고 방법 및 연락처\n\n구체적인 상황을 말씀해주시면 더 정확한 도움을 드릴 수 있습니다! 🛡️`;
}

// 키보드 이벤트
function handleKeyPress(event) {
    if (event.key === 'Enter') {
        sendMessage();
    }
}

// 대화 초기화
function clearChat() {
    if (confirm('대화 내용을 모두 삭제하시겠습니까?')) {
        const messagesContainer = document.getElementById('chatMessages');
        messagesContainer.innerHTML = `
            <div class="message bot-message">
                <div class="message-avatar">🤖</div>
                <div class="message-content">
                    <div class="message-text">
                        안녕하세요! 저는 보이스피싱 예방을 도와드리는 AI 챗봇입니다. 🛡️<br><br>
                        다음과 같은 도움을 드릴 수 있어요:<br>
                        • 보이스피싱 의심 상황 판단<br>
                        • 피해 발생 시 대응 방법<br>
                        • 예방 수칙 및 안전 가이드<br>
                        • 신고 방법 및 연락처 안내<br><br>
                        무엇을 도와드릴까요?
                    </div>
                    <div class="message-time">방금 전</div>
                </div>
            </div>
        `;
        chatHistory = [];
    }
}

// 대화 저장
function downloadChat() {
    if (chatHistory.length === 0) {
        alert('저장할 대화 내용이 없습니다.');
        return;
    }
    
    let chatText = '보이스피싱 예방 센터 AI 챗봇 상담 내역\n';
    chatText += '=' .repeat(50) + '\n\n';
    
    chatHistory.forEach(msg => {
        const sender = msg.sender === 'user' ? '사용자' : 'AI 챗봇';
        chatText += `[${msg.time}] ${sender}: ${msg.text}\n\n`;
    });
    
    const blob = new Blob([chatText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `챗봇_상담내역_${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
}

// 음성 입력 (시뮬레이션)
function startVoiceInput() {
    alert('음성 입력 기능은 개발 중입니다. 곧 제공될 예정입니다!');
}

// 파일 첨부 (시뮬레이션)
function attachFile() {
    alert('파일 첨부 기능은 개발 중입니다. 스크린샷이나 문서를 첨부하여 더 정확한 상담을 받을 수 있습니다!');
}

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', function() {
    // 초기 메시지는 HTML에 이미 있으므로 히스토리에만 추가
    chatHistory.push({
        text: '안녕하세요! 저는 보이스피싱 예방을 도와드리는 AI 챗봇입니다.',
        sender: 'bot',
        time: '방금 전'
    });
    
    // 입력창에 포커스
    document.getElementById('chatInput').focus();
});