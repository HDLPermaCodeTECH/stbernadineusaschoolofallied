'use strict';

const crypto = require('node:crypto');
const { AsyncLocalStorage } = require('node:async_hooks');
const submissionContext = new AsyncLocalStorage();
const ACTION = 'stb_public_form';
const REVIEW_PREFIX = '[WEBSITE SPAM REVIEW] ';
const HOSTS = new Set(['stbernadineusa.com', 'www.stbernadineusa.com']);
const SECURITY_FIELDS = new Set(['cf-turnstile-response', 'stb_form_ticket', 'stb_website']);

function assessSolicitation(data) {
    const fields = ['subject', 'message', 'careDetails', 'additionalInfo', 'coverLetter', 'CoverLetter'];
    const text = fields.map(key => typeof data[key] === 'string' ? data[key] : '').join(' ').normalize('NFKC').toLowerCase();
    const category = /\b(?:seo|backlinks?|guest posts?|link building|website (?:design|redesign|development)|web design|digital marketing|domain authority|paid traffic)\b/.test(text);
    const pitch = /\b(?:we (?:offer|provide|specialize|can help)|i (?:offer|provide|can help)|our (?:services|agency|packages)|offering (?:you|our)|buy (?:links|backlinks)|rank your (?:site|website)|increase your (?:traffic|rankings)|promote your (?:site|website)|guest post (?:opportunity|placement))\b/.test(text);
    const urls = (text.match(/https?:\/\/[^\s<>]+/g) || []).length;
    const reasons = [];
    if (category && pitch) reasons.push('commercial-service-pitch');
    if (category && urls >= 3) reasons.push('promotional-link-pattern');
    return { review: reasons.length > 0, reasons };
}

function createFormProtection({ env = process.env, fetchImpl = (...args) => fetch(...args), now = Date.now, log = console.info } = {}) {
    const recent = new Map();
    const secret = () => String(env.TURNSTILE_SECRET_KEY || '').trim();
    const siteKey = () => String(env.TURNSTILE_SITE_KEY || '').trim();
    const configured = () => !!secret() && !!siteKey() && (env.NODE_ENV === 'test' || !/^[123]x000000/.test(siteKey()) && !/^[123]x000000/.test(secret()));
    const sign = payload => crypto.createHmac('sha256', secret()).update(payload).digest('base64url');
    function issueTicket() {
        const payload = Buffer.from(JSON.stringify({ at: now(), nonce: crypto.randomBytes(16).toString('hex') })).toString('base64url');
        return payload + '.' + sign(payload);
    }
    function validTicket(value) {
        if (typeof value !== 'string' || value.length > 600) return false;
        const parts = value.split('.');
        if (parts.length !== 2) return false;
        const actual = Buffer.from(parts[1]);
        const expected = Buffer.from(sign(parts[0]));
        if (actual.length !== expected.length || !crypto.timingSafeEqual(actual, expected)) return false;
        try {
            const ticket = JSON.parse(Buffer.from(parts[0], 'base64url').toString());
            return typeof ticket.nonce === 'string' && Number.isFinite(ticket.at) && ticket.at <= now() + 30000 && now() - ticket.at < 2 * 60 * 60 * 1000;
        } catch { return false; }
    }
    function config(req, res) {
        res.set('Cache-Control', 'no-store');
        if (!configured()) return res.status(503).json({ error: 'Verification is temporarily unavailable. Please contact the school directly.' });
        res.json({ siteKey: siteKey(), action: ACTION, ticket: issueTicket() });
    }
    const deny = (req, res, status, code, message) => {
        log('[FORM_PROTECTION]', JSON.stringify({ path: req.path, code }));
        return res.status(status).json({ error: message, code });
    };
    async function guard(req, res, next) {
        if (!configured()) return deny(req, res, 503, 'VERIFICATION_UNAVAILABLE', 'Verification is temporarily unavailable. Please contact the school directly.');
        const data = req.body || {};
        if (typeof data.stb_website !== 'string' || data.stb_website.trim()) return deny(req, res, 400, 'SUBMISSION_REJECTED', 'We could not accept this submission. Please contact the school directly.');
        if (!validTicket(data.stb_form_ticket)) return deny(req, res, 400, 'FORM_EXPIRED', 'Please refresh the page and complete verification again.');
        const token = data['cf-turnstile-response'];
        if (typeof token !== 'string' || !token.trim() || token.length > 2048) return deny(req, res, 400, 'CAPTCHA_REQUIRED', 'Please complete the verification before sending.');
        let verified;
        try {
            const response = await fetchImpl('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ secret: secret(), response: token, remoteip: req.ip }),
                signal: AbortSignal.timeout(8000)
            });
            if (!response.ok) throw new Error('Verification service unavailable');
            verified = await response.json();
        } catch { return deny(req, res, 503, 'VERIFICATION_UNAVAILABLE', 'Verification is temporarily unavailable. Please try again shortly.'); }
        if (verified.success !== true || verified.action !== ACTION || !HOSTS.has(verified.hostname)) {
            return deny(req, res, 400, 'CAPTCHA_FAILED', 'Verification expired or failed. Please verify again and retry.');
        }
        // Store only salted hashes, never message bodies or contact details.
        const content = Object.keys(data).filter(key => !SECURITY_FIELDS.has(key)).sort().map(key => [key, data[key]]);
        const fingerprint = crypto.createHmac('sha256', secret()).update(req.path + req.ip + JSON.stringify(content)).digest('hex');
        for (const [key, expires] of recent) if (expires <= now()) recent.delete(key);
        if (recent.has(fingerprint)) return deny(req, res, 409, 'DUPLICATE_SUBMISSION', 'This request was already submitted. Please wait for the team to reply.');
        if (recent.size >= 5000) recent.delete(recent.keys().next().value);
        recent.set(fingerprint, now() + 60000);
        res.once('finish', () => {
            if (res.statusCode >= 200 && res.statusCode < 300) recent.set(fingerprint, now() + 10 * 60 * 1000);
            else recent.delete(fingerprint);
        });
        const assessment = assessSolicitation(data);
        if (assessment.review) log('[FORM_PROTECTION]', JSON.stringify({ path: req.path, code: 'REVIEW', reasons: assessment.reasons }));
        return submissionContext.run(assessment, () => next());
    }
    return { config, guard };
}

module.exports = { createFormProtection, assessSolicitation, submissionContext, REVIEW_PREFIX, ACTION };
