'use strict';

const page = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Temporarily Unavailable | St. Bernadine</title>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; min-height: 100vh; display: grid; place-items: center; padding: 24px; background: #f4f7fb; color: #183453; font: 18px/1.6 system-ui, sans-serif; }
    main { width: 100%; max-width: 580px; padding: clamp(24px, 6vw, 48px); background: #fff; border-top: 5px solid #183453; border-radius: 8px; }
    .brand { font-size: 15px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; }
    h1 { margin: 24px 0 16px; font-size: clamp(28px, 6vw, 40px); line-height: 1.2; }
    p { margin: 16px 0 0; }
    .status { margin-top: 32px; color: #52647b; font-size: 14px; }
  </style>
</head>
<body>
  <main>
    <div class="brand">St. Bernadine</div>
    <h1>Temporarily unavailable</h1>
    <p>Our website is currently undergoing maintenance. Please check back later.</p>
    <p>Thank you for your patience.</p>
    <p class="status">503 &middot; Service Unavailable</p>
  </main>
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
