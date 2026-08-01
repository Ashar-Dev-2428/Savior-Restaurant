/* ==========================================
   RESERVATION.JS
   Reservation Form, Validation & Demo Submission
   ========================================== */

const ReservationModule = (() => {
    'use strict';

    // ==========================================
    // CONFIGURATION
    // ==========================================
    const CONFIG = {
        minDaysAhead: 1,
        maxDaysAhead: 90,
        minGuests: 1,
        maxGuests: 20,
        workingHours: {
            open: 17,  // 5:00 PM
            close: 23  // 11:00 PM
        }
    };

    // ==========================================
    // STATE
    // ==========================================
    const state = {
        isSubmitting: false,
        formData: null
    };

    // ==========================================
    // DOM ELEMENTS
    // ==========================================
    let reservationForm = null;
    let dateInput = null;
    let timeSelect = null;
    let guestsInput = null;

    // ==========================================
    // INITIALIZATION
    // ==========================================

    const init = () => {
        reservationForm = document.getElementById('reservationForm');
        if (!reservationForm) return;

        dateInput = document.getElementById('resDate');
        timeSelect = document.getElementById('resTime');
        guestsInput = document.getElementById('resGuests');

        // Set min/max dates
        setupDateConstraints();

        // Bind events
        bindEvents();

        // Setup real-time validation
        setupRealTimeValidation();
    };

    // ==========================================
    // DATE CONSTRAINTS
    // ==========================================

    const setupDateConstraints = () => {
        if (!dateInput) return;

        const today = new Date();
        const minDate = new Date(today);
        minDate.setDate(today.getDate() + CONFIG.minDaysAhead);

        const maxDate = new Date(today);
        maxDate.setDate(today.getDate() + CONFIG.maxDaysAhead);

        dateInput.min = formatDate(minDate);
        dateInput.max = formatDate(maxDate);

        // Set default to tomorrow
        dateInput.value = formatDate(minDate);
    };

    const formatDate = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    // ==========================================
    // TIME SLOTS MANAGEMENT
    // ==========================================

    const updateTimeSlots = () => {
        if (!timeSelect || !dateInput) return;

        const selectedDate = new Date(dateInput.value);
        const today = new Date();
        const isToday = selectedDate.toDateString() === today.toDateString();

        // Clear existing options except placeholder
        const placeholder = timeSelect.querySelector('option[value=""]');
        timeSelect.innerHTML = '';
        if (placeholder) timeSelect.appendChild(placeholder);

        // Generate time slots
        const slots = generateTimeSlots(isToday);

        slots.forEach(slot => {
            const option = document.createElement('option');
            option.value = slot.value;
            option.textContent = slot.label;
            timeSelect.appendChild(option);
        });
    };

    const generateTimeSlots = (isToday) => {
        const slots = [];
        const currentHour = new Date().getHours();

        for (let hour = CONFIG.workingHours.open; hour < CONFIG.workingHours.close; hour++) {
            // Skip past hours if booking for today
            if (isToday && hour <= currentHour) continue;

            // Add :00 slot
            slots.push({
                value: `${String(hour).padStart(2, '0')}:00`,
                label: formatTime(hour, 0)
            });

            // Add :30 slot (except for last hour)
            if (hour < CONFIG.workingHours.close - 1) {
                slots.push({
                    value: `${String(hour).padStart(2, '0')}:30`,
                    label: formatTime(hour, 30)
                });
            }
        }

        return slots;
    };

    const formatTime = (hour, minute) => {
        const period = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour);
        const displayMinute = String(minute).padStart(2, '0');
        return `${displayHour}:${displayMinute} ${period}`;
    };

    // ==========================================
    // VALIDATION
    // ==========================================

    const validateField = (field) => {
        const value = field.value.trim();
        const fieldName = field.id;
        let isValid = true;
        let message = '';

        switch (fieldName) {
            case 'resName':
                isValid = value.length >= 2 && value.length <= 50;
                message = isValid ? '' : 'Please enter a valid name (2-50 characters)';
                break;

            case 'resEmail':
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                isValid = emailRegex.test(value);
                message = isValid ? '' : 'Please enter a valid email address';
                break;

            case 'resPhone':
                const phoneRegex = /^[\d\s\-\+\(\)]{10,20}$/;
                isValid = phoneRegex.test(value);
                message = isValid ? '' : 'Please enter a valid phone number';
                break;

            case 'resGuests':
                const guests = parseInt(value);
                isValid = guests >= CONFIG.minGuests && guests <= CONFIG.maxGuests;
                message = isValid ? '' : `Guests must be between ${CONFIG.minGuests} and ${CONFIG.maxGuests}`;
                break;

            case 'resDate':
                const selectedDate = new Date(value);
                const minDate = new Date();
                minDate.setDate(minDate.getDate() + CONFIG.minDaysAhead);
                const maxDate = new Date();
                maxDate.setDate(maxDate.getDate() + CONFIG.maxDaysAhead);

                isValid = selectedDate >= minDate && selectedDate <= maxDate;
                message = isValid ? '' : `Date must be between ${formatDate(minDate)} and ${formatDate(maxDate)}`;
                break;

            case 'resTime':
                isValid = value !== '';
                message = isValid ? '' : 'Please select a time';
                break;
        }

        // Update UI
        updateFieldStatus(field, isValid, message);

        return isValid;
    };

    const updateFieldStatus = (field, isValid, message) => {
        const formFloating = field.closest('.form-floating');
        if (!formFloating) return;

        // Remove previous status
        formFloating.classList.remove('is-valid', 'is-invalid');
        
        // Remove previous feedback
        const existingFeedback = formFloating.querySelector('.invalid-feedback, .valid-feedback');
        if (existingFeedback) existingFeedback.remove();

        if (field.value === '') return; // Don't show status for empty fields

        if (isValid) {
            formFloating.classList.add('is-valid');
            field.classList.add('is-valid');
            field.classList.remove('is-invalid');
        } else {
            formFloating.classList.add('is-invalid');
            field.classList.add('is-invalid');
            field.classList.remove('is-valid');

            // Add error message
            const feedback = document.createElement('div');
            feedback.className = 'invalid-feedback';
            feedback.textContent = message;
            formFloating.appendChild(feedback);
        }
    };

    const validateForm = () => {
        const fields = reservationForm.querySelectorAll('input[required], select[required]');
        let isFormValid = true;

        fields.forEach(field => {
            if (!validateField(field)) {
                isFormValid = false;
            }
        });

        return isFormValid;
    };

    // ==========================================
    // REAL-TIME VALIDATION
    // ==========================================

    const setupRealTimeValidation = () => {
        const fields = reservationForm.querySelectorAll('input, select, textarea');

        fields.forEach(field => {
            // Validate on blur
            field.addEventListener('blur', () => {
                if (field.hasAttribute('required') || field.value !== '') {
                    validateField(field);
                }
            });

            // Clear status on focus
            field.addEventListener('focus', () => {
                const formFloating = field.closest('.form-floating');
                if (formFloating) {
                    formFloating.classList.remove('is-valid', 'is-invalid');
                }
                field.classList.remove('is-valid', 'is-invalid');
            });

            // Special handling for date change
            if (field.id === 'resDate') {
                field.addEventListener('change', () => {
                    updateTimeSlots();
                    validateField(field);
                });
            }
        });
    };

    // ==========================================
    // FORM SUBMISSION
    // ==========================================

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (state.isSubmitting) return;

        // Validate form
        if (!validateForm()) {
            SavoirApp.showToast('Please fix the errors in the form', 'error');
            
            // Focus first invalid field
            const firstInvalid = reservationForm.querySelector('.is-invalid');
            firstInvalid?.focus();
            return;
        }

        state.isSubmitting = true;

        // Collect form data
        const formData = new FormData(reservationForm);
        state.formData = Object.fromEntries(formData.entries());

        // Show loading state
        const submitBtn = reservationForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Processing...';

        // Simulate API call
        try {
            await simulateSubmission();

            // Success
            SavoirApp.showToast('Reservation confirmed! We will send you a confirmation email shortly.', 'success');
            
            // Reset form
            reservationForm.reset();
            setupDateConstraints();
            
            // Clear validation states
            reservationForm.querySelectorAll('.is-valid, .is-invalid').forEach(el => {
                el.classList.remove('is-valid', 'is-invalid');
            });

        } catch (error) {
            SavoirApp.showToast('Something went wrong. Please try again.', 'error');
        } finally {
            state.isSubmitting = false;
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
    };

    const simulateSubmission = () => {
        return new Promise((resolve) => {
            setTimeout(() => {
                console.log('Reservation Data:', state.formData);
                resolve();
            }, 2000);
        });
    };

    // ==========================================
    // EVENT BINDING
    // ==========================================

    const bindEvents = () => {
        // Form submission
        reservationForm.addEventListener('submit', handleSubmit);

        // Date change updates time slots
        if (dateInput) {
            dateInput.addEventListener('change', updateTimeSlots);
        }
    };

    // ==========================================
    // PUBLIC API
    // ==========================================

    return {
        init,
        validateForm,
        getState: () => ({ ...state })
    };

})();

// Register module
SavoirApp.registerModule('reservation', ReservationModule);