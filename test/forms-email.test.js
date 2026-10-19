const test = require('node:test');
const assert = require('node:assert/strict');
const Module = require('node:module');

const messages = [];
let failNext = false;
let rejectNext = false;
const transport = {
    verify: async () => true,
    sendMail: async options => {
        if (failNext) {
            failNext = false;
            throw Object.assign(new Error('Test authentication rejection'), { code: 'EAUTH', responseCode: 535 });
        }
        messages.push(options);
        if (rejectNext) {
            rejectNext = false;
            return { accepted: [], rejected: [options.to], messageId: 'test-rejected' };
        }
        return { accepted: [options.to], rejected: [], messageId: 'test-message' };
    }
};
const originalLoad = Module._load;
Module._load = function (name, ...args) {
    if (name === 'nodemailer') return { createTransport: () => transport };
    return originalLoad.call(this, name, ...args);
};
process.env.EMAIL_USER = 'school@stbernadineusa.com';
process.env.EMAIL_PASS = 'test-only-placeholder';
process.env.GEMINI_API_KEY = '';
const app = require('../server');
const { createFormTransport } = require('../form_mail');
Module._load = originalLoad;
app.set('trust proxy', 'loopback');
let server;
let base;
let visitor = 1;

test.before(async () => {
    server = await new Promise(resolve => {
        const instance = app.listen(0, '127.0.0.1', () => resolve(instance));
    });
    base = `http://127.0.0.1:${server.address().port}`;
});
test.after(() => new Promise(resolve => server.close(resolve)));

async function submit(route, data, multipart = false) {
    const headers = { 'X-Forwarded-For': `203.0.113.${visitor++}` };
    let body;
    if (multipart) {
        body = new FormData();
        for (const [key, value] of Object.entries(data)) body.append(key, value);
        if (route === '/apply-job') body.append('resume', new Blob(['%PDF-1.4 test fixture'], { type: 'application/pdf' }), 'test-resume.pdf');
    } else {
        headers['Content-Type'] = 'application/json';
        body = JSON.stringify(data);
    }
    const start = messages.length;
    const response = await fetch(base + route, { method: 'POST', headers, body });
    return { response, messages: messages.slice(start) };
}

const routes = [
    ['/send-email', { firstName: 'Test', lastName: 'Student', email: 'visitor@example.invalid', Program: 'CNA' }, true],
    ['/send-contact', { name: 'Test Inquiry', email: 'visitor@example.invalid', subject: 'Routing test', message: 'No real submission' }],
    ['/request-care', { firstName: 'Test', lastName: 'Care', contactEmail: 'visitor@example.invalid', contactPhone: '+12015550123', careType: 'Personal Care' }],
    ['/apply-job', { firstName: 'Test', lastName: 'Applicant', contactEmail: 'visitor@example.invalid', contactPhone: '+12015550123', position: 'Test Position', startDate: '2026-11-01', AppMethod: 'upload' }, true],
    ['/send-referral', { referrer_name: 'Test Referrer', referrer_email: 'visitor@example.invalid', referrer_phone: '+12015550123', applicant_name: 'Test Applicant', applicant_phone: '+12015550124', refer_program: 'Home Care Services' }],
    ['/subscribe', { email: 'visitor@example.invalid', source_page: '/blog' }]
];
routes.splice(2, 0, ['/send-placement', routes[1][1]]);
const expectedRecipients = {
    '/send-email': 'school@stbernadineusa.com',
    '/send-contact': 'info@stbernadineusa.com',
    '/send-placement': 'placement@stbernadineusa.com',
    '/request-care': 'care@stbernadineusa.com',
    '/apply-job': 'apply@stbernadineusa.com',
    '/send-referral': 'info@stbernadineusa.com',
    '/subscribe': 'info@stbernadineusa.com'
};
for (const [route, data, multipart] of routes) {
    test(`${route} sends to the requested department inbox`, async () => {
        const result = await submit(route, data, multipart);
        assert.equal(result.response.status, 200, await result.response.text());
        const admin = result.messages[0];
        assert.equal(admin.to, expectedRecipients[route]);
        assert.equal(admin.cc, undefined);
        assert.equal(admin.bcc, undefined);
        assert.equal(admin.replyTo, 'visitor@example.invalid');
        if (result.messages.length > 1) assert.equal(result.messages[1].replyTo, expectedRecipients[route]);
    });
}
test('SMTP authentication rejection never produces a success response', async () => {
    failNext = true;
    const result = await submit('/send-referral', routes.find(row => row[0] === '/send-referral')[1]);
    assert.equal(result.response.status, 503);
    assert.equal(result.messages.length, 0);
});
test('SMTP recipient rejection never produces a success response', async () => {
    rejectNext = true;
    const result = await submit('/subscribe', routes.find(row => row[0] === '/subscribe')[1]);
    assert.equal(result.response.status, 503);
});
test('Invalid referral and subscription data are rejected before sending', async () => {
    for (const route of ['/send-referral', '/subscribe']) {
        const result = await submit(route, { email: 'invalid' });
        assert.equal(result.response.status, 400);
        assert.equal(result.messages.length, 0);
    }
});
test('SMTP credentials are required with no embedded password fallback', () => {
    assert.throws(() => createFormTransport({}), { code: 'SMTP_NOT_CONFIGURED' });
    assert.throws(() => createFormTransport({ EMAIL_USER: 'school@stbernadineusa.com', EMAIL_PASS: 'test', EMAIL_PORT: '25' }), { code: 'SMTP_NOT_CONFIGURED' });
});
