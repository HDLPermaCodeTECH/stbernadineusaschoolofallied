const test = require('node:test');
const assert = require('node:assert/strict');
const { eligible, suppressed, remember, KEY, DAY, WAIT, REVIEW_URL } = require('../asset/google-reviews');

const ready = { path: '/', elapsed: WAIT, scroll: .4, visible: true, interacting: false, obstructed: false, dismissed: false };
test('review invitation waits until engaged homepage browsing and does not interrupt forms or overlays', () => {
    assert.equal(eligible(ready), true);
    for (const path of ['/contact', '/inquiry', '/apply', '/enrollment', '/referral', '/updates', '/request-care']) {
        assert.equal(eligible({ ...ready, path }), false, path);
    }
    for (const change of [{ elapsed: WAIT - 1 }, { scroll: .34 }, { visible: false }, { interacting: true }, { obstructed: true }, { dismissed: true }]) {
        assert.equal(eligible({ ...ready, ...change }), false);
    }
});
test('dismissal expires after seven days and visiting Google suppresses repeat invitations for ninety days', () => {
    const values = new Map();
    const storage = { getItem: key => values.get(key) || null, setItem: (key, value) => values.set(key, value) };
    const now = Date.UTC(2026, 10, 19);
    for (const days of [7, 90]) {
        remember(storage, days, now);
        assert.equal(suppressed(storage, now), true);
        assert.equal(suppressed(storage, now + days * DAY - 1), true);
        assert.equal(suppressed(storage, now + days * DAY), false);
    }
    values.set(KEY, JSON.stringify({ version: 1, until: now + 91 * DAY }));
    assert.equal(suppressed(storage, now), false);
    values.set(KEY, '{invalid');
    assert.equal(suppressed(storage, now), false);
});
test('blocked storage cannot break the website and the review link targets the verified business', () => {
    const blocked = { getItem() { throw Error('denied'); }, setItem() { throw Error('denied'); } };
    assert.equal(suppressed(blocked), false);
    assert.doesNotThrow(() => remember(blocked, 7));
    const url = new URL(REVIEW_URL);
    assert.equal(url.origin, 'https://search.google.com');
    assert.equal(url.searchParams.get('placeid'), 'ChIJo_14zDBXwokRlXeePPByrto');
});
