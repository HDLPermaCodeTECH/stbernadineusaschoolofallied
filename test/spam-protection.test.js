'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const { createFormProtection, assessSolicitation, submissionContext, ACTION } = require('../spam_protection');

async function fixture(t, env = { TURNSTILE_SITE_KEY: 'production-site', TURNSTILE_SECRET_KEY: 'private-fixture-secret' }) {
    let clock = Date.now();
    let result = { success: true, hostname: 'stbernadineusa.com', action: ACTION };
    let verifies = 0;
    let mailAccepted = true;
    const logs = [];
    const protection = createFormProtection({ env, now: () => clock, log: (...args) => logs.push(args), fetchImpl: async (_, options) => {
        verifies++;
        assert.equal(JSON.parse(options.body).secret, env.TURNSTILE_SECRET_KEY);
        if (result instanceof Error) throw result;
        return Response.json(result);
    } });
    const app = express();
    app.use(express.json());
    app.get('/config', protection.config);
    app.post('/submit', protection.guard, (req, res) => res.status(mailAccepted ? 200 : 503).json({ review: submissionContext.getStore().review }));
    const server = await new Promise(resolve => { const s = app.listen(0, '127.0.0.1', () => resolve(s)); });
    t.after(() => new Promise(resolve => server.close(resolve)));
    const base = 'http://127.0.0.1:' + server.address().port;
    const configResponse = await fetch(base + '/config');
    const config = await configResponse.json();
    const body = { name: 'Fixture', message: 'Interested in enrolling in CNA', stb_website: '', stb_form_ticket: config.ticket, 'cf-turnstile-response': 'valid-fixture-token' };
    const submit = (data = body) => fetch(base + '/submit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    return { config, configResponse, body, submit, logs, verifies: () => verifies, result: value => result = value, advance: ms => clock += ms, mail: value => mailAccepted = value };
}

test('Configuration is no-store, exposes no secret and fails closed without production keys', async t => {
    const f = await fixture(t);
    assert.match(f.configResponse.headers.get('cache-control'), /no-store/);
    assert.equal(f.config.siteKey, 'production-site');
    assert.ok(f.config.ticket);
    assert.doesNotMatch(JSON.stringify(f.config), /private-fixture-secret/);
    for (const env of [{}, { TURNSTILE_SITE_KEY: '1x00000000000000000000AA', TURNSTILE_SECRET_KEY: '1x0000000000000000000000000000000AA' }]) {
        const unavailable = await fixture(t, env);
        assert.equal(unavailable.configResponse.status, 503);
        assert.equal((await unavailable.submit()).status, 503);
        assert.equal(unavailable.verifies(), 0);
    }
});

test('Honeypot, missing tokens, tampered tickets and expired forms cannot reach verification', async t => {
    const f = await fixture(t);
    for (const patch of [{ stb_website: 'bot-filled' }, { 'cf-turnstile-response': '' }, { stb_form_ticket: f.body.stb_form_ticket + 'x' }, { 'cf-turnstile-response': 'x'.repeat(2049) }]) {
        assert.equal((await f.submit({ ...f.body, ...patch })).status, 400);
    }
    f.advance(2 * 60 * 60 * 1000);
    assert.equal((await f.submit()).status, 400);
    assert.equal(f.verifies(), 0);
});

test('Cloudflare rejects expired/replayed tokens, wrong hostnames and wrong actions', async t => {
    const f = await fixture(t);
    for (const result of [
        { success: false, 'error-codes': ['timeout-or-duplicate'] },
        { success: true, hostname: 'attacker.invalid', action: ACTION },
        { success: true, hostname: 'stbernadineusa.com', action: 'other-form' }
    ]) {
        f.result(result);
        assert.equal((await f.submit()).status, 400);
    }
    f.result(new Error('service unavailable'));
    assert.equal((await f.submit()).status, 503);
});

test('Duplicate requests are rejected while unsuccessful delivery can be retried', async t => {
    const f = await fixture(t);
    f.mail(false);
    assert.equal((await f.submit()).status, 503);
    f.mail(true);
    assert.equal((await f.submit()).status, 200);
    assert.equal((await f.submit()).status, 409);
    f.advance(10 * 60 * 1000 + 1);
    assert.equal((await f.submit()).status, 200);
});

test('Review keeps the message available without leaking message content into logs', async t => {
    const f = await fixture(t);
    const response = await f.submit({ ...f.body, message: 'We offer SEO services and website redesign. Private visitor details.' });
    assert.equal(response.status, 200);
    assert.equal((await response.json()).review, true);
    assert.doesNotMatch(JSON.stringify(f.logs), /Private visitor|Fixture|valid-fixture-token|private-fixture-secret/);
});

test('Service, care, enrollment and job inquiries are not flagged by generic words alone', () => {
    for (const message of [
        'What services do you offer? I need home care for my mother.',
        'I am applying for a nursing job; my previous job included digital marketing.',
        'The website design is confusing. Please help me find the enrollment form.',
        'I need tuition details and information about your CNA program.',
        'Our agency provides licensed home care nurses. Do you have a placement vacancy?'
    ]) assert.equal(assessSolicitation({ message }).review, false, message);
    assert.equal(assessSolicitation({ message: 'We offer SEO and backlink packages.' }).review, true);
    assert.equal(assessSolicitation({ message: 'Guest post opportunity: https://a.invalid https://b.invalid https://c.invalid' }).review, true);
});
