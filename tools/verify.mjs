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
ok('app version matches service worker cache', (()=>{const v=(fs.readFileSync('app/index.html','utf8').match(/const VERSION='(v\d+)'/)||[])[1]; return !!v && fs.readFileSync('app/sw.js','utf8').includes('voedingscheck-'+v);})());
ok('PWA meta present', /apple-mobile-web-app-capable/.test(html) && /rel="manifest"/.test(html) && /apple-touch-icon/.test(html));
// feedback round 1
await page.evaluate(()=>localStorage.removeItem('voedingscheck.v1')); await page.reload(); await page.waitForTimeout(300);
await page.tap('#t-zuivel'); await page.waitForTimeout(150);
ok('zuivel tap opens portion picker', await page.locator('#picker.open').count()===1 && (await page.locator('#picker [data-ml]').count())===4);
ok('zuivel tap adds nothing by itself', (await page.textContent('#t-zuivel .v'))==='0');
await page.click('#picker [data-ml="300"]'); await page.click('#picker [data-ml="250"]'); await page.waitForTimeout(100);
ok('portions sum to 550 ml', (await page.textContent('#t-zuivel .v'))==='550' && /nog 250 ml tot 800/.test(await page.textContent('#t-zuivel .amt')));
ok('button that would pass 800 warns "te veel"', /te veel/.test(await page.textContent('#picker [data-ml="300"]')) && !/te veel/.test(await page.textContent('#picker [data-ml="250"]')));
await page.click('#otherBtn'); await page.waitForTimeout(80);
ok('Anders opens a number field', await page.locator('#otherForm:not([hidden])').count()===1 && (await page.getAttribute('#otherInput','inputmode'))==='numeric');
ok('Anders button hides while the field is open', !(await page.isVisible('#otherBtn')));
await page.fill('#otherInput','180'); await page.press('#otherInput','Enter'); await page.waitForTimeout(100);
ok('Anders 180 ml adds to 730 ml', (await page.textContent('#t-zuivel .v'))==='730' && await page.locator('#t-zuivel.done').count()===1);
await page.click('#otherBtn'); await page.fill('#otherInput',''); await page.press('#otherInput','Enter'); await page.waitForTimeout(80);
ok('empty Anders adds nothing', (await page.textContent('#t-zuivel .v'))==='730');
await page.fill('#otherInput','120'); await page.press('#otherInput','Enter'); await page.waitForTimeout(100);
ok('over 800 is logged, not blocked', (await page.textContent('#t-zuivel .v'))==='850');
ok('over 800 shows "50 ml te veel" in red', /50 ml te veel/.test(await page.textContent('#t-zuivel .amt')) && await page.locator('#t-zuivel.over').count()===1 && await page.locator('#t-zuivel.done').count()===0);
ok('zuivel over limit does not count as goal met', (await page.getAttribute('#total','data-frac')).startsWith('0/'));
await page.click('#closePicker'); await page.click('#t-zuivel .minus'); await page.waitForTimeout(100);
ok('minus removes only the last portion', (await page.textContent('#t-zuivel .v'))==='730');
await page.reload(); await page.waitForTimeout(300);
ok('portions survive reload', (await page.textContent('#t-zuivel .v'))==='730');
// volkoren in grams
await page.tap('#t-volkoren'); await page.waitForTimeout(150);
ok('volkoren picker shows 35/70/105 with slice counts', (await page.locator('#picker [data-ml]').count())===3 && /1 snee/.test(await page.textContent('#picker [data-ml="35"]')) && /2 sneetjes/.test(await page.textContent('#picker [data-ml="70"]')) && /3 sneetjes/.test(await page.textContent('#picker [data-ml="105"]')));
await page.click('#picker [data-ml="105"]'); await page.click('#picker [data-ml="105"]'); await page.click('#picker [data-ml="70"]'); await page.waitForTimeout(100);
ok('volkoren 280 g fills the ring', (await page.textContent('#t-volkoren .v'))==='280' && await page.locator('#t-volkoren.done').count()===1);
await page.click('#otherBtn'); await page.fill('#otherInput','35'); await page.press('#otherInput','Enter'); await page.waitForTimeout(100);
ok('volkoren 315 g shows "35 g te veel"', /35 g te veel/.test(await page.textContent('#t-volkoren .amt')) && await page.locator('#t-volkoren.over').count()===1);
await page.click('#closePicker');
// rounding to half slices (17,5 g)
await page.evaluate(()=>localStorage.removeItem('voedingscheck.v1')); await page.reload(); await page.waitForTimeout(300);
await page.tap('#t-volkoren'); await page.waitForTimeout(150); await page.click('#otherBtn');
await page.fill('#otherInput','50'); await page.waitForTimeout(80);
ok('typing 50 g previews 52,5 g and 1,5 sneetjes', /52,5 g/.test(await page.textContent('#otherHint')) && /1,5 sneetjes/.test(await page.textContent('#otherHint')));
await page.press('#otherInput','Enter'); await page.waitForTimeout(100);
ok('50 g is logged as 52,5 g', (await page.textContent('#t-volkoren .v'))==='52,5' && /nog 227,5 g tot 280/.test(await page.textContent('#t-volkoren .amt')));
await page.click('#otherBtn'); await page.fill('#otherInput','40'); await page.press('#otherInput','Enter'); await page.waitForTimeout(100);
ok('40 g rounds down to 35 g', (await page.textContent('#t-volkoren .v'))==='87,5');
await page.click('#otherBtn'); await page.fill('#otherInput','5'); await page.press('#otherInput','Enter'); await page.waitForTimeout(100);
ok('5 g is less than half a slice and adds nothing', (await page.textContent('#t-volkoren .v'))==='87,5');
ok('sheet shows total in slices', /2,5 sneetjes/.test(await page.textContent('#picker .now')));
await page.click('#closePicker');
await page.tap('#t-zuivel'); await page.waitForTimeout(150); await page.click('#otherBtn'); await page.fill('#otherInput','183'); await page.press('#otherInput','Enter'); await page.waitForTimeout(100);
ok('zuivel Anders stays exact (183 ml)', (await page.textContent('#t-zuivel .v'))==='183');
await page.click('#closePicker');
// migration: yesterday's app stored slices as a count
await page.evaluate(k=>localStorage.setItem('voedingscheck.v1',JSON.stringify({date:k,counts:{volkoren:5},modes:{},portions:{}})),await page.evaluate(()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}));
await page.reload(); await page.waitForTimeout(300);
ok('5 logged slices convert to 175 g', (await page.textContent('#t-volkoren .v'))==='175');
await page.evaluate(()=>localStorage.removeItem('voedingscheck.v1')); await page.reload(); await page.waitForTimeout(300);
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
await page.evaluate(()=>{const p=document.getElementById('pages'); p.scrollTo({left:0,behavior:'instant'});}); await page.waitForTimeout(150);
await page.click('#t-eiwit [data-help]'); await page.waitForTimeout(100);
ok('eiwitpoeder help sheet says 25–30 gram', await page.locator('#info.open').count()===1 && /25–30 gram/.test(await page.textContent('#info p')));
await page.click('#closeInfo');
ok('eiwitpoeder count unchanged by help tap', (await page.textContent('#t-eiwit .v'))==='0');
// App vernieuwen keeps today's data and reloads with fresh files
await page.evaluate(()=>{const p=document.getElementById('pages'); p.scrollTo({left:p.clientWidth,behavior:'instant'});}); await page.waitForTimeout(150);
await page.tap('#t-fruit').catch(()=>{});
await page.evaluate(()=>{const p=document.getElementById('pages'); p.scrollTo({left:p.clientWidth,behavior:'instant'});}); await page.waitForTimeout(150);
await page.click('#more'); await page.waitForTimeout(80);
ok('Meer menu has App vernieuwen and shows the version', await page.isVisible('#refresh') && /v\d+/.test(await page.textContent('#ver')));
const before=await page.evaluate(()=>localStorage.getItem('voedingscheck.v1'));
await page.evaluate(()=>{window.__stale=true});
await Promise.all([page.waitForNavigation(), page.click('#refresh')]); await page.waitForTimeout(400);
ok('App vernieuwen reloads the page', await page.evaluate(()=>window.__stale!==true));
ok('App vernieuwen keeps today\'s data', (await page.evaluate(()=>localStorage.getItem('voedingscheck.v1')))===before);
ok('every tile has a glyph', await page.evaluate(()=>[...document.querySelectorAll('.tile[data-id] .icon svg')].every(sv=>sv.children.length>0)) && (await page.locator('.tile[data-id] .icon svg').count())===10);
ok('no page overflow', await page.evaluate(()=>document.documentElement.scrollHeight<=window.innerHeight+1));
for(const r of results) console.log(r.join('  '));
await b.close(); srv.close();
process.exit(results.some(r=>r[0]==='FAIL')?1:0);
