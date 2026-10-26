'use strict';

const { FORM_INBOXES } = require('./form_mail');

const TEAMS = Object.freeze({
    ENROLLMENT: { label: 'Admissions & Enrollment', name: 'Admissions Team', inbox: FORM_INBOXES.ENROLLMENT, subject: 'We received your enrollment request', title: 'Enrollment request received.', intro: 'Thank you for your interest in studying with St. Bernadine.', next: 'Our admissions team will review your request and follow up about program information and the next steps.' },
    PLACEMENT: { label: 'Placement & Consultancy', name: 'Placement Team', inbox: FORM_INBOXES.PLACEMENT, subject: 'We received your placement inquiry', title: 'Placement inquiry received.', intro: 'Thank you for contacting St. Bernadine about placement and consultancy services.', next: 'Our placement team will review your message and follow up about the next steps and any information we need.' },
    INQUIRY: { label: 'Inquiries & Referrals', name: 'Information Team', inbox: FORM_INBOXES.INQUIRY, subject: 'We received your message', title: 'Thank you for getting in touch.', intro: 'Your message has reached the St. Bernadine information team.', next: 'Our team will review your message and direct your inquiry to the appropriate staff member.' },
    CARE: { label: 'Home Care Services', name: 'Care Coordination Team', inbox: FORM_INBOXES.CARE, subject: 'We received your care request', title: 'Care request received.', intro: 'Thank you for reaching out to St. Bernadine Home Care Services.', next: 'Our care coordination team will review your request and follow up about your care needs and the next steps.' },
    JOB: { label: 'Careers & Recruitment', name: 'Recruitment Team', inbox: FORM_INBOXES.JOB, subject: 'We received your job application', title: 'Application received.', intro: 'Thank you for your interest in joining St. Bernadine.', next: 'Our recruitment team will review your application and contact you if additional information or an interview is needed.' },
    REFERRAL: { label: 'Inquiries & Referrals', name: 'Information Team', inbox: FORM_INBOXES.REFERRAL, subject: 'We received your referral', title: 'Thank you for your referral.', intro: 'Your referral has reached the St. Bernadine information team.', next: 'Our team will review the referral and coordinate the appropriate next steps. This confirmation is sent only to you as the referrer.' },
    SUBSCRIPTION: { label: 'School & Service Updates', name: 'Information Team', inbox: FORM_INBOXES.SUBSCRIPTION, subject: 'We received your updates request', title: 'Updates request received.', intro: 'Thank you for your interest in updates from St. Bernadine.', next: 'Our information team has received your request for updates about programs, opportunities and services.' }
});

const fs = require('node:fs');
const path = require('node:path');
const brandTemplate = fs.readFileSync(path.join(__dirname, 'email_brand.hbs'), 'utf8');
const LOGO_URL = 'https://stbernadineusa.com/asset/images/st-bernadine-email-logo-20261026.png';
const WEBSITE_URL = 'https://stbernadineusa.com/';
const MAILING_ADDRESS = '591 Summit Ave, Suite 410, Jersey City, NJ 07306, United States';
const UPDATE_RECIPIENTS = Object.freeze(['LJSAMIN@yahoo.com', 'mystbernadine@gmail.com', 'llagashebreydill1996@gmail.com', 'lsamin.sbsah@gmail.com']);
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
const httpsUrl = value => {
    if (!value) return '';
    const parsed = new URL(value);
    if (parsed.protocol !== 'https:') throw new Error('Email links must use HTTPS.');
    return parsed.href;
};

