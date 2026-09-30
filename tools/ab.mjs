// node tools/ab.mjs out.png imgA imgB [cropX cropY cropW cropH in 390x844 pt]  -> side-by-side, random order, prints mapping
import { chromium } from 'playwright'; import fs from 'fs';
const [,, out, i1, i2, cx, cy, cw, ch] = process.argv;
const flip = Math.random()<0.5; const [A,B] = flip ? [i2,i1] : [i1,i2];
const d=f=>'data:image/png;base64,'+fs.readFileSync(f).toString('base64');
const crop = cx!==undefined;
const W = crop ? +cw : 390, H = crop ? +ch : 844;
const b=await chromium.launch(); const p=await b.newPage({viewport:{width:W*2+60,height:H+70},deviceScaleFactor:2});
const img=(src)=>crop
  ? `<div style="width:${W}px;height:${H}px;overflow:hidden;position:relative;border-radius:12px"><img src="${src}" style="position:absolute;width:390px;height:844px;left:${-cx}px;top:${-cy}px"></div>`
  : `<img src="${src}" style="width:390px;height:844px;border-radius:24px;display:block">`;
await p.setContent(`<html><body style="margin:0;background:#111;color:#fff;font:700 28px -apple-system,Helvetica,Arial;display:flex;gap:20px;padding:20px">
<div><div style="text-align:center;margin-bottom:8px">A</div>${img(d(A))}</div>
<div><div style="text-align:center;margin-bottom:8px">B</div>${img(d(B))}</div></body></html>`);
await p.waitForTimeout(300); await p.screenshot({path:out}); await b.close();
console.log(JSON.stringify({A, B}));
