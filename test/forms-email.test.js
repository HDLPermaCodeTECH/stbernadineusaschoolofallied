const test = require('node:test');
const assert = require('node:assert/strict');
const Module = require('node:module');

const messages = [];
let failNext = false;
let rejectNext = false;
let failConfirmation = false;
const transport = {
    verify: async () => true,
    sendMail: async options => {
        if (failConfirmation && options.to === 'visitor@example.invalid') {
            throw Object.assign(new Error('Private SMTP diagnostic must not reach visitors'), { code: 'ECONNECTION' });
        }
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
process.env.SITE_MAINTENANCE = 'off';
process.env.NODE_ENV = 'test';
const app = require('../server');
const { createFormTransport } = require('../form_mail');
Module._load = originalLoad;
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
    ['/apply-job', { firstName: 'Test', lastName: 'Applicant', contactEmail: 'visitor@example.invalid', contactPhone: '+12015550123', position: 'Test Position', startDate: '2026-11-01', AppMethod: 'upload', BackgroundConsent: 'on', Truthfulness: 'on' }, true],
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

test('Every form fails safely when its department email is not accepted', async () => {
    for (const [route, data, multipart] of routes) {
        failNext = true;
        const result = await submit(route, data, multipart);
        assert.equal(result.response.status, 503, route);
        assert.equal(result.messages.length, 0, route);
        const body = await result.response.text();
        assert.doesNotMatch(body, /EAUTH|535|authentication|test-message/i);
    }
});

test('Confirmation failure preserves the accepted department submission', async () => {
    failConfirmation = true;
    try {
        for (const [route, data, multipart] of routes.slice(0, 5)) {
            const result = await submit(route, data, multipart);
            assert.equal(result.response.status, 200, route);
            assert.equal(result.messages.length, 1, route);
            assert.equal(result.messages[0].to, expectedRecipients[route]);
            const body = await result.response.json();
            assert.equal(body.confirmationSent, false);
            assert.match(body.message, /do not resubmit/);
            assert.doesNotMatch(body.message, /Private SMTP diagnostic/);
        }
    } finally { failConfirmation = false; }
});

test('Email aliases remain unchanged in Reply-To and confirmation addresses', async () => {
    const email = 'first.last+admissions@gmail.com';
    const result = await submit('/send-contact', { name: 'Alias Test', email, subject: 'Alias check', message: 'Test only' });
    assert.equal(result.response.status, 200);
    assert.equal(result.messages[0].replyTo, email);
    assert.equal(result.messages[1].to, email);
});

test('The public Care Request field names send patient and contact details to the care team', async () => {
    const result = await submit('/request-care', {
        patientFirstName: 'Test', patientLastName: 'Patient', patientAge: '72',
        serviceLocation: 'Test Service Location', contactName: 'Test Contact', relationship: 'Family',
        contactPhone: '+12015550123', contactEmail: 'visitor@example.invalid',
        careType: 'Hourly Care', startDate: '2026-11-01', careDetails: '<script>test</script>'
    });
    assert.equal(result.response.status, 200, await result.response.text());
    assert.equal(result.messages[0].to, 'care@stbernadineusa.com');
    for (const value of ['Test Patient', 'Test Service Location', 'Test Contact', 'Family', '72']) assert.ok(result.messages[0].html.includes(value));
    assert.doesNotMatch(result.messages[0].html, /<script>test<\/script>/);
});

test('Job resume uploads accept the advertised formats and reject unsupported files', async () => {
    const data = routes.find(row => row[0] === '/apply-job')[1];
    for (const [extension, mimeType, expected] of [
        ['pdf', 'application/pdf', 200],
        ['doc', 'application/msword', 200],
        ['docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 200],
        ['exe', 'application/x-msdownload', 400]
    ]) {
        const form = new FormData();
        for (const [key, value] of Object.entries(data)) form.append(key, value);
        form.append('resume', new Blob(['Local file type fixture'], { type: mimeType }), `format-fixture.${extension}`);
        const before = messages.length;
        const response = await fetch(base + '/apply-job', { method: 'POST', headers: { 'X-Forwarded-For': `203.0.113.${visitor++}` }, body: form });
        assert.equal(response.status, expected, extension);
        if (expected === 200) assert.equal(messages[before].to, 'apply@stbernadineusa.com');
        else { assert.equal(messages.length, before); assert.match((await response.json()).error, /PDF, DOC or DOCX/); }
    }
});

test('Job declarations must be confirmed before sending an application', async () => {
    const data = { ...routes.find(row => row[0] === '/apply-job')[1] };
    delete data.BackgroundConsent;
    const result = await submit('/apply-job', data, true);
    assert.equal(result.response.status, 400);
    assert.equal(result.messages.length, 0);
});

test('Source files, encoded source paths and applicant uploads cannot be downloaded', async () => {
    for (const route of ['/server.js', '/server%2Ejs', '/form_mail.js', '/maintenance.js', '/test/forms-email.test.js', '/uploads/test.pdf', '/.env', '/stbernadine_manual_deploy.zip']) {
        const response = await fetch(base + route);
        assert.equal(response.status, 403, route);
    }
    const response = await fetch(base + '/asset/script.js');
    assert.equal(response.status, 200);
});

test('Local reverse proxy clients are limited separately with readable JSON errors', async () => {
    const data = { email: 'not-an-email' };
    for (let i = 0; i < 6; i++) {
        const response = await fetch(base + '/apply-job', { headers: { 'X-Forwarded-For': '203.0.113.240' } });
        assert.equal(response.status, 200, 'Opening a form must not consume a submission attempt');
        await response.text();
    }
    for (let i = 0; i < 6; i++) {
        const response = await fetch(base + '/subscribe', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': '203.0.113.240' }, body: JSON.stringify(data) });
        assert.equal(response.status, i < 5 ? 400 : 429);
        if (i === 5) assert.match((await response.json()).error, /Too many submissions/);
    }
    const result = await submit('/subscribe', data);
    assert.equal(result.response.status, 400);
    assert.equal(app.get('trust proxy'), 'loopback');
});

test('Temporary applicant files are cleaned up after rejected and invalid submissions', async () => {
    const fs = require('node:fs/promises');
    for (const scenario of ['invalid', 'rejected']) {
        const suffix = `cleanup-fixture-${scenario}-${Date.now()}.pdf`;
        const upload = new FormData();
        upload.append('resume', new Blob(['%PDF-1.4 test fixture'], { type: 'application/pdf' }), suffix);
        if (scenario === 'rejected') {
            for (const [key, value] of Object.entries(routes.find(row => row[0] === '/apply-job')[1])) upload.append(key, value);
            failNext = true;
        }
        const response = await fetch(base + '/apply-job', { method: 'POST', headers: { 'X-Forwarded-For': `203.0.113.${visitor++}` }, body: upload });
        assert.equal(response.status, scenario === 'invalid' ? 400 : 503);
        let leftovers;
        for (let i = 0; i < 20; i++) {
            leftovers = (await fs.readdir('uploads')).filter(name => name.endsWith(suffix));
            if (!leftovers.length) break;
            await new Promise(resolve => setTimeout(resolve, 25));
        }
        assert.equal(leftovers.length, 0, 'Temporary application upload was not deleted');
    }
});

test('The deployed default keeps pages and form endpoints in HTTP 503 maintenance', () => {
    const { execFileSync } = require('node:child_process');
    const script = `
        const assert = require('node:assert/strict');
        const app = require('./server');
        const server = app.listen(0, '127.0.0.1', async () => {
            try {
                for (const [method, route] of [['GET','/'],['GET','/contact'],['POST','/send-referral'],['HEAD','/']]) {
                    const response = await fetch('http://127.0.0.1:' + server.address().port + route, { method });
                    assert.equal(response.status, 503);
                    assert.equal(response.headers.get('retry-after'), '3600');
                    assert.match(response.headers.get('cache-control'), /no-store/);
                }
                console.log('MAINTENANCE_OK');
            } catch(error) { console.error(error.message); process.exitCode=1; }
            finally { server.close(); }
        });`;
    const output = execFileSync(process.execPath, ['-e', script], { cwd: process.cwd(), env: { ...process.env, SITE_MAINTENANCE: 'on' }, encoding: 'utf8', timeout: 20000 });
    assert.match(output, /MAINTENANCE_OK/);
});
