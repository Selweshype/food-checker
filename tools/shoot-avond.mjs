// Page 2 with long dinner labels on several phones, plus the Granen sheet. node tools/shoot-avond.mjs <outdir>
import { chromium } from 'playwright'; import http from 'http'; import fs from 'fs'; import path from 'path';
const root=path.resolve('app'); const out=process.argv[2]; fs.mkdirSync(out,{recursive:true});
const mime={'.html':'text/html','.js':'text/javascript','.webmanifest':'application/manifest+json','.svg':'image/svg+xml','.png':'image/png'};
const srv=http.createServer((q,r)=>{let p=q.url.split('?')[0]; if(p==='/')p='/index.html'; const f=path.join(root,p); if(!fs.existsSync(f)){r.writeHead(404);return r.end();} r.writeHead(200,{'content-type':mime[path.extname(f)]||'application/octet-stream'}); fs.createReadStream(f).pipe(r);}).listen(0);
const key=(()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')})();
const b=await chromium.launch(); let fails=0;
for(const [name,w,h] of [['SE_tab',375,548],['iPhone15_tab',393,659],['iPhone15_home',393,852]]){
  const page=await b.newPage({viewport:{width:w,height:h},deviceScaleFactor:3,hasTouch:true,isMobile:true,locale:'nl-NL'});
  await page.goto(`http://localhost:${srv.address().port}/index.html`);
  await page.evaluate(k=>{localStorage.setItem('voedingscheck.v1.seen','1');localStorage.setItem('voedingscheck.v1',JSON.stringify({date:k,counts:{groenten:1},modes:{graan:'cooked'},portions:{graan:[100,50],olijfolie:[]}}))},key);
  await page.reload(); await page.waitForTimeout(300);
  await page.evaluate(()=>{const p=document.getElementById('pages'); p.scrollTo({left:p.clientWidth,behavior:'instant'});}); await page.waitForTimeout(200);
  const bad=await page.evaluate(()=>{const f=document.querySelector('.foot').getBoundingClientRect().top; const t=[...document.querySelectorAll('#p2 > .tile')].map(x=>{const r=x.getBoundingClientRect(),l=x.querySelector('.label').getBoundingClientRect();return {top:r.top,bottom:Math.max(r.bottom,l.bottom),lw:l.width,cw:r.width}});
    const p=[]; t.forEach((a,i)=>{ if(a.bottom>f+1)p.push(`tile ${i+1} into footer`); if(a.lw>a.cw+1)p.push(`tile ${i+1} label too wide`); if(t[i+2]&&a.bottom>t[i+2].top+1)p.push(`tile ${i+1} overlaps row below`);}); return p;});
  console.log(`${bad.length?'FAIL':'PASS'}  page 2 ${name} ${w}x${h}${bad.length?'  → '+bad.join('; '):''}`); if(bad.length) fails++;
  await page.screenshot({path:path.join(out,`p2_${name}.png`)});
  if(name==='iPhone15_tab'){ await page.tap('#t-graan'); await page.waitForTimeout(350); await page.screenshot({path:path.join(out,'granen-sheet.png')}); await page.click('#closePicker');
    await page.tap('#t-olijfolie'); await page.waitForTimeout(350); await page.screenshot({path:path.join(out,'olie-sheet.png')}); }
  await page.close();
}
await b.close(); srv.close(); process.exit(fails?1:0);
