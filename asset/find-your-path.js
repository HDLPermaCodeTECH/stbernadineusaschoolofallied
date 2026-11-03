'use strict';
(() => {
    const section = document.getElementById('find-your-path');
    if (!section) return;
    const paths = {
        study: { title:'Build skills for your next chapter.', eyebrow:'SCHOOL OF ALLIED HEALTH', badge:'LEARN WITH PURPOSE', description:'Explore St. Bernadine’s allied health training programs, review the program information and connect with the school office about enrollment.', image:'/asset/images/sahs.webp', alt:'St. Bernadine allied health training', primary:'Explore programs', href:'/school-of-allied-health-services/#certification-programs', secondary:'Ask about enrollment', contact:'/contact?inquiry=enrollment#contact-form' },
        career: { title:'Explore your next career move.', eyebrow:'PLACEMENT & CONSULTING', badge:'TAKE THE NEXT STEP', description:'Discover St. Bernadine’s placement and consulting services. Learn about the process and speak with the placement team about your circumstances and available next steps.', image:'/asset/images/pc.webp', alt:'Healthcare placement and consulting', primary:'Explore placement', href:'/placement', secondary:'Talk to the placement team', contact:'/contact?department=placement#contact-form' },
        care: { title:'Support for someone you love.', eyebrow:'HOME CARE SERVICES', badge:'CARE THAT STARTS WITH YOU', description:'Learn about support at home and the services St. Bernadine offers. Share your care needs with the team so they can discuss suitable support with you.', image:'/asset/images/hcs.jpg', alt:'Home care support', primary:'Explore home care', href:'/home-care', secondary:'Request home care', contact:'/request-care' }
    };
    const choices = [...section.querySelectorAll('[data-path-choice]')].map(link => {
        const button = document.createElement('button');
        button.type = 'button';
        button.dataset.pathChoice = link.dataset.pathChoice;
        button.setAttribute('aria-controls', 'stb-path-result');
        button.setAttribute('aria-pressed', 'false');
        while (link.firstChild) button.appendChild(link.firstChild);
        link.replaceWith(button);
        return button;
    });
    const result = section.querySelector('.stb-path-result-copy');
    choices.forEach(choice => {
        // Native buttons activate on the first tap, Enter or Space. The HTML links
        // remain the no-JavaScript fallback until this enhancement initializes.
        choice.addEventListener('click', event => {
            event.preventDefault();
            const path = paths[choice.dataset.pathChoice];
            choices.forEach(item => item.setAttribute('aria-pressed', String(item === choice)));
            section.querySelector('#stb-path-result-title').textContent = path.title;
            section.querySelector('[data-path-eyebrow]').textContent = path.eyebrow;
            section.querySelector('[data-path-badge]').textContent = path.badge;
            section.querySelector('[data-path-description]').textContent = path.description;
            section.querySelector('.stb-path-photo').removeAttribute('data-default-view');
            const image = section.querySelector('.stb-path-photo img'); image.src = path.image; image.alt = path.alt;
            const primary = section.querySelector('[data-path-primary]'); primary.querySelector('[data-path-primary-label]').textContent = path.primary; primary.href = path.href;
            const secondary = section.querySelector('[data-path-secondary]'); secondary.textContent = path.secondary; secondary.href = path.contact;
            section.querySelector('.stb-path-actions').hidden = false;
            section.querySelector('[data-path-back]').hidden = false;
            result.removeAttribute('data-changed');
            requestAnimationFrame(() => result.setAttribute('data-changed', 'true'));
            if (matchMedia('(max-width:850px)').matches) {
                section.querySelector('.stb-path-result').scrollIntoView({ block:'start', behavior:matchMedia('(prefers-reduced-motion:reduce)').matches ? 'instant' : 'smooth' });
            }
        });
    });
})();
