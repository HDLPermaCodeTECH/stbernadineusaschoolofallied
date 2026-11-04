const test = require('node:test');
const assert = require('node:assert/strict');
const Module = require('node:module');
const uploadFixtures = require('./upload-fixtures');

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
process.env.TURNSTILE_SITE_KEY = 'local-test-site';
process.env.TURNSTILE_SECRET_KEY = 'local-test-secret';
const nativeFetch = global.fetch;
let tokenSequence = 0;
// Exercise the real guard and signed ticket; only Cloudflare and SMTP are mocked.
global.fetch = async (url, options = {}) => {
    if (String(url) === 'https://challenges.cloudflare.com/turnstile/v0/siteverify') {
        return Response.json({ success: true, hostname: 'stbernadineusa.com', action: 'stb_public_form' });
    }
    if (options.method === 'POST' && /^http:\/\/127\.0\.0\.1:\d+\/(send-|request-care|apply-job|subscribe)/.test(String(url))) {
        const origin = new URL(url).origin;
        const config = await (await nativeFetch(origin + '/api/form-protection')).json();
        const protection = { stb_website: '', stb_form_ticket: config.ticket, 'cf-turnstile-response': 'fixture-' + ++tokenSequence };
        if (options.body instanceof FormData) {
            for (const [key, value] of Object.entries(protection)) options.body.set(key, value);
        } else options = { ...options, body: JSON.stringify({ ...JSON.parse(options.body), ...protection }) };
    }
    return nativeFetch(url, options);
};
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
test.after(() => new Promise(resolve => server.close(() => { global.fetch = nativeFetch; resolve(); })));

