/* A brief brand introduction; page access never depends on this animation. */
(() => {
    'use strict';
    const root = document.documentElement;
    const started = performance.now();
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let dismissed = false;
    let dismissTimer;
    const finish = () => {
        if (dismissed) return;
        dismissed = true;
        clearTimeout(dismissTimer);
        root.classList.remove('stb-loading');
        const overlay = document.getElementById('stb-preloader');
        if (overlay) {
            overlay.setAttribute('aria-hidden', 'true');
            setTimeout(() => overlay.remove(), reducedMotion ? 0 : 650);
        }
    };
    const ready = () => {
        const logo = document.querySelector('#stb-preloader img');
        const reveal = () => {
            dismissTimer = setTimeout(finish, Math.max(0, (reducedMotion ? 0 : 3000) - (performance.now() - started)));
        };
        if (logo && typeof logo.decode === 'function') logo.decode().catch(() => {}).then(reveal);
        else reveal();
    };
    root.classList.add('stb-loading');
    // Never wait for CAPTCHA, maps, video, external services, or window.load.
    setTimeout(finish, 5000);
    window.addEventListener('pageshow', event => { if (event.persisted) finish(); });
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready, { once: true });
    else ready();
})();
