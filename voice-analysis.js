// Voice Analysis JavaScript
let selectedFile = null;

// DOM Elements
const audioFileInput = document.getElementById('audioFileInput');
const fileInfo = document.getElementById('fileInfo');
const fileName = document.getElementById('fileName');
const removeFileBtn = document.getElementById('removeFile');
const analyzeBtn = document.getElementById('analyzeBtn');
const uploadZone = document.getElementById('uploadZone');
const processingStatus = document.getElementById('processingStatus');
const analysisResult = document.getElementById('analysisResult');
const progressFill = document.getElementById('progressFill');
const statusText = document.getElementById('statusText');
const newAnalysisBtn = document.getElementById('newAnalysisBtn');
const downloadReportBtn = document.getElementById('downloadReport');
const reportScamBtn = document.getElementById('reportScam');

// File Upload Handler
audioFileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        // Validate file type
        const validTypes = ['audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/m4a', 'audio/x-m4a'];
        if (!validTypes.includes(file.type) && !file.name.match(/\.(mp3|wav|m4a)$/i)) {
            alert('지원하지 않는 파일 형식입니다. MP3, WAV, M4A 파일을 업로드해주세요.');
            return;
        }

        // Validate file size (50MB)
        if (file.size > 50 * 1024 * 1024) {
            alert('파일 크기가 너무 큽니다. 50MB 이하의 파일을 업로드해주세요.');
            return;
        }

        selectedFile = file;
        fileName.textContent = file.name;
        fileInfo.style.display = 'flex';
        analyzeBtn.style.display = 'inline-flex';
    }
});

// Remove File Handler
removeFileBtn.addEventListener('click', () => {
    selectedFile = null;
    audioFileInput.value = '';
    fileInfo.style.display = 'none';
    analyzeBtn.style.display = 'none';
});

// Analyze Button Handler
analyzeBtn.addEventListener('click', async () => {
    if (!selectedFile) return;

    // Hide upload zone and show processing
    uploadZone.style.display = 'none';
    processingStatus.style.display = 'block';

    // Simulate analysis process
    await simulateAnalysis();
});

// Simulate Analysis Process
async function simulateAnalysis() {
    const stages = [
        { progress: 20, text: '음성 파일을 업로드하고 있습니다...' },
        { progress: 40, text: '음성을 텍스트로 변환하고 있습니다...' },
        { progress: 60, text: 'AI가 텍스트를 분석하고 있습니다...' },
        { progress: 80, text: '보이스피싱 패턴을 검사하고 있습니다...' },
        { progress: 100, text: '분석이 완료되었습니다!' }
    ];

    for (const stage of stages) {
        await sleep(1000);
        progressFill.style.width = stage.progress + '%';
        statusText.textContent = stage.text;
    }

    await sleep(500);
    showResults();
}

