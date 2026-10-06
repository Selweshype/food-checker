// screenshots of the portion sheets: node tools/shoot-sheets.mjs <outdir>
import { chromium } from 'playwright'; import http from 'http'; import fs from 'fs'; import path from 'path';
const root=path.resolve('app'); const out=process.argv[2]; fs.mkdirSync(out,{recursive:true});
const mime={'.html':'text/html','.js':'text/javascript','.webmanifest':'application/manifest+json','.svg':'image/svg+xml','.png':'image/png'};
const srv=http.createServer((q,r)=>{let p=q.url.split('?')[0]; if(p==='/')p='/index.html'; const f=path.join(root,p); if(!fs.existsSync(f)){r.writeHead(404);return r.end();} r.writeHead(200,{'content-type':mime[path.extname(f)]||'application/octet-stream'}); fs.createReadStream(f).pipe(r);}).listen(0);
const key=(()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')})();
const b=await chromium.launch(); const page=await b.newPage({viewport:{width:393,height:659},deviceScaleFactor:3,hasTouch:true,isMobile:true,locale:'nl-NL'});
await page.goto(`http://localhost:${srv.address().port}/index.html`);
await page.evaluate(k=>{localStorage.setItem('voedingscheck.v1.seen','1');localStorage.setItem('voedingscheck.v1',JSON.stringify({date:k,counts:{fruit:2,kaas:1},modes:{},portions:{volkoren:[70,35,70],zuivel:[300,250,180,120]}}))},key);
await page.reload(); await page.waitForTimeout(300);
await page.screenshot({path:path.join(out,'home.png')});
await page.tap('#t-volkoren'); await page.waitForTimeout(250); await page.click('#otherBtn'); await page.fill('#otherInput','50'); await page.waitForTimeout(250);
await page.screenshot({path:path.join(out,'volkoren-anders.png')});
await page.click('#closePicker'); await page.tap('#t-zuivel'); await page.waitForTimeout(350);
await page.screenshot({path:path.join(out,'zuivel-over.png')});
await b.close(); srv.close();
