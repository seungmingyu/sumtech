// 뉴스 섹션으로 스크롤
function scrollToNews() {
    document.getElementById('news').scrollIntoView({
        behavior: 'smooth'
    });
}

// 서비스 섹션으로 스크롤
function scrollToServices() {
    document.getElementById('services').scrollIntoView({
        behavior: 'smooth'
    });
}

// 개별 서비스 버튼 기능들
// 각 페이지로 이동하는 함수들
function showVoicePhishingInfo() {
    window.location.href = 'voice-changer.html';
}

function showPhishingMethods() {
    window.location.href = 'url-checker.html';
}

function showFAQ() {
    window.location.href = 'ai-chatbot.html';
}

function showContact() {
    alert('문의하기\n\n보이스피싱 신고센터\n📞 전화: 1588-2112\n🌐 온라인: www.phishing-report.kr\n\n금융감독원 신고센터\n📞 전화: 1332\n\n경찰청 사이버수사대\n📞 전화: 182');
}

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', function () {
    // 배경 패턴 애니메이션
    const backgroundPattern = document.querySelector('.background-pattern');
    if (backgroundPattern) {
        backgroundPattern.style.opacity = '0';
        setTimeout(() => {
            backgroundPattern.style.transition = 'opacity 1s ease';
            backgroundPattern.style.opacity = '1';
        }, 100);
    }

    // 버튼 호버 효과 강화
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(button => {
        button.addEventListener('mouseenter', function () {
            this.style.transform = 'translateY(-3px) scale(1.02)';
        });

        button.addEventListener('mouseleave', function () {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });

    // 페이지네이션 기능
    const pageNums = document.querySelectorAll('.page-num');
    pageNums.forEach(page => {
        page.addEventListener('click', function () {
            pageNums.forEach(p => p.classList.remove('active'));
            this.classList.add('active');

            // 페이지 번호에 따른 뉴스 내용 변경
            const newsCard = document.querySelector('.news-card h3');
            const newsContent = document.querySelector('.news-card p');
            const pageNum = this.textContent;

            if (newsCard && newsContent) {
                switch (pageNum) {
                    case '1':
                        newsCard.textContent = '상황별 투자 시기 정보';
                        newsContent.textContent = '투자를 위해서 본 정보소식과 시기가 중요하다 생각고 경고합니다. 투자 수익률을 보장하지는 않습니다만 경우에는 경우 그렇게 수익이 좋습니다.';
                        break;
                    case '2':
                        newsCard.textContent = '최신 보이스피싱 수법 분석';
                        newsContent.textContent = '최근 급증하고 있는 새로운 보이스피싱 수법들을 분석하고, 피해 예방을 위한 대응 방안을 제시합니다. 특히 메신저와 SNS를 활용한 신종 사기에 주의가 필요합니다.';
                        break;
                    case '3':
                        newsCard.textContent = '금융사기 예방 가이드';
                        newsContent.textContent = '금융사기로부터 자신을 보호하는 방법과 피해 발생 시 대처 요령을 상세히 안내합니다. 개인정보 보호와 안전한 금융거래를 위한 필수 지식을 제공합니다.';
                        break;
                }
            }
        });
    });

    // 서비스 버튼들에 개별 기능 연결
    const serviceButtons = document.querySelectorAll('.service-btn');
    serviceButtons.forEach((btn, index) => {
        btn.addEventListener('click', function () {
            switch (index) {
                case 0:
                    showVoicePhishingInfo();
                    break;
                case 1:
                    showPhishingMethods();
                    break;
                case 2:
                    showFAQ();
                    break;
            }
        });
    });

    // 뉴스 더보기 버튼
    const readMoreBtn = document.querySelector('.read-more');
    if (readMoreBtn) {
        readMoreBtn.addEventListener('click', function () {
            alert('뉴스 상세 페이지로 이동합니다.\n\n더 자세한 정보와 관련 기사들을 확인하실 수 있습니다.');
        });
    }
});

// 키보드 접근성
document.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ') {
        const focusedElement = document.activeElement;
        if (focusedElement.classList.contains('btn') ||
            focusedElement.classList.contains('service-btn') ||
            focusedElement.classList.contains('read-more')) {
            e.preventDefault();
            focusedElement.click();
        }
    }
});

// 반응형 텍스트 조정
function adjustTextSize() {
    const title = document.querySelector('.main-title');
    const description = document.querySelector('.main-description');

    if (window.innerWidth < 480) {
        if (title) title.style.fontSize = '1.8rem';
        if (description) description.style.fontSize = '0.95rem';
    } else if (window.innerWidth < 768) {
        if (title) title.style.fontSize = '2.2rem';
        if (description) description.style.fontSize = '1rem';
    } else {
        if (title) title.style.fontSize = '2.8rem';
        if (description) description.style.fontSize = '1.1rem';
    }
}

window.addEventListener('resize', adjustTextSize);
window.addEventListener('load', adjustTextSize);

// 서비스 카드 애니메이션
document.addEventListener('DOMContentLoaded', function () {
    const cards = document.querySelectorAll('.service-card');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                setTimeout(() => {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }, index * 100);
            }
        });
    });

    cards.forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(card);
    });
});

// 뉴스 카드 애니메이션
document.addEventListener('DOMContentLoaded', function () {
    const newsCards = document.querySelectorAll('.news-card');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateX(0)';
            }
        });
    });

    newsCards.forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateX(-20px)';
        card.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
        observer.observe(card);
    });
});

// 스크롤 시 배경 변화
window.addEventListener('scroll', function () {
    const scrolled = window.scrollY;
    const rate = scrolled * -0.5;

    const backgroundPattern = document.querySelector('.background-pattern');
    if (backgroundPattern) {
        backgroundPattern.style.transform = `translateY(${rate}px)`;
    }
});