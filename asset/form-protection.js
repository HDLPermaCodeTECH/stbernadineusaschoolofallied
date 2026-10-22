'use strict';

(() => {
    const states = new WeakMap();
    let configPromise;
    let configLoadedAt = 0;
    let scriptPromise;
    function loadWidget() {
        if (window.turnstile) return Promise.resolve();
        if (!scriptPromise) scriptPromise = new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
            script.async = true;
            script.onload = resolve;
            script.onerror = () => reject(new Error('Verification could not load. Please reload or contact the school directly.'));
            document.head.appendChild(script);
        });
        return scriptPromise;
    }
    function getConfig() {
        if (!configPromise || Date.now() - configLoadedAt > 60 * 60 * 1000) {
            configLoadedAt = Date.now();
            configPromise = fetch('/api/form-protection', { cache: 'no-store' }).then(async response => {
            const config = await response.json();
            if (!response.ok || !config.siteKey || !config.ticket) throw new Error(config.error || 'Verification is temporarily unavailable.');
            return config;
            });
        }
        return configPromise;
    }
    function initialize(form) {
        if (states.has(form)) return states.get(form);
        const state = { token: '', id: null, config: null };
        states.set(form, state);
        const group = document.createElement('div');
        group.className = 'stb-form-security';
        if (form.classList.contains('footer-subscribe-form')) form.style.flexWrap = 'wrap';
        else {
            const notice = document.createElement('p');
            notice.className = 'stb-form-notice';
            notice.textContent = 'For St. Bernadine service inquiries. Unsolicited sales proposals are not accepted.';
            group.appendChild(notice);
        }
        const trap = document.createElement('div');
        trap.className = 'stb-form-trap';
        trap.setAttribute('aria-hidden', 'true');
        const label = document.createElement('label');
        label.textContent = 'Leave this field empty';
        const honeypot = document.createElement('input');
        honeypot.type = 'text'; honeypot.name = 'stb_website'; honeypot.tabIndex = -1; honeypot.autocomplete = 'off';
        label.appendChild(honeypot); trap.appendChild(label); group.appendChild(trap);
        state.honeypot = honeypot;
        const widget = document.createElement('div');
        widget.className = 'stb-turnstile-widget';
        const status = document.createElement('p');
        status.className = 'stb-verification-status';
        status.setAttribute('role', 'status'); status.setAttribute('aria-live', 'polite');
        status.textContent = 'Loading verification…';
        group.append(widget, status); form.appendChild(group);
        state.group = group; state.status = status;
        state.ready = Promise.all([getConfig(), loadWidget()]).then(([config]) => {
            state.config = config;
            state.id = window.turnstile.render(widget, {
                sitekey: config.siteKey, action: config.action, theme: 'auto', size: 'compact',
                callback: token => { state.token = token; status.textContent = 'Verification complete.'; },
                'expired-callback': () => { state.token = ''; status.textContent = 'Please complete verification again.'; },
                'error-callback': () => { state.token = ''; status.textContent = 'Verification could not complete. Please retry or contact the school directly.'; return true; }
            });
            status.textContent = 'Complete verification before sending.';
        }).catch(error => { status.textContent = error.message; throw error; });
        state.ready.catch(() => {});
        return state;
    }
    window.StbFormProtection = {
        async prepare(form) {
            const state = initialize(form);
            await state.ready;
            // Long applications may stay open for hours; renew the signed ticket.
            state.config = await getConfig();
            if (!state.token) {
                state.status.textContent = 'Please complete the verification before sending.';
                state.group.scrollIntoView({ behavior: 'smooth', block: 'center' });
                throw new Error(state.status.textContent);
            }
            const result = { 'cf-turnstile-response': state.token, stb_form_ticket: state.config.ticket, stb_website: state.honeypot.value };
            state.token = '';
            window.turnstile.reset(state.id);
            return result;
        }
    };
    function start() {
        document.querySelectorAll('#contact-form, #homeCareInquiryForm, #request-care-form, #jobApplicationForm, #application-form, #referral-form, .footer-subscribe-form').forEach(initialize);
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
    else start();
})();
