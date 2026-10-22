'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const nodemailer = require('nodemailer');
const proxyaddr = require('proxy-addr');
const { buildAcknowledgement } = require('../email_templates');

test('Country flag CSS embeds the unchanged full-size and retina sprites', () => {
    const vendor = path.join(__dirname, '../asset/vendor/intl-tel-input');
    const css = fs.readFileSync(path.join(vendor, 'css/intlTelInput.css'), 'utf8');
    const sources = [...css.matchAll(/url\("data:image\/png;base64,([A-Za-z0-9+/=]+)"\)/g)];
    assert.equal(sources.length, 2);
    for (const [index, name] of ['flags.png', 'flags@2x.png'].entries()) {
        const embedded = Buffer.from(sources[index][1], 'base64');
        assert.deepEqual(embedded, fs.readFileSync(path.join(vendor, 'img', name)));
        assert.equal(embedded.readUInt32BE(16), index === 0 ? 5762 : 11524);
        assert.equal(embedded.readUInt32BE(20), index === 0 ? 15 : 30);
    }
    assert.doesNotMatch(css, /url\(["']?\.\.\/img\/flags/);
});

test('All seven phone-entry pages request the new flag stylesheet', () => {
    for (const name of ['contact', 'inquiry', 'home-care-inquiry', 'request-care', 'apply-job', 'apply', 'referral']) {
        const html = fs.readFileSync(path.join(__dirname, '..', name + '.html'), 'utf8');
        assert.match(html, /intlTelInput\.css\?v=20261022-flags1/);
    }
});

test('Proxy trust rejects external clients and malformed mapped subnet broad matches', () => {
    const loopback = proxyaddr.compile('loopback');
    assert.equal(loopback('127.0.0.1'), true);
    assert.equal(loopback('::1'), true);
    assert.equal(loopback('203.0.113.20'), false);
    const mapped = proxyaddr.compile('::ffff:10.0.0.0/8');
    assert.equal(mapped('203.0.113.20'), false);
});

test('Upgraded Nodemailer generates complete branded MIME with attachment without sending', async () => {
    const transport = nodemailer.createTransport({ streamTransport: true, buffer: true, newline: 'windows' });
    try {
        const email = buildAcknowledgement('ENROLLMENT');
        const info = await transport.sendMail({
            from: { name: email.displayName, address: 'sender@example.invalid' },
            to: 'recipient@example.invalid', replyTo: email.replyTo,
            subject: email.subject, html: email.html, text: email.text,
            attachments: [{ filename: 'test.txt', content: 'local MIME test only' }]
        });
        assert.deepEqual(info.envelope.to, ['recipient@example.invalid']);
        const mime = info.message.toString();
        assert.match(mime, /Content-Type: multipart\/mixed/);
        assert.match(mime, /Content-Type: text\/html/);
        assert.match(mime, /Content-Type: text\/plain/);
        assert.match(mime, /filename=test.txt/);
        assert.match(mime, /Reply-To: school@stbernadineusa.com/);
    } finally { transport.close(); }
});
