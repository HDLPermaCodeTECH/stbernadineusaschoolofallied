'use strict';
const fs = require('node:fs/promises');
const path = require('node:path');
const { FORM_INBOXES, safeMailError } = require('./form_mail');

const CHECK_ID = 'website-delivery-20261019-01';

module.exports = async function runApprovedDeliveryCheck(transport, from, directory = path.join(__dirname, '.mail-checks')) {
    if (String(from).toLowerCase() !== FORM_INBOXES.ENROLLMENT) throw new Error('Unexpected test sender.');
    await fs.mkdir(directory, { recursive: true, mode: 0o700 });
    for (const recipient of [...new Set(Object.values(FORM_INBOXES))]) {
        const department = recipient.split('@')[0];
        const receipt = path.join(directory, CHECK_ID + '-' + department + '.json');
        try {
            await fs.writeFile(receipt, JSON.stringify({ attempted: true, recipient }), { flag: 'wx', mode: 0o600 });
        } catch (error) {
            if (error.code === 'EEXIST') continue;
            throw error;
        }
        const messageId = '<' + CHECK_ID + '-' + department + '@stbernadineusa.com>';
        try {
            const result = await transport.sendMail({
                from: '"St. Bernadine Website" <' + from + '>',
                to: recipient,
                subject: '[WEBSITE TEST] Department delivery check',
                text: 'Website email delivery test only. No action required.',
                messageId,
                headers: { 'X-StBernadine-Delivery-Check': CHECK_ID }
            });
            const accepted = result.accepted?.includes(recipient) && !result.rejected?.length;
            const status = { checkId: CHECK_ID, recipient, accepted: Boolean(accepted), messageId };
            await fs.writeFile(receipt, JSON.stringify(status), { mode: 0o600 });
            console.log('[DELIVERY_TEST]', JSON.stringify(status));
        } catch (error) {
            console.error('[DELIVERY_TEST]', JSON.stringify({ checkId: CHECK_ID, recipient, accepted: false, ...safeMailError(error) }));
            if (error.code === 'EAUTH') break;
        }
    }
};
