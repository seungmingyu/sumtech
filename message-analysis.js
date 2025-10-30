// Message Analysis JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const messageInput = document.getElementById('messageInput');
    const charCount = document.getElementById('charCount');
    const urlCount = document.getElementById('urlCount');
    const analyzeBtn = document.getElementById('analyzeMessageBtn');
    const messageInputZone = document.getElementById('messageInputZone');
    const processingStatus = document.getElementById('messageProcessingStatus');
    const analysisResult = document.getElementById('messageAnalysisResult');
    const newAnalysisBtn = document.getElementById('newMessageAnalysisBtn');
    const progressFill = document.getElementById('messageProgressFill');
    const statusText = document.getElementById('messageStatusText');

    let detectedUrls = [];

    // URL 정규식 패턴
    const urlPattern = /(https?:\/\/[^\s]+)|(www\.[^\s]+)|([a-zA-Z0-9-]+\.[a-zA-Z]{2,}[^\s]*)/gi;

    // 문자 입력 시 실시간 카운트 및 URL 감지
    messageInput.addEventListener('input', function() {
        const text = this.value;
        const length = text.length;
        
        // 글자 수 업데이트
        charCount.textContent = `${length}자`;
        
        // URL 감지
        detectedUrls = text.match(urlPattern) || [];
        urlCount.textContent = `URL ${detectedUrls.length}개 감지`;
        
        // URL이 감지되면 강조 표시
        if (detectedUrls.length > 0) {
            urlCount.style.color = '#f57c00';
            urlCount.style.fontWeight = '700';
        } else {
            urlCount.style.color = '#0095ff';
            urlCount.style.fontWeight = '600';
        }
        
        // 분석 버튼 활성화/비활성화
        if (length > 10) {
            analyzeBtn.disabled = false;
            analyzeBtn.style.opacity = '1';
        } else {
            analyzeBtn.disabled = true;
            analyzeBtn.style.opacity = '0.5';
        }
    });

    // 초기 버튼 상태
    analyzeBtn.disabled = true;
    analyzeBtn.style.opacity = '0.5';

    // 분석 버튼 클릭
    analyzeBtn.addEventListener('click', function() {
        if (messageInput.value.trim().length < 10) {
            alert('문자 내용을 10자 이상 입력해주세요.');
            return;
        }

        startAnalysis();
    });

    // 새로운 분석 버튼 클릭
    newAnalysisBtn.addEventListener('click', function() {
        resetAnalysis();
    });

    // 분석 시작
    function startAnalysis() {
        // 입력 영역 숨기기
        messageInputZone.style.display = 'none';
        
        // 처리 상태 표시
        processingStatus.style.display = 'block';
        
        // 진행 상태 시뮬레이션
        let progress = 0;
        const stages = [
            '문자 내용을 분석하고 있습니다...',
            'URL을 추출하고 있습니다...',
            '악성 사이트 데이터베이스와 대조하고 있습니다...',
            'AI가 보이스피싱 패턴을 분석하고 있습니다...',
            '최종 결과를 생성하고 있습니다...'
        ];
        
        let currentStage = 0;
        
        const progressInterval = setInterval(() => {
            progress += Math.random() * 15;
            
            if (progress >= 100) {
                progress = 100;
                clearInterval(progressInterval);
                
                setTimeout(() => {
                    showResults();
                }, 500);
            }
            
            progressFill.style.width = `${progress}%`;
            
            // 단계별 텍스트 변경
            const stageIndex = Math.min(Math.floor((progress / 100) * stages.length), stages.length - 1);
            if (stageIndex !== currentStage) {
                currentStage = stageIndex;
                statusText.textContent = stages[currentStage];
            }
        }, 300);
    }

    // 결과 표시
    function showResults() {
        // 처리 상태 숨기기
        processingStatus.style.display = 'none';
        
        // 결과 영역 표시
        analysisResult.style.display = 'block';
        
        // 결과 애니메이션
        analysisResult.style.opacity = '0';
        setTimeout(() => {
            analysisResult.style.transition = 'opacity 0.5s';
            analysisResult.style.opacity = '1';
        }, 100);
        
        // 분석 결과 생성 (시뮬레이션)
        const messageText = messageInput.value;
        displayAnalysisResults(messageText);
    }

    // 분석 결과 표시
    function displayAnalysisResults(messageText) {
        // 위험도 계산 (시뮬레이션)
        const riskScore = calculateRiskScore(messageText);
        
        // 메시지 내용 표시
        document.getElementById('messageContent').textContent = messageText;
        
        // URL 감지 표시
        if (detectedUrls.length > 0) {
            const urlDetection = document.getElementById('urlDetection');
            const urlList = document.getElementById('urlList');
            
            urlDetection.style.display = 'block';
            urlList.innerHTML = detectedUrls.map(url => 
                `<div class="url-item"><i class="fas fa-link"></i> ${url}</div>`
            ).join('');
        }
        
        // 위험도 등급 및 확률 표시
        const riskBadge = document.getElementById('riskBadge');
        const riskLevel = document.getElementById('riskLevel');
        const riskProbability = document.getElementById('riskProbability');
        const riskLevelCard = document.querySelector('.risk-level-card');
        
        if (riskScore >= 70) {
            riskLevel.textContent = '매우 위험';
            riskBadge.style.color = '#ef4444';
            riskProbability.textContent = `${riskScore}%`;
            riskLevelCard.style.background = 'linear-gradient(135deg, #4a0000, #8b0000)';
        } else if (riskScore >= 40) {
            riskLevel.textContent = '주의 필요';
            riskBadge.style.color = '#f59e0b';
            riskProbability.textContent = `${riskScore}%`;
            riskLevelCard.style.background = 'linear-gradient(135deg, #4a3800, #8b6914)';
        } else {
            riskLevel.textContent = '안전';
            riskBadge.style.color = '#10b981';
            riskProbability.textContent = `${riskScore}%`;
            riskLevelCard.style.background = 'linear-gradient(135deg, #001a2e, #002e4f)';
        }
        
        // 위험도 등급 세부 정보
        const riskGrade = document.getElementById('riskGrade');
        let gradeBadgeClass = 'grade-badge';
        let gradeText = '';
        let gradeDescription = '';
        
        if (riskScore >= 70) {
            gradeBadgeClass = 'grade-badge';
            gradeText = '매우 위험';
            gradeDescription = '보이스피싱 문자로 강력하게 의심됩니다';
        } else if (riskScore >= 40) {
            gradeBadgeClass = 'grade-badge warning';
            gradeText = '주의 필요';
            gradeDescription = '의심스러운 요소가 발견되었습니다';
        } else {
            gradeBadgeClass = 'grade-badge safe';
            gradeText = '안전';
            gradeDescription = '정상적인 문자로 판단됩니다';
        }
        
        riskGrade.innerHTML = `
            <span class="${gradeBadgeClass}">${gradeText}</span>
            <p>${gradeDescription}</p>
        `;
        
        // 분석 근거 (API 응답으로 채워질 예정이므로 빈 상태로 유지)
        document.getElementById('analysisGrounds').innerHTML = '';
        
        // 권고 대처 방안 (API 응답으로 채워질 예정이므로 빈 상태로 유지)
        document.getElementById('messageRecommendations').innerHTML = '';
    }

    // 위험도 점수 계산 (시뮬레이션)
    function calculateRiskScore(text) {
        let score = 30; // 기본 점수
        
        // 보이스피싱 키워드 체크
        const phishingKeywords = [
            '긴급', '즉시', '확인', '계좌', '이체', '출금', '정지',
            '명의도용', '경찰', '검찰', '금융감독원', '안전계좌',
            '보안강화', '본인확인', '미납', '연체', '압류', '가압류',
            '택배', '우체국', '관세청', '통관', '보관료', '파손',
            '환불', '보상', '무료', '당첨', '경품'
        ];
        
        phishingKeywords.forEach(keyword => {
            if (text.includes(keyword)) {
                score += 10;
            }
        });
        
        // URL 포함 시 추가 점수
        if (detectedUrls.length > 0) {
            score += 20;
        }
        
        // 축약 URL 서비스 사용 시 추가 점수
        const shortUrlPatterns = ['bit.ly', 'goo.gl', 't.co', 'tinyurl', 'ow.ly'];
        shortUrlPatterns.forEach(pattern => {
            if (text.toLowerCase().includes(pattern)) {
                score += 15;
            }
        });
        
        // 최대 95%로 제한
        return Math.min(score, 95);
    }

    // 분석 초기화
    function resetAnalysis() {
        // 입력 초기화
        messageInput.value = '';
        charCount.textContent = '0자';
        urlCount.textContent = 'URL 0개 감지';
        detectedUrls = [];
        
        // 진행 바 초기화
        progressFill.style.width = '0%';
        
        // 화면 전환
        analysisResult.style.display = 'none';
        processingStatus.style.display = 'none';
        messageInputZone.style.display = 'block';
        
        // 페이지 상단으로 스크롤
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // 다운로드 버튼
    document.getElementById('downloadMessageReport').addEventListener('click', function() {
        alert('분석 결과 다운로드 기능은 API 연동 후 구현됩니다.');
    });

    // 신고 버튼
    document.getElementById('reportMessage').addEventListener('click', function() {
        alert('보이스피싱 신고 기능은 API 연동 후 구현됩니다.\n\n긴급 신고:\n• 경찰신고: 112\n• 금융감독원: 1332\n• 보이스피싱: 1588-2112');
    });
});