async function submit(route, data, multipart = false) {
    const headers = { 'X-Forwarded-For': `203.0.113.${visitor++}` };
    let body;
    if (multipart) {
        body = new FormData();
        for (const [key, value] of Object.entries(data)) body.append(key, value);
        if (route === '/apply-job') body.append('resume', new Blob(['%PDF-1.4 test fixture'], { type: 'application/pdf' }), 'test-resume.pdf');
        if (route === '/apply-job' && data.AppMethod === 'manual') body.append('applicantPhoto',new Blob([uploadFixtures.png],{type:'image/png'}),'test-photo.png');
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
        assert.equal(result.messages.length, 2, 'Every form must acknowledge its sender');
        const confirmation = result.messages[1];
        assert.equal(confirmation.to, 'visitor@example.invalid');
        assert.equal(confirmation.replyTo, expectedRecipients[route]);
        assert.equal(confirmation.headers['Auto-Submitted'], 'auto-replied');
        assert.equal(admin.headers['Auto-Submitted'], 'auto-generated');
        assert.equal(admin.headers['X-Auto-Response-Suppress'], 'All');
        assert.ok(confirmation.text.includes(expectedRecipients[route]));
        assert.match(confirmation.html, /What happens next\?/);
        assert.doesNotMatch(confirmation.html, /<script|<form/i);
        assert.match(confirmation.html, /src="https:\/\/stbernadineusa.com\/asset\/images\/st-bernadine-email-logo-20261026.png"/);
        assert.match(confirmation.html, /#1F4D1F/);
        assert.match(confirmation.html, /#9C0A0A/);
    });
}
test('All inquiry categories appear in notification subjects and both body formats with existing routing', async () => {
    for (const [inquiry_type, label] of Object.entries({ enrollment: 'Enrollment / Training', placement: 'Job Placement', care: 'Home Care Services', partnership: 'Business Partnership', other: 'Other Concern' })) {
        const result = await submit('/send-contact', { ...routes[1][1], inquiry_type });
        assert.equal(result.response.status, 200, await result.response.text());
        assert.equal(result.messages.length, 2);
        assert.equal(result.messages[0].to, 'info@stbernadineusa.com');
        assert.ok(result.messages[0].subject.includes(`[${label}]`));
        assert.ok(result.messages[0].html.includes(label));
        assert.ok(result.messages[0].text.includes(`Type of Inquiry: ${label}`));
        assert.equal(result.messages[0].replyTo, 'visitor@example.invalid');
    }
    const placement = await submit('/send-placement', { ...routes[1][1], inquiry_type: 'placement' });
    assert.equal(placement.response.status, 200);
    assert.equal(placement.messages[0].to, 'placement@stbernadineusa.com');
    assert.ok(placement.messages[0].subject.includes('[Job Placement]'));
    assert.equal(placement.messages[1].replyTo, 'placement@stbernadineusa.com');
});

test('Invalid inquiry categories cannot send notification or acknowledgement emails', async () => {
    for (const inquiry_type of ['', 'unknown', '<script>alert(1)</script>', 'care\r\nBcc: attacker@example.invalid', ['care'], { type: 'care' }, null]) {
        const result = await submit('/send-contact', { ...routes[1][1], inquiry_type });
        assert.equal(result.response.status, 400);
        assert.equal(result.messages.length, 0);
    }
});

test('Contact validation reports the affected fields without sending invalid submissions', async () => {
    for (const route of ['/send-contact', '/send-placement']) {
        const result = await submit(route, { ...routes[1][1], name: ' ', email: 'bad-address', contact_number: 'not-a-phone', subject: ' ', message: ' ' });
        assert.equal(result.response.status, 400);
        assert.equal(result.messages.length, 0);
        const body = await result.response.json();
        for (const path of ['name','email','contact_number','subject','message']) assert.ok(body.details.some(detail => detail.path === path), path);
    }
});

test('Inquiry message limits accept the boundary and reject oversized or non-text payloads before email', async () => {
    const accepted = await submit('/send-contact', { ...routes[1][1], message: 'x'.repeat(3000) });
    assert.equal(accepted.response.status, 200);
    assert.equal(accepted.messages.length, 2);
    for (const message of ['x'.repeat(3001), '😀'.repeat(1501), ['array'], { text: 'object' }]) {
        const rejected = await submit('/send-contact', { ...routes[1][1], message });
        assert.equal(rejected.response.status, 400);
        assert.equal(rejected.messages.length, 0);
        assert.ok((await rejected.response.json()).details.some(detail => detail.path === 'message'));
    }
    for (const field of ['name', 'subject']) {
        const rejected = await submit('/send-contact', { ...routes[1][1], [field]: 'x'.repeat(181) });
        assert.equal(rejected.response.status, 400);
        assert.equal(rejected.messages.length, 0);
    }
});

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
        for (const [route, data, multipart] of routes) {
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
        form.append('resume', new Blob([uploadFixtures[extension] || 'Unsupported fixture'], { type: mimeType }), `format-fixture.${extension}`);
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
    for (const route of ['/server.js', '/server%2Ejs', '/form_mail.js', '/email_templates.js', '/email_brand.hbs', '/maintenance.js', '/spam_protection.js', '/test/forms-email.test.js', '/uploads/test.pdf', '/.env', '/stbernadine_manual_deploy.zip']) {
        const response = await fetch(base + route);
        assert.equal(response.status, 403, route);
    }
    const response = await fetch(base + '/asset/script.js');
    assert.equal(response.status, 200);
});

test('Unverified submissions cannot send department messages or acknowledgements', async () => {
    const before = messages.length;
    const response = await nativeFetch(base + '/send-contact', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': '203.0.113.230' }, body: JSON.stringify(routes[1][1]) });
    assert.equal(response.status, 400);
    assert.equal(messages.length, before);
});

test('Commercial website pitches are tagged for review without an automatic acknowledgement', async () => {
    const result = await submit('/send-contact', { name: 'Pitch fixture', email: 'visitor@example.invalid', subject: 'SEO proposal', message: 'We offer SEO services and website redesign for your business.' });
    assert.equal(result.response.status, 200);
    assert.equal(result.messages.length, 1);
    assert.equal(result.messages[0].to, 'info@stbernadineusa.com');
    assert.match(result.messages[0].subject, /^\[WEBSITE SPAM REVIEW\]/);
    assert.equal((await result.response.json()).confirmationSent, false);
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
    const { UPLOAD_DIRECTORY } = require('../security_hardening');
    const beforeFiles = new Set(await fs.readdir(UPLOAD_DIRECTORY));
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
            leftovers = (await fs.readdir(UPLOAD_DIRECTORY)).filter(name => !beforeFiles.has(name));
            if (!leftovers.length) break;
            await new Promise(resolve => setTimeout(resolve, 25));
        }
        assert.equal(leftovers.length, 0, 'Temporary application upload was not deleted');
    }
});

