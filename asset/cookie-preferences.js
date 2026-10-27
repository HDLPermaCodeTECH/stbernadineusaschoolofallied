(function (root, factory) {
    'use strict';
    const api = factory();
    if (typeof module === 'object' && module.exports) module.exports = api;
    if (root.document) api.mount(root);
})(typeof window === 'undefined' ? globalThis : window, function () {
    'use strict';
    const KEY = 'stbPrivacyPreferences';
    const LIFETIME = 180 * 24 * 60 * 60 * 1000;
    function createPreferences(externalMedia, now = Date.now()) {
        return { version: 1, essential: true, externalMedia: externalMedia === true,
            analytics: false, marketing: false, updatedAt: now, expiresAt: now + LIFETIME };
    }
    function parsePreferences(raw, now = Date.now()) {
        try {
            const value = JSON.parse(raw);
            if (!value || value.version !== 1 || value.essential !== true ||
                typeof value.externalMedia !== 'boolean' || value.analytics !== false || value.marketing !== false ||
                !Number.isFinite(value.updatedAt) || !Number.isFinite(value.expiresAt) ||
                value.updatedAt > now + 300000 || value.expiresAt <= now || value.expiresAt <= value.updatedAt ||
                value.expiresAt - value.updatedAt > LIFETIME) return null;
            return { ...createPreferences(value.externalMedia, value.updatedAt), expiresAt: value.expiresAt };
        } catch (_) { return null; }
    }
    function readPreferences(storage, now = Date.now()) {
        try { return parsePreferences(storage.getItem(KEY), now); } catch (_) { return null; }
    }
    function savePreferences(storage, preferences) {
        try {
            storage.setItem(KEY, JSON.stringify(preferences));
            storage.removeItem('cookieConsent'); // The old banner never collected map consent.
            return true;
        } catch (_) { return false; }
    }
    function mount(win) {
        const doc = win.document;
        function init() {
            if (doc.getElementById('stb-privacy-banner')) return;
            let storage;
            try { storage = win.localStorage; } catch (_) { storage = null; }
            let preferences = readPreferences(storage);
            let returnFocus;
            const icon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 4 6v5c0 5 3.5 8 8 10 4.5-2 8-5 8-10V6l-8-3Z"/><path d="m8 12 3 3 5-6"/></svg>';
            const host = doc.createElement('div');
            host.id = 'stb-privacy-controls';
            host.innerHTML = `
                <section id="stb-privacy-banner" class="stb-privacy-banner" aria-labelledby="stb-privacy-banner-title" hidden>
                    <div class="stb-privacy-symbol">${icon}</div>
                    <div class="stb-privacy-banner-copy"><h2 id="stb-privacy-banner-title">A little choice. More privacy.</h2>
                    <p>Essential storage keeps this site working securely and remembers your choice. Optional Google Maps stays off until you allow it. <a href="/privacy#cookies">Privacy details</a></p></div>
                    <div class="stb-privacy-actions"><button type="button" data-privacy-choice="essential">Essential only</button><button type="button" data-privacy-choice="optional">Allow optional</button><button type="button" class="stb-privacy-settings" data-cookie-settings>Cookie Settings</button></div>
                </section>
                <dialog id="stb-privacy-dialog" class="stb-privacy-dialog" aria-labelledby="stb-privacy-title" aria-describedby="stb-privacy-intro">
                    <div class="stb-privacy-heading"><div><span class="stb-privacy-eyebrow">ST. BERNADINE · PRIVACY</span><h2 id="stb-privacy-title" tabindex="-1">Your privacy, your choice.</h2></div><button type="button" class="stb-privacy-close" aria-label="Close cookie settings"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg></button></div>
                    <div class="stb-privacy-body"><p id="stb-privacy-intro">Keep the essentials, choose the extras. You can change these preferences at any time using Cookie Settings in the footer.</p>
                        <section class="stb-privacy-category"><div class="stb-privacy-category-title"><h3>Essential services</h3><span class="stb-privacy-badge">Always active</span></div><p>Site delivery, security verification for forms and saving your privacy choice. These services keep the website and its forms working.</p></section>
                        <section class="stb-privacy-category"><label class="stb-privacy-map-label" for="stb-privacy-maps"><span><strong>Google Maps</strong><small>Optional external content</small></span><input type="checkbox" id="stb-privacy-maps" aria-describedby="stb-privacy-map-description"></label><p id="stb-privacy-map-description">Show the interactive map on our Contact page. Loading it connects to Google, which may receive your IP address and use its own cookies or storage. It stays off unless you allow it.</p></section>
                        <section class="stb-privacy-category stb-privacy-inactive"><div class="stb-privacy-category-title"><h3>Analytics &amp; advertising</h3><span class="stb-privacy-badge">Not in use</span></div><p>No analytics or advertising trackers are installed in this website's current setup.</p></section>
                        <p class="stb-privacy-small">Your choice is saved in this browser for up to 180 days. Turning maps off stops future embedded map loads on this site; it cannot erase information Google has already received. <a href="/privacy#cookies">Read the privacy details</a>.</p>
                    </div>
                    <div class="stb-privacy-dialog-actions"><button type="button" data-privacy-choice="essential">Essential only</button><button type="button" data-privacy-choice="optional">Allow optional</button><button type="button" class="stb-privacy-save">Save choices</button></div>
                </dialog><p id="stb-privacy-status" class="stb-privacy-status" role="status" aria-live="polite"></p>`;
            doc.body.appendChild(host);
            const banner = doc.getElementById('stb-privacy-banner');
            const dialog = doc.getElementById('stb-privacy-dialog');
            const checkbox = doc.getElementById('stb-privacy-maps');
            const status = doc.getElementById('stb-privacy-status');
            let statusTimer;
            function apply() {
                const allowed = preferences?.externalMedia === true;
                doc.querySelectorAll('iframe[data-consent-src]').forEach(frame => {
                    const placeholder = frame.parentElement.querySelector('.stb-map-placeholder');
                    if (allowed) {
                        if (!frame.hasAttribute('src')) frame.setAttribute('src', frame.dataset.consentSrc);
                    } else frame.removeAttribute('src');
                    frame.hidden = !allowed;
                    if (placeholder) placeholder.hidden = allowed;
                });
                banner.hidden = preferences !== null;
                doc.body.classList.toggle('cookie-pending', !preferences);
            }
            function announce(text) {
                clearTimeout(statusTimer);
                status.textContent = text;
                status.classList.add('stb-privacy-status-visible');
                statusTimer = setTimeout(() => status.classList.remove('stb-privacy-status-visible'), 6500);
            }
            function close() { if (dialog.open) dialog.close(); }
            function open(trigger) {
                returnFocus = trigger || doc.activeElement;
                const menu = doc.querySelector('.mobile-menu-btn[aria-expanded="true"]');
                if (menu) menu.click();
                checkbox.checked = preferences?.externalMedia === true;
                if (!dialog.open) dialog.showModal();
                doc.documentElement.classList.add('stb-privacy-modal-open');
                doc.getElementById('stb-privacy-title').focus();
            }
            function choose(allowMaps) {
                preferences = createPreferences(allowMaps);
                const persisted = savePreferences(storage, preferences);
                apply();
                close();
                announce(persisted ? (allowMaps ? 'Preferences saved. Google Maps is allowed.' : 'Preferences saved. Optional maps are off.') : 'Your choice applies to this page only because this browser is blocking storage.');
                win.dispatchEvent(new CustomEvent('stb:privacychange', { detail: { ...preferences } }));
            }
            doc.addEventListener('click', event => {
                const trigger = event.target.closest('[data-cookie-settings]');
                if (trigger) { event.preventDefault(); open(trigger); }
            });
            host.querySelectorAll('[data-privacy-choice]').forEach(button => button.addEventListener('click', () => choose(button.dataset.privacyChoice === 'optional')));
            host.querySelector('.stb-privacy-save').addEventListener('click', () => choose(checkbox.checked));
            host.querySelector('.stb-privacy-close').addEventListener('click', close);
            dialog.addEventListener('close', () => {
                doc.documentElement.classList.remove('stb-privacy-modal-open');
                if (returnFocus?.isConnected && !returnFocus.closest('[hidden]')) returnFocus.focus({ preventScroll: true });
            });
            dialog.addEventListener('keydown', event => {
                if (event.key !== 'Tab') return;
                const controls = [...dialog.querySelectorAll('button:not([disabled]),a[href],input:not([disabled])')];
                const first = controls[0];
                const last = controls[controls.length - 1];
                if (!event.shiftKey && doc.activeElement === last) {
                    event.preventDefault(); first.focus();
                } else if (event.shiftKey && (doc.activeElement === first || doc.activeElement.id === 'stb-privacy-title')) {
                    event.preventDefault(); last.focus();
                }
            });
            win.addEventListener('storage', event => {
                if (event.key === KEY || event.key === null) {
                    preferences = readPreferences(storage);
                    checkbox.checked = preferences?.externalMedia === true;
                    apply();
                }
            });
            win.addEventListener('pageshow', () => {
                // Recheck expiry and permission on back/forward navigation, too.
                if (storage) preferences = readPreferences(storage);
                apply();
            });
            win.StBPrivacy = Object.freeze({ openSettings: () => open(), getPreferences: () => preferences ? { ...preferences } : null });
            apply();
        }
        if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', init, { once: true });
        else init();
    }
    return { KEY, LIFETIME, createPreferences, parsePreferences, readPreferences, savePreferences, mount };
});
