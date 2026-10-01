// Checks that both pages fit without overlap on common phone sizes, in a Safari tab and standalone.
// node tools/fit-check.mjs [outdir]  -> PASS/FAIL per device, plus a contact sheet if outdir given
import { chromium } from 'playwright'; import http from 'http'; import fs from 'fs'; import path from 'path';
const root=path.resolve('app'); const out=process.argv[2];
const mime={'.html':'text/html','.js':'text/javascript','.webmanifest':'application/manifest+json','.svg':'image/svg+xml','.png':'image/png'};
const srv=http.createServer((q,r)=>{let p=q.url.split('?')[0]; if(p==='/')p='/index.html'; const f=path.join(root,p); if(!fs.existsSync(f)){r.writeHead(404);return r.end();} r.writeHead(200,{'content-type':mime[path.extname(f)]||'application/octet-stream'}); fs.createReadStream(f).pipe(r);}).listen(0);
const url=`http://localhost:${srv.address().port}/index.html`;
// visible CSS viewport: Safari tab = screen minus status bar and toolbars; standalone = full screen
const devices=[
  ['iPhone SE (tab)',375,548],['iPhone SE (home)',375,667],
  ['iPhone 13 mini (tab)',375,629],['iPhone 13 mini (home)',375,812],
  ['iPhone 15 (tab)',393,659],['iPhone 15 (home)',393,852],
  ['iPhone 15 Pro Max (tab)',430,739],['iPhone 15 Pro Max (home)',430,932],
  ['Android 360 (tab)',360,664],['Android 412 (home)',412,915],
];
const key=(()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')})();
const b=await chromium.launch(); let fails=0; const shots=[];
for(const [name,w,h] of devices){
  const page=await b.newPage({viewport:{width:w,height:h},deviceScaleFactor:2,isMobile:true,hasTouch:true,locale:'nl-NL'});
  await page.goto(url);
  await page.evaluate(k=>localStorage.setItem('voedingscheck.v1',JSON.stringify({date:k,counts:{volkoren:5,fruit:3,kaas:1,pindakaas:3,eiwit:1,groenten:1},portions:{zuivel:[300,250]},modes:{}})),key);
  await page.reload(); await page.waitForTimeout(250);
  const problems=[];
  for(const pg of ['p1','p2']){
    await page.evaluate(id=>{const p=document.getElementById('pages'); p.scrollTo({left:id==='p1'?0:p.clientWidth,behavior:'instant'});},pg); await page.waitForTimeout(120);
    const r=await page.evaluate(id=>{
      const foot=document.querySelector('.foot').getBoundingClientRect();
      const tiles=[...document.querySelectorAll(`#${id} > .tile`)].map(t=>{const rr=t.getBoundingClientRect(); const lab=t.querySelector('.label').getBoundingClientRect(); const ring=t.querySelector('.ring').getBoundingClientRect(); return {top:rr.top,bottom:Math.max(rr.bottom,lab.bottom),left:rr.left,right:rr.right,ring:ring.width,labW:lab.width,cellW:rr.width}});
      return {footTop:foot.top, vh:innerHeight, sw:document.documentElement.scrollWidth, iw:innerWidth, sh:document.documentElement.scrollHeight, tiles};
    },pg);
    if(r.sh>r.vh+1) problems.push(`${pg}: page scrolls vertically`);
    r.tiles.forEach((t,i)=>{ if(t.bottom>r.footTop+1) problems.push(`${pg} tile ${i+1} runs into footer by ${Math.round(t.bottom-r.footTop)}px`); if(t.labW>t.cellW+1) problems.push(`${pg} tile ${i+1} label wider than its cell`); });
    for(let i=0;i+2<r.tiles.length;i++){ const a=r.tiles[i], c=r.tiles[i+2]; if(a.bottom>c.top+1) problems.push(`${pg} row overlap between tile ${i+1} and ${i+3} by ${Math.round(a.bottom-c.top)}px`); }
    if(pg==='p1') problems.ring=Math.round(r.tiles[0].ring);
    if(out){ const f=path.join(out,`${name.replace(/[^a-z0-9]+/gi,'_')}_${pg}.png`); await page.screenshot({path:f}); shots.push([name,pg,f,w,h]); }
  }
  const ok=problems.length===0; if(!ok) fails++;
  console.log(`${ok?'PASS':'FAIL'}  ${name.padEnd(26)} ${w}x${h}  ring ${problems.ring}px${ok?'':'  → '+problems.join('; ')}`);
  await page.close();
}
if(out){
  const d=f=>'data:image/png;base64,'+fs.readFileSync(f).toString('base64');
  const p1=shots.filter(s=>s[1]==='p1');
  const pg=await b.newPage({viewport:{width:1700,height:1100},deviceScaleFactor:1});
  await pg.setContent(`<body style="margin:0;background:#111;color:#ddd;font:600 13px -apple-system,Arial;display:flex;flex-wrap:wrap;gap:14px;padding:14px;align-items:flex-end">${p1.map(([n,_,f,w,h])=>`<div><img src="${d(f)}" style="width:${w*0.55}px;height:${h*0.55}px;display:block;border-radius:10px"><div style="margin-top:4px">${n}</div></div>`).join('')}</body>`);
  await pg.waitForTimeout(300); await pg.screenshot({path:path.join(out,'contact.png'),fullPage:true});
}
await b.close(); srv.close(); process.exit(fails?1:0);
