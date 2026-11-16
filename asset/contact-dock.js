'use strict';
(() => {
    function mount() {
        const doc = document;
        if (doc.getElementById('stb-contact-dock')) return;
        const root = doc.documentElement;
        root.style.setProperty('--stb-page-bottom-padding', getComputedStyle(doc.body).paddingBottom);
        const messageIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8v.5Z"/></svg>';
        const dock = doc.createElement('nav');
        dock.id = 'stb-contact-dock';
        dock.className = 'stb-contact-dock';
        dock.setAttribute('aria-label', 'Contact St. Bernadine');
        dock.innerHTML = '<a class="stb-contact-action stb-contact-call" href="tel:+12012221116" aria-label="Call St. Bernadine at +1 (201) 222-1116"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3H3c0 10 8 18 18 18v-3l-5-3-2 2a15 15 0 0 1-7-7l2-2-3-5Z"/></svg><span>Call Now</span></a><a class="stb-contact-action stb-contact-message" href="/contact#contact-form">' + messageIcon + '<span>Message Us Now</span></a>';
        doc.body.appendChild(dock);
        root.classList.add('stb-contact-dock-ready');
        doc.body.classList.add('stb-contact-dock-ready');

        const updateHeight = () => root.style.setProperty('--stb-contact-dock-height', Math.ceil(dock.getBoundingClientRect().height) + 'px');
        updateHeight();
        if ('ResizeObserver' in window) new ResizeObserver(updateHeight).observe(dock);
        window.addEventListener('resize', updateHeight, { passive: true });
        const updateViewport = () => root.style.setProperty('--stb-visible-height', (window.visualViewport?.height || window.innerHeight) + 'px');
        updateViewport();
        window.visualViewport?.addEventListener('resize', updateViewport, { passive: true });

        // Shared page scripts mount their controls on DOMContentLoaded. Let them
        // finish first; standalone print/video pages get a direct contact link.
        setTimeout(() => {
            if (!doc.querySelector('.chat-toggle-btn')) {
                const message = doc.createElement('a');
                message.className = 'stb-dock-message-fallback';
                message.href = '/contact#contact-form';
                message.setAttribute('aria-label', 'Message St. Bernadine');
                message.innerHTML = messageIcon;
                doc.body.appendChild(message);
                const observer = new MutationObserver(() => {
                    if (doc.querySelector('.chat-toggle-btn')) { message.remove(); observer.disconnect(); }
                });
                observer.observe(doc.body, { childList: true });
            }
            if (!doc.getElementById('back-to-top')) {
                const top = doc.createElement('a');
                top.id = 'back-to-top'; top.href = '#';
                top.setAttribute('aria-label', 'Go to top');
                top.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 12 6-6 6 6M12 6v14"/></svg>';
                doc.body.appendChild(top);
                const update = () => top.classList.toggle('show', window.scrollY > 300);
                update(); window.addEventListener('scroll', update, { passive: true });
                top.addEventListener('click', event => {
                    event.preventDefault();
                    window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
                });
            } else {
                doc.getElementById('back-to-top').classList.toggle('show', window.scrollY > 300);
            }
        }, 0);
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount, { once: true });
    else mount();
})();
