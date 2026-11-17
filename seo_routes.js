'use strict';
const fs = require('node:fs');
const path = require('node:path');

// Only public page aliases are normalized. Form POSTs and verification files
// retain their original routes, and unknown paths still reach the public gate.
function canonicalPageRedirect(directory) {
    const routes = new Map();
    for (const file of fs.readdirSync(directory)) {
        if (!file.endsWith('.html') || file.startsWith('google')) continue;
        const stem = file.slice(0, -5);
        const target = stem === 'index' ? '/' : '/' + stem;
        for (const alias of ['/' + file, '/' + stem, '/' + stem + '/']) routes.set(alias, target);
    }
    for (const folder of ['about-us', 'school-of-allied-health-services']) {
        if (!fs.existsSync(path.join(directory, folder, 'index.html'))) continue;
        const target = '/' + folder + '/';
        for (const suffix of ['', '/', '/index', '/index/', '/index.html']) routes.set('/' + folder + suffix, target);
    }
    routes.set('/', '/');
    return (req, res, next) => {
        if (!['GET', 'HEAD'].includes(req.method)) return next();
        const canonical = routes.get(req.path.toLowerCase());
        const queryAt = req.url.indexOf('?');
        const query = queryAt < 0 ? '' : req.url.slice(queryAt);
        const www = String(req.headers.host || '').toLowerCase() === 'www.stbernadineusa.com';
        if (www) return res.redirect(301, 'https://stbernadineusa.com' + (canonical || req.path) + query);
        if (canonical && canonical !== req.path) return res.redirect(301, canonical + query);
        next();
    };
}

module.exports = { canonicalPageRedirect };
