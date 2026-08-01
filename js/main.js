/* ==========================================
   MAIN.JS
   Core Application Controller
   ========================================== */

/**
 * Savoir Restaurant - Main Application Module
 * Handles initialization, event delegation, and module coordination
 */

const SavoirApp = (() => {
    'use strict';

    // ==========================================
    // CONFIGURATION
    // ==========================================
    const CONFIG = {
        animationDelay: 100,
        scrollOffset: 100,
        debounceDelay: 150,
        throttleDelay: 100,
        lazyLoadThreshold: 200
    };

    // ==========================================
    // STATE MANAGEMENT
    // ==========================================
    const state = {
        isLoaded: false,
        isScrolling: false,
        currentSection: null,
        scrollDirection: 'down',
        lastScrollY: 0,
        modules: new Map()
    };

    // ==========================================
    // UTILITY FUNCTIONS
    // ==========================================

    /**
     * Debounce function execution
     */
    const debounce = (func, wait) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    };

    /**
     * Throttle function execution
     */
    const throttle = (func, limit) => {
        let inThrottle;
        return function executedFunction(...args) {
            if (!inThrottle) {
                func(...args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    };

    /**
     * Check if element is in viewport
     */
    const isInViewport = (element, threshold = 0) => {
        const rect = element.getBoundingClientRect();
        return (
            rect.top <= (window.innerHeight - threshold) &&
            rect.bottom >= threshold
        );
    };

    /**
     * Smooth scroll to element
     */
    const smoothScrollTo = (target, offset = 0) => {
        const element = typeof target === 'string' ? document.querySelector(target) : target;
        if (!element) return;

        const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
        const offsetPosition = elementPosition - offset;

        window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
        });
    };

    /**
     * Add class when element enters viewport
     */
    const addClassOnScroll = (selector, className, threshold = 100) => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
            if (isInViewport(el, threshold)) {
                el.classList.add(className);
            }
        });
    };

    /**
     * Format number with commas
     */
    const formatNumber = (num) => {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    };

    /**
     * Generate unique ID
     */
    const generateId = () => {
        return 'savoir-' + Math.random().toString(36).substr(2, 9);
    };

    /**
     * Get current year
     */
    const getCurrentYear = () => new Date().getFullYear();

    // ==========================================
    // MODULE REGISTRATION SYSTEM
    // ==========================================

    /**
     * Register a module with the application
     */
    const registerModule = (name, module) => {
        if (state.modules.has(name)) {
            console.warn(`Module "${name}" is already registered. Overwriting...`);
        }
        state.modules.set(name, module);
        return module;
    };

    /**
     * Get a registered module
     */
    const getModule = (name) => {
        return state.modules.get(name);
    };

    /**
     * Initialize all registered modules
     */
    const initModules = () => {
        state.modules.forEach((module, name) => {
            if (typeof module.init === 'function') {
                try {
                    module.init();
                } catch (error) {
                    console.error(`Error initializing module "${name}":`, error);
                }
            }
        });
    };

    // ==========================================
    // SCROLL MANAGEMENT
    // ==========================================

    /**
     * Handle scroll events
     */
    const handleScroll = () => {
        const currentScrollY = window.pageYOffset;
        state.scrollDirection = currentScrollY > state.lastScrollY ? 'down' : 'up';
        state.lastScrollY = currentScrollY;
        state.isScrolling = true;

        // Update scroll progress
        updateScrollProgress();

        // Clear scrolling flag after delay
        clearTimeout(window.scrollTimeout);
        window.scrollTimeout = setTimeout(() => {
            state.isScrolling = false;
        }, 150);
    };

    /**
     * Update scroll progress bar
     */
    const updateScrollProgress = () => {
        const progressBar = document.getElementById('scrollProgress');
        if (!progressBar) return;

        const scrollTop = window.pageYOffset;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const progress = (scrollTop / docHeight) * 100;

        progressBar.style.width = `${progress}%`;
    };

    /**
     * Initialize scroll listeners
     */
    const initScrollListeners = () => {
        window.addEventListener('scroll', throttle(handleScroll, CONFIG.throttleDelay), { passive: true });
    };

    // ==========================================
    // RESIZE MANAGEMENT
    // ==========================================

    /**
     * Handle window resize
     */
    const handleResize = () => {
        // Dispatch custom resize event for modules
        window.dispatchEvent(new CustomEvent('savoir:resize', {
            detail: {
                width: window.innerWidth,
                height: window.innerHeight
            }
        }));
    };

    /**
     * Initialize resize listeners
     */
    const initResizeListeners = () => {
        window.addEventListener('resize', debounce(handleResize, CONFIG.debounceDelay));
    };

    // ==========================================
    // LAZY LOADING
    // ==========================================

    /**
     * Initialize lazy loading for images
     */
    const initLazyLoading = () => {
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        loadImage(img);
                        imageObserver.unobserve(img);
                    }
                });
            }, {
                rootMargin: `${CONFIG.lazyLoadThreshold}px`
            });

            document.querySelectorAll('img[loading="lazy"]').forEach(img => {
                imageObserver.observe(img);
            });
        } else {
            // Fallback for browsers without IntersectionObserver
            document.querySelectorAll('img[loading="lazy"]').forEach(loadImage);
        }
    };

    /**
     * Load an image
     */
    const loadImage = (img) => {
        const src = img.getAttribute('src');
        if (!src) return;

        // Add loaded class for fade-in effect
        img.style.opacity = '0';
        img.style.transition = 'opacity 0.5s ease';

        img.onload = () => {
            img.style.opacity = '1';
        };

        img.onerror = () => {
            img.style.opacity = '1';
            img.classList.add('img-error');
        };

        // If already cached, trigger load immediately
        if (img.complete) {
            img.style.opacity = '1';
        }
    };

    // ==========================================
    // SMOOTH SCROLL LINKS
    // ==========================================

    /**
     * Initialize smooth scroll for anchor links
     */
    const initSmoothScrollLinks = () => {
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a[href^="#"]');
            if (!link) return;

            const targetId = link.getAttribute('href');
            if (targetId === '#') return;

            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                e.preventDefault();
                smoothScrollTo(targetElement, CONFIG.scrollOffset);
            }
        });
    };

    // ==========================================
    // CURRENT YEAR UPDATE
    // ==========================================

    /**
     * Update current year in footer
     */
    const initCurrentYear = () => {
        const yearElements = document.querySelectorAll('#currentYear');
        yearElements.forEach(el => {
            el.textContent = getCurrentYear();
        });
    };

    // ==========================================
    // FORM HANDLING
    // ==========================================

    /**
     * Initialize form enhancements
     */
    const initFormEnhancements = () => {
        // Add floating label support
        document.querySelectorAll('.form-floating input, .form-floating textarea, .form-floating select').forEach(input => {
            input.addEventListener('focus', () => {
                input.closest('.form-floating')?.classList.add('focused');
            });

            input.addEventListener('blur', () => {
                input.closest('.form-floating')?.classList.remove('focused');
            });
        });
    };

    // ==========================================
    // TOAST NOTIFICATIONS
    // ==========================================

    /**
     * Show toast notification
     */
    const showToast = (message, type = 'info') => {
        const toastEl = document.getElementById('liveToast');
        const toastBody = document.getElementById('toastMessage');
        
        if (!toastEl || !toastBody) return;

        toastBody.textContent = message;
        
        // Update icon based on type
        const icon = toastEl.querySelector('.toast-header i');
        if (icon) {
            icon.className = type === 'success' ? 'fas fa-check-circle me-2 text-success' :
                            type === 'error' ? 'fas fa-exclamation-circle me-2 text-danger' :
                            'fas fa-info-circle me-2 text-info';
        }

        const toast = new bootstrap.Toast(toastEl, {
            delay: 4000,
            autohide: true
        });
        
        toast.show();
    };

    // ==========================================
    // PAGE VISIBILITY API
    // ==========================================

    /**
     * Handle page visibility changes
     */
    const initPageVisibility = () => {
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                window.dispatchEvent(new CustomEvent('savoir:pause'));
            } else {
                window.dispatchEvent(new CustomEvent('savoir:resume'));
            }
        });
    };

    // ==========================================
    // PREFERS REDUCED MOTION
    // ==========================================

    /**
     * Check for reduced motion preference
     */
    const prefersReducedMotion = () => {
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    };

    /**
     * Initialize reduced motion detection
     */
    const initReducedMotion = () => {
        const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        
        mediaQuery.addEventListener('change', (e) => {
            document.body.classList.toggle('reduced-motion', e.matches);
            window.dispatchEvent(new CustomEvent('savoir:reducedMotion', {
                detail: { reduced: e.matches }
            }));
        });

        if (mediaQuery.matches) {
            document.body.classList.add('reduced-motion');
        }
    };

    // ==========================================
    // PUBLIC API
    // ==========================================

    return {
        // Configuration
        CONFIG,

        // State
        getState: () => ({ ...state }),

        // Utilities
        debounce,
        throttle,
        isInViewport,
        smoothScrollTo,
        addClassOnScroll,
        formatNumber,
        generateId,
        getCurrentYear,
        prefersReducedMotion,

        // Module System
        registerModule,
        getModule,
        initModules,

        // Core Features
        showToast,
        loadImage,

        // Initialization
        init: () => {
            if (state.isLoaded) return;

            // Initialize core systems
            initScrollListeners();
            initResizeListeners();
            initLazyLoading();
            initSmoothScrollLinks();
            initCurrentYear();
            initFormEnhancements();
            initPageVisibility();
            initReducedMotion();

            // Initialize all registered modules
            initModules();

            state.isLoaded = true;

            // Dispatch ready event
            window.dispatchEvent(new CustomEvent('savoir:ready'));

            console.log('%c Savoir Restaurant ', 'background: #c9a96e; color: #0f0f0f; font-size: 20px; font-weight: bold; padding: 10px 20px; border-radius: 8px;');
            console.log('%c Premium Dining Experience Initialized ', 'color: #c9a96e; font-size: 14px;');
        }
    };

})();

// ==========================================
// DOM READY INITIALIZATION
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    // Initialize the application
    SavoirApp.init();
});