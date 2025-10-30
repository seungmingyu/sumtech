// Chat Simulation JavaScript - API 연동 버전
document.addEventListener('DOMContentLoaded', function() {
    // API 기본 URL
    const API_BASE = '/api';
    
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
    let currentSessionId = null;
    let isSimulationActive = false;
    let scenariosData = {};
    let openersData = {};

    // 초기 상태 업데이트
    updateChatStatus('대기 중', '#94a3b8');
    startSimulationBtn.disabled = true;
    viewResultBtn.disabled = true;

    // 페이지 로드 시 시나리오 목록 가져오기
    loadScenarios();

    async function loadScenarios() {
        try {
            const response = await fetch(`${API_BASE}/meta`);
            if (!response.ok) throw new Error('시나리오 로딩 실패');
            
            const data = await response.json();
            scenariosData = data.scenarios;
            openersData = data.openers;
            
            // 시나리오 옵션 추가
            Object.keys(scenariosData).forEach(key => {
                const option = document.createElement('option');
                option.value = key;
                option.textContent = key;
                scenarioSelect.appendChild(option);
            });
            
            console.log('시나리오 로딩 완료:', Object.keys(scenariosData));
        } catch (error) {
            console.error('시나리오 로딩 오류:', error);
            showError('시나리오를 불러오는데 실패했습니다.');
        }
    }

    // 시나리오 선택 이벤트
    scenarioSelect.addEventListener('change', function() {
        const selectedValue = this.value;
        
        if (selectedValue && scenariosData[selectedValue]) {
            currentScenario = selectedValue;
            openingPreview.textContent = openersData[selectedValue] || scenariosData[selectedValue];
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
    startSimulationBtn.addEventListener('click', async function() {
        if (!currentScenario) return;
        
        try {
            await startSimulation();
        } catch (error) {
            console.error('시뮬레이션 시작 오류:', error);
            showError('시뮬레이션을 시작하는데 실패했습니다.');
        }
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
    viewResultBtn.addEventListener('click', async function() {
        try {
            await showResults();
        } catch (error) {
            console.error('결과 조회 오류:', error);
            showError('결과를 불러오는데 실패했습니다.');
        }
    });

    // 시뮬레이션 시작
    async function startSimulation() {
        isSimulationActive = true;
        
        // 채팅 영역 초기화
        chatMessages.innerHTML = '';
        
        // 입력 활성화
        chatInput.disabled = false;
        sendMessageBtn.disabled = false;
        chatInput.focus();
        
        // 버튼 상태 변경
        startSimulationBtn.disabled = true;
        scenarioSelect.disabled = true;
        viewResultBtn.disabled = false;
        
        // 상태 업데이트
        updateChatStatus('시뮬레이션 시작 중...', '#f59e0b');
        
        try {
            // API 호출: 세션 시작
            const response = await fetch(`${API_BASE}/begin`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ scenario: currentScenario })
            });
            
            if (!response.ok) throw new Error('세션 시작 실패');
            
            const data = await response.json();
            currentSessionId = data.sid;
            
            updateChatStatus('시뮬레이션 진행 중', '#10b981');
            
            // 첫 메시지 표시
            setTimeout(() => {
                addScammerMessage(data.text);
            }, 500);
            
        } catch (error) {
            console.error('시작 오류:', error);
            showError('세션 시작에 실패했습니다. 다시 시도해주세요.');
            resetSimulation();
        }
    }

    // 메시지 전송
    async function sendMessage() {
        const message = chatInput.value.trim();
        
        if (!message || !isSimulationActive || !currentSessionId) return;
        
        // 사용자 메시지 추가
        addUserMessage(message);
        
        // 입력창 초기화
        chatInput.value = '';
        chatInput.style.height = 'auto';
        
        // 입력 비활성화 (응답 대기)
        chatInput.disabled = true;
        sendMessageBtn.disabled = true;
        
        try {
            // API 호출: 메시지 전송
            const response = await fetch(`${API_BASE}/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sid: currentSessionId,
                    scenario: currentScenario,
                    message: message
                })
            });
            
            if (!response.ok) throw new Error('메시지 전송 실패');
            
            const data = await response.json();
            
            // AI 응답 표시
            setTimeout(() => {
                addScammerMessage(data.text);
                
                // 입력 다시 활성화
                chatInput.disabled = false;
                sendMessageBtn.disabled = false;
                chatInput.focus();
            }, 800 + Math.random() * 700);
            
        } catch (error) {
            console.error('메시지 전송 오류:', error);
            showError('메시지 전송에 실패했습니다.');
            
            // 입력 다시 활성화
            chatInput.disabled = false;
            sendMessageBtn.disabled = false;
        }
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
        scrollToBottom();
    }

    // 결과 표시
    async function showResults() {
        if (!currentSessionId) {
            alert('아직 진행된 대화가 없습니다.');
            return;
        }
        
        updateChatStatus('결과 분석 중...', '#f59e0b');
        
        try {
            // API 호출: 분석 결과
            const response = await fetch(`${API_BASE}/analyze_json`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sid: currentSessionId,
                    scenario: currentScenario
                })
            });
            
            if (!response.ok) throw new Error('분석 실패');
            
            const data = await response.json();
            
            // 결과 모달 또는 새 페이지에 표시
            showResultModal(data.markdown);
            
            updateChatStatus('시뮬레이션 완료', '#10b981');
            
        } catch (error) {
            console.error('분석 오류:', error);
            showError('결과 분석에 실패했습니다.');
            updateChatStatus('시뮬레이션 진행 중', '#10b981');
        }
    }

    // 결과 모달 표시
    function showResultModal(markdown) {
        // 간단한 모달 구현 (실제로는 더 멋진 UI 필요)
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.8);
            z-index: 10000;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 20px;
        `;
        
        const content = document.createElement('div');
        content.style.cssText = `
            background: white;
            padding: 30px;
            border-radius: 12px;
            max-width: 800px;
            max-height: 80vh;
            overflow-y: auto;
            box-shadow: 0 10px 40px rgba(0,0,0,0.3);
        `;
        
        // Markdown을 HTML로 간단 변환 (실제로는 마크다운 라이브러리 사용 권장)
        const htmlContent = markdown
            .replace(/^# (.+)$/gm, '<h1>$1</h1>')
            .replace(/^## (.+)$/gm, '<h2>$1</h2>')
            .replace(/^### (.+)$/gm, '<h3>$1</h3>')
            .replace(/^\*\*(.+)\*\*$/gm, '<strong>$1</strong>')
            .replace(/^- (.+)$/gm, '<li>$1</li>')
            .replace(/\n/g, '<br>');
        
        content.innerHTML = `
            ${htmlContent}
            <br><br>
            <button onclick="this.closest('div[style*=fixed]').remove()" 
                    style="padding: 10px 20px; background: #3b82f6; color: white; border: none; border-radius: 6px; cursor: pointer;">
                닫기
            </button>
        `;
        
        modal.appendChild(content);
        document.body.appendChild(modal);
        
        // 모달 외부 클릭 시 닫기
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    }

    // 시뮬레이션 리셋
    function resetSimulation() {
        isSimulationActive = false;
        currentSessionId = null;
        chatInput.disabled = true;
        sendMessageBtn.disabled = true;
        startSimulationBtn.disabled = false;
        scenarioSelect.disabled = false;
        updateChatStatus('대기 중', '#94a3b8');
    }

    // 에러 메시지 표시
    function showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'chat-message system-error';
        errorDiv.innerHTML = `
            <div class="message-content" style="background: #fee; border-left: 4px solid #f44; padding: 12px; margin: 10px 0;">
                <strong>⚠️ 오류:</strong> ${escapeHtml(message)}
            </div>
        `;
        chatMessages.appendChild(errorDiv);
        scrollToBottom();
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