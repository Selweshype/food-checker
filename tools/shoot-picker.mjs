import { chromium } from 'playwright'; import http from 'http'; import fs from 'fs'; import path from 'path';
const root=path.resolve('app'); const mime={'.html':'text/html','.js':'text/javascript','.webmanifest':'application/manifest+json','.svg':'image/svg+xml','.png':'image/png'};
const srv=http.createServer((q,r)=>{let p=q.url.split('?')[0]; if(p==='/')p='/index.html'; const f=path.join(root,p); if(!fs.existsSync(f)){r.writeHead(404);return r.end();} r.writeHead(200,{'content-type':mime[path.extname(f)]||'application/octet-stream'}); fs.createReadStream(f).pipe(r);}).listen(0);
const b=await chromium.launch(); const page=await b.newPage({viewport:{width:390,height:844},deviceScaleFactor:3,hasTouch:true,isMobile:true,locale:'nl-NL'});
await page.goto(`http://localhost:${srv.address().port}/index.html`); await page.waitForTimeout(300);
await page.tap('#t-zuivel'); await page.click('#picker [data-ml="300"]'); await page.click('#picker [data-ml="250"]'); await page.waitForTimeout(400);
await page.screenshot({path:process.argv[2]}); await b.close(); srv.close();
