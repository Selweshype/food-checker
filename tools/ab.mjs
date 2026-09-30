// node tools/ab.mjs out.png imgA imgB [cropX cropY cropW cropH in 390x844 pt]  -> side-by-side, random order, prints mapping
import { chromium } from 'playwright'; import fs from 'fs';
const [,, out, i1, i2, c1, c2] = process.argv; // c1/c2: 'x,y,w,h' crop per image in pt
const flip = Math.random()<0.5; const [A,B] = flip ? [i2,i1] : [i1,i2];
const d=f=>'data:image/png;base64,'+fs.readFileSync(f).toString('base64');
const crop = c1!==undefined; const box=(c)=>c.split(',').map(Number);
const [ ,, W0, H0 ] = crop ? box(c1) : [0,0,390,844]; const W=W0, H=H0;
const boxes = crop ? (flip ? [box(c2||c1), box(c1)] : [box(c1), box(c2||c1)]) : [];
const b=await chromium.launch(); const p=await b.newPage({viewport:{width:W*2+60,height:H+70},deviceScaleFactor:2});
const img=(src,i)=>crop
  ? (()=>{const [cx,cy]=boxes[i];return `<div style="width:${W}px;height:${H}px;overflow:hidden;position:relative;border-radius:12px"><img src="${src}" style="position:absolute;width:390px;height:844px;left:${-cx}px;top:${-cy}px"></div>`})()
  : `<img src="${src}" style="width:390px;height:844px;border-radius:24px;display:block">`;
await p.setContent(`<html><body style="margin:0;background:#111;color:#fff;font:700 28px -apple-system,Helvetica,Arial;display:flex;gap:20px;padding:20px">
<div><div style="text-align:center;margin-bottom:8px">A</div>${img(d(A),0)}</div>
<div><div style="text-align:center;margin-bottom:8px">B</div>${img(d(B),1)}</div></body></html>`);
await p.waitForTimeout(300); await p.screenshot({path:out}); await b.close();
console.log(JSON.stringify({A, B}));
