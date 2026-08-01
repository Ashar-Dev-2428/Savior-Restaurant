/* ==========================================
   GALLERY.JS
   Gallery Filter, Lightbox & Image Navigation
   ========================================== */

const GalleryModule = (() => {
    'use strict';

    // ==========================================
    // CONFIGURATION
    // ==========================================
    const CONFIG = {
        animationDuration: 400,
        lightboxTransition: 300,
        swipeThreshold: 50
    };

    // ==========================================
    // STATE
    // ==========================================
    const state = {
        currentFilter: 'all',
        currentImageIndex: 0,
        filteredImages: [],
        isLightboxOpen: false
    };

    // ==========================================
    // DOM ELEMENTS
    // ==========================================
    let galleryGrid = null;
    let galleryItems = null;
    let filterBtns = null;
    let lightbox = null;
    let lightboxImage = null;
    let lightboxCaption = null;
    let lightboxClose = null;
    let lightboxPrev = null;
    let lightboxNext = null;

    // ==========================================
    // INITIALIZATION
    // ==========================================

    const init = () => {
        galleryGrid = document.getElementById('galleryGrid');
        if (!galleryGrid) return;

        galleryItems = galleryGrid.querySelectorAll('.gallery-item');
        filterBtns = document.querySelectorAll('.filter-btn');

        // Lightbox elements
        lightbox = document.getElementById('lightbox');
        lightboxImage = document.getElementById('lightboxImage');
        lightboxCaption = document.getElementById('lightboxCaption');
        lightboxClose = document.getElementById('lightboxClose');
        lightboxPrev = document.getElementById('lightboxPrev');
        lightboxNext = document.getElementById('lightboxNext');

        // Initialize filtered images
        updateFilteredImages();

        bindEvents();
    };

    // ==========================================
    // FILTER FUNCTIONALITY
    // ==========================================

    const filterGallery = (category) => {
        if (state.currentFilter === category) return;

        state.currentFilter = category;
        updateFilteredImages();

        // Update active button
        filterBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === category);
        });

        // Animate items
        galleryItems.forEach(item => {
            const itemCategory = item.dataset.category;
            const shouldShow = category === 'all' || itemCategory === category;

            if (shouldShow) {
                item.classList.remove('hidden');
                item.style.animation = `fadeInUp ${CONFIG.animationDuration}ms ease forwards`;
            } else {
                item.style.animation = `fadeOut ${CONFIG.animationDuration}ms ease forwards`;
                setTimeout(() => {
                    item.classList.add('hidden');
                }, CONFIG.animationDuration);
            }
        });
    };

    const updateFilteredImages = () => {
        state.filteredImages = Array.from(galleryItems).filter(item => {
            return state.currentFilter === 'all' || item.dataset.category === state.currentFilter;
        });
    };

    // ==========================================
    // LIGHTBOX
    // ==========================================

    const openLightbox = (index) => {
        if (state.filteredImages.length === 0) return;

        state.currentImageIndex = index;
        state.isLightboxOpen = true;

        updateLightboxImage();
        lightbox.classList.add('active');

        // Prevent body scroll
        document.body.style.overflow = 'hidden';

        // Focus trap
        lightboxClose?.focus();
    };

    const closeLightbox = () => {
        state.isLightboxOpen = false;
        lightbox.classList.remove('active');

        // Restore body scroll
        document.body.style.overflow = '';
    };

    const nextImage = () => {
        if (state.filteredImages.length <= 1) return;

        state.currentImageIndex = (state.currentImageIndex + 1) % state.filteredImages.length;
        animateLightboxTransition('next');
    };

    const prevImage = () => {
        if (state.filteredImages.length <= 1) return;

        state.currentImageIndex = (state.currentImageIndex - 1 + state.filteredImages.length) % state.filteredImages.length;
        animateLightboxTransition('prev');
    };

    const updateLightboxImage = () => {
        const currentItem = state.filteredImages[state.currentImageIndex];
        if (!currentItem) return;

        const img = currentItem.querySelector('img');
        const title = currentItem.querySelector('.gallery-title')?.textContent || '';

        lightboxImage.src = img.src;
        lightboxImage.alt = img.alt;
        lightboxCaption.textContent = title;
    };

    const animateLightboxTransition = (direction) => {
        const translateX = direction === 'next' ? '-50px' : '50px';

        lightboxImage.style.opacity = '0';
        lightboxImage.style.transform = `translateX(${translateX})`;

        setTimeout(() => {
            updateLightboxImage();
            lightboxImage.style.transition = 'none';
            lightboxImage.style.transform = direction === 'next' ? 'translateX(50px)' : 'translateX(-50px)';

            requestAnimationFrame(() => {
                lightboxImage.style.transition = `opacity ${CONFIG.lightboxTransition}ms ease, transform ${CONFIG.lightboxTransition}ms ease`;
                lightboxImage.style.opacity = '1';
                lightboxImage.style.transform = 'translateX(0)';
            });
        }, CONFIG.lightboxTransition);
    };

    // ==========================================
    // EVENT BINDING
    // ==========================================

    const bindEvents = () => {
        // Filter buttons
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                filterGallery(btn.dataset.filter);
            });
        });

        // Gallery item clicks
        galleryItems.forEach((item, index) => {
            item.addEventListener('click', () => {
                // Find index in filtered array
                const filteredIndex = state.filteredImages.indexOf(item);
                openLightbox(filteredIndex >= 0 ? filteredIndex : 0);
            });
        });

        // Lightbox controls
        lightboxClose?.addEventListener('click', closeLightbox);
        lightboxPrev?.addEventListener('click', (e) => {
            e.stopPropagation();
            prevImage();
        });
        lightboxNext?.addEventListener('click', (e) => {
            e.stopPropagation();
            nextImage();
        });

        // Close on backdrop click
        lightbox?.addEventListener('click', (e) => {
            if (e.target === lightbox) {
                closeLightbox();
            }
        });

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (!state.isLightboxOpen) return;

            switch (e.key) {
                case 'Escape':
                    e.preventDefault();
                    closeLightbox();
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    prevImage();
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    nextImage();
                    break;
            }
        });

        // Touch/Swipe support for lightbox
        let touchStartX = 0;
        let touchEndX = 0;

        lightbox?.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });

        lightbox?.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            const diff = touchStartX - touchEndX;

            if (Math.abs(diff) > CONFIG.swipeThreshold) {
                if (diff > 0) {
                    nextImage();
                } else {
                    prevImage();
                }
            }
        }, { passive: true });

        // Mouse wheel navigation
        lightbox?.addEventListener('wheel', (e) => {
            if (!state.isLightboxOpen) return;
            e.preventDefault();

            if (e.deltaY > 0) {
                nextImage();
            } else {
                prevImage();
            }
        }, { passive: false });
    };

    // ==========================================
    // PUBLIC API
    // ==========================================

    return {
        init,
        filterGallery,
        openLightbox,
        closeLightbox,
        getState: () => ({ ...state })
    };

})();

// Register module
SavoirApp.registerModule('gallery', GalleryModule);