// Simulates the iOS home-screen bug where 100vh/dvh/lvh resolve 59pt (status bar) shorter than the screen.
// Fails if the bottom of the screen is not blue or the footer floats above the bottom.
import { chromium } from 'playwright'; import http from 'http'; import fs from 'fs'; import path from 'path';
const root=path.resolve('app'); const out=process.argv[2];
const mime={'.html':'text/html','.js':'text/javascript','.webmanifest':'application/manifest+json','.svg':'image/svg+xml','.png':'image/png'};
const srv=http.createServer((q,r)=>{let p=q.url.split('?')[0]; if(p==='/')p='/index.html'; const f=path.join(root,p); if(!fs.existsSync(f)){r.writeHead(404);return r.end();}
  let body=fs.readFileSync(f); if(p.endsWith('.html')) body=Buffer.from(String(body).replace(/100(l|d|)vh/g,(m)=>`calc(${m} - 59px)`));
  r.writeHead(200,{'content-type':mime[path.extname(f)]||'application/octet-stream'}); r.end(body);}).listen(0);
const b=await chromium.launch(); let fails=0;
for(const [name,w,h] of [['iPhone 15 (home screen)',393,852],['iPhone 15 Pro Max (home screen)',430,932],['iPhone SE (home screen)',375,667]]){
  const page=await b.newPage({viewport:{width:w,height:h},deviceScaleFactor:1,isMobile:true,hasTouch:true});
  await page.goto(`http://localhost:${srv.address().port}/index.html`); await page.waitForTimeout(300);
  const png=await page.screenshot(); if(out) fs.writeFileSync(path.join(out,name.replace(/[^a-z0-9]+/gi,'_')+'.png'),png);
  const px=await page.evaluate(async(b64)=>{const i=new Image(); i.src='data:image/png;base64,'+b64; await i.decode(); const c=document.createElement('canvas'); c.width=i.width;c.height=i.height; const x=c.getContext('2d'); x.drawImage(i,0,0); const d=x.getImageData(Math.floor(i.width/2),i.height-3,1,1).data; return [d[0],d[1],d[2]];}, png.toString('base64'));
  const footGap=await page.evaluate(()=>innerHeight-document.querySelector('.foot').getBoundingClientRect().bottom);
  const blue=px[2]>px[1]+40; const ok=blue && footGap<=1;
  if(!ok) fails++;
  console.log(`${ok?'PASS':'FAIL'}  ${name.padEnd(32)} bottom pixel rgb(${px.join(',')}) ${blue?'blue':'NOT blue'}, gap under footer ${Math.round(footGap)}px`);
  await page.close();
}
await b.close(); srv.close(); process.exit(fails?1:0);
