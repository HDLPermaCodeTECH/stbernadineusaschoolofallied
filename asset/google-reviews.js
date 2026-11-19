'use strict';
(() => {
    const REVIEW_URL = 'https://search.google.com/local/writereview?placeid=ChIJo_14zDBXwokRlXeePPByrto';
    const KEY = 'stbGoogleReviewPrompt';
    const DAY = 86400000;
    const WAIT = 60000;

    function suppressed(storage, now = Date.now()) {
        try {
            const value = JSON.parse(storage.getItem(KEY));
            return value?.version === 1 && Number.isFinite(value.until) && value.until > now && value.until <= now + 90 * DAY;
        } catch { return false; }
    }
    function remember(storage, days, now = Date.now()) {
        try { storage.setItem(KEY, JSON.stringify({ version: 1, until: now + days * DAY })); } catch { /* Private browsing may block storage. */ }
    }
    function eligible({ path, elapsed, scroll, visible, interacting, obstructed, dismissed }) {
        return ['/', '/index.html'].includes(path) && elapsed >= WAIT && scroll >= .35 && visible && !interacting && !obstructed && !dismissed;
    }
    if (typeof module !== 'undefined' && module.exports) module.exports = { REVIEW_URL, KEY, DAY, WAIT, suppressed, remember, eligible };
    if (typeof document === 'undefined') return;

    function mount() {
        const doc = document;
        let storage;
        try { storage = window.localStorage; } catch { /* Keep the page usable when storage is disabled. */ }
        // Honor a review link opened from any shared page, without tracking the visitor.
        doc.addEventListener('click', event => {
            if (event.target.closest('a[href]')?.href === REVIEW_URL && storage) remember(storage, 90);
        });
        // The invitation is limited to the homepage; form pages are never interrupted.
        if (!['/', '/index.html'].includes(location.pathname) || typeof HTMLDialogElement === 'undefined') return;
        if (storage && suppressed(storage)) return;
        let dismissed = false;
        let shown = false;
        let checking = false;
        const started = Date.now();
        let lastInteraction = started;
        let timer;
        const svgClose = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg>';
        const dialog = doc.createElement('dialog');
        dialog.className = 'stb-review-dialog';
        dialog.id = 'stb-review-dialog';
        dialog.setAttribute('aria-labelledby', 'stb-review-dialog-title');
        dialog.setAttribute('aria-describedby', 'stb-review-dialog-description');
        dialog.innerHTML = '<button type="button" class="stb-review-close" aria-label="Close review invitation" autofocus>' + svgClose + '</button>' +
            '<div class="stb-review-dialog-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9Z"/></svg></div>' +
            '<span class="stb-review-eyebrow">Your experience matters</span><h2 id="stb-review-dialog-title">How was your St. Bernadine experience?</h2>' +
            '<p id="stb-review-dialog-description">Share an honest review of your experience with St. Bernadine. Your feedback helps us improve and helps others decide on their next step.</p>' +
            '<div class="stb-review-dialog-actions"><a class="stb-review-primary" href="' + REVIEW_URL + '" target="_blank" rel="noopener noreferrer" data-review-open>Write a Google Review<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7M7 7h10v10"/></svg></a><button type="button" class="stb-review-later">Not now</button></div>' +
            '<p class="stb-review-disclosure">Opens Google in a new tab. A Google account is required. All honest feedback is welcome.</p>';
        doc.body.appendChild(dialog);
        const finish = days => {
            dismissed = true;
            if (storage) remember(storage, days);
            dialog.close();
        };
        dialog.querySelector('.stb-review-close').addEventListener('click', () => finish(7));
        dialog.querySelector('.stb-review-later').addEventListener('click', () => finish(7));
        dialog.querySelector('[data-review-open]').addEventListener('click', () => finish(90));
        dialog.addEventListener('cancel', event => { event.preventDefault(); finish(7); });
        dialog.addEventListener('close', () => doc.documentElement.classList.remove('stb-review-modal-open'));
        dialog.addEventListener('click', event => {
            const rect = dialog.getBoundingClientRect();
            if (event.target === dialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) finish(7);
        });
        doc.addEventListener('click', event => {
            if (event.target.closest('a[href]')?.href === REVIEW_URL && !dialog.contains(event.target)) {
                dismissed = true;
                if (storage) remember(storage, 90);
                cleanup();
            }
        });
        function cleanup() {
            clearTimeout(timer);
            window.removeEventListener('scroll', check);
            doc.removeEventListener('visibilitychange', check);
            doc.removeEventListener('pointerdown', interacted);
            doc.removeEventListener('keydown', interacted);
        }
        function interacted() { lastInteraction = Date.now(); }
        function check() {
            if (shown || dismissed || checking) return;
            checking = true;
            requestAnimationFrame(() => {
                checking = false;
                const scrollable = Math.max(1, doc.documentElement.scrollHeight - window.innerHeight);
                const active = doc.activeElement;
                if (!eligible({ path: location.pathname, elapsed: Date.now() - started, scroll: window.scrollY / scrollable,
                    visible: doc.visibilityState === 'visible',
                    interacting: Date.now() - lastInteraction < 2000 || !!active?.closest('input,textarea,select,[contenteditable="true"],form'),
                    obstructed: doc.body.classList.contains('cookie-pending') || doc.body.classList.contains('nav-open') || !!doc.querySelector('dialog[open],.chatbot-container.active,.chatbot-container.open') || doc.documentElement.classList.contains('stb-loading'),
                    dismissed: dismissed || (storage ? suppressed(storage) : false) })) return;
                shown = true;
                cleanup();
                dialog.showModal();
                doc.documentElement.classList.add('stb-review-modal-open');
            });
        }
        function tick() {
            check();
            if (!shown && !dismissed) timer = setTimeout(tick, 5000);
        }
        window.addEventListener('scroll', check, { passive: true });
        doc.addEventListener('visibilitychange', check);
        doc.addEventListener('pointerdown', interacted, { passive: true });
        doc.addEventListener('keydown', interacted);
        timer = setTimeout(tick, WAIT);
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount, { once: true });
    else mount();
})();
