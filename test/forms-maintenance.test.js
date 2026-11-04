'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const express=require('express');
const {createFormsMaintenance}=require('../forms_maintenance');
const until='2026-11-04T17:00:00.000Z';
let current=Date.parse(until)-6*60*60*1000;
let server,base,passed=0;
test.before(async()=>{
    const app=express();
    app.use(createFormsMaintenance({until,now:()=>current}));
    app.use((req,res)=>{passed++;res.json({available:true});});
    server=await new Promise(resolve=>{const instance=app.listen(0,'127.0.0.1',()=>resolve(instance));});
    base='http://127.0.0.1:'+server.address().port;
});
test.after(()=>new Promise(resolve=>server.close(resolve)));

test('All form pages, HTML aliases, case variants and queries show scoped maintenance',async()=>{
    for(const route of ['/forms','/contact','/inquiry','/home-care-inquiry','/request-care','/apply-job','/apply','/referral','/medical-form','/CONTACT.html','/inquiry/?category=enrollment']) {
        const response=await fetch(base+route);
        assert.equal(response.status,503,route);
        assert.match(await response.text(),/Forms &amp; Inquiry Pages/);
        assert.match(response.headers.get('cache-control'),/no-store/);
        assert.equal(response.headers.get('retry-after'),new Date(until).toUTCString());
    }
    assert.equal((await fetch(base+'/contact',{method:'HEAD'})).status,503);
    assert.equal(passed,0);
});
test('Existing tabs and direct submissions cannot send mail during scoped maintenance',async()=>{
    for(const route of ['/send-email','/send-contact','/send-placement','/request-care','/apply-job','/send-referral','/subscribe','/SEND-CONTACT/']) {
        const response=await fetch(base+route,{method:'POST',body:'unparsed request'});
        assert.equal(response.status,503,route);
        const body=await response.json();
        assert.equal(body.code,'FORMS_MAINTENANCE');
        assert.equal(body.timeZone,'Asia/Manila');
        assert.equal(body.reopensAt,until);
    }
    assert.equal((await fetch(base+'/api/form-protection')).status,503);
    assert.equal(passed,0);
});
test('The public website, assets, chat and health remain available with clear Philippine reopening time',async()=>{
    for(const route of ['/','/placement','/home-care','/about-us/','/asset/site.css','/health']) assert.equal((await fetch(base+route)).status,200,route);
    assert.equal((await fetch(base+'/chat',{method:'POST'})).status,200);
    const html=await (await fetch(base+'/inquiry')).text();
    assert.match(html,/November 5, 2026/);
    assert.match(html,/1:00 AM Philippine time \(UTC\+8\)/);
});
test('Forms reopen automatically at the fixed deadline without extending the window on restart',async()=>{
    current=Date.parse(until);
    for(const [route,method] of [['/contact','GET'],['/send-contact','POST'],['/api/form-protection','GET']]) assert.equal((await fetch(base+route,{method})).status,200);
    const restarted=createFormsMaintenance({until,now:()=>current});
    let continued=false;
    restarted({path:'/inquiry',method:'GET'},{},()=>{continued=true;});
    assert.equal(continued,true);
});

test('The production window lasts exactly six hours and does not close forms before its start',()=>{
    const window=require('../forms_maintenance_window.json');
    assert.equal(Date.parse(window.until)-Date.parse(window.startsAt),6*60*60*1000);
    const middleware=createFormsMaintenance({...window,now:()=>Date.parse(window.startsAt)-1});
    let continued=false;
    middleware({path:'/contact',method:'GET'},{},()=>{continued=true;});
    assert.equal(continued,true);
});
