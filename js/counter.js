/* ==========================================
   COUNTER.JS
   Animated Statistics Counter
   ========================================== */

const CounterModule = (() => {
    'use strict';

    // ==========================================
    // CONFIGURATION
    // ==========================================
    const CONFIG = {
        duration: 2500,
        threshold: 0.3,
        rootMargin: '0px',
        suffixes: {
            thousand: 'K',
            million: 'M'
        }
    };

    // ==========================================
    // STATE
    // ==========================================
    const state = {
        counters: [],
        observer: null,
        isReducedMotion: false
    };

    // ==========================================
    // INITIALIZATION
    // ==========================================

    const init = () => {
        state.isReducedMotion = SavoirApp.prefersReducedMotion();

        // Find all counter elements
        const counterElements = document.querySelectorAll('.stat-number[data-count]');
        if (counterElements.length === 0) return;

        state.counters = Array.from(counterElements);

        // Setup intersection observer
        initObserver();

        // Bind events
        bindEvents();
    };

    // ==========================================
    // INTERSECTION OBSERVER
    // ==========================================

    const initObserver = () => {
        const options = {
            root: null,
            rootMargin: CONFIG.rootMargin,
            threshold: CONFIG.threshold
        };

        state.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const counter = entry.target;
                    const target = parseInt(counter.dataset.count, 10);

                    if (!isNaN(target)) {
                        animateCounter(counter, target);
                    }

                    // Unobserve after animation
                    state.observer.unobserve(counter);
                }
            });
        }, options);

        // Observe all counters
        state.counters.forEach(counter => {
            state.observer.observe(counter);
        });
    };

    // ==========================================
    // COUNTER ANIMATION
    // ==========================================

    const animateCounter = (element, target) => {
        // If reduced motion, just show final number
        if (state.isReducedMotion) {
            element.textContent = formatNumber(target);
            return;
        }

        const startTime = performance.now();
        const startValue = 0;
        const duration = CONFIG.duration;

        // Add animation class
        element.classList.add('counting');

        const updateCounter = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Easing function - easeOutExpo for smooth deceleration
            const easeOutExpo = 1 - Math.pow(2, -10 * progress);
            
            // Calculate current value
            const currentValue = Math.floor(startValue + (target - startValue) * easeOutExpo);

            // Update display
            element.textContent = formatNumber(currentValue);

            // Continue animation or finish
            if (progress < 1) {
                requestAnimationFrame(updateCounter);
            } else {
                // Ensure final value is exact
                element.textContent = formatNumber(target);
                element.classList.remove('counting');
                element.classList.add('counted');

                // Trigger pop animation
                triggerPopAnimation(element);
            }
        };

        requestAnimationFrame(updateCounter);
    };

    // ==========================================
    // NUMBER FORMATTING
    // ==========================================

    const formatNumber = (num) => {
        // Format with commas for thousands
        if (num < 1000) {
            return num.toString();
        }

        // For demo purposes, show full number with commas
        // In production, you might want to abbreviate large numbers
        return num.toLocaleString('en-US');
    };

    /**
     * Abbreviate large numbers (optional)
     */
    const abbreviateNumber = (num) => {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + CONFIG.suffixes.million;
        }
        if (num >= 1000) {
            return (num / 1000).toFixed(1) + CONFIG.suffixes.thousand;
        }
        return num.toString();
    };

    // ==========================================
    // POP ANIMATION
    // ==========================================

    const triggerPopAnimation = (element) => {
        element.style.animation = 'counterPop 0.3s ease';
        
        setTimeout(() => {
            element.style.animation = '';
        }, 300);
    };

    // ==========================================
    // MANUAL TRIGGER
    // ==========================================

    /**
     * Manually trigger a counter animation
     */
    const triggerCounter = (selector) => {
        const element = typeof selector === 'string' 
            ? document.querySelector(selector) 
            : selector;

        if (!element) return;

        const target = parseInt(element.dataset.count, 10);
        if (!isNaN(target)) {
            animateCounter(element, target);
        }
    };

    /**
     * Reset a counter to 0
     */
    const resetCounter = (selector) => {
        const element = typeof selector === 'string' 
            ? document.querySelector(selector) 
            : selector;

        if (!element) return;

        element.textContent = '0';
        element.classList.remove('counted', 'counting');
    };

    // ==========================================
    // EVENT BINDING
    // ==========================================

    const bindEvents = () => {
        // Handle reduced motion changes
        window.addEventListener('savoir:reducedMotion', (e) => {
            state.isReducedMotion = e.detail.reduced;
        });

        // Re-initialize on dynamic content (if needed)
        window.addEventListener('savoir:contentLoaded', () => {
            // Re-scan for new counters
            const newCounters = document.querySelectorAll('.stat-number[data-count]:not(.counted):not(.counting)');
            newCounters.forEach(counter => {
                state.observer.observe(counter);
            });
        });
    };

    // ==========================================
    // PUBLIC API
    // ==========================================

    return {
        init,
        triggerCounter,
        resetCounter,
        formatNumber,
        getState: () => ({ ...state })
    };

})();

// Register module
SavoirApp.registerModule('counter', CounterModule);