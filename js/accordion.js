/* ==========================================
   ACCORDION.JS
   FAQ Accordion with ARIA & Keyboard Support
   ========================================== */

const AccordionModule = (() => {
    'use strict';

    // ==========================================
    // CONFIGURATION
    // ==========================================
    const CONFIG = {
        animationDuration: 350,
        allowMultiple: false, // true = multiple open, false = single open
        startOpen: null // index of item to start open, null = all closed
    };

    // ==========================================
    // STATE
    // ==========================================
    const state = {
        items: [],
        openItems: new Set()
    };

    // ==========================================
    // INITIALIZATION
    // ==========================================

    const init = () => {
        // Find all accordion containers
        const accordions = document.querySelectorAll('.accordion');
        
        accordions.forEach(accordion => {
            initializeAccordion(accordion);
        });

        // Also initialize standalone FAQ items if they exist
        const faqItems = document.querySelectorAll('.faq-item');
        if (faqItems.length > 0 && accordions.length === 0) {
            initializeStandaloneFAQ(faqItems);
        }
    };

    // ==========================================
    // ACCORDION INITIALIZATION
    // ==========================================

    const initializeAccordion = (accordion) => {
        const items = accordion.querySelectorAll('.accordion-item');
        
        items.forEach((item, index) => {
            const header = item.querySelector('.accordion-header, .accordion-button, .faq-question');
            const body = item.querySelector('.accordion-body, .accordion-collapse, .faq-answer');
            
            if (!header || !body) return;

            // Setup ARIA attributes
            const itemId = SavoirApp.generateId();
            const bodyId = `${itemId}-body`;

            header.setAttribute('id', itemId);
            header.setAttribute('aria-expanded', 'false');
            header.setAttribute('aria-controls', bodyId);

            body.setAttribute('id', bodyId);
            body.setAttribute('role', 'region');
            body.setAttribute('aria-labelledby', itemId);

            // Store item reference
            const itemData = {
                element: item,
                header: header,
                body: body,
                index: index,
                isOpen: false
            };

            state.items.push(itemData);

            // Bind click event
            header.addEventListener('click', () => toggleItem(itemData));

            // Bind keyboard events
            header.addEventListener('keydown', (e) => handleKeyboard(e, itemData, items, index));

            // Handle start open
            if (CONFIG.startOpen === index) {
                openItem(itemData);
            }
        });
    };

    // ==========================================
    // STANDALONE FAQ INITIALIZATION
    // ==========================================

    const initializeStandaloneFAQ = (items) => {
        items.forEach((item, index) => {
            const question = item.querySelector('.faq-question');
            const answer = item.querySelector('.faq-answer');
            
            if (!question || !answer) return;

            // Setup ARIA
            const itemId = SavoirApp.generateId();
            const answerId = `${itemId}-answer`;

            question.setAttribute('id', itemId);
            question.setAttribute('aria-expanded', 'false');
            question.setAttribute('aria-controls', answerId);
            question.setAttribute('tabindex', '0');

            answer.setAttribute('id', answerId);
            answer.setAttribute('role', 'region');
            answer.setAttribute('aria-labelledby', itemId);

            // Initial state
            answer.style.maxHeight = '0';
            answer.style.overflow = 'hidden';
            answer.style.transition = `max-height ${CONFIG.animationDuration}ms ease, opacity ${CONFIG.animationDuration}ms ease, padding ${CONFIG.animationDuration}ms ease`;
            answer.style.opacity = '0';

            const itemData = {
                element: item,
                header: question,
                body: answer,
                index: index,
                isOpen: false
            };

            state.items.push(itemData);

            question.addEventListener('click', () => toggleItem(itemData));
            question.addEventListener('keydown', (e) => handleKeyboard(e, itemData, items, index));
        });
    };

    // ==========================================
    // TOGGLE FUNCTIONALITY
    // ==========================================

    const toggleItem = (item) => {
        if (item.isOpen) {
            closeItem(item);
        } else {
            openItem(item);
        }
    };

    const openItem = (item) => {
        if (item.isOpen) return;

        // Close other items if multiple not allowed
        if (!CONFIG.allowMultiple) {
            state.items.forEach(otherItem => {
                if (otherItem !== item && otherItem.isOpen) {
                    closeItem(otherItem);
                }
            });
        }

        item.isOpen = true;
        item.header.setAttribute('aria-expanded', 'true');
        item.element.classList.add('active', 'open');

        // Animate body open
        animateOpen(item.body);

        state.openItems.add(item.index);

        // Dispatch event
        dispatchAccordionEvent('open', item);
    };

    const closeItem = (item) => {
        if (!item.isOpen) return;

        item.isOpen = false;
        item.header.setAttribute('aria-expanded', 'false');
        item.element.classList.remove('active', 'open');

        // Animate body closed
        animateClose(item.body);

        state.openItems.delete(item.index);

        // Dispatch event
        dispatchAccordionEvent('close', item);
    };

    // ==========================================
    // ANIMATIONS
    // ==========================================

    const animateOpen = (body) => {
        // Get natural height
        body.style.maxHeight = 'none';
        const height = body.scrollHeight;
        body.style.maxHeight = '0';

        // Force reflow
        body.offsetHeight;

        // Animate to height
        requestAnimationFrame(() => {
            body.style.maxHeight = `${height}px`;
            body.style.opacity = '1';
        });

        // Clean up after animation
        setTimeout(() => {
            body.style.maxHeight = 'none';
        }, CONFIG.animationDuration);
    };

    const animateClose = (body) => {
        // Get current height
        const height = body.scrollHeight;
        body.style.maxHeight = `${height}px`;

        // Force reflow
        body.offsetHeight;

        // Animate to 0
        requestAnimationFrame(() => {
            body.style.maxHeight = '0';
            body.style.opacity = '0';
        });
    };

    // ==========================================
    // KEYBOARD NAVIGATION
    // ==========================================

    const handleKeyboard = (e, item, allItems, currentIndex) => {
        const itemsArray = Array.from(allItems);
        const headers = itemsArray.map(i => i.querySelector('.accordion-header, .accordion-button, .faq-question') || i.querySelector('.faq-question'));

        switch (e.key) {
            case 'Enter':
            case ' ':
                e.preventDefault();
                toggleItem(item);
                break;

            case 'ArrowDown':
                e.preventDefault();
                const nextIndex = (currentIndex + 1) % headers.length;
                headers[nextIndex]?.focus();
                break;

            case 'ArrowUp':
                e.preventDefault();
                const prevIndex = (currentIndex - 1 + headers.length) % headers.length;
                headers[prevIndex]?.focus();
                break;

            case 'Home':
                e.preventDefault();
                headers[0]?.focus();
                break;

            case 'End':
                e.preventDefault();
                headers[headers.length - 1]?.focus();
                break;
        }
    };

    // ==========================================
    // EVENT DISPATCH
    // ==========================================

    const dispatchAccordionEvent = (type, item) => {
        window.dispatchEvent(new CustomEvent('savoir:accordion', {
            detail: {
                type,
                index: item.index,
                element: item.element
            }
        }));
    };

    // ==========================================
    // PUBLIC API
    // ==========================================

    const open = (index) => {
        const item = state.items[index];
        if (item) openItem(item);
    };

    const close = (index) => {
        const item = state.items[index];
        if (item) closeItem(item);
    };

    const closeAll = () => {
        state.items.forEach(item => {
            if (item.isOpen) closeItem(item);
        });
    };

    const getOpenItems = () => {
        return Array.from(state.openItems);
    };

    // ==========================================
    // PUBLIC API
    // ==========================================

    return {
        init,
        open,
        close,
        closeAll,
        getOpenItems,
        getState: () => ({ ...state })
    };

})();

// Register module
SavoirApp.registerModule('accordion', AccordionModule);