test('Cross-site and unsupported requests are rejected before CAPTCHA or email processing', async () => {
    const before = messages.length;
    for (const headers of [
        { Origin:'https://attacker.example', 'Content-Type':'application/json' },
        { Origin:'null', 'Content-Type':'application/json' },
        { 'Sec-Fetch-Site':'cross-site', 'Content-Type':'application/json' }
    ]) {
        const response=await nativeFetch(base+'/send-contact',{method:'POST',headers,body:JSON.stringify(routes[1][1])});
        assert.equal(response.status,403);
    }
    const unsupported=await nativeFetch(base+'/send-contact',{method:'POST',headers:{'Content-Type':'text/plain'},body:'test'});
    assert.equal(unsupported.status,415);
    for(const route of ['/SEND-CONTACT','/send-contact/']) {
        const response=await nativeFetch(base+route,{method:'POST',headers:{Origin:'https://attacker.example','Content-Type':'application/json'},body:'{}'});
        assert.equal(response.status,403,route);
        const nested=await nativeFetch(base+route,{method:'POST',headers:{'Content-Type':'application/json'},body:'{"email":{"nested":true}}'});
        assert.equal(nested.status,400,route);
    }
    assert.equal(messages.length,before);
});

test('Oversized, nested, malformed and compressed JSON fail safely without mail delivery', async () => {
    const before=messages.length;
    const cases=[
        [JSON.stringify({message:'x'.repeat(70*1024)}),{},413],
        ['{"email":{"unexpected":"nested"}}',{},400],
        ['["unexpected array"]',{},400],
        ['{"__proto__":{"polluted":true}}',{},400],
        ['{"message":',{},400],
        [require('node:zlib').gzipSync('{"message":"fixture"}'),{'Content-Encoding':'gzip'},415]
    ];
    for(const [body,extra,status] of cases) {
        const response=await nativeFetch(base+'/send-contact',{method:'POST',headers:{'Content-Type':'application/json',...extra},body});
        assert.equal(response.status,status,await response.text());
    }
    assert.equal(messages.length,before);
    assert.equal({}.polluted,undefined);
});

test('Public-file allowlisting hides backend modules and diagnostic data while preserving website files', async () => {
    for(const route of ['/security_hardening.js','/models.json','/models_utf8.json','/package-lock.json','/asset/backup.env','/asset/debug.json','/asset/source.js.map']) {
        const response=await nativeFetch(base+route);
        assert.equal(response.status,403,route);
    }
    for(const route of ['/','/contact','/about-us/','/school-of-allied-health-services/','/manifest.json','/sw.js','/asset/form-protection.js','/asset/images/st-bernadine-email-logo-20261026.png','/health']) {
        const response=await nativeFetch(base+route);
        assert.equal(response.status,200,route);
    }
    const response=await nativeFetch(base+'/contact');
    assert.equal(response.headers.get('x-powered-by'),null);
    assert.doesNotMatch(response.headers.get('content-security-policy'),/unsafe-eval/);
});

