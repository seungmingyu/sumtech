// URL 검사 기능
let isChecking = false;

// URL 검사 실행
function checkURL() {
    const urlInput = document.getElementById('urlInput');
    const url = urlInput.value.trim();
    
    if (!url) {
        alert('검사할 URL을 입력해주세요.');
        return;
    }
    
    if (!isValidURL(url)) {
        alert('올바른 URL 형식을 입력해주세요. (예: https://example.com)');
        return;
    }
    
    if (isChecking) {
        return;
    }
    
    isChecking = true;
    showLoadingState();
    
    // 검사 시뮬레이션 (실제로는 서버 API 호출)
    setTimeout(() => {
        const result = analyzeURL(url);
        showResult(result);
        isChecking = false;
    }, 2000);
}

// URL 유효성 검사
function isValidURL(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}

// 로딩 상태 표시
function showLoadingState() {
    const resultSection = document.getElementById('resultSection');
    const resultCard = document.getElementById('resultCard');
    
    resultSection.style.display = 'block';
    resultCard.innerHTML = `
        <div class="loading-state">
            <div class="loading-spinner"></div>
            <h3>URL 검사 중...</h3>
            <p>보안 데이터베이스와 대조하여 위험도를 분석하고 있습니다.</p>
            <div class="loading-steps">
                <div class="step active">도메인 분석</div>
                <div class="step">SSL 인증서 확인</div>
                <div class="step">피싱 DB 대조</div>
                <div class="step">위험도 계산</div>
            </div>
        </div>
    `;
    
    // 로딩 단계 애니메이션
    let currentStep = 0;
    const steps = document.querySelectorAll('.step');
    const stepInterval = setInterval(() => {
        if (currentStep < steps.length - 1) {
            currentStep++;
            steps[currentStep].classList.add('active');
        } else {
            clearInterval(stepInterval);
        }
    }, 400);
}

// URL 분석 (시뮬레이션)
function analyzeURL(url) {
    const domain = new URL(url).hostname;
    
    // 위험한 패턴 검사
    const dangerousPatterns = [
        'phishing-test.com',
        'fake-bank.co.kr',
        'suspicious-site.net',
        'scam-alert.org'
    ];
    
    const suspiciousPatterns = [
        'bit.ly',
        'tinyurl.com',
        'short.link',
        'click.me'
    ];
    
    // 안전한 사이트들
    const safeSites = [
        'google.com',
        'naver.com',
        'daum.net',
        'github.com',
        'microsoft.com',
        'apple.com'
    ];
    
    let riskScore = 0;
    let status = 'safe';
    let statusTitle = '안전한 사이트';
    let statusDescription = '이 URL은 안전한 것으로 확인되었습니다.';
    let statusIcon = '🛡️';
    
    // 위험 사이트 검사
    if (dangerousPatterns.some(pattern => domain.includes(pattern))) {
        riskScore = Math.floor(Math.random() * 30) + 70; // 70-100
        status = 'dangerous';
        statusTitle = '위험한 사이트';
        statusDescription = '이 URL은 피싱 사이트로 확인되었습니다. 접속하지 마세요!';
        statusIcon = '🚨';
    }
    // 의심스러운 사이트 검사
    else if (suspiciousPatterns.some(pattern => domain.includes(pattern))) {
        riskScore = Math.floor(Math.random() * 40) + 30; // 30-70
        status = 'suspicious';
        statusTitle = '주의 필요';
        statusDescription = '이 URL은 주의가 필요합니다. 신중하게 접속하세요.';
        statusIcon = '⚠️';
    }
    // 안전한 사이트 검사
    else if (safeSites.some(pattern => domain.includes(pattern))) {
        riskScore = Math.floor(Math.random() * 10); // 0-10
        status = 'safe';
    }
    // 기타 사이트
    else {
        riskScore = Math.floor(Math.random() * 50) + 10; // 10-60
        if (riskScore > 40) {
            status = 'suspicious';
            statusTitle = '주의 필요';
            statusDescription = '이 URL에 대한 정보가 부족합니다. 주의하여 접속하세요.';
            statusIcon = '⚠️';
        }
    }
    
    return {
        url,
        domain,
        riskScore,
        status,
        statusTitle,
        statusDescription,
        statusIcon,
        sslValid: riskScore < 70,
        scanTime: (Math.random() * 2 + 0.5).toFixed(1)
    };
}

// 결과 표시
function showResult(result) {
    const resultCard = document.getElementById('resultCard');
    const scanTime = document.getElementById('scanTime');
    
    scanTime.textContent = result.scanTime + '초';
    
    const statusClass = result.status;
    const sslStatus = result.sslValid ? '유효' : '무효';
    
    resultCard.innerHTML = `
        <div class="result-status ${statusClass}">
            <div class="status-icon">${result.statusIcon}</div>
            <div class="status-text">
                <h4>${result.statusTitle}</h4>
                <p>${result.statusDescription}</p>
            </div>
        </div>
        
        <div class="result-details">
            <div class="detail-item">
                <span class="detail-label">도메인:</span>
                <span class="detail-value">${result.domain}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">SSL 인증서:</span>
                <span class="detail-value ${result.sslValid ? 'valid' : 'invalid'}">${sslStatus}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">위험도 점수:</span>
                <span class="detail-value risk-score ${statusClass}">${result.riskScore}/100</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">마지막 검사:</span>
                <span class="detail-value">방금 전</span>
            </div>
        </div>
        
        ${result.status === 'dangerous' ? `
        <div class="danger-warning">
            <h4>⚠️ 위험 경고</h4>
            <ul>
                <li>이 사이트에 개인정보를 입력하지 마세요</li>
                <li>파일을 다운로드하지 마세요</li>
                <li>즉시 브라우저를 닫으세요</li>
                <li>의심스러운 활동을 112에 신고하세요</li>
            </ul>
        </div>
        ` : ''}
        
        ${result.status === 'suspicious' ? `
        <div class="caution-notice">
            <h4>💡 주의사항</h4>
            <ul>
                <li>개인정보 입력 시 각별히 주의하세요</li>
                <li>공식 사이트인지 다시 한 번 확인하세요</li>
                <li>의심스러우면 직접 검색하여 접속하세요</li>
            </ul>
        </div>
        ` : ''}
    `;
}

// 샘플 URL 테스트
function testSafeURL() {
    document.getElementById('urlInput').value = 'https://www.google.com';
    checkURL();
}

function testDangerousURL() {
    document.getElementById('urlInput').value = 'https://phishing-test.com/fake-bank';
    checkURL();
}

function testSuspiciousURL() {
    document.getElementById('urlInput').value = 'https://bit.ly/suspicious-link';
    checkURL();
}

// 엔터 키 이벤트
document.addEventListener('DOMContentLoaded', function() {
    const urlInput = document.getElementById('urlInput');
    
    urlInput.addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            checkURL();
        }
    });
    
    // 입력창에 포커스
    urlInput.focus();
});