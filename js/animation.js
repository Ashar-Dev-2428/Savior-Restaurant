/* ==========================================
   ANIMATION.JS
   Scroll Reveal, Intersection Observer & Parallax
   ========================================== */

const AnimationModule = (() => {
    'use strict';

    // ==========================================
    // CONFIGURATION
    // ==========================================
    const CONFIG = {
        revealThreshold: 0.15,
        revealRootMargin: '0px 0px -50px 0px',
        parallaxElements: '.parallax-slow, .parallax-medium, .parallax-fast',
        staggerDelay: 100,
        maxStagger: 8
    };

    // ==========================================
    // STATE
    // ==========================================
    const state = {
        observer: null,
        parallaxElements: [],
        isReducedMotion: false
    };

    // ==========================================
    // INITIALIZATION
    // ==========================================

    const init = () => {
        // Check reduced motion preference
        state.isReducedMotion = SavoirApp.prefersReducedMotion();

        if (!state.isReducedMotion) {
            initIntersectionObserver();
            initParallax();
            initStaggerAnimations();
        } else {
            // Show all elements immediately
            document.querySelectorAll('.reveal, .reveal-up, .reveal-down, .reveal-left, .reveal-right, .reveal-zoom, .reveal-blur, .reveal-clip').forEach(el => {
                el.classList.add('active');
            });
        }

        // Bind events
        bindEvents();
    };

    // ==========================================
    // INTERSECTION OBSERVER
    // ==========================================

    const initIntersectionObserver = () => {
        const options = {
            root: null,
            rootMargin: CONFIG.revealRootMargin,
            threshold: CONFIG.revealThreshold
        };

        state.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const element = entry.target;
                    
                    // Add active class
                    element.classList.add('active');

                    // Handle stagger children
                    if (element.classList.contains('stagger-parent')) {
                        animateStaggerChildren(element);
                    }

                    // Unobserve after animation (unless it's a repeating animation)
                    if (!element.classList.contains('repeat-animation')) {
                        state.observer.unobserve(element);
                    }
                } else if (element.classList.contains('repeat-animation')) {
                    element.classList.remove('active');
                }
            });
        }, options);

        // Observe all reveal elements
        const revealSelectors = [
            '.reveal',
            '.reveal-up',
            '.reveal-down',
            '.reveal-left',
            '.reveal-right',
            '.reveal-zoom',
            '.reveal-blur',
            '.reveal-clip'
        ];

        document.querySelectorAll(revealSelectors.join(', ')).forEach(el => {
            state.observer.observe(el);
        });
    };

    // ==========================================
    // STAGGER ANIMATIONS
    // ==========================================

    const initStaggerAnimations = () => {
        // Auto-detect stagger parents
        document.querySelectorAll('[data-stagger]').forEach(parent => {
            parent.classList.add('stagger-parent');
            const children = parent.children;
            
            Array.from(children).forEach((child, index) => {
                if (index < CONFIG.maxStagger) {
                    child.classList.add(`delay-${index + 1}`);
                    child.classList.add('reveal-up');
                }
            });
        });
    };

    const animateStaggerChildren = (parent) => {
        const children = parent.querySelectorAll('.reveal-up, .reveal-down, .reveal-left, .reveal-right');
        
        children.forEach((child, index) => {
            setTimeout(() => {
                child.classList.add('active');
            }, index * CONFIG.staggerDelay);
        });
    };

    // ==========================================
    // PARALLAX EFFECTS
    // ==========================================

    const initParallax = () => {
        state.parallaxElements = Array.from(document.querySelectorAll(CONFIG.parallaxElements));
        
        if (state.parallaxElements.length === 0) return;

        // Use requestAnimationFrame for smooth parallax
        let ticking = false;

        const updateParallax = () => {
            const scrollY = window.pageYOffset;
            const windowHeight = window.innerHeight;

            state.parallaxElements.forEach(el => {
                const rect = el.getBoundingClientRect();
                const elementTop = rect.top + scrollY;
                const elementVisible = scrollY + windowHeight > elementTop && scrollY < elementTop + rect.height;

                if (elementVisible) {
                    const speed = getParallaxSpeed(el);
                    const yPos = (scrollY - elementTop) * speed;
                    el.style.transform = `translateY(${yPos}px)`;
                }
            });

            ticking = false;
        };

        window.addEventListener('scroll', () => {
            if (!ticking) {
                requestAnimationFrame(updateParallax);
                ticking = true;
            }
        }, { passive: true });

        // Initial call
        updateParallax();
    };

    const getParallaxSpeed = (element) => {
        if (element.classList.contains('parallax-slow')) return 0.1;
        if (element.classList.contains('parallax-medium')) return 0.3;
        if (element.classList.contains('parallax-fast')) return 0.5;
        return 0.2;
    };

    // ==========================================
    // SPECIAL ANIMATIONS
    // ==========================================

    /**
     * Animate element with custom animation
     */
    const animateElement = (element, animationClass, duration = 500) => {
        return new Promise((resolve) => {
            element.classList.add(animationClass);
            
            setTimeout(() => {
                element.classList.remove(animationClass);
                resolve();
            }, duration);
        });
    };

    /**
     * Counter animation for statistics
     */
    const animateCounter = (element, target, duration = 2000) => {
        if (state.isReducedMotion) {
            element.textContent = SavoirApp.formatNumber(target);
            return Promise.resolve();
        }

        return new Promise((resolve) => {
            const startTime = performance.now();
            const startValue = 0;

            const updateCounter = (currentTime) => {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);

                // Easing function (ease-out-expo)
                const easeOut = 1 - Math.pow(2, -10 * progress);
                const currentValue = Math.floor(startValue + (target - startValue) * easeOut);

                element.textContent = SavoirApp.formatNumber(currentValue);

                if (progress < 1) {
                    requestAnimationFrame(updateCounter);
                } else {
                    element.textContent = SavoirApp.formatNumber(target);
                    element.classList.add('counter-done');
                    resolve();
                }
            };

            requestAnimationFrame(updateCounter);
        });
    };

    /**
     * Typewriter effect
     */
    const typewriterEffect = (element, text, speed = 50) => {
        return new Promise((resolve) => {
            let index = 0;
            element.textContent = '';

            const type = () => {
                if (index < text.length) {
                    element.textContent += text.charAt(index);
                    index++;
                    setTimeout(type, speed);
                } else {
                    resolve();
                }
            };

            type();
        });
    };

    /**
     * Text rotator effect
     */
    const initTextRotator = (selector, interval = 3000) => {
        const elements = document.querySelectorAll(selector);
        
        elements.forEach(el => {
            const texts = JSON.parse(el.dataset.texts || '[]');
            if (texts.length === 0) return;

            let currentIndex = 0;

            setInterval(() => {
                el.style.opacity = '0';
                el.style.transform = 'translateY(-20px)';

                setTimeout(() => {
                    currentIndex = (currentIndex + 1) % texts.length;
                    el.textContent = texts[currentIndex];
                    el.style.transform = 'translateY(20px)';

                    requestAnimationFrame(() => {
                        el.style.opacity = '1';
                        el.style.transform = 'translateY(0)';
                    });
                }, 300);
            }, interval);
        });
    };

    // ==========================================
    // SCROLL-TRIGGERED ANIMATIONS
    // ==========================================

    /**
     * Animate elements when they come into view (one-time)
     */
    const animateOnScroll = (selector, animationClass = 'animate-fade-in-up') => {
        const elements = document.querySelectorAll(selector);

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add(animationClass);
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });

        elements.forEach(el => observer.observe(el));
    };

    // ==========================================
    // EVENT BINDING
    // ==========================================

    const bindEvents = () => {
        // Handle reduced motion changes
        window.addEventListener('savoir:reducedMotion', (e) => {
            state.isReducedMotion = e.detail.reduced;
            
            if (state.isReducedMotion) {
                // Show all elements
                document.querySelectorAll('.reveal, .reveal-up, .reveal-down, .reveal-left, .reveal-right, .reveal-zoom, .reveal-blur, .reveal-clip').forEach(el => {
                    el.classList.add('active');
                });
            }
        });
    };

    // ==========================================
    // PUBLIC API
    // ==========================================

    return {
        init,
        animateElement,
        animateCounter,
        typewriterEffect,
        initTextRotator,
        animateOnScroll,
        getState: () => ({ ...state })
    };

})();

// Register module
SavoirApp.registerModule('animation', AnimationModule);