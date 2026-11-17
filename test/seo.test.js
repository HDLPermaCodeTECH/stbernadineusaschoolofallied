'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const express = require('express');
const http = require('node:http');
const { canonicalPageRedirect } = require('../seo_routes');
const hardening = require('../security_hardening');
const root = path.join(__dirname, '..');
const origin = 'https://stbernadineusa.com';
const files = fs.readdirSync(root).filter(file => file.endsWith('.html') && !file.startsWith('google'))
    .concat(['about-us/index.html', 'school-of-allied-health-services/index.html']);
const route = file => file === 'index.html' ? '/' : file.endsWith('/index.html') ? '/' + file.slice(0, -10) : '/' + file.slice(0, -5);
const canonical = file => origin + route(file);
const content = file => fs.readFileSync(path.join(root, file), 'utf8');

let server, base;
test.before(async () => {
    const app = express();
    app.use(canonicalPageRedirect(root));
    app.use(hardening.publicFileGate(root));
    app.use(express.static(root, { extensions: ['html'] }));
    app.post('/send-contact', (req, res) => res.json({ accepted: true }));
    server = await new Promise(resolve => { const instance = app.listen(0, '127.0.0.1', () => resolve(instance)); });
    base = 'http://127.0.0.1:' + server.address().port;
});
test.after(() => new Promise(resolve => server.close(resolve)));

test('Every public page has one unique title, description and direct canonical URL', () => {
    assert.equal(files.length, 35);
    const titles = new Set(), descriptions = new Set();
    for (const file of files) {
        const html = content(file), head = html.split('</head>')[0];
        const title = [...head.matchAll(/<title>(.*?)<\/title>/gs)];
        const description = [...head.matchAll(/<meta name="description" content="([^"]*)">/g)];
        const links = [...head.matchAll(/<link rel="canonical" href="([^"]*)">/g)];
        assert.equal(title.length, 1, file);
        assert.equal(description.length, 1, file);
        assert.ok(description[0][1].length > 70, file);
        assert.equal(links.length, 1, file);
        assert.equal(links[0][1], canonical(file), file);
        assert.ok(!titles.has(title[0][1]), file); titles.add(title[0][1]);
        assert.ok(!descriptions.has(description[0][1]), file); descriptions.add(description[0][1]);
        assert.match(head, /<meta property="og:url" content="https:\/\/stbernadineusa.com\//);
        assert.ok(head.includes('property="og:url" content="' + canonical(file) + '"'), file);
        assert.doesNotMatch(head, /<meta name="robots" content="[^"]*noindex/);
    }
});

test('Sitemap covers exactly the canonical pages and only direct destinations return 200', async () => {
    const sitemap = content('sitemap.xml');
    const locations = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1]);
    assert.deepEqual(new Set(locations), new Set(files.map(canonical)));
    assert.equal(locations.length, files.length);
    for (const url of locations) {
        const response = await fetch(base + new URL(url).pathname, { redirect: 'manual' });
        assert.equal(response.status, 200, url);
        assert.match(response.headers.get('content-type'), /text\/html/);
        await response.arrayBuffer();
    }
    assert.match(content('robots.txt'), /Sitemap: https:\/\/stbernadineusa.com\/sitemap.xml/);
    assert.doesNotMatch(content('robots.txt'), /Disallow:\s*\/$/m);
});

test('Structured data is valid JSON, matches page identity and uses one organization identity', () => {
    for (const file of files) {
        const scripts = [...content(file).matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)];
        assert.equal(scripts.length, 1, file);
        const data = JSON.parse(scripts[0][1]);
        const page = data['@graph'].find(item => item['@id'] === canonical(file) + '#webpage');
        assert.equal(page.url, canonical(file));
        assert.equal(page.isPartOf['@id'], origin + '/#website');
        const org = data['@graph'].find(item => item['@id'] === origin + '/#organization');
        assert.equal(org.telephone, '+1-201-222-1116');
        assert.equal(org.address.addressLocality, 'Jersey City');
        assert.doesNotMatch(scripts[0][1], /www\.stbernadineusa\.com|stbernadineschool|linkedin|"aggregateRating"/);
        for (const course of data['@graph'].filter(item => item['@type'] === 'Course')) {
            assert.equal(course.provider['@id'], org['@id']);
            assert.equal(course.url, canonical(file));
            assert.equal(course.offers, undefined, 'Registration charges must not be presented as total course prices');
        }
    }
});

test('Page aliases preserve query parameters in one permanent redirect', async () => {
    const cases = [['/index.html','/'], ['/index','/'], ['/CONTACT.html','/contact'], ['/contact/','/contact'],
        ['/about-us','/about-us/'], ['/about-us/index.html','/about-us/'], ['/school-of-allied-health-services/index','/school-of-allied-health-services/']];
    for (const [alias, target] of cases) {
        const response = await fetch(base + alias + '?category=enrollment&source=seo', { redirect:'manual' });
        assert.equal(response.status, 301, alias);
        assert.equal(response.headers.get('location'), target + '?category=enrollment&source=seo');
    }
    const www = await new Promise((resolve, reject) => {
        http.get(base + '/contact.html?category=care', {headers: {Host:'www.stbernadineusa.com'}}, response => {
            response.resume(); resolve(response);
        }).on('error', reject);
    });
    assert.equal(www.statusCode, 301);
    assert.equal(www.headers.location, origin + '/contact?category=care');
});

test('Verification file and form POSTs remain available while server source stays private', async () => {
    const verification = fs.readdirSync(root).find(file => /^google.*\.html$/.test(file));
    const response = await fetch(base + '/' + verification, { redirect:'manual' });
    assert.equal(response.status, 200);
    assert.match(await response.text(), /google-site-verification/);
    assert.equal((await fetch(base + '/send-contact', {method:'POST', redirect:'manual'})).status, 200);
    assert.equal((await fetch(base + '/seo_routes.js')).status, 403);
    assert.equal((await fetch(base + '/server.js')).status, 403);
});