// Show Analysis Results
function showResults() {
    processingStatus.style.display = 'none';
    analysisResult.style.display = 'block';

    // Simulate random risk score (for demo)
    const riskScore = Math.floor(Math.random() * 100);
    updateRiskScore(riskScore);

    // Simulated transcription
    const sampleTranscriptions = [
        "안녕하세요, 금융감독원입니다. 고객님의 계좌에서 이상 거래가 감지되었습니다. 즉시 본인 확인이 필요하니 다음 정보를 알려주시기 바랍니다...",
        "검찰청입니다. 고객님의 명의로 범죄 계좌가 개설되어 현재 수사가 진행 중입니다. 즉시 안전계좌로 자금을 이전하셔야 합니다...",
        "경찰청 사이버범죄 수사대입니다. 고객님의 개인정보가 유출되어 범죄에 사용되고 있습니다. 계좌 보호를 위해 지금 바로 조치가 필요합니다...",
        "안녕하세요, 은행 고객센터입니다. 최근 시스템 점검 중 고객님의 계좌에서 보안 문제가 발견되었습니다..."
    ];
    
    document.getElementById('transcriptionText').textContent = 
        sampleTranscriptions[Math.floor(Math.random() * sampleTranscriptions.length)];

    // 전사 결과, 탐지 근거, 대응 방법은 API 응답으로 채워질 예정
    // 현재는 빈 상태로 유지
    document.getElementById('suspiciousKeywords').innerHTML = '';
    document.getElementById('riskFactors').innerHTML = '';
    document.getElementById('recommendations').innerHTML = '';

    // Scroll to results
    setTimeout(() => {
        analysisResult.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 300);
}

// Update Risk Score with Animation
function updateRiskScore(score) {
    const riskPercentageEl = document.getElementById('riskPercentage');
    const riskLabelEl = document.getElementById('riskLabel');
    const riskDescriptionEl = document.getElementById('riskDescription');
    const meterFill = document.getElementById('meterFill');
    const riskScoreCard = document.querySelector('.risk-score-card');

    // Animate counter
    let current = 0;
    const interval = setInterval(() => {
        current += 1;
        riskPercentageEl.textContent = current + '%';
        
        if (current >= score) {
            clearInterval(interval);
            riskPercentageEl.textContent = score + '%';
        }
    }, 20);

    // Update label and description based on score
    if (score >= 70) {
        riskLabelEl.textContent = '높은 위험';
        riskDescriptionEl.textContent = '보이스피싱일 가능성이 매우 높습니다';
        riskScoreCard.style.background = 'linear-gradient(135deg, #4a0000, #8b0000)';
        meterFill.style.stroke = '#ff4444';
    } else if (score >= 40) {
        riskLabelEl.textContent = '중간 위험';
        riskDescriptionEl.textContent = '의심스러운 요소가 발견되었습니다';
        riskScoreCard.style.background = 'linear-gradient(135deg, #4a3800, #8b6914)';
        meterFill.style.stroke = '#fbbf24';
    } else {
        riskLabelEl.textContent = '낮은 위험';
        riskDescriptionEl.textContent = '안전한 통화로 판단됩니다';
        riskScoreCard.style.background = 'linear-gradient(135deg, #001a2e, #002e4f)';
        meterFill.style.stroke = '#00d9ff';
    }

    // Animate meter
    const circumference = 251.2; // Approximate arc length
    const offset = circumference - (score / 100) * circumference;
    meterFill.style.strokeDasharray = `${circumference} ${circumference}`;
    meterFill.style.strokeDashoffset = offset;
}

// New Analysis Button Handler
newAnalysisBtn.addEventListener('click', () => {
    resetAnalysis();
});

// Reset Analysis
function resetAnalysis() {
    selectedFile = null;
    audioFileInput.value = '';
    fileInfo.style.display = 'none';
    analyzeBtn.style.display = 'none';
    uploadZone.style.display = 'block';
    processingStatus.style.display = 'none';
    analysisResult.style.display = 'none';
    progressFill.style.width = '0%';
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Download Report Handler
downloadReportBtn.addEventListener('click', () => {
    alert('분석 결과 다운로드 기능은 준비 중입니다.');
});

// Report Scam Handler
reportScamBtn.addEventListener('click', () => {
    const confirmed = confirm('보이스피싱 신고 페이지로 이동하시겠습니까?\n\n신고 번호:\n• 경찰청: 112\n• 금융감독원: 1332\n• 보이스피싱 전용: 1588-2112');
    
    if (confirmed) {
        alert('신고가 접수되었습니다. 담당자가 확인 후 연락드리겠습니다.');
    }
});

// Utility function for sleep
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Drag and Drop Support
uploadZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadZone.style.borderColor = 'var(--accent-teal)';
    uploadZone.style.background = 'rgba(26, 139, 141, 0.05)';
});

uploadZone.addEventListener('dragleave', (e) => {
    e.preventDefault();
    uploadZone.style.borderColor = 'var(--gray)';
    uploadZone.style.background = 'var(--white)';
});

uploadZone.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadZone.style.borderColor = 'var(--gray)';
    uploadZone.style.background = 'var(--white)';
    
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('audio/')) {
        selectedFile = file;
        fileName.textContent = file.name;
        fileInfo.style.display = 'flex';
        analyzeBtn.style.display = 'inline-flex';
    }
});

console.log('Voice Analysis System Ready! 🎤');

