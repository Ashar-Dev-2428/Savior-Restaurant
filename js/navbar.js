/* ==========================================
   NAVBAR.JS
   Sticky Navbar, Scroll Behavior & Mobile Nav
   ========================================== */

const NavbarModule = (() => {
    'use strict';

    // ==========================================
    // CONFIGURATION
    // ==========================================
    const CONFIG = {
        scrollThreshold: 100,
        hideThreshold: 50,
        transitionDuration: 300,
        mobileBreakpoint: 992
    };

    // ==========================================
    // STATE
    // ==========================================
    const state = {
        isScrolled: false,
        isHidden: false,
        lastScrollY: 0,
        scrollDirection: 'up',
        isMobileOpen: false
    };

    // ==========================================
    // DOM ELEMENTS
    // ==========================================
    let navbar = null;
    let navbarCollapse = null;
    let toggler = null;

    // ==========================================
    // INITIALIZATION
    // ==========================================

    const init = () => {
        navbar = document.getElementById('mainNavbar');
        if (!navbar) return;

        navbarCollapse = navbar.querySelector('.navbar-collapse');
        toggler = navbar.querySelector('.navbar-toggler');

        bindEvents();
        handleScroll(); // Check initial scroll position
    };

    // ==========================================
    // EVENT BINDING
    // ==========================================

    const bindEvents = () => {
        // Scroll events
        window.addEventListener('scroll', SavoirApp.throttle(handleScroll, 50), { passive: true });

        // Mobile toggle
        if (toggler) {
            toggler.addEventListener('click', handleToggle);
        }

        // Close mobile menu on link click
        document.querySelectorAll('.navbar-nav .nav-link').forEach(link => {
            link.addEventListener('click', () => {
                if (window.innerWidth < CONFIG.mobileBreakpoint && state.isMobileOpen) {
                    closeMobileMenu();
                }
            });
        });

        // Close mobile menu on outside click
        document.addEventListener('click', (e) => {
            if (state.isMobileOpen && !navbar.contains(e.target)) {
                closeMobileMenu();
            }
        });

        // Escape key to close mobile menu
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && state.isMobileOpen) {
                closeMobileMenu();
            }
        });

        // Handle resize
        window.addEventListener('savoir:resize', (e) => {
            if (e.detail.width >= CONFIG.mobileBreakpoint && state.isMobileOpen) {
                closeMobileMenu();
            }
        });
    };

    // ==========================================
    // SCROLL HANDLING
    // ==========================================

    const handleScroll = () => {
        const currentScrollY = window.pageYOffset;

        // Determine scroll direction
        state.scrollDirection = currentScrollY > state.lastScrollY ? 'down' : 'up';

        // Handle scrolled state
        if (currentScrollY > CONFIG.scrollThreshold) {
            if (!state.isScrolled) {
                navbar.classList.add('scrolled');
                state.isScrolled = true;
            }
        } else {
            if (state.isScrolled) {
                navbar.classList.remove('scrolled');
                state.isScrolled = false;
            }
            // Always show navbar when at top
            showNavbar();
        }

        // Handle hide/show on scroll (only when scrolled past threshold)
        if (state.isScrolled) {
            const scrollDelta = currentScrollY - state.lastScrollY;

            if (scrollDelta > CONFIG.hideThreshold && state.scrollDirection === 'down') {
                hideNavbar();
            } else if (scrollDelta < -CONFIG.hideThreshold && state.scrollDirection === 'up') {
                showNavbar();
            }
        }

        state.lastScrollY = currentScrollY;
    };

    // ==========================================
    // NAVBAR VISIBILITY
    // ==========================================

    const hideNavbar = () => {
        if (state.isHidden) return;
        navbar.style.transform = 'translateY(-100%)';
        state.isHidden = true;
    };

    const showNavbar = () => {
        if (!state.isHidden) return;
        navbar.style.transform = 'translateY(0)';
        state.isHidden = false;
    };

    // ==========================================
    // MOBILE MENU
    // ==========================================

const handleToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (state.isMobileOpen) {
        closeMobileMenu();
    } else {
        openMobileMenu();
    }
};

    const openMobileMenu = () => {
        if (!navbarCollapse) return;

        navbarCollapse.classList.add('show');
        toggler.setAttribute('aria-expanded', 'true');
        state.isMobileOpen = true;

        // Prevent body scroll
        document.body.style.overflow = 'hidden';

        // Add backdrop
        createBackdrop();

        // Focus trap
        trapFocus(navbarCollapse);
    };

    const closeMobileMenu = () => {
        if (!navbarCollapse) return;

        navbarCollapse.classList.remove('show');
        toggler.setAttribute('aria-expanded', 'false');
        state.isMobileOpen = false;

        // Restore body scroll
        document.body.style.overflow = '';

        // Remove backdrop
        removeBackdrop();

        // Return focus to toggler
        toggler?.focus();
    };

    // ==========================================
    // BACKDROP
    // ==========================================

    let backdrop = null;

    const createBackdrop = () => {
        backdrop = document.createElement('div');
        backdrop.className = 'navbar-backdrop';
        backdrop.style.cssText = `
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.5);
            z-index: 1020;
            opacity: 0;
            transition: opacity 0.3s ease;
        `;
        
        backdrop.addEventListener('click', closeMobileMenu);
        document.body.appendChild(backdrop);

        // Trigger reflow for transition
        requestAnimationFrame(() => {
            backdrop.style.opacity = '1';
        });
    };

    const removeBackdrop = () => {
        if (!backdrop) return;

        backdrop.style.opacity = '0';
        setTimeout(() => {
            backdrop?.remove();
            backdrop = null;
        }, 300);
    };

    // ==========================================
    // FOCUS TRAP
    // ==========================================

    const trapFocus = (element) => {
        const focusableElements = element.querySelectorAll(
            'a[href], button, input, textarea, select, [tabindex]:not([tabindex="-1"])'
        );
        
        const firstFocusable = focusableElements[0];
        const lastFocusable = focusableElements[focusableElements.length - 1];

        element.addEventListener('keydown', (e) => {
            if (e.key !== 'Tab') return;

            if (e.shiftKey) {
                if (document.activeElement === firstFocusable) {
                    lastFocusable.focus();
                    e.preventDefault();
                }
            } else {
                if (document.activeElement === lastFocusable) {
                    firstFocusable.focus();
                    e.preventDefault();
                }
            }
        });

        firstFocusable?.focus();
    };

    // ==========================================
    // ACTIVE NAV LINK
    // ==========================================

    const updateActiveLink = (sectionId) => {
        document.querySelectorAll('.navbar-nav .nav-link').forEach(link => {
            link.classList.remove('active');
            const href = link.getAttribute('href');
            
            if (href === `#${sectionId}` || href === `index.html#${sectionId}`) {
                link.classList.add('active');
            }
        });
    };

    // ==========================================
    // PUBLIC API
    // ==========================================

    return {
        init,
        getState: () => ({ ...state }),
        updateActiveLink,
        closeMobileMenu
    };

})();

// Register module
SavoirApp.registerModule('navbar', NavbarModule);