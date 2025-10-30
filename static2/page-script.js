// FAQ 토글 기능
function toggleFAQ(element) {
    const faqItem = element.parentElement;
    const answer = faqItem.querySelector('.faq-answer');
    const toggle = element.querySelector('.faq-toggle');
    
    if (faqItem.classList.contains('active')) {
        faqItem.classList.remove('active');
        answer.style.maxHeight = '0';
        toggle.textContent = '+';
    } else {
        // 다른 FAQ 항목들 닫기
        document.querySelectorAll('.faq-item.active').forEach(item => {
            item.classList.remove('active');
            item.querySelector('.faq-answer').style.maxHeight = '0';
            item.querySelector('.faq-toggle').textContent = '+';
        });
        
        // 현재 항목 열기
        faqItem.classList.add('active');
        answer.style.maxHeight = answer.scrollHeight + 'px';
        toggle.textContent = '−';
    }
}

// 페이지 로드 시 애니메이션
document.addEventListener('DOMContentLoaded', function() {
    // 페이지 요소들 애니메이션
    const animateElements = document.querySelectorAll('.info-card, .method-card, .faq-item, .emergency-item');
    
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

    animateElements.forEach(element => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(30px)';
        element.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(element);
    });

    // 네비게이션 활성화
    const currentPage = window.location.pathname.split('/').pop();
    const navLinks = document.querySelectorAll('.nav-menu a');
    
    navLinks.forEach(link => {
        if (link.getAttribute('href') === currentPage) {
            link.classList.add('active');
        }
    });
});

// 부드러운 스크롤
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// 스크롤 시 헤더 효과
window.addEventListener('scroll', function() {
    const header = document.querySelector('.page-header');
    if (header) {
        if (window.scrollY > 100) {
            header.style.background = 'rgba(79, 172, 254, 0.95)';
            header.style.backdropFilter = 'blur(20px)';
        } else {
            header.style.background = 'rgba(79, 172, 254, 0.9)';
            header.style.backdropFilter = 'blur(10px)';
        }
    }
});