// Message Analysis JavaScript (FastAPI 백엔드 연동)
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

    // URL 정규식 (프론트 가시화용)
    const urlPattern = /(https?:\/\/[^\s]+)|(www\.[^\s]+)|([a-zA-Z0-9-]+\.[a-zA-Z]{2,}[^\s]*)/gi;

    // 입력 시 실시간 카운트/URL 감지
    messageInput.addEventListener('input', function() {
        const text = this.value;
        const length = text.length;

        charCount.textContent = `${length}자`;

        detectedUrls = text.match(urlPattern) || [];
        urlCount.textContent = `URL ${detectedUrls.length}개 감지`;
        if (detectedUrls.length > 0) {
            urlCount.style.color = '#f57c00';
            urlCount.style.fontWeight = '700';
        } else {
            urlCount.style.color = '#0095ff';
            urlCount.style.fontWeight = '600';
        }

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

    // 분석 버튼 → 실제 API 호출
    analyzeBtn.addEventListener('click', async function() {
        const text = messageInput.value.trim();
        if (text.length < 10) {
            alert('문자 내용을 10자 이상 입력해주세요.');
            return;
        }
        await startAnalysis(text);
    });

    // 새로운 분석
    newAnalysisBtn.addEventListener('click', function() {
        resetAnalysis();
    });

    // 진행바 시뮬(UX) + 실제 서버 분석
    async function startAnalysis(text) {
        messageInputZone.style.display = 'none';
        processingStatus.style.display = 'block';

        let progress = 0;
        const stages = [
            '문자 내용을 분석하고 있습니다...',
            'URL을 추출하고 있습니다...',
            '악성 사이트 데이터베이스와 대조하고 있습니다...',
            'AI가 보이스피싱 패턴을 분석하고 있습니다...',
            '최종 결과를 생성하고 있습니다...'
        ];
        let currentStage = 0;

        const progressTimer = setInterval(() => {
            progress += Math.random() * 15;
            if (progress >= 95) progress = 95;
            progressFill.style.width = `${progress}%`;

            const stageIndex = Math.min(Math.floor((progress / 100) * stages.length), stages.length - 1);
            if (stageIndex !== currentStage) {
                currentStage = stageIndex;
                statusText.textContent = stages[currentStage];
            }
        }, 300);

        try {
            const formData = new FormData();
            formData.append('text', text);

            const res = await fetch('/scan/message', {
                method: 'POST',
                body: formData
            });

            if (!res.ok) {
                throw new Error(`서버 오류: ${res.status}`);
            }

            const data = await res.json();
            progress = 100;
            progressFill.style.width = '100%';
            clearInterval(progressTimer);

            setTimeout(() => {
                showResults(text, data);
            }, 300);
        } catch (err) {
            clearInterval(progressTimer);
            alert('분석 중 오류가 발생했습니다: ' + err.message);
            resetAnalysis();
        }
    }

    // 결과 표시
    function showResults(inputText, data) {
        processingStatus.style.display = 'none';
        analysisResult.style.display = 'block';
        analysisResult.style.opacity = '0';
        setTimeout(() => {
            analysisResult.style.transition = 'opacity 0.5s';
            analysisResult.style.opacity = '1';
        }, 50);

        // 메시지 원문
        document.getElementById('messageContent').textContent = inputText;

        // URL 영역
        const urlDetection = document.getElementById('urlDetection');
        const urlList = document.getElementById('urlList');
        const urlOverallBadge = document.getElementById('urlOverallBadge');
        urlList.innerHTML = '';

        const urlDict = data?.url_analysis || {};
        const urlKeys = Object.keys(urlDict);

        if (urlKeys.length > 0) {
            urlDetection.style.display = 'block';
            // overall 표시
            if (data?.url_overall === 'True') {
                urlOverallBadge.textContent = '(악성 URL 탐지됨)';
                urlOverallBadge.style.color = '#fca5a5';
            } else if (data?.url_overall === 'False') {
                urlOverallBadge.textContent = '(악성 URL 미탐지)';
                urlOverallBadge.style.color = '#a7f3d0';
            } else {
                urlOverallBadge.textContent = '(URL 없음)';
                urlOverallBadge.style.color = '#9ca3af';
            }

            urlKeys.forEach(u => {
                const bad = !!urlDict[u];
                const div = document.createElement('div');
                div.className = `url-item ${bad ? 'bad' : 'ok'}`;
                div.innerHTML = `<i class="fas fa-link"></i><span>${u}</span>${bad ? '<span style="margin-left:auto;font-weight:700;">위험</span>' : '<span style="margin-left:auto;opacity:.8;">정상</span>'}`;
                urlList.appendChild(div);
            });
        } else {
            urlDetection.style.display = 'block';
            urlOverallBadge.textContent = '(URL 없음)';
            urlOverallBadge.style.color = '#9ca3af';
            const div = document.createElement('div');
            div.className = 'url-item na';
            div.innerHTML = `<i class="fas fa-link"></i><span>표시할 URL이 없습니다.</span>`;
            urlList.appendChild(div);
        }

        // Gemini 분석 텍스트 파싱
        const gtext = (data?.gemini_result || '').trim();
        const parsed = parseGeminiText(gtext);

        // 위험도 카드
        applyRiskCard(parsed.level, parsed.prob);

        // 위험도 상세
        const riskGrade = document.getElementById('riskGrade');
        const riskGradeDesc = document.getElementById('riskGradeDesc');
        const badge = document.createElement('span');
        badge.className = 'grade-badge';
        if (parsed.level === '매우 위험' || parsed.level === '위험') {
            badge.classList.add('danger');
        } else if (parsed.level === '의심') {
            badge.classList.add('warning');
        } else if (parsed.level === '안전') {
            badge.classList.add('safe');
        }
        badge.textContent = parsed.level || '-';
        riskGrade.innerHTML = '';
        riskGrade.appendChild(badge);
        riskGradeDesc.textContent = parsed.levelDesc;

        // 분석 근거
        const analysisGrounds = document.getElementById('analysisGrounds');
        analysisGrounds.innerHTML = '';
        parsed.grounds.forEach(item => {
            const li = document.createElement('li');
            li.textContent = item;
            analysisGrounds.appendChild(li);
        });

        // 권고 대처 방안
        const recEl = document.getElementById('messageRecommendations');
        recEl.innerHTML = '';
        parsed.recos.forEach(item => {
            const li = document.createElement('li');
            li.textContent = item;
            recEl.appendChild(li);
        });

        // 다운로드 핸들러에 데이터 저장
        window.__lastMessageReport = {
            inputText,
            url_analysis: urlDict,
            url_overall: data?.url_overall,
            parsed,
            raw: gtext
        };
    }

    // 위험도 카드 스타일 적용
    function applyRiskCard(level, prob) {
        const riskBadge = document.getElementById('riskBadge');
        const riskLevel = document.getElementById('riskLevel');
        const riskProbability = document.getElementById('riskProbability');
        const riskLevelCard = document.querySelector('.risk-level-card');

        const pct = (typeof prob === 'number' && prob >= 0) ? prob : 0;
        riskProbability.textContent = `${pct}%`;

        if (level === '매우 위험' || level === '위험') {
            riskLevel.textContent = level;
            riskBadge.style.color = '#ef4444';
            riskLevelCard.style.background = 'linear-gradient(135deg, #4a0000, #8b0000)';
        } else if (level === '의심') {
            riskLevel.textContent = '의심';
            riskBadge.style.color = '#f59e0b';
            riskLevelCard.style.background = 'linear-gradient(135deg, #4a3800, #8b6914)';
        } else {
            riskLevel.textContent = '안전';
            riskBadge.style.color = '#10b981';
            riskLevelCard.style.background = 'linear-gradient(135deg, #001a2e, #002e4f)';
        }
    }

    // Gemini 결과 파서 (message_gemini.py의 출력 형식 기준)
    function parseGeminiText(text) {
        const out = {
            level: '의심',
            levelDesc: '',
            prob: 0,
            grounds: [],
            recos: []
        };
        if (!text) return out;

        // 위험도 등급 추출
        const mLevel = text.match(/위험도\s*등급[:\s]*\*?\*?([^\n\r*]+)/i);
        if (mLevel) {
            out.level = mLevel[1].replace(/\*/g, '').trim();
        }

        // 위험 확률 추출
        const mProb = text.match(/위험\s*확률[:\s]*\*?\*?([0-9]{1,3})\s*%/i);
        if (mProb) {
            out.prob = Math.max(0, Math.min(100, parseInt(mProb[1], 10)));
        }

        // 분석 근거 블록
        const groundsBlock = getBlock(text, '분석 근거', '권고 대처 방안');
        if (groundsBlock) {
            const lines = groundsBlock.split('\n')
                .map(s => s.trim())
                .filter(s => s.startsWith('*') || s.startsWith('-'));
            out.grounds = lines.map(s => s.replace(/^[\*\-]\s*/, '').replace(/\*\*/g, '').trim());
        }

        // 권고 대처 방안 블록
        const recBlock = getBlock(text, '권고 대처 방안', null);
        if (recBlock) {
            const lines = recBlock.split('\n')
                .map(s => s.trim())
                .filter(s => s.startsWith('*') || s.startsWith('-'));
            out.recos = lines.map(s => s.replace(/^[\*\-]\s*/, '').replace(/\*\*/g, '').trim());
        }

        // 보조 설명
        if (!out.levelDesc) {
            if (out.level.includes('위험') && !out.level.includes('의심')) {
                out.levelDesc = '보이스피싱일 가능성이 매우 높습니다.';
            } else if (out.level.includes('의심')) {
                out.levelDesc = '의심 요소가 일부 발견되었습니다.';
            } else {
                out.levelDesc = '정상적인 문자로 판단됩니다.';
            }
        }
        return out;
    }

    // 섹션 블록 추출
    function getBlock(full, startTitle, endTitle) {
        const startIdx = full.indexOf(startTitle);
        if (startIdx < 0) return '';
        const sub = full.slice(startIdx + startTitle.length);
        if (!endTitle) return sub;
        const endIdx = sub.indexOf(endTitle);
        return endIdx >= 0 ? sub.slice(0, endIdx) : sub;
    }

    // 초기화
    function resetAnalysis() {
        messageInput.value = '';
        charCount.textContent = '0자';
        urlCount.textContent = 'URL 0개 감지';
        detectedUrls = [];
        progressFill.style.width = '0%';
        analysisResult.style.display = 'none';
        processingStatus.style.display = 'none';
        messageInputZone.style.display = 'block';
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // 다운로드: Markdown 생성
    document.getElementById('downloadMessageReport').addEventListener('click', function() {
        const rep = window.__lastMessageReport;
        if (!rep) {
            alert('다운로드할 분석 결과가 없습니다.');
            return;
        }
        const lines = [];
        lines.push('# 스미싱 문자 분석 리포트');
        lines.push('');
        lines.push('## 1) 입력 원문');
        lines.push('```\n' + rep.inputText + '\n```');
        lines.push('');
        lines.push('## 2) URL 분석');
        lines.push(`- 종합 판단: ${rep.url_overall || 'N/A'}`);
        const entries = Object.entries(rep.url_analysis || {});
        if (entries.length) {
            entries.forEach(([u, bad]) => lines.push(`  - ${u} : ${bad ? '위험' : '정상'}`));
        } else {
            lines.push('  - (URL 없음)');
        }
        lines.push('');
        lines.push('## 3) AI 분석(요약)');
        lines.push(`- 위험도 등급: ${rep.parsed.level}`);
        lines.push(`- 위험 확률: ${rep.parsed.prob}%`);
        if (rep.parsed.grounds.length) {
            lines.push('- 분석 근거:');
            rep.parsed.grounds.forEach(g => lines.push(`  * ${g}`));
        }
        if (rep.parsed.recos.length) {
            lines.push('- 권고 대처 방안:');
            rep.parsed.recos.forEach(r => lines.push(`  * ${r}`));
        }
        lines.push('');
        lines.push('---');
        lines.push('## 부록: 원문 분석 결과(모델 출력)');
        lines.push('');
        lines.push(rep.raw || '(원문 없음)');

        const blob = new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `smishing_report_${Date.now()}.md`;
        document.body.appendChild(a);
        a.click();
        a.remove();
    });

    // 신고 버튼
    document.getElementById('reportMessage').addEventListener('click', function() {
        alert('보이스피싱 신고 기능은 API 연동 후 구현됩니다.\n\n긴급 신고:\n• 경찰신고: 112\n• 금융감독원: 1332\n• 보이스피싱: 1588-2112');
    });
});