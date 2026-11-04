'use strict';
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');

const JSON_LIMIT = 64 * 1024;
const UPLOAD_DIRECTORY = path.join(os.tmpdir(), 'stbernadine-private-uploads');
const POST_PATHS = new Set(['/chat', '/send-email', '/send-contact', '/send-placement', '/request-care', '/apply-job', '/send-referral', '/subscribe']);
const UPLOAD_PATHS = new Set(['/send-email', '/apply-job']);
const SITE_ORIGINS = new Set(['https://stbernadineusa.com', 'https://www.stbernadineusa.com']);
const EXTENSIONS = { 'application/pdf':['.pdf'], 'image/png':['.png'], 'image/jpeg':['.jpg','.jpeg'], 'application/msword':['.doc'], 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':['.docx'] };
const MULTIPART_LIMITS = Object.freeze({ fileSize:5*1024*1024, files:10, fields:100, fieldSize:128*1024, parts:110, fieldNameSize:100, headerPairs:100 });
// Match Express's default case-insensitive, optional trailing-slash routing.
const endpointPath = req => req.path.toLowerCase().replace(/\/$/,'');

function trustedOrigin(origin, env=process.env) {
    if (SITE_ORIGINS.has(origin)) return true;
    if (!['test','development'].includes(env.NODE_ENV)) return false;
    try { const url=new URL(origin); return ['http:','https:'].includes(url.protocol) && ['localhost','127.0.0.1','[::1]'].includes(url.hostname) && origin===url.origin; }
    catch { return false; }
}

function requestGuard(req, res, next) {
    const endpoint=endpointPath(req);
    if (req.method !== 'POST' || !POST_PATHS.has(endpoint)) return next();
    const origin=req.get('origin');
    if ((origin && !trustedOrigin(origin)) || req.get('sec-fetch-site')==='cross-site') return res.status(403).json({error:'This request must be sent from the St. Bernadine website.'});
    const type=String(req.get('content-type')||'').split(';')[0].trim().toLowerCase();
    const multipart=type==='multipart/form-data' && UPLOAD_PATHS.has(endpoint);
    if (type!=='application/json' && !multipart) return res.status(415).json({error:'This request has an unsupported content type.'});
    const length=req.get('content-length');
    const limit=multipart ? 52*1024*1024 : JSON_LIMIT;
    if (length && (!/^\d+$/.test(length) || Number(length)>limit)) return res.status(413).json({error:'This request exceeds the permitted size. Please reduce its contents.'});
    next();
}

function flatJsonGuard(req, res, next) {
    if (req.method!=='POST' || !POST_PATHS.has(endpointPath(req)) || !req.is('application/json')) return next();
    const data=req.body;
    if (!data || Array.isArray(data) || typeof data!=='object' || Object.keys(data).length>100 || Object.entries(data).some(([key,value])=>['__proto__','constructor','prototype'].includes(key) || (value!==null && typeof value==='object'))) {
        const details=data && !Array.isArray(data) && typeof data==='object' ? Object.entries(data).filter(([,value])=>value!==null && typeof value==='object').map(([key])=>({path:key,msg:'Use a text value for this field.'})) : [];
        return res.status(400).json({error:'Please submit valid form fields without nested data.',details});
    }
    next();
}

function limitConcurrency(maximum) {
    let active=0;
    return (req,res,next) => {
        if(req.method!=='POST') return next();
        if(active>=maximum) return res.set('Retry-After','10').status(429).json({error:'This service is busy. Please wait a moment before trying again.'});
        active++; let released=false;
        const release=()=>{if(!released){released=true;active--;}};
        res.once('finish',release); res.once('close',release);
        next();
    };
}

function publicFileGate(root) {
    const pages=new Set(['/']);
    for (const file of fs.readdirSync(root,{withFileTypes:true})) {
        if (file.isFile() && file.name.endsWith('.html')) { pages.add('/'+file.name); pages.add('/'+file.name.slice(0,-5)); }
    }
    for (const directory of ['about-us','school-of-allied-health-services']) {
        if (fs.existsSync(path.join(root,directory,'index.html'))) for (const suffix of ['', '/', '/index', '/index.html']) pages.add('/'+directory+suffix);
    }
    const publicRoot=new Set(['/sw.js','/manifest.json','/favicon.ico','/favicon.png','/robots.txt','/sitemap.xml']);
    const licenses=new Set(['/asset/vendor/fontawesome/LICENSE.txt','/asset/vendor/fonts/poppins-OFL.txt','/asset/vendor/fonts/inter-OFL.txt']);
    return (req,res,next) => {
        if (!['GET','HEAD'].includes(req.method)) return next();
        let decoded;
        try { decoded=decodeURIComponent(req.path); } catch { return res.status(400).json({error:'Invalid request path.'}); }
        const unsafe=/[\0\\]/.test(decoded) || decoded.split('/').some(part=>part==='..' || part.startsWith('.')) || /(?:^|\/)(?:node_modules|uploads|test|tools|scratch)(?:\/|$)/i.test(decoded);
        if (unsafe) return res.status(403).json({error:'Access denied.'});
        if (decoded==='/health' || decoded==='/api/form-protection' || pages.has(decoded) || publicRoot.has(decoded) || licenses.has(decoded)) return next();
        if (decoded.startsWith('/asset/') && /\.(?:css|js|png|jpe?g|webp|gif|svg|ico|woff2?|ttf|otf|eot|mp4|webm|pdf)$/i.test(decoded)) return next();
        return res.status(403).json({error:'Access denied.'});
    };
}

function ensureUploadDirectory() { fs.mkdirSync(UPLOAD_DIRECTORY,{recursive:true,mode:0o700}); return UPLOAD_DIRECTORY; }
function privateUploadName(req,file,callback) {
    const extension=EXTENSIONS[file.mimetype]?.[0] || '.bin';
    const filename=crypto.randomUUID()+extension;
    (req.privateUploadPaths ||= new Set()).add(path.join(UPLOAD_DIRECTORY,filename));
    callback(null,filename);
}

function cleanupUploads(req) {
    const paths=new Set(req.privateUploadPaths || []);
    const files=Array.isArray(req.files) ? req.files : Object.values(req.files || {}).flat();
    for (const file of files) paths.add(file.path);
    for (const filename of paths) {
        const remove=(attempt=0)=>fs.unlink(filename,error=>{
            if (error && ['EBUSY','EPERM'].includes(error.code) && attempt<3) { const timer=setTimeout(()=>remove(attempt+1),100); timer.unref(); }
            else if (error && error.code!=='ENOENT') console.error('[UPLOAD_CLEANUP_FAILED]',JSON.stringify({code:error.code}));
        });
        remove();
    }
}

async function isWordPackage(handle,size) {
    const tail=Buffer.alloc(Math.min(size,65557));
    await handle.read(tail,0,tail.length,size-tail.length);
    let end=-1;
    for (let at=tail.length-22;at>=0;at--) if (tail.readUInt32LE(at)===0x06054b50) { end=at;break; }
    if (end<0 || tail.readUInt16LE(end+4)!==0 || tail.readUInt16LE(end+6)!==0) return false;
    const count=tail.readUInt16LE(end+10), length=tail.readUInt32LE(end+12), offset=tail.readUInt32LE(end+16);
    if (!count || count>2048 || length>512*1024 || offset+length>size-tail.length+end) return false;
    const directory=Buffer.alloc(length); await handle.read(directory,0,length,offset);
    const names=new Set(); let cursor=0;
    for(let entry=0;entry<count;entry++) {
        if(cursor+46>directory.length || directory.readUInt32LE(cursor)!==0x02014b50 || (directory.readUInt16LE(cursor+8)&1)) return false;
        const n=directory.readUInt16LE(cursor+28), extra=directory.readUInt16LE(cursor+30), comment=directory.readUInt16LE(cursor+32);
        if(cursor+46+n+extra+comment>directory.length) return false;
        const name=directory.subarray(cursor+46,cursor+46+n).toString('utf8');
        if(name.includes('..') || /[\0\\]/.test(name) || name.startsWith('/')) return false;
        names.add(name); cursor+=46+n+extra+comment;
    }
    return names.has('[Content_Types].xml') && names.has('word/document.xml');
}

async function validUploadedFile(file) {
    if (!EXTENSIONS[file.mimetype]?.includes(path.extname(file.originalname).toLowerCase())) return false;
    const handle=await fs.promises.open(file.path,'r');
    try {
        const size=(await handle.stat()).size, header=Buffer.alloc(32);
        if(size<8) return false;
        await handle.read(header,0,header.length,0);
        if(file.mimetype==='application/pdf') return header.subarray(0,5).equals(Buffer.from('%PDF-'));
        if(file.mimetype==='image/png') return size>=24 && pngDimensionsAllowed(header,20000000);
        if(file.mimetype==='image/jpeg') {
            if(!header.subarray(0,3).equals(Buffer.from('ffd8ff','hex'))) return false;
            const bytes=Buffer.alloc(Math.min(size,1024*1024)); await handle.read(bytes,0,bytes.length,0);
            let at=2;
            while(at+4<bytes.length) {
                if(bytes[at++]!==0xff) return false;
                while(bytes[at]===0xff) at++;
                const marker=bytes[at++];
                if(marker===0xda || marker===0xd9 || at+2>bytes.length) return false;
                const length=bytes.readUInt16BE(at);
                if(length<2 || at+length>bytes.length) return false;
                if([0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf].includes(marker)) {
                    return length>=8 && dimensionsAllowed(bytes.readUInt16BE(at+5),bytes.readUInt16BE(at+3),20000000);
                }
                at+=length;
            }
            return false;
        }
        if(file.mimetype==='application/msword') return header.subarray(0,8).equals(Buffer.from('d0cf11e0a1b11ae1','hex'));
        return header.readUInt32LE(0)===0x04034b50 && await isWordPackage(handle,size);
    } finally {await handle.close();}
}

function dimensionsAllowed(width,height,pixels) { return width>0 && height>0 && width<=12000 && height<=12000 && width*height<=pixels; }
function pngDimensionsAllowed(header,pixels) {
    return header.length>=24 && header.subarray(0,8).equals(Buffer.from('89504e470d0a1a0a','hex')) && header.toString('ascii',12,16)==='IHDR' && dimensionsAllowed(header.readUInt32BE(16),header.readUInt32BE(20),pixels);
}

async function validateUploads(req,res,next) {
    try {
        if(req.body?.SignatureData) {
            const signature=req.body.SignatureData;
            if(typeof signature!=='string' || signature.length>128*1024 || !/^data:image\/png;base64,[A-Za-z0-9+/]+={0,2}$/.test(signature) || !pngDimensionsAllowed(Buffer.from(signature.slice('data:image/png;base64,'.length),'base64'),2000000)) {
                return res.status(400).json({error:'Please redraw your signature as a valid, reasonably sized image.'});
            }
        }
        const files=Array.isArray(req.files) ? req.files : Object.values(req.files || {}).flat();
        for(const file of files) if(!await validUploadedFile(file)) return res.status(400).json({error:'An uploaded file has an invalid format or image size. Use a valid PDF, DOC, DOCX, JPG or PNG file; photos must be 20 megapixels or smaller.'});
        next();
    } catch {return res.status(400).json({error:'The uploaded file could not be checked. Please select a valid file and try again.'});}
}

module.exports={JSON_LIMIT,UPLOAD_DIRECTORY,MULTIPART_LIMITS,trustedOrigin,requestGuard,flatJsonGuard,limitConcurrency,publicFileGate,ensureUploadDirectory,privateUploadName,cleanupUploads,validUploadedFile,validateUploads};
