import { chromium } from 'playwright'; import fs from 'fs';
const p='app/index.html'; let s=fs.readFileSync(p,'utf8');
const m=s.match(/const G = \{([\s\S]*?)\n\};/); const body=m[1];
const entries=[...body.matchAll(/  (\w+):'(.*?)',\n/g)];
const b=await chromium.launch(); const page=await b.newPage();
let out='';
for(const [,k,v] of entries){
  const inner=v.replace(/^<g transform="translate\([^)]*\)">|<\/g>$/g,'');
  await page.setContent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="240" height="240"><g id="g">${inner}</g></svg>`);
  const bb=await page.evaluate(()=>{const r=document.getElementById('g').getBBox();return {x:r.x,y:r.y,w:r.width,h:r.height}});
  const dx=(12-(bb.x+bb.w/2)).toFixed(2), dy=(12-(bb.y+bb.h/2)).toFixed(2);
  out+=`  ${k}:'<g transform="translate(${dx} ${dy})">${inner}</g>',\n`;
  console.log(k.padEnd(9), 'bbox', bb.w.toFixed(1)+'x'+bb.h.toFixed(1), 'shift', dx, dy);
}
await b.close();
s=s.replace(m[0], 'const G = {\n'+out+'};'); fs.writeFileSync(p,s);
