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

const escapeHtml = value => String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));

function buildAcknowledgement(kind, mode = 'form') {
    const team = TEAMS[kind];
    if (!team || !['form', 'direct'].includes(mode)) throw new Error('Unknown acknowledgment type.');
    const direct = mode === 'direct';
    const title = direct ? 'Thank you for your email.' : team.title;
    const intro = direct ? `Your email has reached the St. Bernadine ${team.name.toLowerCase()}.` : team.intro;
    const next = direct ? 'Our team will review your email and follow up about your inquiry or the next steps.' : team.next;
    const subject = `${direct ? team.label.replace(' & ', ' and ') + ': email received' : team.subject} | St. Bernadine`;
    const preheader = `Received by our ${team.name.toLowerCase()}. For follow-up, reply to ${team.inbox}.`;
    const fragment = `<div style="display:none;font-size:1px;line-height:1px;color:#f8fafc;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">${escapeHtml(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#f8fafc" style="width:100%;background-color:#f8fafc;">
  <tr><td align="center" style="padding:28px 12px;">
    <!--[if mso]><table role="presentation" width="600" cellpadding="0" cellspacing="0"><tr><td><![endif]-->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#ffffff" style="width:100%;max-width:600px;background-color:#ffffff;border:1px solid #e2e8f0;border-radius:8px;">
      <tr><td style="padding:28px 28px 24px;border-top:5px solid #06752e;border-bottom:1px solid #e2e8f0;">
        <img src="https://stbernadineusa.com/asset/images/4d-logo.png" alt="St. Bernadine" width="128" height="110" style="display:block;width:128px;height:110px;border:0;object-fit:contain;">
        <p style="margin:8px 0 0;color:#475569;font-family:Inter,Arial,Helvetica,sans-serif;font-size:12px;line-height:1.6;">School of Allied Health &amp; Healthcare Services</p>
      </td></tr>
      <tr><td style="padding:30px 28px 12px;">
        <p style="margin:0 0 14px;color:#902017;font-family:Inter,Arial,Helvetica,sans-serif;font-size:12px;font-weight:bold;letter-spacing:1px;line-height:1.6;text-transform:uppercase;">Message received</p>
        <h1 style="margin:0 0 22px;color:#054d1f;font-family:Poppins,Arial,Helvetica,sans-serif;font-size:28px;font-weight:bold;line-height:1.2;">${escapeHtml(title)}</h1>
        <p style="margin:0 0 16px;color:#475569;font-family:Inter,Arial,Helvetica,sans-serif;font-size:16px;line-height:1.75;">Hello,</p>
        <p style="margin:0 0 22px;color:#475569;font-family:Inter,Arial,Helvetica,sans-serif;font-size:16px;line-height:1.75;">${escapeHtml(intro)}</p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#F0FDF4" style="width:100%;background-color:#F0FDF4;border-left:3px solid #06752e;">
          <tr><td style="padding:18px 20px;">
            <p style="margin:0 0 5px;color:#475569;font-family:Inter,Arial,Helvetica,sans-serif;font-size:12px;line-height:1.6;">YOUR CONTACT TEAM</p>
            <p style="margin:0 0 6px;color:#054d1f;font-family:Inter,Arial,Helvetica,sans-serif;font-size:16px;font-weight:bold;line-height:1.5;">${escapeHtml(team.label)}</p>
            <a href="mailto:${team.inbox}" style="color:#06752e;font-family:Inter,Arial,Helvetica,sans-serif;font-size:14px;line-height:1.8;text-decoration:underline;word-break:break-all;">${team.inbox}</a>
          </td></tr>
        </table>
        <h2 style="margin:26px 0 10px;color:#054d1f;font-family:Inter,Arial,Helvetica,sans-serif;font-size:17px;line-height:1.5;">What happens next?</h2>
        <p style="margin:0 0 16px;color:#475569;font-family:Inter,Arial,Helvetica,sans-serif;font-size:16px;line-height:1.75;">${escapeHtml(next)}</p>
        <p style="margin:0 0 24px;color:#475569;font-family:Inter,Arial,Helvetica,sans-serif;font-size:16px;line-height:1.75;">If you need to add information, reply to this email. There is no need to send the same request again.</p>
        <p style="margin:0 0 24px;color:#475569;font-family:Inter,Arial,Helvetica,sans-serif;font-size:16px;line-height:1.75;">Kind regards,<br><strong style="color:#054d1f;">${escapeHtml(team.name)}</strong><br>St. Bernadine</p>
      </td></tr>
      <tr><td bgcolor="#f8fafc" style="padding:22px 28px;background-color:#f8fafc;border-top:1px solid #e2e8f0;">
        <p style="margin:0 0 10px;color:#64748B;font-family:Inter,Arial,Helvetica,sans-serif;font-size:12px;line-height:1.75;">This is an automated acknowledgment of receipt. A team member will handle your message separately.</p>
        <p style="margin:0;color:#64748B;font-family:Inter,Arial,Helvetica,sans-serif;font-size:12px;line-height:1.75;">591 Summit Ave, Suite 410<br>Jersey City, NJ 07306, United States<br><a href="tel:+12012221116" style="color:#06752e;text-decoration:underline;">+1 (201) 222-1116</a></p>
      </td></tr>
    </table>
    <!--[if mso]></td></tr></table><![endif]-->
  </td></tr>
</table>`;
    const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="color-scheme" content="light"><title>${escapeHtml(subject)}</title></head><body style="margin:0;padding:0;background-color:#f8fafc;">${fragment}</body></html>`;
    const text = `ST. BERNADINE\nSchool of Allied Health & Healthcare Services\n\n${title}\n\nHello,\n\n${intro}\n\nYOUR CONTACT TEAM\n${team.label}\n${team.inbox}\n\nWHAT HAPPENS NEXT?\n${next}\n\nIf you need to add information, reply to this email. There is no need to send the same request again.\n\nKind regards,\n${team.name}\nSt. Bernadine\n\nThis is an automated acknowledgment of receipt. A team member will handle your message separately.\n591 Summit Ave, Suite 410, Jersey City, NJ 07306\n+1 (201) 222-1116`;
    return { subject, html, fragment, text, replyTo: team.inbox, displayName: `St. Bernadine - ${team.name}` };
}

module.exports = { TEAMS, buildAcknowledgement };