// Body HTML is trusted application/administrator content, never raw form input.
function buildBrandedEmail(options) {
    const values = {
        subject: options.subject, preheader: options.preheader || options.title,
        logo_url: LOGO_URL, category: options.category || 'ST. BERNADINE', title: options.title,
        subtitle: options.subtitle || '', greeting: options.greeting || '', body_html: options.bodyHtml || '',
        featured_image_url: httpsUrl(options.featuredImageUrl), featured_image_alt: options.featuredImageAlt || '',
        cta_url: httpsUrl(options.ctaUrl), cta_label: options.ctaLabel || 'Visit Our Website',
        mailing_address: MAILING_ADDRESS, website_url: WEBSITE_URL,
        contact_email: options.contactEmail || FORM_INBOXES.INQUIRY,
        recipient_context: options.recipientContext || 'This is a St. Bernadine service message.',
        unsubscribe_url: httpsUrl(options.unsubscribeUrl), current_year: new Date().getFullYear()
    };
    const conditional = brandTemplate.replace(/{{#if (\w+)}}([\s\S]*?){{\/if}}/g, (_, key, block) => values[key] ? block : '');
    const html = conditional.replace(/{{{body_html}}}|{{(\w+)}}/g, (token, key) => token === '{{{body_html}}}' ? values.body_html : escapeHtml(values[key]));
    const body = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)[1];
    const style = html.match(/<style>[\s\S]*?<\/style>/i)[0];
    return { subject: options.subject, html, fragment: style + body, text: options.text || '', replyTo: values.contact_email, displayName: options.displayName || 'St. Bernadine' };
}

function buildAcknowledgement(kind, mode = 'form') {
    const team = TEAMS[kind];
    if (!team || !['form', 'direct'].includes(mode)) throw new Error('Unknown acknowledgment type.');
    const direct = mode === 'direct';
    const title = direct ? 'Thank you for your email.' : team.title;
    const intro = direct ? `Your email has reached the St. Bernadine ${team.name.toLowerCase()}.` : team.intro;
    const next = direct ? 'Our team will review your email and follow up about your inquiry or the next steps.' : team.next;
    const subject = `${direct ? team.label.replace(' & ', ' and ') + ': email received' : team.subject} | St. Bernadine`;
    const preheader = `Received by our ${team.name.toLowerCase()}. For follow-up, reply to ${team.inbox}.`;
    const text = `ST. BERNADINE\nCOMPASSION • COMPETENCE • COMMITMENT\n\n${title}\n\nGood day!\n\n${intro}\n\nYOUR CONTACT TEAM\n${team.label}\n${team.inbox}\n\nWHAT HAPPENS NEXT?\n${next}\n\nIf you need to add information, reply to this email. There is no need to send the same request again.\n\nKind regards,\n${team.name}\nSt. Bernadine\n\nPeople Helping People\nBuilding a stronger community through healthcare, education and service.\n\nThis is an automated acknowledgment of receipt. A team member will handle your message separately.\n${MAILING_ADDRESS}\n+1 (201) 222-1116`;
    const bodyHtml = `<p style="margin:0 0 22px;">${escapeHtml(intro)}</p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="#F7F5F0" style="background:#F7F5F0;border-left:3px solid #9C0A0A;"><tr><td style="padding:18px 20px;">
        <p style="margin:0 0 5px;color:#5D665E;font-size:11px;letter-spacing:1px;">YOUR CONTACT TEAM</p>
        <p style="margin:0 0 6px;color:#1F4D1F;font-size:16px;font-weight:bold;">${escapeHtml(team.label)}</p>
        <a href="mailto:${team.inbox}" style="color:#1F4D1F;word-break:break-all;">${team.inbox}</a></td></tr></table>
        <h2 style="margin:26px 0 10px;color:#1F4D1F;font-size:19px;">What happens next?</h2>
        <p style="margin:0 0 18px;">${escapeHtml(next)}</p>
        <p style="margin:0 0 22px;">If you need to add information, reply to this email. There is no need to send the same request again.</p>
        <p style="margin:0;">Kind regards,<br><strong style="color:#1F4D1F;">${escapeHtml(team.name)}</strong><br>St. Bernadine</p>`;
    return buildBrandedEmail({ subject, title, preheader, category: team.label.toUpperCase(), subtitle: 'Your message is with the right team.', greeting: 'Good day!', bodyHtml, text,
        ctaUrl: WEBSITE_URL, contactEmail: team.inbox, displayName: `St. Bernadine - ${team.name}`,
        recipientContext: 'This is an automated acknowledgement because you contacted St. Bernadine. A team member will handle your message separately.' });
}

function buildUpdateEmail({ subject, title, bodyHtml, bodyText, preheader, subtitle = '', featuredImageUrl, featuredImageAlt, ctaUrl = WEBSITE_URL, ctaLabel = 'Visit Our Website' }) {
    if (!subject || !title || !bodyHtml || !bodyText) throw new Error('An update needs a subject, title, HTML content and plain text.');
    return { ...buildBrandedEmail({ subject, title, preheader, category: 'WEBSITE UPDATE RELEASED', subtitle, bodyHtml, text: `${title}\n\n${bodyText}\n\nSt. Bernadine USA\n${WEBSITE_URL}`, ctaUrl, ctaLabel, featuredImageUrl, featuredImageAlt,
        contactEmail: 'developer@hdlpermacodetech.com', displayName: 'Developer',
        recipientContext: 'This operational website update is intended for St. Bernadine administrators and designated recipients.' }), to: [...UPDATE_RECIPIENTS] };
}

module.exports = { TEAMS, buildAcknowledgement, buildBrandedEmail, buildUpdateEmail, UPDATE_RECIPIENTS, LOGO_URL };
