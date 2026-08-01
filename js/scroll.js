/* ==========================================
   SCROLL.JS
   Scroll Progress, Back-to-Top & Scroll Spy
   ========================================== */

const ScrollModule = (() => {
    'use strict';

    // ==========================================
    // CONFIGURATION
    // ==========================================
    const CONFIG = {
        backToTopThreshold: 400,
        scrollSpyOffset: 120,
        smoothScrollOffset: 80,
        progressBarHeight: 3
    };

    // ==========================================
    // STATE
    // ==========================================
    const state = {
        scrollProgress: 0,
        isBackToTopVisible: false,
        currentSection: null
    };

    // ==========================================
    // DOM ELEMENTS
    // ==========================================
    let progressBar = null;
    let backToTopBtn = null;
    let sections = [];
    let navLinks = [];

    // ==========================================
    // INITIALIZATION
    // ==========================================

    const init = () => {
        progressBar = document.getElementById('scrollProgress');
        backToTopBtn = document.getElementById('backToTop');

        // Get all sections for scroll spy
        sections = document.querySelectorAll('section[id]');
        
        // Get nav links
        navLinks = document.querySelectorAll('.navbar-nav .nav-link[href^="#"]');

        bindEvents();
        handleScroll(); // Initial check
    };

    // ==========================================
    // EVENT BINDING
    // ==========================================

    const bindEvents = () => {
        // Main scroll handler
        window.addEventListener('scroll', SavoirApp.throttle(handleScroll, 16), { passive: true });

        // Back to top button
        backToTopBtn?.addEventListener('click', scrollToTop);

        // Smooth scroll for anchor links
        document.querySelectorAll('a[href^="#"]').forEach(link => {
            link.addEventListener('click', handleSmoothScroll);
        });
    };

    // ==========================================
    // SCROLL HANDLER
    // ==========================================

    const handleScroll = () => {
        const scrollY = window.pageYOffset;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;

        // Update scroll progress
        updateProgressBar(scrollY, docHeight);

        // Update back to top button
        updateBackToTop(scrollY);

        // Update scroll spy
        updateScrollSpy(scrollY);
    };

    // ==========================================
    // PROGRESS BAR
    // ==========================================

    const updateProgressBar = (scrollY, docHeight) => {
        if (!progressBar) return;

        const progress = docHeight > 0 ? (scrollY / docHeight) * 100 : 0;
        state.scrollProgress = Math.min(progress, 100);

        progressBar.style.width = `${state.scrollProgress}%`;
    };

    // ==========================================
    // BACK TO TOP
    // ==========================================

    const updateBackToTop = (scrollY) => {
        if (!backToTopBtn) return;

        const shouldShow = scrollY > CONFIG.backToTopThreshold;

        if (shouldShow && !state.isBackToTopVisible) {
            backToTopBtn.classList.add('visible');
            state.isBackToTopVisible = true;
        } else if (!shouldShow && state.isBackToTopVisible) {
            backToTopBtn.classList.remove('visible');
            state.isBackToTopVisible = false;
        }
    };

    const scrollToTop = (e) => {
        e?.preventDefault();

        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    };

    // ==========================================
    // SMOOTH SCROLL
    // ==========================================

    const handleSmoothScroll = (e) => {
        const href = e.currentTarget.getAttribute('href');
        
        // Skip if it's just "#" or empty
        if (!href || href === '#' || !href.startsWith('#')) return;

        const targetId = href.substring(1);
        const targetElement = document.getElementById(targetId);

        if (!targetElement) return;

        e.preventDefault();

        const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset;
        const offsetPosition = targetPosition - CONFIG.smoothScrollOffset;

        window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
        });

        // Update URL hash without jumping
        history.pushState(null, null, href);
    };

    // ==========================================
    // SCROLL SPY
    // ==========================================

    const updateScrollSpy = (scrollY) => {
        if (sections.length === 0 || navLinks.length === 0) return;

        let currentSectionId = null;

        // Find current section
        sections.forEach(section => {
            const sectionTop = section.offsetTop - CONFIG.scrollSpyOffset;
            const sectionHeight = section.offsetHeight;

            if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
                currentSectionId = section.id;
            }
        });

        // Update nav links
        if (currentSectionId && currentSectionId !== state.currentSection) {
            state.currentSection = currentSectionId;

            navLinks.forEach(link => {
                const href = link.getAttribute('href');
                const isActive = href === `#${currentSectionId}`;

                link.classList.toggle('active', isActive);

                if (isActive) {
                    link.setAttribute('aria-current', 'page');
                } else {
                    link.removeAttribute('aria-current');
                }
            });

            // Update navbar module if available
            const navbarModule = SavoirApp.getModule('navbar');
            if (navbarModule?.updateActiveLink) {
                navbarModule.updateActiveLink(currentSectionId);
            }
        }
    };

    // ==========================================
    // SCROLL TO ELEMENT
    // ==========================================

    const scrollToElement = (selector, offset = CONFIG.smoothScrollOffset) => {
        const element = typeof selector === 'string' 
            ? document.querySelector(selector) 
            : selector;

        if (!element) return;

        const targetPosition = element.getBoundingClientRect().top + window.pageYOffset;
        const offsetPosition = targetPosition - offset;

        window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
        });
    };

    // ==========================================
    // PUBLIC API
    // ==========================================

    return {
        init,
        scrollToTop,
        scrollToElement,
        getState: () => ({ ...state })
    };

})();

// Register module
SavoirApp.registerModule('scroll', ScrollModule);