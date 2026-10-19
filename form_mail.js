const nodemailer = require('nodemailer');

const FORM_INBOXES = Object.freeze({
    ENROLLMENT: 'school@stbernadineusa.com',
    PLACEMENT: 'placement@stbernadineusa.com',
    INQUIRY: 'info@stbernadineusa.com',
    REFERRAL: 'info@stbernadineusa.com',
    CARE: 'care@stbernadineusa.com',
    JOB: 'apply@stbernadineusa.com',
    SUBSCRIPTION: 'info@stbernadineusa.com'
});

function createFormTransport(env = process.env) {
    const port = Number(env.EMAIL_PORT || 465);
    const user = String(env.EMAIL_USER || '').trim();
    const pass = env.EMAIL_PASS;
    if (!user || !pass || ![465, 587].includes(port)) {
        const error = new Error('SMTP settings are incomplete.');
        error.code = 'SMTP_NOT_CONFIGURED';
        throw error;
    }
    return nodemailer.createTransport({
        host: String(env.EMAIL_HOST || 'smtp.hostinger.com').trim(),
        port,
        secure: port === 465,
        requireTLS: port === 587,
        auth: { user, pass },
        connectionTimeout: 15000,
        greetingTimeout: 15000,
        socketTimeout: 30000
    });
}

function safeMailError(error) {
    return {
        code: String(error.code || 'SMTP_ERROR').replace(/[^A-Z0-9_]/gi, '').slice(0, 60),
        responseCode: Number(error.responseCode) || null
    };
}

module.exports = { FORM_INBOXES, createFormTransport, safeMailError };
