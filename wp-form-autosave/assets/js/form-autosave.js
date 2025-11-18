/**
 * Form AutoSave & Recovery - Frontend JavaScript
 *
 * Automatically saves form data to localStorage and restores on page reload
 *
 * @version 1.0.0
 */

(function() {
    'use strict';

    // Configuration (passed from WordPress)
    const config = window.formAutosaveConfig || {
        enabled: true,
        expiration: 48, // hours
        excludeFields: ['password', 'credit_card', 'cvv'],
        showNotification: true,
        notificationText: 'We found a previously saved entry. Would you like to restore it?',
        restoreButtonText: 'Restore',
        dismissButtonText: 'Dismiss',
        debug: false
    };

    // Constants
    const STORAGE_PREFIX = 'form_autosave_';
    const SAVE_DELAY = 1000; // milliseconds (debounce)
    const TIMESTAMP_KEY = '_timestamp';
    const URL_KEY = '_url';

    // State
    let saveTimers = {};
    let formsTracked = new Set();
    let notificationShown = false;

    /**
     * Initialize the plugin
     */
    function init() {
        if (!config.enabled) {
            log('AutoSave is disabled in settings');
            return;
        }

        if (!isLocalStorageAvailable()) {
            log('localStorage is not available');
            return;
        }

        log('Initializing Form AutoSave...');

        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', setup);
        } else {
            setup();
        }
    }

    /**
     * Setup form tracking
     */
    function setup() {
        // Find all forms on the page
        const forms = document.querySelectorAll('form');

        if (forms.length === 0) {
            log('No forms found on page');
            return;
        }

        log(`Found ${forms.length} form(s) on page`);

        forms.forEach((form, index) => {
            setupForm(form, index);
        });

        // Watch for dynamically added forms
        observeDynamicForms();

        // Clean up expired data
        cleanupExpiredData();
    }

    /**
     * Setup individual form
     */
    function setupForm(form, index) {
        // Skip if already tracked
        if (formsTracked.has(form)) {
            return;
        }

        const formId = getFormId(form, index);
        log(`Setting up form: ${formId}`);

        formsTracked.add(form);

        // Check for saved data
        const savedData = getSavedData(formId);
        if (savedData && config.showNotification) {
            showRestoreNotification(form, formId, savedData);
        }

        // Track form inputs
        const inputs = getFormInputs(form);

        inputs.forEach(input => {
            // Auto-save on input change
            input.addEventListener('input', () => {
                debouncedSave(formId, form);
            });

            input.addEventListener('change', () => {
                debouncedSave(formId, form);
            });
        });

        // Clear saved data on successful submit
        form.addEventListener('submit', () => {
            log(`Form submitted: ${formId}, clearing saved data`);
            clearSavedData(formId);
        });

        // Handle form reset
        form.addEventListener('reset', () => {
            log(`Form reset: ${formId}, clearing saved data`);
            clearSavedData(formId);
        });
    }

    /**
     * Get unique form ID
     */
    function getFormId(form, index) {
        // Try to use form ID
        if (form.id) {
            return form.id;
        }

        // Try to use form name
        if (form.name) {
            return form.name;
        }

        // Try to use form action
        if (form.action) {
            try {
                const url = new URL(form.action);
                const path = url.pathname.replace(/\//g, '_');
                return `form_${path}_${index}`;
            } catch (e) {
                // Fallback
            }
        }

        // Use index as fallback
        return `form_${index}`;
    }

    /**
     * Get all form inputs
     */
    function getFormInputs(form) {
        const inputs = form.querySelectorAll('input, textarea, select');
        return Array.from(inputs).filter(input => {
            // Skip excluded types
            const type = input.type ? input.type.toLowerCase() : '';
            if (['submit', 'button', 'reset', 'file', 'image', 'hidden'].includes(type)) {
                return false;
            }

            // Skip excluded fields
            const name = input.name || input.id || '';
            if (isFieldExcluded(name)) {
                return false;
            }

            return true;
        });
    }

    /**
     * Check if field should be excluded
     */
    function isFieldExcluded(fieldName) {
        if (!fieldName) return false;

        const lowerName = fieldName.toLowerCase();

        return config.excludeFields.some(excluded => {
            return lowerName.includes(excluded.toLowerCase());
        });
    }

    /**
     * Debounced save function
     */
    function debouncedSave(formId, form) {
        // Clear existing timer
        if (saveTimers[formId]) {
            clearTimeout(saveTimers[formId]);
        }

        // Set new timer
        saveTimers[formId] = setTimeout(() => {
            saveFormData(formId, form);
        }, SAVE_DELAY);
    }

    /**
     * Save form data to localStorage
     */
    function saveFormData(formId, form) {
        const inputs = getFormInputs(form);
        const data = {};
        let hasData = false;

        inputs.forEach(input => {
            const name = input.name || input.id;
            if (!name) return;

            let value = null;

            if (input.type === 'checkbox') {
                value = input.checked;
            } else if (input.type === 'radio') {
                if (input.checked) {
                    value = input.value;
                }
            } else {
                value = input.value;
            }

            if (value !== null && value !== '') {
                data[name] = value;
                hasData = true;
            }
        });

        // Only save if there's actual data
        if (!hasData) {
            log(`No data to save for form: ${formId}`);
            return;
        }

        // Add metadata
        data[TIMESTAMP_KEY] = Date.now();
        data[URL_KEY] = window.location.href;

        // Save to localStorage
        const storageKey = STORAGE_PREFIX + formId;
        try {
            localStorage.setItem(storageKey, JSON.stringify(data));
            log(`Saved data for form: ${formId}`, data);
        } catch (e) {
            console.error('Failed to save form data:', e);
        }
    }

    /**
     * Get saved data from localStorage
     */
    function getSavedData(formId) {
        const storageKey = STORAGE_PREFIX + formId;

        try {
            const json = localStorage.getItem(storageKey);
            if (!json) return null;

            const data = JSON.parse(json);

            // Check if data is expired
            if (isDataExpired(data)) {
                log(`Data expired for form: ${formId}`);
                localStorage.removeItem(storageKey);
                return null;
            }

            // Check if data is for current URL
            if (data[URL_KEY] && data[URL_KEY] !== window.location.href) {
                log(`Data is for different URL: ${data[URL_KEY]}`);
                // Still return data, but user might want to filter this
            }

            return data;
        } catch (e) {
            console.error('Failed to load saved data:', e);
            return null;
        }
    }

    /**
     * Check if data is expired
     */
    function isDataExpired(data) {
        if (!data[TIMESTAMP_KEY]) return false;

        const age = Date.now() - data[TIMESTAMP_KEY];
        const maxAge = config.expiration * 60 * 60 * 1000; // hours to milliseconds

        return age > maxAge;
    }

    /**
     * Clear saved data
     */
    function clearSavedData(formId) {
        const storageKey = STORAGE_PREFIX + formId;
        localStorage.removeItem(storageKey);
        log(`Cleared data for form: ${formId}`);
    }

    /**
     * Restore form data
     */
    function restoreFormData(form, formId, savedData) {
        const inputs = getFormInputs(form);

        inputs.forEach(input => {
            const name = input.name || input.id;
            if (!name || !(name in savedData)) return;

            const value = savedData[name];

            if (input.type === 'checkbox') {
                input.checked = value === true;
            } else if (input.type === 'radio') {
                if (input.value === value) {
                    input.checked = true;
                }
            } else {
                input.value = value;
            }

            // Trigger change event for compatibility with other scripts
            const event = new Event('change', { bubbles: true });
            input.dispatchEvent(event);
        });

        log(`Restored data for form: ${formId}`);

        // Show success message
        showSuccessMessage(form, 'Form data restored successfully!');
    }

    /**
     * Show restore notification
     */
    function showRestoreNotification(form, formId, savedData) {
        if (notificationShown) return;
        notificationShown = true;

        const notification = document.createElement('div');
        notification.className = 'form-autosave-notification';
        notification.innerHTML = `
            <div class="form-autosave-notification-content">
                <p class="form-autosave-notification-text">${config.notificationText}</p>
                <div class="form-autosave-notification-buttons">
                    <button type="button" class="form-autosave-btn form-autosave-btn-restore">${config.restoreButtonText}</button>
                    <button type="button" class="form-autosave-btn form-autosave-btn-dismiss">${config.dismissButtonText}</button>
                </div>
            </div>
        `;

        // Insert before form
        form.parentNode.insertBefore(notification, form);

        // Handle restore button
        const restoreBtn = notification.querySelector('.form-autosave-btn-restore');
        restoreBtn.addEventListener('click', () => {
            restoreFormData(form, formId, savedData);
            notification.remove();
        });

        // Handle dismiss button
        const dismissBtn = notification.querySelector('.form-autosave-btn-dismiss');
        dismissBtn.addEventListener('click', () => {
            clearSavedData(formId);
            notification.remove();
        });

        // Auto-dismiss after 30 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.classList.add('form-autosave-notification-fade');
                setTimeout(() => notification.remove(), 300);
            }
        }, 30000);
    }

    /**
     * Show success message
     */
    function showSuccessMessage(form, message) {
        const toast = document.createElement('div');
        toast.className = 'form-autosave-toast';
        toast.textContent = message;

        form.parentNode.insertBefore(toast, form);

        // Animate in
        setTimeout(() => toast.classList.add('form-autosave-toast-show'), 10);

        // Remove after 3 seconds
        setTimeout(() => {
            toast.classList.remove('form-autosave-toast-show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    /**
     * Watch for dynamically added forms
     */
    function observeDynamicForms() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1) { // Element node
                        if (node.tagName === 'FORM') {
                            setupForm(node, formsTracked.size);
                        } else {
                            const forms = node.querySelectorAll('form');
                            forms.forEach(form => setupForm(form, formsTracked.size));
                        }
                    }
                });
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    /**
     * Clean up expired data
     */
    function cleanupExpiredData() {
        const keys = Object.keys(localStorage);

        keys.forEach(key => {
            if (key.startsWith(STORAGE_PREFIX)) {
                try {
                    const data = JSON.parse(localStorage.getItem(key));
                    if (isDataExpired(data)) {
                        localStorage.removeItem(key);
                        log(`Removed expired data: ${key}`);
                    }
                } catch (e) {
                    // Invalid data, remove it
                    localStorage.removeItem(key);
                }
            }
        });
    }

    /**
     * Check if localStorage is available
     */
    function isLocalStorageAvailable() {
        try {
            const test = '__localStorage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (e) {
            return false;
        }
    }

    /**
     * Debug logging
     */
    function log(message, data) {
        if (config.debug) {
            console.log('[Form AutoSave]', message, data || '');
        }
    }

    // Initialize when script loads
    init();

})();
