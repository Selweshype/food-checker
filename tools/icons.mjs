import { chromium } from 'playwright'; import fs from 'fs';
const svg = fs.readFileSync('app/icon.svg','utf8');
const b = await chromium.launch(); 
for (const s of [180,512]) {
  const p = await b.newPage({viewport:{width:s,height:s}});
  await p.setContent(`<html><body style="margin:0;background:#0b0b10">${svg.replace('<svg ',`<svg width="${s}" height="${s}" `)}</body></html>`);
  await p.screenshot({path:`app/icon-${s}.png`,omitBackground:false}); await p.close();
}
await b.close(); console.log('icons ok');
