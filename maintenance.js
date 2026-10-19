'use strict';

const page = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#174b39">
  <meta name="description" content="St. Bernadine website maintenance and service updates. Contact our teams directly for enrollment, placement, inquiries, care requests, and job applications.">
  <link rel="icon" href="data:,">
  <title>Website Maintenance | St. Bernadine</title>
  <style>
    :root {
      color-scheme: light;
      --background: #f6f7f3;
      --surface: #ffffff;
      --ink: #173d30;
      --body: #4b5b53;
      --muted: #65746c;
      --line: #dce3db;
      --brand: #174b39;
      --soft: #edf3ed;
      --accent: #806030;
    }
    * { box-sizing: border-box; }
    body { margin: 0; min-height: 100vh; min-height: 100dvh; background: var(--background); color: var(--body); font: 16px/1.65 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; -webkit-font-smoothing: antialiased; }
    .page { max-width: 1216px; margin: 0 auto; padding: 0 48px; }
    .masthead { display: flex; align-items: center; justify-content: space-between; gap: 24px; padding: 38px 0 30px; border-bottom: 1px solid var(--line); }
    .brand-name { margin: 0; color: var(--brand); font: 600 30px/1.1 Georgia, "Times New Roman", serif; letter-spacing: -.7px; }
    .brand-description { margin: 9px 0 0; color: var(--body); font-size: 12px; letter-spacing: .015em; }
    .domain { color: var(--muted); font-size: 13px; }
    main { display: grid; grid-template-columns: minmax(0, 1.3fr) minmax(0, 1fr); gap: 72px; align-items: start; padding: 70px 0 66px; }
    .badge { display: inline-flex; align-items: center; gap: 9px; padding: 6px 12px; border: 1px solid var(--line); border-radius: 4px; color: var(--brand); background: var(--soft); font-size: 12px; font-weight: 600; letter-spacing: .035em; }
    .badge::before { content: ""; width: 6px; height: 6px; border-radius: 50%; background: var(--accent); flex-shrink: 0; }
    h1 { margin: 24px 0 22px; color: var(--ink); font: 400 clamp(40px, 4.5vw, 60px)/1.08 Georgia, "Times New Roman", serif; letter-spacing: -1.8px; }
    .intro { max-width: 490px; margin: 0; font-size: 17px; line-height: 1.8; }
    .notice { margin-top: 38px; padding-top: 25px; border-top: 1px solid var(--line); }
    .eyebrow { margin: 0; color: var(--brand); font-size: 11px; line-height: 1.5; font-weight: 700; letter-spacing: .14em; text-transform: uppercase; }
    .issues { list-style: none; padding: 0; margin: 20px 0 0; display: grid; gap: 20px; }
    .issues li { display: grid; grid-template-columns: 24px minmax(0, 1fr); gap: 12px; }
    .issue-number { padding-top: 2px; color: var(--accent); font-size: 12px; font-weight: 650; font-variant-numeric: tabular-nums; }
    h2, h3, p { overflow-wrap: break-word; }
    .issue-title { margin: 0 0 4px; color: var(--ink); font-size: 14px; font-weight: 650; }
    .issue-description { margin: 0; font-size: 14px; line-height: 1.75; }
    .contacts { padding: 32px; border: 1px solid var(--line); border-radius: 10px; background: var(--surface); box-shadow: 0 12px 40px -24px rgb(23 61 48 / 15%); }
    .contacts h2 { margin: 10px 0 12px; color: var(--ink); font: 400 29px/1.2 Georgia, "Times New Roman", serif; letter-spacing: -.5px; }
    .contact-intro { margin: 0; font-size: 14px; line-height: 1.75; }
    .contact-list { list-style: none; padding: 0; margin: 24px 0 0; }
    .contact-list li + li { border-top: 1px solid var(--line); }
    .contact-link { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin: 0 -12px; padding: 14px 12px; color: var(--brand); text-decoration: none; border-radius: 5px; transition: background-color 180ms ease; cursor: pointer; }
    .contact-link:hover { background: var(--soft); }
    .contact-link:focus-visible { outline: 3px solid var(--brand); outline-offset: 3px; background: var(--soft); }
    .contact-link span { min-width: 0; }
    .contact-label { display: block; margin-bottom: 2px; color: var(--body); font-size: 12px; }
    .contact-email { display: block; font-size: 14px; font-weight: 600; overflow-wrap: anywhere; }
    .contact-link svg { width: 17px; height: 17px; flex-shrink: 0; }
    .contact-footnote { margin: 18px 0 0; padding-top: 20px; border-top: 1px solid var(--line); color: var(--muted); font-size: 12px; line-height: 1.65; }
    footer { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 12px 24px; padding: 23px 0 28px; border-top: 1px solid var(--line); color: var(--muted); font-size: 12px; }
    footer p { margin: 0; }
    .status { font-variant-numeric: tabular-nums; }
    @media (min-width: 1200px) { .page { min-height: 100dvh; display: flex; flex-direction: column; } main { flex: 1; align-content: center; } }
    @media (max-width: 960px) { main { gap: 36px; grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr); } .contacts { padding: 24px; } .page { padding: 0 32px; } }
    @media (max-width: 760px) { main { grid-template-columns: 1fr; gap: 36px; padding: 42px 0; } .intro { max-width: 560px; } h1 { font-size: clamp(40px, 8vw, 56px); } .contacts { max-width: 560px; } .notice { margin-top: 30px; } }
    @media (max-width: 480px) { .page { padding: 0 24px; } .masthead { padding: 28px 0 24px; } .brand-name { font-size: 27px; } .brand-description { max-width: 240px; font-size: 11px; } .domain { display: none; } .contacts { padding: 24px; } .contact-email { font-size: 13px; } h1 { letter-spacing: -1.1px; } footer { flex-direction: column; } }
    @media (prefers-reduced-motion: reduce) { *, *::before, *::after { transition: none !important; } }
  </style>
