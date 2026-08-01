/* ==========================================
   SLIDER.JS
   Hero Auto Slider with Touch & Keyboard Support
   ========================================== */

const SliderModule = (() => {
    'use strict';

    // ==========================================
    // CONFIGURATION
    // ==========================================
    const CONFIG = {
        autoPlay: true,
        autoPlayDelay: 6000,
        transitionDuration: 800,
        swipeThreshold: 50,
        pauseOnHover: true,
        pauseOnHidden: true
    };

    // ==========================================
    // STATE
    // ==========================================
    const state = {
        currentSlide: 0,
        totalSlides: 0,
        isAutoPlaying: false,
        isTransitioning: false,
        autoPlayTimer: null,
        touchStartX: 0,
        touchEndX: 0
    };

    // ==========================================
    // DOM ELEMENTS
    // ==========================================
    let slider = null;
    let slides = null;
    let dots = null;
    let prevBtn = null;
    let nextBtn = null;

    // ==========================================
    // INITIALIZATION
    // ==========================================

    const init = () => {
        slider = document.getElementById('heroSlider');
        if (!slider) return;

        slides = slider.querySelectorAll('.hero-slide');
        state.totalSlides = slides.length;
        if (state.totalSlides === 0) return;

        // Controls
        prevBtn = document.getElementById('sliderPrev');
        nextBtn = document.getElementById('sliderNext');
        dots = document.querySelectorAll('.slider-dot');

        // Initialize
        showSlide(0);
        bindEvents();

        // Start autoplay
        if (CONFIG.autoPlay) {
            startAutoPlay();
        }
    };


    // ==========================================
    // SLIDE NAVIGATION
    // ==========================================

    const showSlide = (index) => {
        if (state.isTransitioning || index === state.currentSlide) return;
        state.isTransitioning = true;

        const currentSlideEl = slides[state.currentSlide];
        const nextSlideEl = slides[index];

        // Remove active from current
        currentSlideEl.classList.remove('active');

        // Add active to next
        nextSlideEl.classList.add('active');

        // Animate content
        animateSlideContent(nextSlideEl);

        // Update dots
        updateDots(index);

        // Update state
        state.currentSlide = index;

        // Reset transition lock
        setTimeout(() => {
            state.isTransitioning = false;
        }, CONFIG.transitionDuration);
    };

    const nextSlide = () => {
        const next = (state.currentSlide + 1) % state.totalSlides;
        showSlide(next);
    };

    const prevSlide = () => {
        const prev = (state.currentSlide - 1 + state.totalSlides) % state.totalSlides;
        showSlide(prev);
    };

    const goToSlide = (index) => {
        if (index < 0 || index >= state.totalSlides) return;
        showSlide(index);
    };

    // ==========================================
    // SLIDE CONTENT ANIMATION
    // ==========================================

    const animateSlideContent = (slide) => {
        const elements = slide.querySelectorAll('.reveal-up, .reveal-left, .reveal-right');
        
        // Reset animations
        elements.forEach(el => {
            el.classList.remove('active');
            el.style.animation = 'none';
            el.offsetHeight; // Trigger reflow
        });

        // Re-trigger animations with stagger
        elements.forEach((el, i) => {
            const delay = el.classList.contains('delay-1') ? 100 :
                         el.classList.contains('delay-2') ? 200 :
                         el.classList.contains('delay-3') ? 300 : 0;
            
            setTimeout(() => {
                el.classList.add('active');
            }, delay + 300);
        });
    };

    // ==========================================
    // DOTS UPDATE
    // ==========================================

    const updateDots = (activeIndex) => {
        dots.forEach((dot, i) => {
            dot.classList.toggle('active', i === activeIndex);
            dot.setAttribute('aria-current', i === activeIndex ? 'true' : 'false');
        });
    };

    // ==========================================
    // AUTO PLAY
    // ==========================================

    const startAutoPlay = () => {
        if (state.isAutoPlaying) return;
        state.isAutoPlaying = true;
        
        state.autoPlayTimer = setInterval(() => {
            nextSlide();
        }, CONFIG.autoPlayDelay);
    };

    const stopAutoPlay = () => {
        state.isAutoPlaying = false;
        clearInterval(state.autoPlayTimer);
    };

    const resetAutoPlay = () => {
        stopAutoPlay();
        if (CONFIG.autoPlay) {
            startAutoPlay();
        }
    };

    // ==========================================
    // EVENT BINDING
    // ==========================================

    const bindEvents = () => {
        // Previous/Next buttons
        prevBtn?.addEventListener('click', () => {
            prevSlide();
            resetAutoPlay();
        });

        nextBtn?.addEventListener('click', () => {
            nextSlide();
            resetAutoPlay();
        });

        // Dot navigation
        dots.forEach((dot, index) => {
            dot.addEventListener('click', () => {
                goToSlide(index);
                resetAutoPlay();
            });
        });

        // Touch/Swipe support
        slider.addEventListener('touchstart', handleTouchStart, { passive: true });
        slider.addEventListener('touchend', handleTouchEnd, { passive: true });

        // Mouse drag support
        let isDragging = false;
        let startX = 0;

        slider.addEventListener('mousedown', (e) => {
            isDragging = true;
            startX = e.clientX;
        });

        slider.addEventListener('mouseup', (e) => {
            if (!isDragging) return;
            isDragging = false;
            const diff = startX - e.clientX;
            
            if (Math.abs(diff) > CONFIG.swipeThreshold) {
                if (diff > 0) {
                    nextSlide();
                } else {
                    prevSlide();
                }
                resetAutoPlay();
            }
        });

        slider.addEventListener('mouseleave', () => {
            isDragging = false;
        });

        // Pause on hover
        if (CONFIG.pauseOnHover) {
            slider.addEventListener('mouseenter', stopAutoPlay);
            slider.addEventListener('mouseleave', startAutoPlay);
        }

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            // Only if slider is in viewport
            const rect = slider.getBoundingClientRect();
            const isInView = rect.top < window.innerHeight && rect.bottom > 0;
            
            if (!isInView) return;

            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                prevSlide();
                resetAutoPlay();
            } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                nextSlide();
                resetAutoPlay();
            }
        });

        // Pause when page is hidden
        if (CONFIG.pauseOnHidden) {
            window.addEventListener('savoir:pause', stopAutoPlay);
            window.addEventListener('savoir:resume', startAutoPlay);
        }
    };

    // ==========================================
    // TOUCH HANDLERS
    // ==========================================

    const handleTouchStart = (e) => {
        state.touchStartX = e.changedTouches[0].screenX;
        stopAutoPlay();
    };

    const handleTouchEnd = (e) => {
        state.touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
        startAutoPlay();
    };

    const handleSwipe = () => {
        const diff = state.touchStartX - state.touchEndX;

        if (Math.abs(diff) > CONFIG.swipeThreshold) {
            if (diff > 0) {
                nextSlide();
            } else {
                prevSlide();
            }
        }
    };

    // ==========================================
    // PUBLIC API
    // ==========================================

    return {
        init,
        nextSlide,
        prevSlide,
        goToSlide,
        startAutoPlay,
        stopAutoPlay,
        getState: () => ({ ...state })
    };

})();

