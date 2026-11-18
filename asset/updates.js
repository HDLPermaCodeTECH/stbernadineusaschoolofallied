'use strict';
(() => {
    const cards = [...document.querySelectorAll('.update-card')];
    const search = document.getElementById('report-search');
    const filters = [...document.querySelectorAll('[data-filter]')];
    const count = document.getElementById('results-count');
    const clear = document.getElementById('clear-search');
    const empty = document.getElementById('empty-state');
    let topic = 'all';
    const searchable = new Map(cards.map(card => [card, card.textContent.toLocaleLowerCase()]));
    function applyFilters() {
        const query = search.value.trim().toLocaleLowerCase();
        let visible = 0;
        for (const card of cards) {
            card.hidden = !((topic === 'all' || card.dataset.category === topic) && searchable.get(card).includes(query));
            if (!card.hidden) visible++;
        }
        for (const button of filters) button.setAttribute('aria-pressed', String(button.dataset.filter === topic));
        clear.hidden = !search.value;
        empty.hidden = visible !== 0;
        count.textContent = visible === cards.length ? `Showing all ${visible} reports · Newest first` : `${visible} matching ${visible === 1 ? 'report' : 'reports'} · Newest first`;
    }
    function reset() { search.value = ''; topic = 'all'; applyFilters(); }
    search.addEventListener('input', applyFilters);
    document.querySelector('.archive-controls').addEventListener('submit', event => event.preventDefault());
    clear.addEventListener('click', () => { search.value = ''; applyFilters(); search.focus(); });
    document.getElementById('reset-filters').addEventListener('click', () => { reset(); search.focus(); });
    for (const button of filters) button.addEventListener('click', () => { topic = button.dataset.filter; applyFilters(); });
    function openLinkedReport() {
        let id;
        try { id = decodeURIComponent(location.hash.slice(1)); } catch { return; }
        const card = cards.find(item => item.id === id);
        if (!card) return;
        if (card.hidden) reset();
        card.querySelector('details').open = true;
        requestAnimationFrame(() => card.scrollIntoView({ block: 'start', behavior: 'auto' }));
    }
    window.addEventListener('hashchange', openLinkedReport);
    openLinkedReport();
    let noticeTimer;
    const notice = document.getElementById('copy-status');
    for (const button of document.querySelectorAll('.copy-link')) button.addEventListener('click', async () => {
        const link = 'https://stbernadineusa.com/updates#' + encodeURIComponent(button.dataset.reportId);
        try {
            await navigator.clipboard.writeText(link);
            notice.textContent = 'Report link copied';
        } catch {
            // A selectable link remains useful when clipboard permission is unavailable.
            let field = button.parentElement.querySelector('input');
            if (!field) {
                field = document.createElement('input');
                field.readOnly = true;
                field.setAttribute('aria-label', 'Report link. Select and copy this address.');
                field.style.cssText = 'width:100%;min-width:0;padding:10px;border:1px solid #a0b69f;border-radius:8px;font-size:12px;';
                button.parentElement.appendChild(field);
                button.parentElement.style.flexWrap = 'wrap';
            }
            field.value = link;
            field.focus(); field.select();
            notice.textContent = 'Select and copy the report link';
        }
        clearTimeout(noticeTimer);
        noticeTimer = setTimeout(() => { notice.textContent = ''; }, 4000);
    });
})();
