'use strict';

const PAGES=new Set(['/forms','/contact','/inquiry','/home-care-inquiry','/request-care','/apply-job','/apply','/referral','/medical-form']);
const SUBMISSIONS=new Set(['/send-email','/send-contact','/send-placement','/request-care','/apply-job','/send-referral','/subscribe']);

function createFormsMaintenance({startsAt='1970-01-01T00:00:00.000Z',until,enabled=true,now=Date.now}={}) {
    const start=Date.parse(startsAt);
    const deadline=Date.parse(until);
    if(!Number.isFinite(start) || !Number.isFinite(deadline) || start>=deadline) throw new Error('A valid forms maintenance window is required.');
    const reopening=new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Manila',month:'long',day:'numeric',year:'numeric',hour:'numeric',minute:'2-digit',hour12:true}).format(new Date(deadline))+' Philippine time (UTC+8)';
    const contacts=[['Enrollment & admissions','school'],['Placement','placement'],['Inquiries & referrals','info'],['Care requests','care'],['Job applications','apply']].map(([label,mailbox])=>`<li><span>${label}</span><a href="mailto:${mailbox}@stbernadineusa.com">${mailbox}@stbernadineusa.com</a></li>`).join('');
    const html=`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Forms &amp; Inquiry Maintenance | St. Bernadine</title><style>*{box-sizing:border-box}body{margin:0;background:#f7f5f0;color:#354739;font:16px/1.7 Arial,sans-serif}.wrap{max-width:760px;margin:48px auto;padding:0 20px}.card{background:white;border:1px solid #e3e6df;border-top:5px solid #9c0a0a;border-radius:20px;overflow:hidden}.brand{text-align:center;padding:28px}.brand img{width:105px;height:auto}.hero{padding:32px;background:#1f4d1f;color:white}.label{text-transform:uppercase;letter-spacing:2px;font-size:11px;color:#f2d9ab}h1{font:normal 36px/1.2 Georgia,serif;margin:14px 0}p{margin:0 0 18px}.hero p{margin:0;color:#e7eee7}.body{padding:32px}.reopen{padding:20px;background:#f2f7ef;border:1px solid #dce6d7;border-radius:12px;margin-bottom:26px}.reopen strong,.reopen time{display:block}.reopen time{color:#1f4d1f;font-weight:bold;margin-top:6px}h2{font-size:20px;color:#1f4d1f;margin:24px 0 12px}ul{padding:0;list-style:none}li{padding:12px 0;border-bottom:1px solid #eee}li span,li a{display:block}li span{font-size:13px;color:#637063}a{color:#1f4d1f;overflow-wrap:anywhere}a:focus-visible{outline:3px solid #1f4d1f;outline-offset:4px}.back{display:inline-block;margin-top:16px;font-weight:bold}.foot{padding:18px 32px;background:#f7f5f0;font-size:12px;color:#637063}@media(max-width:480px){.wrap{margin:20px auto;padding:0 12px}.hero,.body{padding:26px 22px}h1{font-size:30px}.reopen{padding:16px}}</style></head><body><main class="wrap"><article class="card"><div class="brand"><img src="/asset/images/st-bernadine-email-logo-20261026.png" alt="St. Bernadine"></div><header class="hero"><div class="label">Temporary maintenance</div><h1>Forms &amp; Inquiry Pages</h1><p>Online submissions are temporarily paused for security maintenance and verification.</p></header><div class="body"><div class="reopen"><strong>Scheduled reopening</strong><time datetime="${new Date(deadline).toISOString()}">${reopening}</time></div><p>The rest of our website remains available. The forms will become available automatically when this maintenance window ends. Please contact the appropriate department directly by email if you need assistance in the meantime.</p><h2>Contact our teams</h2><ul>${contacts}</ul><a class="back" href="/">Return to the homepage</a></div><footer class="foot">Thank you for your patience. Direct department email remains available.</footer></article></main></body></html>`;
    return (req,res,next)=>{
        const current=now();
        if(!enabled || current<start || current>=deadline) return next();
        let route;
        try {route=decodeURIComponent(req.path).toLowerCase().replace(/\/+$/,'').replace(/\.html$/,'');}
        catch {return next();}
        const page=['GET','HEAD'].includes(req.method) && PAGES.has(route);
        const submission=!['GET','HEAD','OPTIONS'].includes(req.method) && SUBMISSIONS.has(route);
        const config=route==='/api/form-protection';
        if(!page && !submission && !config) return next();
        res.set({'Cache-Control':'no-store, max-age=0','Retry-After':new Date(deadline).toUTCString(),'X-Content-Type-Options':'nosniff','X-Robots-Tag':'noindex'});
        if(page) return res.status(503).type('html').send(html);
        return res.status(503).json({code:'FORMS_MAINTENANCE',error:'Online forms are temporarily unavailable. Scheduled reopening: '+reopening+'. Please contact the appropriate department directly by email.',reopensAt:new Date(deadline).toISOString(),timeZone:'Asia/Manila'});
    };
}

module.exports={createFormsMaintenance};
