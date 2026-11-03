'use strict';
(() => {
    const form = document.getElementById('contact-form');
    if (!form) return;
    const ids = { name: 'contact-name', email: 'contact-email', contact_number: 'contactNumber', inquiry_type: 'contact-inquiry-type', subject: 'contact-subject', message: 'contact-message' };
    const fields = Object.fromEntries(Object.entries(ids).map(([key, id]) => [key, document.getElementById(id)]));
    const categoryValues = ['enrollment', 'placement', 'care', 'partnership', 'other'];
    const params = new URLSearchParams(location.search);
    const placement = params.get('department') === 'placement';
    const preset = placement ? 'placement' : (categoryValues.includes(params.get('inquiry')) ? params.get('inquiry') : '');
    const endpoint = placement ? '/send-placement' : '/send-contact';
    const button = form.querySelector('button[type="submit"]');
    const feedback = document.getElementById('contact-feedback');
    const count = document.getElementById('contact-message-count');
    const errors = {};
    let busy = false;
    form.noValidate = true;
    if (placement) {
        document.title = 'Placement Inquiry | St. Bernadine';
        document.querySelector('.services-hero-content h1').textContent = 'Placement Inquiry';
        form.parentElement.querySelector('h2').textContent = 'Placement Inquiry Form';
        feedback.querySelector('[data-feedback-help]').href = 'mailto:placement@stbernadineusa.com';
    }
    function defaults() {
        fields.inquiry_type.value = preset;
        if (placement) fields.subject.value = 'Placement / Visa Inquiry';
    }
    function updateCount() {
        const length = fields.message.value.length;
        count.textContent = `${length.toLocaleString('en-US')} / 3,000 characters`;
        count.dataset.atLimit = String(length >= 3000);
    }
    function fieldError(key, text) {
        errors[key].textContent = text;
        errors[key].hidden = !text;
        fields[key].setAttribute('aria-invalid', String(!!text));
    }
    function validateField(key) {
        const field = fields[key];
        const value = field.value.trim();
        let message = '';
        if (!value) message = { name: 'Enter your name.', email: 'Enter your email address.', contact_number: 'Enter a contact number.', inquiry_type: 'Choose a type of inquiry.', subject: 'Enter a subject.', message: 'Enter your message.' }[key];
        else if (key === 'email' && (field.validity.typeMismatch || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))) message = 'Enter a valid email address, such as name@example.com.';
        else if (key === 'contact_number') {
            const digits = value.replace(/\D/g, '');
            const phone = window.intlTelInputGlobals?.getInstance(field);
            if (!/^[+\d][\d\s().-]*$/.test(value) || digits.length < 7 || digits.length > 15 || (window.intlTelInputUtils && phone && !phone.isValidNumber())) message = 'Check the country code and enter a valid phone number.';
        } else if (key === 'inquiry_type' && !categoryValues.includes(value)) message = 'Choose one of the listed inquiry types.';
        if (!message && field.maxLength > 0 && field.value.length > field.maxLength) message = `Use ${field.maxLength.toLocaleString('en-US')} characters or fewer.`;
        fieldError(key, message);
        return !message;
    }
    for (const [key, field] of Object.entries(fields)) {
        const error = document.createElement('span');
        error.id = field.id + '-error'; error.className = 'stb-field-error'; error.hidden = true;
        const anchor = key === 'contact_number' ? field.closest('.iti') || field : field;
        anchor.insertAdjacentElement('afterend', error);
        field.setAttribute('aria-describedby', [field.getAttribute('aria-describedby'), error.id].filter(Boolean).join(' '));
        errors[key] = error;
        field.addEventListener('blur', () => validateField(key));
        field.addEventListener(key === 'inquiry_type' ? 'change' : 'input', () => {
            if (field.getAttribute('aria-invalid') === 'true') validateField(key);
            if (key === 'message') updateCount();
        });
    }
    function show(state, title, message, focus = false) {
        feedback.dataset.state = state;
        feedback.querySelector('[data-feedback-title]').textContent = title;
        feedback.querySelector('[data-feedback-message]').textContent = message;
        feedback.querySelector('[data-feedback-help]').hidden = state !== 'error';
        feedback.hidden = false;
        if (focus) feedback.focus();
    }
    function firstInvalid() { return Object.keys(fields).find(key => fields[key].getAttribute('aria-invalid') === 'true'); }
    form.addEventListener('submit', async event => {
        event.preventDefault();
        if (busy) return;
        feedback.hidden = true;
        Object.keys(fields).forEach(validateField);
        const invalid = firstInvalid();
        if (invalid) {
            show('error', 'A few details need your attention', 'Please correct the highlighted fields, then send your message.');
            fields[invalid].focus(); return;
        }
        busy = true; button.disabled = true; button.textContent = 'Verifying…'; form.setAttribute('aria-busy', 'true');
        let timer;
        try {
            let protection;
            try {
                if (!window.StbFormProtection) throw new Error('Verification is still loading. Please wait a moment and try again.');
                protection = await window.StbFormProtection.prepare(form);
            } catch (error) {
                show('error', 'Verification needed', error.message || 'Complete the security verification before sending.', true);
                return;
            }
            const data = Object.fromEntries(Object.entries(fields).map(([key, field]) => [key, field.value]));
            data.contact_number = window.intlTelInputGlobals?.getInstance(fields.contact_number)?.getNumber() || fields.contact_number.value;
            button.textContent = 'Sending…';
            const controller = new AbortController();
            timer = setTimeout(() => controller.abort(), 30000);
            const response = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...data, ...protection }), signal: controller.signal });
            const result = await response.json();
            if (response.ok && typeof result.message === 'string') {
                form.reset(); defaults(); updateCount();
                Object.keys(fields).forEach(key => fieldError(key, ''));
                show('success', 'Message received', result.message, true);
            } else {
                if (response.status === 400 && Array.isArray(result.details)) {
                    for (const detail of result.details) {
                        const key = detail.path;
                        if (fields[key]) fieldError(key, typeof detail.msg === 'string' && detail.msg !== 'Invalid value' ? detail.msg.slice(0, 200) : 'Please check this field and try again.');
                    }
                }
                show('error', response.status === 429 ? 'Please wait before trying again' : 'Your message needs attention', typeof result.error === 'string' && result.error !== 'Validation failed' ? result.error : 'Please correct the highlighted details and try again. Your message is still here.');
                const key = firstInvalid();
                if (key) fields[key].focus(); else feedback.focus();
            }
        } catch (_) {
            show('error', 'Delivery could not be confirmed', 'Your message is still here. A connection problem prevented us from confirming delivery. Please contact our team by email before sending the same message again.', true);
        } finally {
            clearTimeout(timer); busy = false; button.disabled = false; button.textContent = 'Send Message'; form.removeAttribute('aria-busy');
        }
    });
    defaults(); updateCount();
})();
