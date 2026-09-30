// Usage: node tools/shoot.mjs <outdir> [state]   states: empty|partial|done|all
import { chromium } from 'playwright';
import http from 'http'; import fs from 'fs'; import path from 'path';
const root = path.resolve('app');
const out = process.argv[2] || 'shots'; fs.mkdirSync(out, {recursive:true});
const which = process.argv[3] || 'all';
const mime = {'.html':'text/html','.js':'text/javascript','.webmanifest':'application/manifest+json','.svg':'image/svg+xml','.png':'image/png','.json':'application/json'};
const srv = http.createServer((req,res)=>{
  let p = decodeURIComponent(req.url.split('?')[0]); if(p==='/') p='/index.html';
  const f = path.join(root,p);
  if(!f.startsWith(root)||!fs.existsSync(f)){res.writeHead(404);return res.end();}
  res.writeHead(200,{'content-type':mime[path.extname(f)]||'application/octet-stream'}); fs.createReadStream(f).pipe(res);
}).listen(0);
const port = srv.address().port; const url=`http://localhost:${port}/index.html`;
const browser = await chromium.launch();
const ctx = await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:3,isMobile:true,hasTouch:true,locale:'nl-NL',colorScheme:'dark',
  userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'});
const page = await ctx.newPage();
const states = {
  empty: {},
  partial: {volkoren:5,zuivel:2,fruit:3,kaas:1,pindakaas:3,eiwit:1,groenten:1},
  done: {volkoren:8,zuivel:4,fruit:3,kaas:2,pindakaas:2,eiwit:1,groenten:1,graan:1,eiwitbron:1,olijfolie:1},
  over: {volkoren:3,kaas:3,pindakaas:4,fruit:1},
};
const d=new Date(); const key=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
for (const [name,counts] of Object.entries(states)) {
  if(which!=='all'&&which!==name) continue;
  await page.goto(url);
  await page.evaluate(([k,c])=>localStorage.setItem('voedingscheck.v1',JSON.stringify({date:k,counts:c})),[key,counts]);
  await page.reload(); await page.waitForTimeout(700);
  await page.screenshot({path:path.join(out,`${name}.png`)});
  await page.screenshot({path:path.join(out,`${name}-full.png`),fullPage:true});
  console.log('shot',name);
}
await browser.close(); srv.close();
