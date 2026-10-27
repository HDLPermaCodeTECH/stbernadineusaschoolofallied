'use strict';
(() => {
    function initialize() {
        const card = document.querySelector('.stb-location-card');
        if (!card) return;
        const frame = card.querySelector('iframe[data-consent-src]');
        const state = card.querySelector('[data-map-permission-state]');
        const loader = card.querySelector('.stb-map-loader');
        const loadingText = loader.querySelector('span');
        let source = null;
        let timeout;
        function update() {
            const nextSource = frame.getAttribute('src');
            const allowed = !!nextSource;
            card.dataset.mapAllowed = String(allowed);
            state.textContent = allowed ? 'Google Maps allowed' : 'Google Maps off';
            if (nextSource === source) return;
            source = nextSource;
            clearTimeout(timeout);
            loader.hidden = !allowed;
            if (allowed) {
                loadingText.textContent = 'Loading the interactive map…';
                timeout = setTimeout(() => {
                    loadingText.textContent = 'The map is taking longer than expected. You can still use Get Directions.';
                }, 12000);
            }
        }
        frame.addEventListener('load', () => {
            if (!frame.hasAttribute('src')) return;
            clearTimeout(timeout);
            loader.hidden = true;
        });
        new MutationObserver(update).observe(frame, { attributes: true, attributeFilter: ['src', 'hidden'] });
        update();
        const viewButtons = [...card.querySelectorAll('[data-map-view]')];
        const imageryNote = card.querySelector('[data-street-imagery-note]');
        viewButtons.forEach(button => button.addEventListener('click', () => {
            const street = button.dataset.mapView === 'street';
            const url = street ? frame.dataset.streetSrc : frame.dataset.satelliteSrc;
            frame.dataset.consentSrc = url;
            frame.title = street ? 'Google Street View near the St. Bernadine office' : 'Satellite view of the St. Bernadine office on Google Maps';
            viewButtons.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
            imageryNote.hidden = !street;
            // Changing the view never overrides an existing map opt-out.
            if (frame.hasAttribute('src') && frame.getAttribute('src') !== url) frame.setAttribute('src', url);
        }));
        const copy = card.querySelector('[data-copy-address]');
        const feedback = card.querySelector('.stb-location-feedback');
        const fallback = card.querySelector('.stb-location-copy-fallback');
        // Permit selecting this public address even where other site text is protected.
        card.addEventListener('selectstart', event => event.stopPropagation());
        copy.addEventListener('click', async () => {
            copy.disabled = true;
            try {
                if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
                await navigator.clipboard.writeText(copy.dataset.copyAddress);
                fallback.hidden = true;
                feedback.textContent = 'Address copied. Ready for your journey.';
            } catch (_) {
                fallback.hidden = false;
                const input = fallback.querySelector('input');
                input.focus();
                input.select();
                feedback.textContent = 'Automatic copy is unavailable. Copy the selected address below.';
            } finally { copy.disabled = false; }
        });
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialize, { once: true });
    else initialize();
})();
