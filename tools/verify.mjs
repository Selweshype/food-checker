// Behaviour checks: persistence across reload, daily reset, service worker offline.
import { chromium } from 'playwright';
import http from 'http'; import fs from 'fs'; import path from 'path';
const root = path.resolve('app');
const mime = {'.html':'text/html','.js':'text/javascript','.webmanifest':'application/manifest+json','.svg':'image/svg+xml','.png':'image/png'};
let online = true;
const srv = http.createServer((req,res)=>{
  if(!online){res.destroy();return;}
  let p=req.url.split('?')[0]; if(p==='/')p='/index.html'; const f=path.join(root,p);
  if(!fs.existsSync(f)){res.writeHead(404);return res.end();}
  res.writeHead(200,{'content-type':mime[path.extname(f)]||'application/octet-stream'}); fs.createReadStream(f).pipe(res);
}).listen(0);
const url=`http://localhost:${srv.address().port}/index.html`;
const b=await chromium.launch(); const ctx=await b.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true,locale:'nl-NL'});
const page=await ctx.newPage(); const results=[];
const ok=(name,cond,extra='')=>{results.push([cond?'PASS':'FAIL',name,extra]);};
await page.goto(url); await page.waitForTimeout(300);
// 1. tap increments
await page.tap('#t-fruit'); await page.tap('#t-fruit'); await page.waitForTimeout(100);
ok('tap increments', (await page.textContent('#t-fruit .v'))==='2');
// 2. persists across reload
await page.reload(); await page.waitForTimeout(300);
ok('checks survive reload', (await page.textContent('#t-fruit .v'))==='2');
// 3. long-press decrements
const box=await page.locator('#t-fruit').boundingBox();
await page.mouse.move(box.x+box.width/2, box.y+box.height/2); await page.mouse.down(); await page.waitForTimeout(600); await page.mouse.up(); await page.waitForTimeout(100);
ok('long-press decrements', (await page.textContent('#t-fruit .v'))==='1');
// 4. goal caps at target, max allows one over-step
for(let i=0;i<5;i++) await page.tap('#t-fruit');
ok('goal caps at target', (await page.textContent('#t-fruit .v'))==='3');
for(let i=0;i<5;i++) await page.tap('#t-kaas');
ok('max shows over state at target+1', (await page.textContent('#t-kaas .v'))==='3' && await page.locator('#t-kaas.over').count()===1);
// 5. total ring counts goals only
ok('total counts goal items', (await page.getAttribute('#total','data-frac'))==='1/7');
// 6. daily reset: stored date != today -> empty
await page.evaluate(()=>{const s=JSON.parse(localStorage.getItem('voedingscheck.v1'));s.date='2000-01-01';localStorage.setItem('voedingscheck.v1',JSON.stringify(s));});
await page.reload(); await page.waitForTimeout(300);
ok('new day resets list', (await page.textContent('#t-fruit .v'))==='0' && (await page.getAttribute('#total','data-frac'))==='0/7');
// 7. service worker registered and serves offline
await page.waitForFunction(()=>navigator.serviceWorker.controller!==null || navigator.serviceWorker.getRegistrations().then(r=>r.length>0), null, {timeout:5000}).catch(()=>{});
await page.waitForTimeout(800);
const regs=await page.evaluate(async()=> (await navigator.serviceWorker.getRegistrations()).length);
ok('service worker registered', regs>0);
online=false; await ctx.setOffline(true);
let offlineOk=false; try{ await page.reload({timeout:8000}); await page.waitForTimeout(300); offlineOk=(await page.locator('#t-fruit').count())===1; }catch(e){offlineOk=false}
ok('page loads offline via service worker', offlineOk);
await ctx.setOffline(false); online=true;
// 8. manifest + apple meta present
const html=fs.readFileSync('app/index.html','utf8');
ok('PWA meta present', /apple-mobile-web-app-capable/.test(html) && /rel="manifest"/.test(html) && /apple-touch-icon/.test(html));
// feedback round 1
await page.evaluate(()=>localStorage.removeItem('voedingscheck.v1')); await page.reload(); await page.waitForTimeout(300);
await page.tap('#t-zuivel'); await page.waitForTimeout(80);
ok('zuivel counts in 125 ml steps', (await page.textContent('#t-zuivel .v'))==='125');
for(let i=0;i<4;i++) await page.tap('#t-zuivel');
ok('zuivel done at 625 ml (goal 600)', (await page.textContent('#t-zuivel .v'))==='625' && await page.locator('#t-zuivel.done').count()===1);
for(let i=0;i<3;i++) await page.tap('#t-zuivel');
ok('zuivel capped at 750 ml (max 800)', (await page.textContent('#t-zuivel .v'))==='750');
await page.click('#t-volkoren [data-help]'); await page.waitForTimeout(100);
ok('volkoren help sheet opens with 35 g text', await page.locator('#info.open').count()===1 && /35 gram/.test(await page.textContent('#info p')));
await page.click('#closeInfo');
ok('volkoren count unchanged by help tap', (await page.textContent('#t-volkoren .v'))==='0');
await page.evaluate(()=>{const p=document.getElementById('pages'); p.scrollTo({left:p.clientWidth,behavior:'instant'});}); await page.waitForTimeout(200);
ok('granen defaults to ongekookt', (await page.textContent('#t-graan .amt'))==='75–100 g');
await page.click('#t-graan [data-mode]'); await page.waitForTimeout(100);
ok('granen toggles to gekookt', (await page.textContent('#t-graan .amt'))==='200–250 g');
await page.reload(); await page.waitForTimeout(300);
ok('granen mode survives reload', (await page.textContent('#t-graan .amt'))==='200–250 g');
ok('every tile has a glyph', await page.evaluate(()=>[...document.querySelectorAll('.tile[data-id] .icon svg')].every(sv=>sv.children.length>0)) && (await page.locator('.tile[data-id] .icon svg').count())===10);
ok('no page overflow', await page.evaluate(()=>document.documentElement.scrollHeight<=window.innerHeight+1));
for(const r of results) console.log(r.join('  '));
await b.close(); srv.close();
process.exit(results.some(r=>r[0]==='FAIL')?1:0);
