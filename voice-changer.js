// 음성 분석 대시보드 스크립트
let analysisTimer = null;
let analysisProgress = 0;
let isAnalyzing = false;
let uploadedFile = null;

const DEFAULT_STATE = {
    verdict: '근거 부족',
    summary: '증거 자료가 부족하여 판별할 수 없습니다.',
    transcript: '',
    evidence: '',
    response: ''
};

document.addEventListener('DOMContentLoaded', () => {
    const startBtn = document.getElementById('startAnalysisBtn');
    const resetBtn = document.getElementById('resetAnalysisBtn');
    const fileInput = document.getElementById('audioFileInput');
    const selectFileBtn = document.getElementById('selectFileBtn');
    const uploadArea = document.getElementById('uploadArea');
    const uploadInfo = document.getElementById('uploadInfo');
    const removeFileBtn = document.getElementById('removeFileBtn');

    startBtn.addEventListener('click', () => startAnalysis(startBtn));
    resetBtn.addEventListener('click', () => resetDashboard(startBtn));

    // 파일 선택 버튼 클릭
    selectFileBtn.addEventListener('click', () => fileInput.click());
    uploadArea.addEventListener('click', () => fileInput.click());

    // 파일 선택 이벤트
    fileInput.addEventListener('change', (e) => handleFileSelect(e.target.files[0]));

    // 드래그 앤 드롭
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('audio/')) {
            handleFileSelect(file);
        } else {
            alert('오디오 파일만 업로드할 수 있습니다.');
        }
    });

    // 파일 제거
    removeFileBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        removeFile();
    });

    document.querySelectorAll('.quick-action').forEach(button => {
        button.addEventListener('click', () => handleQuickAction(button.dataset.action));
    });

    resetDashboard(startBtn);
});

async function startAnalysis(startButton) {
    if (isAnalyzing) return;
    
    if (!uploadedFile) {
        alert('먼저 음성 파일을 업로드해주세요.');
        return;
    }

    isAnalyzing = true;
    analysisProgress = 0;
    updateProgress(analysisProgress);
    startButton.disabled = true;
    startButton.textContent = '분석 중...';

    // 프로그레스바 애니메이션 시작
    startProgressAnimation();

    try {
        // FormData 생성
        const formData = new FormData();
        formData.append('file', uploadedFile);

        // API 호출
        const response = await fetch('/scan/voice', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            let errorMsg = '서버 오류: ' + response.status;
            try {
                const errorData = await response.json();
                if (errorData && errorData.detail) {
                    errorMsg = errorData.detail;
                }
            } catch {}
            throw new Error(errorMsg);
        }

        const data = await response.json();
        
        // 분석 완료
        completeAnalysis(startButton, data);
        
    } catch (error) {
        // 에러 처리
        clearInterval(analysisTimer);
        isAnalyzing = false;
        startButton.textContent = '분석 시작';
        startButton.disabled = false;
        
        alert('❌ 분석 오류: ' + (error?.message || String(error)));
        console.error('Analysis error:', error);
    }
}

function startProgressAnimation() {
    const checkpoints = [15, 30, 55, 80, 95];
    let step = 0;

    analysisTimer = setInterval(() => {
        if (analysisProgress >= checkpoints[step]) {
            step++;
        }

        const target = checkpoints[Math.min(step, checkpoints.length - 1)];
        analysisProgress = Math.min(analysisProgress + Math.random() * 5, target);
        updateProgress(analysisProgress);
    }, 400);
}

function completeAnalysis(startButton, apiData) {
    clearInterval(analysisTimer);
    analysisProgress = 100;
    
    // API 응답을 UI 형식으로 변환
    const result = parseApiResponse(apiData);
    
    updateProgress(analysisProgress, result);
    startButton.textContent = '분석 완료';
    startButton.disabled = false;
    isAnalyzing = false;
}

function parseApiResponse(data) {
    // API 응답 형식에 맞게 파싱
    // 실제 API 응답 구조에 따라 조정 필요
    return {
        verdict: data.verdict || data.result || '분석 완료',
        summary: data.summary || data.description || 'AI 분석이 완료되었습니다.',
        transcript: data.transcript || data.text || JSON.stringify(data, null, 2),
        evidence: data.evidence || data.keywords || '',
        response: data.response || data.recommendation || ''
    };
}

function resetDashboard(startButton) {
    clearInterval(analysisTimer);
    analysisProgress = 0;
    isAnalyzing = false;
    updateProgress(analysisProgress, DEFAULT_STATE);
    startButton.textContent = '분석 시작';
    startButton.disabled = false;
}

function updateProgress(value, result = null) {
    const percent = Math.round(value);
    const bar = document.getElementById('analysisProgressBar');
    const percentLabel = document.getElementById('analysisProgressPercent');
    const circle = document.getElementById('analysisProgressCircle');
    const valueLabel = circle.querySelector('.progress-value');
    const verdictLabel = document.getElementById('analysisVerdict');
    const summaryLabel = document.getElementById('analysisSummary');

    bar.style.width = `${percent}%`;
    percentLabel.textContent = `${percent}%`;
    circle.style.setProperty('--progress', `${percent * 3.6}deg`);
    valueLabel.textContent = `${percent}%`;

    if (result) {
        verdictLabel.textContent = result.verdict;
        summaryLabel.textContent = result.summary;
        circle.style.setProperty('--progress-color', result.verdict === '의심 통화' ? '#ef4444' : '#38bdf8');
        updateResultFields(result);
    } else {
        verdictLabel.textContent = DEFAULT_STATE.verdict;
        summaryLabel.textContent = DEFAULT_STATE.summary;
        circle.style.setProperty('--progress-color', '#38bdf8');
        updateResultFields(DEFAULT_STATE);
    }
}

function updateResultFields(result) {
    const transcript = document.getElementById('transcriptResult');
    const evidence = document.getElementById('evidenceResult');
    const response = document.getElementById('responseGuide');

    transcript.value = result.transcript;
    evidence.value = result.evidence;
    response.value = result.response;
}

function handleFileSelect(file) {
    if (!file) return;

    // 업로드된 파일 저장
    uploadedFile = file;

    const uploadArea = document.getElementById('uploadArea');
    const uploadInfo = document.getElementById('uploadInfo');
    const fileName = document.getElementById('fileName');
    const fileSize = document.getElementById('fileSize');

    // 파일 크기를 MB로 변환
    const sizeMB = (file.size / (1024 * 1024)).toFixed(2);

    fileName.textContent = file.name;
    fileSize.textContent = `${sizeMB} MB`;

    uploadArea.style.display = 'none';
    uploadInfo.style.display = 'block';
}

function removeFile() {
    const uploadArea = document.getElementById('uploadArea');
    const uploadInfo = document.getElementById('uploadInfo');
    const fileInput = document.getElementById('audioFileInput');

    // 업로드된 파일 초기화
    uploadedFile = null;
    fileInput.value = '';
    uploadArea.style.display = 'block';
    uploadInfo.style.display = 'none';
}

function handleQuickAction(action) {
    const messages = {
        police: '112 신고센터로 연결합니다. 실제 서비스에서는 통화 앱이 실행됩니다.',
        financial: '금융감독원 1332 신고 페이지로 이동합니다.',
        report: 'JSON 리포트를 다운로드합니다. (데모에서는 안내 메시지만 표시됩니다.)',
        faq: '전문 상담원 연결 신청 페이지로 이동합니다.'
    };

    alert(messages[action] || '준비 중인 기능입니다.');
}