'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const express=require('express');
const {limitConcurrency,trustedOrigin}=require('../security_hardening');

test('Production request origins exclude third-party sites and development localhost',()=>{
    for(const origin of ['https://stbernadineusa.com','https://www.stbernadineusa.com']) assert.equal(trustedOrigin(origin,{NODE_ENV:'production'}),true);
    for(const origin of ['null','https://attacker.example','https://stbernadineusa.com.attacker.example','http://localhost:5500','https://hdlpermacodetech.github.io']) assert.equal(trustedOrigin(origin,{NODE_ENV:'production'}),false,origin);
    assert.equal(trustedOrigin('http://127.0.0.1:3183',{NODE_ENV:'test'}),true);
});

test('Concurrent work is bounded and available capacity returns after a response',async()=>{
    const app=express(); const pending=[]; const arrivals=[];
    app.post('/work',limitConcurrency(2),(req,res)=>{pending.push(()=>res.json({ok:true}));if(arrivals.length)arrivals.shift()();});
    const server=await new Promise(resolve=>{const s=app.listen(0,'127.0.0.1',()=>resolve(s));});
    const url='http://127.0.0.1:'+server.address().port+'/work';
    try {
        const arrive1=new Promise(resolve=>arrivals.push(resolve));const first=fetch(url,{method:'POST'});await arrive1;
        const arrive2=new Promise(resolve=>arrivals.push(resolve));const second=fetch(url,{method:'POST'});await arrive2;
        const rejected=await fetch(url,{method:'POST'});assert.equal(rejected.status,429);assert.equal(rejected.headers.get('retry-after'),'10');
        pending.shift()();await first;
        const arrive3=new Promise(resolve=>arrivals.push(resolve));const third=fetch(url,{method:'POST'});await arrive3;
        pending.shift()();pending.shift()();assert.equal((await second).status,200);assert.equal((await third).status,200);
    } finally {pending.forEach(done=>done());await new Promise(resolve=>server.close(resolve));}
});
