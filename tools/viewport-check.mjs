import { chromium } from 'playwright'; import http from 'http'; import fs from 'fs'; import path from 'path';
const root=path.resolve('app'); const mime={'.html':'text/html','.js':'text/javascript','.webmanifest':'application/manifest+json','.svg':'image/svg+xml','.png':'image/png'};
const srv=http.createServer((q,r)=>{let p=q.url.split('?')[0]; if(p==='/')p='/index.html'; const f=path.join(root,p); if(!fs.existsSync(f)){r.writeHead(404);return r.end();} r.writeHead(200,{'content-type':mime[path.extname(f)]||'application/octet-stream'}); fs.createReadStream(f).pipe(r);}).listen(0);
const b=await chromium.launch(); const page=await b.newPage({viewport:{width:390,height:664},deviceScaleFactor:1,hasTouch:true,isMobile:true});
await page.goto(`http://localhost:${srv.address().port}/index.html`); await page.waitForTimeout(300);
await page.setViewportSize({width:390,height:844}); await page.waitForTimeout(300);
const png=await page.screenshot(); 
// sample bottom-left and bottom-right pixels via canvas in page
const [r,g,bl]=await page.evaluate(async(b64)=>{const img=new Image(); img.src='data:image/png;base64,'+b64; await img.decode(); const c=document.createElement('canvas'); c.width=img.width;c.height=img.height; const x=c.getContext('2d'); x.drawImage(img,0,0); const d=x.getImageData(5,img.height-5,1,1).data; return [d[0],d[1],d[2]];}, png.toString('base64'));
const white = r>240&&g>240&&bl>240;
console.log(`${white?'FAIL':'PASS'}  bottom strip after viewport grows is ${white?'white':'coloured'} (rgb ${r},${g},${bl})`);
if(process.argv[2]) await page.screenshot({path:process.argv[2]}); await b.close(); srv.close(); process.exit(white?1:0);
