// crop an App Store carousel screenshot to the phone frame, output at 1170x2532-ish aspect
import { chromium } from 'playwright'; import fs from 'fs'; import path from 'path';
const [,, src, out] = process.argv;
const b=await chromium.launch(); const p=await b.newPage({viewport:{width:390,height:844},deviceScaleFactor:3});
const data='data:image/png;base64,'+fs.readFileSync(src).toString('base64');
// the frame in the carousel spans roughly x 10%..90%, y 14.6%..95% of the image; the inner content is 390x844 scaled
await p.setContent(`<html><body style="margin:0;background:#000;overflow:hidden"><img id="i" src="${data}" style="position:absolute"></body></html>`);
await p.evaluate(()=>new Promise(r=>{const i=document.getElementById('i'); if(i.complete) r(); else i.onload=r;}));
const dim=await p.evaluate(()=>{const i=document.getElementById('i');return {w:i.naturalWidth,h:i.naturalHeight}});
// frame box measured on the 923x2000 displayed carousel: x 95..830, y 292..1898
const fx=95/923*dim.w, fy=292/2000*dim.h, fw=(830-95)/923*dim.w, fh=(1898-292)/2000*dim.h;
const scale=390/fw;
await p.evaluate(({fx,fy,scale,w,h})=>{const i=document.getElementById('i'); i.style.width=(w*scale)+'px'; i.style.height=(h*scale)+'px'; i.style.left=(-fx*scale)+'px'; i.style.top=(-fy*scale)+'px';},{fx,fy,scale,w:dim.w,h:dim.h});
await p.screenshot({path:out}); await b.close(); console.log('cropped', out);
