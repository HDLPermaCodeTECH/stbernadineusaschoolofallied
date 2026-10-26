'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { TEAMS, buildAcknowledgement, buildUpdateEmail, buildBrandedEmail, UPDATE_RECIPIENTS } = require('../email_templates');

test('Every form and direct acknowledgement renders the supplied brand without template placeholders', () => {
    for (const kind of Object.keys(TEAMS)) for (const mode of ['form', 'direct']) {
        const message = buildAcknowledgement(kind, mode);
        assert.doesNotMatch(message.html, /{{|undefined|you subscribed|unsubscribe/i);
        assert.match(message.html, /People Helping People/);
        assert.match(message.html, /COMPASSION • COMPETENCE • COMMITMENT/);
        assert.match(message.html, /st-bernadine-email-logo-20261026\.png/);
        assert.equal(message.replyTo, TEAMS[kind].inbox);
        assert.ok(message.text.includes('\n\n'));
        assert.match(message.html, /automated acknowledgement because you contacted/);
    }
});

test('Operational updates use the same brand and four recipients without a personal greeting or subscription claim', () => {
    const message = buildUpdateEmail({ subject: 'Website release', title: 'Website Update Released', bodyHtml: '<p>Approved update content.</p>', bodyText: 'Approved update content.' });
    assert.deepEqual(message.to, [...UPDATE_RECIPIENTS]);
    assert.equal(message.to.length, 4);
    assert.ok(message.to.includes('lsamin.sbsah@gmail.com'));
    assert.match(message.html, /operational website update/);
    assert.doesNotMatch(message.html, /Good day!|Hello|Dear|you subscribed|unsubscribe/i);
    assert.match(message.html, /People Helping People/);
});

test('Dynamic text is escaped, unused blocks are omitted and unsafe links are rejected', () => {
    const message = buildBrandedEmail({ subject: '<Unsafe>', title: '<script>example</script>', bodyHtml: '<p>Trusted content.</p>' });
    assert.match(message.html, /&lt;script&gt;example&lt;\/script&gt;/);
    assert.doesNotMatch(message.html, /<script>|{{|featured_image|undefined/);
    assert.throws(() => buildBrandedEmail({ title: 'Test', ctaUrl: 'javascript:alert(1)' }), /HTTPS/);
});
