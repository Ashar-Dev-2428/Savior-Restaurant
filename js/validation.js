/* ==========================================
   VALIDATION.JS
   Form Validation, Email & Input Sanitization
   ========================================== */

const ValidationModule = (() => {
    'use strict';

    // ==========================================
    // CONFIGURATION
    // ==========================================
    const CONFIG = {
        emailRegex: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        phoneRegex: /^[\d\s\-\+\(\)]{10,20}$/,
        urlRegex: /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/,
        nameMinLength: 2,
        nameMaxLength: 50,
        messageMinLength: 10,
        messageMaxLength: 1000,
        passwordMinLength: 8
    };

    // ==========================================
    // STATE
    // ==========================================
    const state = {
        validatedForms: new Map(),
        errorMessages: {
            required: 'This field is required',
            email: 'Please enter a valid email address',
            phone: 'Please enter a valid phone number',
            minLength: (min) => `Must be at least ${min} characters`,
            maxLength: (max) => `Must be no more than ${max} characters`,
            url: 'Please enter a valid URL',
            number: 'Please enter a valid number',
            date: 'Please enter a valid date',
            match: 'Passwords do not match',
            pattern: 'Please match the requested format'
        }
    };

    // ==========================================
    // INITIALIZATION
    // ==========================================

    const init = () => {
        // Initialize validation on all forms with data-validate attribute
        document.querySelectorAll('form[data-validate]').forEach(form => {
            initFormValidation(form);
        });

        // Also initialize newsletter form
        const newsletterForm = document.getElementById('newsletterForm');
        if (newsletterForm) {
            initNewsletterValidation(newsletterForm);
        }
    };

    // ==========================================
    // FORM VALIDATION
    // ==========================================

    const initFormValidation = (form) => {
        const fields = form.querySelectorAll('input, textarea, select');

        fields.forEach(field => {
            // Real-time validation on blur
            field.addEventListener('blur', () => validateField(field));

            // Clear errors on focus
            field.addEventListener('focus', () => clearFieldErrors(field));

            // Validate on input for some fields
            if (field.type === 'email' || field.dataset.validate === 'realtime') {
                field.addEventListener('input', SavoirApp.debounce(() => {
                    if (field.value.length > 0) {
                        validateField(field);
                    }
                }, 300));
            }
        });

        // Form submission
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            
            if (validateForm(form)) {
                // Form is valid - dispatch event or call handler
                form.dispatchEvent(new CustomEvent('savoir:formValid', {
                    detail: { form }
                }));
            } else {
                // Focus first invalid field
                const firstInvalid = form.querySelector('.is-invalid');
                firstInvalid?.focus();
            }
        });

        state.validatedForms.set(form, { fields: Array.from(fields) });
    };

    // ==========================================
    // FIELD VALIDATION
    // ==========================================

    const validateField = (field) => {
        const value = field.value.trim();
        const validations = getValidations(field);
        let isValid = true;
        let errorMessage = '';

        // Required check
        if (field.required && !value) {
            isValid = false;
            errorMessage = state.errorMessages.required;
        }

        // Type-specific validations
        if (isValid && value) {
            switch (field.type) {
                case 'email':
                    if (!CONFIG.emailRegex.test(value)) {
                        isValid = false;
                        errorMessage = state.errorMessages.email;
                    }
                    break;

                case 'tel':
                    if (!CONFIG.phoneRegex.test(value)) {
                        isValid = false;
                        errorMessage = state.errorMessages.phone;
                    }
                    break;

                case 'url':
                    if (!CONFIG.urlRegex.test(value)) {
                        isValid = false;
                        errorMessage = state.errorMessages.url;
                    }
                    break;

                case 'number':
                    const num = parseFloat(value);
                    if (isNaN(num)) {
                        isValid = false;
                        errorMessage = state.errorMessages.number;
                    } else {
                        const min = field.min ? parseFloat(field.min) : null;
                        const max = field.max ? parseFloat(field.max) : null;
                        
                        if (min !== null && num < min) {
                            isValid = false;
                            errorMessage = `Must be at least ${min}`;
                        }
                        if (max !== null && num > max) {
                            isValid = false;
                            errorMessage = `Must be no more than ${max}`;
                        }
                    }
                    break;

                case 'date':
                    const date = new Date(value);
                    if (isNaN(date.getTime())) {
                        isValid = false;
                        errorMessage = state.errorMessages.date;
                    }
                    break;
            }

            // Min length
            const minLength = field.minLength || field.dataset.minLength;
            if (isValid && minLength && value.length < parseInt(minLength)) {
                isValid = false;
                errorMessage = state.errorMessages.minLength(minLength);
            }

            // Max length
            const maxLength = field.maxLength || field.dataset.maxLength;
            if (isValid && maxLength && value.length > parseInt(maxLength)) {
                isValid = false;
                errorMessage = state.errorMessages.maxLength(maxLength);
            }

            // Pattern validation
            if (isValid && field.pattern) {
                const pattern = new RegExp(field.pattern);
                if (!pattern.test(value)) {
                    isValid = false;
                    errorMessage = field.dataset.patternMessage || state.errorMessages.pattern;
                }
            }

            // Custom validation function
            if (isValid && field.dataset.validateFunction) {
                const customValid = window[field.dataset.validateFunction](value, field);
                if (customValid !== true) {
                    isValid = false;
                    errorMessage = customValid || 'Invalid value';
                }
            }
        }

        // Match validation (e.g., confirm password)
        if (isValid && field.dataset.match) {
            const matchField = document.querySelector(field.dataset.match);
            if (matchField && value !== matchField.value) {
                isValid = false;
                errorMessage = state.errorMessages.match;
            }
        }

        // Update UI
        updateFieldUI(field, isValid, errorMessage);

        return isValid;
    };

    // ==========================================
    // FORM VALIDATION
    // ==========================================

    const validateForm = (form) => {
        const fields = form.querySelectorAll('input, textarea, select');
        let isFormValid = true;

        fields.forEach(field => {
            if (!validateField(field)) {
                isFormValid = false;
            }
        });

        return isFormValid;
    };

    // ==========================================
    // UI UPDATES
    // ==========================================

    const updateFieldUI = (field, isValid, errorMessage) => {
        const formGroup = field.closest('.form-floating, .form-group, .mb-3');
        
        // Remove previous states
        field.classList.remove('is-valid', 'is-invalid');
        formGroup?.classList.remove('is-valid', 'is-invalid');

        // Remove previous error message
        const existingFeedback = formGroup?.querySelector('.invalid-feedback, .valid-feedback');
        if (existingFeedback) existingFeedback.remove();

        if (!field.value && !field.required) return; // Don't show status for empty optional fields

        if (isValid) {
            field.classList.add('is-valid');
            formGroup?.classList.add('is-valid');
        } else {
            field.classList.add('is-invalid');
            formGroup?.classList.add('is-invalid');

            // Add error message
            if (errorMessage) {
                const feedback = document.createElement('div');
                feedback.className = 'invalid-feedback';
                feedback.textContent = errorMessage;
                formGroup?.appendChild(feedback);
            }
        }
    };

    const clearFieldErrors = (field) => {
        const formGroup = field.closest('.form-floating, .form-group, .mb-3');
        
        field.classList.remove('is-valid', 'is-invalid');
        formGroup?.classList.remove('is-valid', 'is-invalid');

        const existingFeedback = formGroup?.querySelector('.invalid-feedback, .valid-feedback');
        if (existingFeedback) existingFeedback.remove();
    };

    // ==========================================
    // GET VALIDATIONS
    // ==========================================

    const getValidations = (field) => {
        return {
            required: field.required,
            type: field.type,
            minLength: field.minLength,
            maxLength: field.maxLength,
            pattern: field.pattern,
            min: field.min,
            max: field.max
        };
    };

    // ==========================================
    // NEWSLETTER VALIDATION
    // ==========================================

    const initNewsletterValidation = (form) => {
        const emailInput = form.querySelector('input[type="email"]');
        const checkbox = form.querySelector('input[type="checkbox"]');

        form.addEventListener('submit', (e) => {
            e.preventDefault();

            let isValid = true;

            // Validate email
            if (!emailInput.value.trim()) {
                isValid = false;
                SavoirApp.showToast('Please enter your email address', 'error');
            } else if (!CONFIG.emailRegex.test(emailInput.value.trim())) {
                isValid = false;
                SavoirApp.showToast('Please enter a valid email address', 'error');
            }

            // Validate checkbox
            if (checkbox && !checkbox.checked) {
                isValid = false;
                SavoirApp.showToast('Please agree to the privacy policy', 'error');
            }

            if (isValid) {
                // Simulate subscription
                const submitBtn = form.querySelector('button[type="submit"]');
                const originalText = submitBtn.innerHTML;
                
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Subscribing...';

                setTimeout(() => {
                    SavoirApp.showToast('Thank you for subscribing!', 'success');
                    form.reset();
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalText;
                }, 1500);
            }
        });
    };

    // ==========================================
    // SANITIZATION
    // ==========================================

    const sanitizeInput = (input) => {
        const div = document.createElement('div');
        div.textContent = input;
        return div.innerHTML;
    };

    const sanitizeEmail = (email) => {
        return email.trim().toLowerCase();
    };

    const sanitizePhone = (phone) => {
        return phone.replace(/[^\d\s\-\+\(\)]/g, '').trim();
    };

    // ==========================================
    // VALIDATION HELPERS
    // ==========================================

    const isValidEmail = (email) => {
        return CONFIG.emailRegex.test(email.trim());
    };

    const isValidPhone = (phone) => {
        return CONFIG.phoneRegex.test(phone.trim());
    };

    const isValidURL = (url) => {
        return CONFIG.urlRegex.test(url.trim());
    };

    const isValidName = (name) => {
        const trimmed = name.trim();
        return trimmed.length >= CONFIG.nameMinLength && 
               trimmed.length <= CONFIG.nameMaxLength &&
               /^[a-zA-Z\s\-']+$/.test(trimmed);
    };

    // ==========================================
    // PUBLIC API
    // ==========================================

    return {
        init,
        validateField,
        validateForm,
        sanitizeInput,
        sanitizeEmail,
        sanitizePhone,
        isValidEmail,
        isValidPhone,
        isValidURL,
        isValidName,
        getState: () => ({ ...state })
    };

})();

// Register module
SavoirApp.registerModule('validation', ValidationModule);