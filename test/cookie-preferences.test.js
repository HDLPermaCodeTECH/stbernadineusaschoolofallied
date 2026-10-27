const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { KEY, LIFETIME, createPreferences, parsePreferences, readPreferences, savePreferences } = require('../asset/cookie-preferences');
const now = Date.UTC(2026, 9, 27);

test('only the optional map can be enabled; essential services remain active', () => {
    for (const allowed of [true, false]) {
        const choice = createPreferences(allowed, now);
        assert.equal(choice.externalMedia, allowed);
        assert.equal(choice.essential, true);
        assert.equal(choice.analytics, false);
        assert.equal(choice.marketing, false);
        assert.equal(choice.expiresAt - now, 180 * 24 * 60 * 60 * 1000);
        assert.deepEqual(parsePreferences(JSON.stringify(choice), now), choice);
    }
});

test('invalid, unknown-version and legacy choices do not grant map permission', () => {
    for (const raw of [null, '', '{', 'accepted', 'declined', 'true', '{}', JSON.stringify({ ...createPreferences(true, now), version: 2 })]) {
        assert.equal(parsePreferences(raw, now), null);
    }
});

test('expired consent asks again and cannot silently enable optional maps', () => {
    const raw = JSON.stringify(createPreferences(true, now));
    assert.ok(parsePreferences(raw, now + LIFETIME - 1));
    assert.equal(parsePreferences(raw, now + LIFETIME), null);
});

test('future, malformed and extended consent records fail closed', () => {
    const valid = createPreferences(true, now);
    for (const patch of [{ essential: false }, { externalMedia: 'true' }, { analytics: true }, { marketing: true },
        { expiresAt: now + LIFETIME + 1 }, { updatedAt: now + 300001 }, { expiresAt: 'never' }]) {
        assert.equal(parsePreferences(JSON.stringify({ ...valid, ...patch }), now), null);
    }
});

test('blocked storage does not throw or fabricate a saved choice', () => {
    const blocked = { getItem() { throw Error('Blocked'); }, setItem() { throw Error('Blocked'); } };
    assert.equal(readPreferences(blocked, now), null);
    assert.equal(savePreferences(blocked, createPreferences(false, now)), false);
    assert.equal(readPreferences(null, now), null);
});

test('a new explicit choice replaces the old banner marker without treating it as consent', () => {
    const values = new Map([['cookieConsent', 'accepted']]);
    const storage = { getItem: key => values.get(key) || null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) };
    assert.equal(readPreferences(storage, now), null);
    assert.equal(savePreferences(storage, createPreferences(false, now)), true);
    assert.equal(values.has('cookieConsent'), false);
    assert.equal(readPreferences(storage, now).externalMedia, false);
    assert.equal(JSON.parse(values.get(KEY)).essential, true);
});

test('the contact map has no live source before consent, including when scripts fail', () => {
    const html = fs.readFileSync(path.join(__dirname, '../contact.html'), 'utf8');
    const frame = html.match(/<iframe[\s\S]*?<\/iframe>/)[0];
    assert.match(frame, /\bhidden\b/);
    assert.match(frame, /data-consent-src="https:\/\/www\.google\.com\/maps\/embed/);
    assert.doesNotMatch(frame, /\s+src\s*=/);
    assert.match(html, /Choose map preferences/);
    assert.match(html, /Open directions in Google Maps/);
});

test('all shared public pages load privacy controls and provide a footer preferences link', () => {
    const root = path.join(__dirname, '..');
    const candidates = [...fs.readdirSync(root).filter(name => name.endsWith('.html')),
        'about-us/index.html', 'school-of-allied-health-services/index.html'];
    let pages = 0;
    for (const file of candidates) {
        const html = fs.readFileSync(path.join(root, file), 'utf8');
        if (!html.includes('/asset/modern-ui.css?')) continue;
        pages++;
        assert.match(html, /cookie-preferences\.js\?v=20261027-privacy1" defer/, file);
        assert.match(html, /cookie-preferences\.css\?v=20261027-privacy1/, file);
        assert.match(html, /<a href="\/privacy#cookies" data-cookie-settings>Cookie Settings<\/a>/, file);
    }
    assert.equal(pages, 31);
});