</head>
<body>
  <div class="page">
    <header class="masthead">
      <div>
        <p class="brand-name">St. Bernadine</p>
        <p class="brand-description">School of Allied Health &amp; Healthcare Services</p>
      </div>
      <span class="domain">stbernadineusa.com</span>
    </header>
    <main>
      <section aria-labelledby="maintenance-title">
        <div class="badge">Website maintenance</div>
        <h1 id="maintenance-title">We&rsquo;re improving<br>our website.</h1>
        <p class="intro">Our website is temporarily unavailable while we update our online forms. For assistance, please contact the appropriate team directly by email.</p>
        <section class="notice" aria-labelledby="notice-title">
          <h2 class="eyebrow" id="notice-title">Current service notice</h2>
          <ol class="issues">
            <li>
              <span class="issue-number" aria-hidden="true">01</span>
              <div>
                <h3 class="issue-title">Department email routing</h3>
                <p class="issue-description">Department routing updates are installed. We&rsquo;re verifying email notifications before online forms reopen.</p>
              </div>
            </li>
            <li>
              <span class="issue-number" aria-hidden="true">02</span>
              <div>
                <h3 class="issue-title">Referral submissions</h3>
                <p class="issue-description">The referral submission process has been updated. Final submission and delivery checks are in progress.</p>
              </div>
            </li>
          </ol>
        </section>
      </section>
      <section class="contacts" aria-labelledby="contact-title">
        <p class="eyebrow">Contact our teams</p>
        <h2 id="contact-title">How can we help?</h2>
        <p class="contact-intro">Please use the email address that matches your request.</p>
        <ul class="contact-list">
          <li><a class="contact-link" href="mailto:school@stbernadineusa.com"><span><span class="contact-label">Enrollment &amp; admissions</span><span class="contact-email">school@stbernadineusa.com</span></span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg></a></li>
          <li><a class="contact-link" href="mailto:placement@stbernadineusa.com"><span><span class="contact-label">Placement</span><span class="contact-email">placement@stbernadineusa.com</span></span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg></a></li>
          <li><a class="contact-link" href="mailto:info@stbernadineusa.com"><span><span class="contact-label">Inquiries &amp; referrals</span><span class="contact-email">info@stbernadineusa.com</span></span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg></a></li>
          <li><a class="contact-link" href="mailto:care@stbernadineusa.com"><span><span class="contact-label">Care requests</span><span class="contact-email">care@stbernadineusa.com</span></span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg></a></li>
          <li><a class="contact-link" href="mailto:apply@stbernadineusa.com"><span><span class="contact-label">Job applications</span><span class="contact-email">apply@stbernadineusa.com</span></span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg></a></li>
        </ul>
        <p class="contact-footnote">Online forms remain unavailable during maintenance.</p>
      </section>
    </main>
    <footer>
      <p>Thank you for your patience and understanding.</p>
      <p class="status">HTTP 503 &nbsp;&middot;&nbsp; Temporarily unavailable</p>
    </footer>
  </div>
</body>
</html>`;

module.exports = function maintenance(req, res) {
    res.set({
        'Retry-After': '3600',
        'Cache-Control': 'no-store, max-age=0',
        'X-Content-Type-Options': 'nosniff'
    });
    return res.status(503).type('html').send(page);
};
