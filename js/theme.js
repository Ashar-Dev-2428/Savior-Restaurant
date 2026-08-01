/* ==========================================
   THEME.JS
   Dark/Light Theme Toggle & LocalStorage
   ========================================== */

const ThemeModule = (() => {
    'use strict';

    // ==========================================
    // CONFIGURATION
    // ==========================================
    const CONFIG = {
        storageKey: 'savoir-theme',
        defaultTheme: 'light',
        transitionDuration: 300
    };

    // ==========================================
    // STATE
    // ==========================================
    const state = {
        currentTheme: CONFIG.defaultTheme,
        systemPreference: 'light'
    };

    // ==========================================
    // DOM ELEMENTS
    // ==========================================
    let themeToggle = null;
    let htmlElement = null;

    // ==========================================
    // INITIALIZATION
    // ==========================================

    const init = () => {
        htmlElement = document.documentElement;
        themeToggle = document.getElementById('themeToggle');

        // Detect system preference
        detectSystemPreference();

        // Load saved theme or use system preference
        loadTheme();

        // Bind events
        bindEvents();

        // Apply initial theme
        applyTheme(state.currentTheme);
    };

    // ==========================================
    // SYSTEM PREFERENCE DETECTION
    // ==========================================

    const detectSystemPreference = () => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        state.systemPreference = mediaQuery.matches ? 'dark' : 'light';

        // Listen for system preference changes
        mediaQuery.addEventListener('change', (e) => {
            state.systemPreference = e.matches ? 'dark' : 'light';
            
            // Only auto-switch if user hasn't manually set a preference
            const savedTheme = localStorage.getItem(CONFIG.storageKey);
            if (!savedTheme) {
                setTheme(state.systemPreference);
            }
        });
    };

    // ==========================================
    // THEME MANAGEMENT
    // ==========================================

    const loadTheme = () => {
        const savedTheme = localStorage.getItem(CONFIG.storageKey);
        
        if (savedTheme && ['light', 'dark'].includes(savedTheme)) {
            state.currentTheme = savedTheme;
        } else {
            state.currentTheme = state.systemPreference;
        }
    };

    const saveTheme = (theme) => {
        localStorage.setItem(CONFIG.storageKey, theme);
    };

    const setTheme = (theme) => {
        if (theme === state.currentTheme) return;

        // Add transition class for smooth color transition
        htmlElement.classList.add('theme-transition');

        state.currentTheme = theme;
        applyTheme(theme);
        saveTheme(theme);

        // Dispatch custom event
        window.dispatchEvent(new CustomEvent('savoir:themeChange', {
            detail: { theme }
        }));

        // Remove transition class after animation
        setTimeout(() => {
            htmlElement.classList.remove('theme-transition');
        }, CONFIG.transitionDuration);
    };

    const applyTheme = (theme) => {
        htmlElement.setAttribute('data-theme', theme);

        // Update meta theme-color
        const metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (metaThemeColor) {
            metaThemeColor.setAttribute('content', theme === 'dark' ? '#0f0f0f' : '#ffffff');
        }

        // Update toggle button icon if it exists
        updateToggleIcon();
    };

    const toggleTheme = () => {
        const newTheme = state.currentTheme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
    };

    // ==========================================
    // TOGGLE BUTTON
    // ==========================================

    const updateToggleIcon = () => {
        if (!themeToggle) return;

        const moonIcon = themeToggle.querySelector('.fa-moon');
        const sunIcon = themeToggle.querySelector('.fa-sun');

        if (state.currentTheme === 'dark') {
            moonIcon?.classList.add('d-none');
            sunIcon?.classList.remove('d-none');
        } else {
            moonIcon?.classList.remove('d-none');
            sunIcon?.classList.add('d-none');
        }
    };

    // ==========================================
    // EVENT BINDING
    // ==========================================

    const bindEvents = () => {
        if (themeToggle) {
            themeToggle.addEventListener('click', (e) => {
                e.preventDefault();
                toggleTheme();
            });
        }

        // Keyboard shortcut: Ctrl/Cmd + Shift + L
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'L') {
                e.preventDefault();
                toggleTheme();
            }
        });
    };

    // ==========================================
    // PUBLIC API
    // ==========================================

    return {
        init,
        getTheme: () => state.currentTheme,
        setTheme,
        toggleTheme,
        getState: () => ({ ...state })
    };

})();

// Register module
SavoirApp.registerModule('theme', ThemeModule);