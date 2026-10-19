'use strict';
const crypto = require('node:crypto');
const fs = require('node:fs/promises');
const path = require('node:path');
const { buildAcknowledgement } = require('./email_templates');
const { safeMailError } = require('./form_mail');

const TOKEN_HASH = '42fa3176389944d7aa54ca29351c812afa3421e3dd89678d60a15b54110b7a70';
const RECIPIENT_HASH = 'a7e89ecd2c91119cb46cc1813925299fc3f996dec80edb787220fb5f68c7253f';
const EXPIRES_AT = Date.parse('2026-10-19T06:02:45Z');
const CHECK_ID = 'branded-confirmation-samples-20261019-01';
const hash = value => crypto.createHash('sha256').update(String(value || '')).digest('hex');

module.exports = function sampleHandler(getTransport, getSender, directory = path.join(__dirname, '.mail-checks')) {
    return async (req, res) => {
        const recipient = String(req.body?.recipient || '').trim().toLowerCase();
        if (Date.now() >= EXPIRES_AT || hash(req.get('X-Sample-Authorization')) !== TOKEN_HASH || hash(recipient) !== RECIPIENT_HASH) {
            return res.status(404).json({ error: 'Not found.' });
        }
        try {
            await fs.mkdir(directory, { recursive: true, mode: 0o700 });
            await fs.writeFile(path.join(directory, CHECK_ID + '.json'), JSON.stringify({ attemptedAt: new Date().toISOString() }), { flag: 'wx', mode: 0o600 });
        } catch (error) {
            if (error.code === 'EEXIST') return res.status(409).json({ error: 'Samples already attempted. No duplicate messages sent.' });
            return res.status(503).json({ error: 'Sample check unavailable.' });
        }
        const results = [];
        for (const kind of ['ENROLLMENT', 'PLACEMENT', 'INQUIRY', 'CARE', 'JOB']) {
            const template = buildAcknowledgement(kind);
            const notice = 'TEST PREVIEW ONLY: No request or application has been submitted. This sample shows your department confirmation design.';
            const banner = '<p style="margin:0;padding:14px 20px;background-color:#fff7ed;color:#7c2d12;font:14px/1.6 Arial,sans-serif;">' + notice + '</p>';
            const messageId = '<' + CHECK_ID + '-' + kind.toLowerCase() + '@stbernadineusa.com>';
            try {
                const info = await getTransport().sendMail({
                    from: '"' + template.displayName + '" <' + getSender() + '>',
                    to: recipient,
                    replyTo: template.replyTo,
                    subject: '[TEST] ' + template.subject,
                    html: template.html.replace('<body style="margin:0;padding:0;background-color:#f8fafc;">', '<body style="margin:0;padding:0;background-color:#f8fafc;">' + banner),
                    text: notice + '\n\n' + template.text,
                    messageId,
                    headers: { 'Auto-Submitted': 'auto-replied', 'X-Auto-Response-Suppress': 'All' }
                });
                results.push({ department: kind, replyTo: template.replyTo, accepted: Boolean(info.accepted?.includes(recipient) && !info.rejected?.length), messageId });
            } catch (error) {
                results.push({ department: kind, replyTo: template.replyTo, accepted: false, ...safeMailError(error) });
            }
        }
        await fs.writeFile(path.join(directory, CHECK_ID + '.json'), JSON.stringify({ completedAt: new Date().toISOString(), results }), { mode: 0o600 });
        console.log('[BRANDED_SAMPLE_CHECK]', JSON.stringify({ results }));
        return res.status(results.every(result => result.accepted) ? 200 : 503).json({ results });
    };
};
