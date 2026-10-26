const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const { createChatHandler } = require('../chat_service');

async function withChat(model, run, options = {}) {
    const app = express();
    const logs = [];
    app.use(express.json());
    app.post('/chat', createChatHandler(model, { logger: { warn: (...args) => logs.push(args) }, ...options }));
    const server = await new Promise(resolve => { const instance = app.listen(0, '127.0.0.1', () => resolve(instance)); });
    const send = () => fetch(`http://127.0.0.1:${server.address().port}/chat`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: 'A visitor question' })
    });
    try { await run(send, logs); }
    finally { await new Promise(resolve => server.close(resolve)); }
}

test('AI returns a generated answer and disables response caching', () => withChat({ startChat: () => ({ sendMessage: async () => ({ response: { text: () => 'A useful answer.' } }) }) }, async send => {
    const response = await send();
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('cache-control'), 'no-store');
    assert.deepEqual(await response.json(), { response: 'A useful answer.' });
}));

test('missing AI configuration gives a useful temporary-unavailable response', () => withChat(null, async send => {
    const response = await send();
    assert.equal(response.status, 503);
    assert.match((await response.json()).error, /programs, tuition, location/);
}));

test('invalid credentials do not leak provider diagnostics and are not repeatedly retried', async () => {
    let calls = 0;
    const model = { startChat: () => ({ sendMessage: async () => { calls++; throw Object.assign(new Error('secret-key-and-private-provider-url'), { status: 400 }); } }) };
    await withChat(model, async (send, logs) => {
        for (let i = 0; i < 2; i++) {
            const response = await send();
            assert.equal(response.status, 503);
            assert.doesNotMatch(await response.text(), /secret|private|provider-url/);
        }
        assert.equal(calls, 1);
        assert.doesNotMatch(JSON.stringify(logs), /secret-key|private-provider/);
    });
});

test('provider quota failure returns a retry hint without a server error', () => withChat({ startChat: () => { throw Object.assign(new Error('Private quota details'), { status: 429 }); } }, async send => {
    const response = await send();
    assert.equal(response.status, 429);
    assert.equal(response.headers.get('retry-after'), '60');
    assert.doesNotMatch(await response.text(), /Private quota/);
}));

test('a stalled AI request finishes with a safe response within the deadline', () => withChat({ startChat: () => ({ sendMessage: () => new Promise(() => {}) }) }, async send => {
    const response = await send();
    assert.equal(response.status, 503);
    assert.equal((await response.json()).code, 'AI_UNAVAILABLE');
}, { timeoutMs: 15 }));

test('empty or blocked model output becomes a safe unavailable response', () => withChat({ startChat: () => ({ sendMessage: async () => ({ response: { text: () => '' } }) }) }, async send => {
    const response = await send();
    assert.equal(response.status, 503);
    assert.match((await response.json()).error, /contact our team/);
}));

test('a temporary provider failure can recover on the next request', async () => {
    let calls = 0;
    await withChat({ startChat: () => ({ sendMessage: async () => {
        if (!calls++) throw Object.assign(new Error('Temporary'), { status: 503 });
        return { response: { text: () => 'Recovered.' } };
    } }) }, async send => {
        assert.equal((await send()).status, 503);
        const recovered = await send();
        assert.equal(recovered.status, 200);
        assert.equal((await recovered.json()).response, 'Recovered.');
    });
});