test('MIME-spoofed files and incorrect filename extensions cannot reach department emails', async () => {
    const data=routes.find(row=>row[0]==='/apply-job')[1];
    for(const [filename,bytes,mime] of [
        ['resume.pdf',Buffer.from('<html><script>alert(1)</script></html>'),'application/pdf'],
        ['resume.exe',uploadFixtures.pdf,'application/pdf'],
        ['resume.docx',Buffer.from('PK\x03\x04not a Word document package'),'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    ]) {
        const form=new FormData();
        for(const [key,value] of Object.entries(data)) form.append(key,value);
        form.append('resume',new Blob([bytes],{type:mime}),filename);
        const before=messages.length;
        const response=await fetch(base+'/apply-job',{method:'POST',headers:{'X-Forwarded-For':`203.0.113.${visitor++}`},body:form});
        assert.equal(response.status,400,filename);
        assert.equal(messages.length,before);
    }
});

test('Applicant uploads use random filenames outside the served website root', async () => {
    const path=require('node:path');
    const {UPLOAD_DIRECTORY}=require('../security_hardening');
    const result=await submit('/apply-job',routes.find(row=>row[0]==='/apply-job')[1],true);
    assert.equal(result.response.status,200);
    const file=result.messages[0].attachments.find(item=>item.path);
    assert.ok(file);
    assert.equal(path.dirname(file.path),UPLOAD_DIRECTORY);
    assert.match(path.basename(file.path),/^[a-f0-9-]{36}\.pdf$/);
    assert.ok(!path.resolve(file.path).startsWith(path.resolve(__dirname,'..')+path.sep));
});

test('Enrollment upload types, field sizes and file sizes are bounded before email',async()=>{
    const cases=[
        ['unsupported',400],['large-field',400],['large-file',413]
    ];
    for(const [kind,status] of cases) {
        const form=new FormData();
        form.append('firstName','Test');form.append('lastName','Student');form.append('email','visitor@example.invalid');form.append('Program','CNA');
        if(kind==='large-field') form.append('extra','x'.repeat(129*1024));
        else form.append('attachment',new Blob([kind==='large-file'?Buffer.alloc(5*1024*1024+1):'unsupported'],{type:kind==='large-file'?'application/pdf':'application/x-msdownload'}),kind==='large-file'?'large.pdf':'file.exe');
        const before=messages.length;
        const response=await fetch(base+'/send-email',{method:'POST',headers:{'X-Forwarded-For':`203.0.113.${visitor++}`},body:form});
        assert.equal(response.status,status,kind);
        assert.equal(messages.length,before);
    }
});

test('Manual application signatures are checked before PDF image processing',async()=>{
    const data={...routes.find(row=>row[0]==='/apply-job')[1],AppMethod:'manual'};
    const oversized=Buffer.from(uploadFixtures.png);oversized.writeUInt32BE(100000,16);
    for(const signature of ['data:image/png;base64,'+oversized.toString('base64'),'https://attacker.example/signature.png']) {
        const result=await submit('/apply-job',{...data,SignatureData:signature},true);
        assert.equal(result.response.status,400);
        assert.equal(result.messages.length,0);
    }
    const result=await submit('/apply-job',{...data,SignatureData:'data:image/png;base64,'+uploadFixtures.png.toString('base64')},true);
    assert.equal(result.response.status,200,await result.response.text());
    assert.ok(result.messages[0].attachments.some(file=>file.contentType==='application/pdf'));
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
                const logo = await fetch('http://127.0.0.1:' + server.address().port + '/asset/images/st-bernadine-email-logo-20261026.png');
                assert.equal(logo.status, 200);
                assert.ok(logo.headers.get('content-type').startsWith('image/png'));
                const original = require('node:fs').readFileSync('asset/images/st-bernadine-email-logo-20261026.png');
                assert.ok(Buffer.from(await logo.arrayBuffer()).equals(original));
                const postLogo = await fetch('http://127.0.0.1:' + server.address().port + '/asset/images/st-bernadine-email-logo-20261026.png', { method: 'POST' });
                assert.equal(postLogo.status, 503);
                console.log('MAINTENANCE_OK');
            } catch(error) { console.error(error.message); process.exitCode=1; }
            finally { server.close(); }
        });`;
    const output = execFileSync(process.execPath, ['-e', script], { cwd: process.cwd(), env: { ...process.env, SITE_MAINTENANCE: 'on' }, encoding: 'utf8', timeout: 20000 });
    assert.match(output, /MAINTENANCE_OK/);
});


test('chat rejects non-text and oversized messages before reaching the provider', async () => {
    for (const message of ['', { text: 'bad type' }, 'x'.repeat(2001)]) {
        const response = await nativeFetch(base + '/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message }) });
        assert.equal(response.status, 400);
    }
    const disabled = await nativeFetch(base + '/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: 'A general question' }) });
    assert.equal(disabled.status, 503);
    assert.equal((await disabled.json()).code, 'AI_UNAVAILABLE');
    assert.equal((await nativeFetch(base + '/chat_service.js')).status, 403);
});