// Register module
SavoirApp.registerModule('slider', SliderModule);

// ==========================================
// TESTIMONIAL SLIDER
// ==========================================

document.addEventListener("DOMContentLoaded", function () {

    const testimonialSlider = document.getElementById("testimonialSlider");

    if (!testimonialSlider) return;

    const testimonials = testimonialSlider.querySelectorAll(".testimonial-item");
    const prevButton = document.getElementById("testimonialPrev");
    const nextButton = document.getElementById("testimonialNext");
    const dots = document.querySelectorAll(".testimonial-dot");

    if (testimonials.length === 0) return;

    let currentIndex = 0;
    let autoSlideTimer;


    // ------------------------------------------
    // SHOW TESTIMONIAL
    // ------------------------------------------

    function showTestimonial(index) {

        // Loop
        if (index >= testimonials.length) {
            index = 0;
        }

        if (index < 0) {
            index = testimonials.length - 1;
        }

        // Remove active
        testimonials.forEach(function (testimonial) {
            testimonial.classList.remove("active");
        });

        // Remove active from dots
        dots.forEach(function (dot) {
            dot.classList.remove("active");
        });

        // Show selected testimonial
        testimonials[index].classList.add("active");

        // Activate selected dot
        if (dots[index]) {
            dots[index].classList.add("active");
        }

        currentIndex = index;
    }


    // ------------------------------------------
    // NEXT
    // ------------------------------------------

    function nextTestimonial() {
        showTestimonial(currentIndex + 1);
    }


    // ------------------------------------------
    // PREVIOUS
    // ------------------------------------------

    function previousTestimonial() {
        showTestimonial(currentIndex - 1);
    }


    // ------------------------------------------
    // NEXT BUTTON
    // ------------------------------------------

    if (nextButton) {

        nextButton.addEventListener("click", function () {

            nextTestimonial();

            resetAutoSlide();

        });

    }


    // ------------------------------------------
    // PREVIOUS BUTTON
    // ------------------------------------------

    if (prevButton) {

        prevButton.addEventListener("click", function () {

            previousTestimonial();

            resetAutoSlide();

        });

    }


    // ------------------------------------------
    // DOTS
    // ------------------------------------------

    dots.forEach(function (dot, index) {

        dot.addEventListener("click", function () {

            showTestimonial(index);

            resetAutoSlide();

        });

    });


    // ------------------------------------------
    // AUTO SLIDE
    // ------------------------------------------

    function startAutoSlide() {

        autoSlideTimer = setInterval(function () {

            nextTestimonial();

        }, 5000);

    }


    // ------------------------------------------
    // RESET AUTO SLIDE
    // ------------------------------------------

    function resetAutoSlide() {

        clearInterval(autoSlideTimer);

        startAutoSlide();

    }


    // ------------------------------------------
    // INITIALIZE
    // ------------------------------------------

    showTestimonial(0);

    startAutoSlide();

});