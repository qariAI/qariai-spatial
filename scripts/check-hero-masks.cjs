const fs=require('fs'),path=require('path'),assert=require('assert');
const {chromium}=require('playwright'),{buildSync}=require('esbuild');
const project=path.resolve(__dirname,'..');
(async()=>{let browser;try{
 const code=buildSync({entryPoints:[path.join(project,'src/calligraphy/heroBevel.ts')],bundle:true,write:false,format:'iife',globalName:'QariBevel'}).outputFiles[0].text;
 const source=fs.readFileSync(path.join(project,'src/calligraphy/content.ts'),'utf8');
 const entries=[...source.matchAll(/surah: (\d+), ayah: (\d+).*?text: '([^']+)'/g)].map(m=>({reference:m[1]+':'+m[2],text:m[3]}));
 assert.equal(entries.length,8);
 browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--disable-gpu']});
 const page=await browser.newPage();page.setDefaultTimeout(30000);
 const font=fs.readFileSync(path.join(project,'public/fonts/Amiri-Bold.ttf')).toString('base64');
 await page.setContent(`<style>@font-face{font-family:Amiri;src:url(data:font/ttf;base64,${font});font-weight:700}</style>`);
 await page.evaluate(()=>document.fonts.load('700 100px Amiri'));
 await page.addScriptTag({content:code});
 const proofs=await page.evaluate(entries=>{
  const c=document.createElement('canvas'),ctx=c.getContext('2d'),cache=new Map(),proofs=[];
  ctx.direction='rtl';ctx.textAlign='center';ctx.textBaseline='middle';
  for(const size of [55,100,190])for(const entry of entries){
   ctx.font=`700 ${size}px Amiri`;QariBevel.paintHeroBevel(ctx,entry.text,cache);
   const tile=cache.get(ctx.font+':'+entry.text),reference=document.createElement('canvas');reference.width=tile.canvas.width;reference.height=tile.canvas.height;
   const original=reference.getContext('2d');original.font=ctx.font;original.direction='rtl';original.textAlign='center';original.textBaseline='middle';original.fillStyle='#fff';original.fillText(entry.text,tile.left,tile.top);
   const a=original.getImageData(0,0,reference.width,reference.height).data,b=tile.canvas.getContext('2d').getImageData(0,0,reference.width,reference.height).data;
   let alphaDifferences=0,inkPixels=0,recoloredPixels=0;
   for(let i=0;i<a.length;i+=4){if(a[i+3]!==b[i+3])alphaDifferences++;if(a[i+3]){inkPixels++;if(a[i]!==b[i]||a[i+1]!==b[i+1]||a[i+2]!==b[i+2])recoloredPixels++;}}
   proofs.push({reference:entry.reference,size,alphaDifferences,inkPixels,recoloredPixels});
  }return proofs;
 },entries);
 assert(proofs.every(p=>p.alphaDifferences===0&&p.inkPixels>0&&p.recoloredPixels>0));
 const output=path.join(project,'docs/v1.4.8/refinement/final-mask-verification.json');fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,JSON.stringify(proofs,null,2));
 console.log('PASS: all eight excerpts retain exact native alpha coverage at 55, 100 and 190px; RGB recoloring verified.');
}finally{await browser?.close()}})().catch(e=>{console.error(e);process.exitCode=1});
