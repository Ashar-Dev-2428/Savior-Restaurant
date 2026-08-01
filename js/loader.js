/* ==========================================
   LOADER.JS
   Page Loading Screen & Reveal Animation
   ========================================== */

const LoaderModule = (() => {
    'use strict';

    // ==========================================
    // CONFIGURATION
    // ==========================================
    const CONFIG = {
        minDisplayTime: 1500,    // Minimum time to show loader (ms)
        fadeOutDuration: 600,    // Fade out animation duration (ms)
        progressInterval: 30,    // Progress update interval (ms)
        simulateProgress: true   // Show simulated progress bar
    };

    // ==========================================
    // STATE
    // ==========================================
    const state = {
        startTime: 0,
        isLoaded: false,
        isHidden: false,
        progress: 0
    };

    // ==========================================
    // DOM ELEMENTS
    // ==========================================
    let loader = null;
    let loaderProgress = null;
    let loaderText = null;

    // ==========================================
    // INITIALIZATION
    // ==========================================

    const init = () => {
        loader = document.getElementById('page-loader');
        if (!loader) return;

        loaderProgress = loader.querySelector('.loader-progress');
        loaderText = loader.querySelector('.loader-text');

        state.startTime = performance.now();

        // Start progress animation
        if (CONFIG.simulateProgress && loaderProgress) {
            startProgressAnimation();
        }

        // Bind to load events
        bindEvents();

        // Ensure minimum display time
        enforceMinDisplayTime();
    };

    // ==========================================
    // PROGRESS ANIMATION
    // ==========================================

    const startProgressAnimation = () => {
        let progress = 0;
        const increment = 100 / (CONFIG.minDisplayTime / CONFIG.progressInterval);

        const updateProgress = () => {
            if (state.isHidden) return;

            progress += increment + (Math.random() * 2); // Add slight randomness
            progress = Math.min(progress, 95); // Cap at 95% until fully loaded

            state.progress = progress;
            loaderProgress.style.width = `${progress}%`;

            if (!state.isLoaded) {
                requestAnimationFrame(() => {
                    setTimeout(updateProgress, CONFIG.progressInterval);
                });
            }
        };

        updateProgress();
    };

    // ==========================================
    // LOAD EVENTS
    // ==========================================

    const bindEvents = () => {
        // Main load event
        if (document.readyState === 'complete') {
            onPageLoaded();
        } else {
            window.addEventListener('load', onPageLoaded);
        }

        // Fallback: hide loader after max time regardless
        setTimeout(() => {
            if (!state.isHidden) {
                hideLoader();
            }
        }, 5000);
    };

    const onPageLoaded = () => {
        state.isLoaded = true;

        // Complete progress bar
        if (loaderProgress) {
            loaderProgress.style.width = '100%';
        }

        // Check if minimum display time has passed
        const elapsed = performance.now() - state.startTime;
        const remaining = Math.max(0, CONFIG.minDisplayTime - elapsed);

        setTimeout(() => {
            hideLoader();
        }, remaining);
    };

    // ==========================================
    // MINIMUM DISPLAY TIME
    // ==========================================

    const enforceMinDisplayTime = () => {
        // Loader will be hidden by onPageLoaded or fallback timeout
    };

    // ==========================================
    // HIDE LOADER
    // ==========================================

    const hideLoader = () => {
        if (state.isHidden) return;
        state.isHidden = true;

        if (!loader) return;

        // Add exit animation
        loader.classList.add('hidden');

        // Animate content reveal
        animateContentReveal();

        // Remove loader from DOM after animation
        setTimeout(() => {
            loader.style.display = 'none';
            
            // Dispatch event
            window.dispatchEvent(new CustomEvent('savoir:loaderHidden'));
        }, CONFIG.fadeOutDuration);
    };

    // ==========================================
    // CONTENT REVEAL
    // ==========================================

    const animateContentReveal = () => {
        // Trigger hero content animations
        const heroContent = document.querySelector('.hero-slide.active .hero-content');
        if (heroContent) {
            const elements = heroContent.querySelectorAll('.reveal-up, .reveal-left, .reveal-right');
            
            elements.forEach((el, index) => {
                const delay = el.classList.contains('delay-1') ? 100 :
                             el.classList.contains('delay-2') ? 200 :
                             el.classList.contains('delay-3') ? 300 : 0;

                setTimeout(() => {
                    el.classList.add('active');
                }, delay + 200);
            });
        }

        // Trigger navbar animation
        const navbar = document.getElementById('mainNavbar');
        if (navbar) {
            navbar.style.animation = 'navbarSlideDown 0.6s ease forwards';
        }
    };

    // ==========================================
    // MANUAL CONTROL
    // ==========================================

    const show = () => {
        if (!loader) return;
        
        state.isHidden = false;
        loader.style.display = '';
        loader.classList.remove('hidden');
        
        state.startTime = performance.now();
        state.progress = 0;
        
        if (loaderProgress) {
            loaderProgress.style.width = '0%';
        }
    };

    const hide = () => {
        hideLoader();
    };

    // ==========================================
    // PUBLIC API
    // ==========================================

    return {
        init,
        show,
        hide,
        getState: () => ({ ...state })
    };

})();

// Register module
SavoirApp.registerModule('loader', LoaderModule);