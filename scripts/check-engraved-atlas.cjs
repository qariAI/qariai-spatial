// Exercise the actual atlas baker in Canvas2D, without a WebGL context.
const fs=require('fs'),path=require('path'),assert=require('assert');
const {buildSync}=require('esbuild'),{chromium}=require('playwright');
const project=path.resolve(__dirname,'..');
(async()=>{let browser;try{
 let source=fs.readFileSync(path.join(project,'src/CalligraphyDepthArt.tsx'),'utf8');
 source=source.slice(0,source.indexOf('// Polar UVs')).replace(/^import .*react.*;$/gm,'').replace(/^import .*mergeGeometries.*;$/gm,'');
 source=source.replace('function engravedAtlas(', 'export function engravedAtlas(')
  .replace('const bevelCache = new Map', 'const placements = []; const bevelCache = new Map')
  .replace('drawPhrase(c, h, cursor', 'placements.push({band:index,row,x:cursor,width,y:band.top+offset,maxHeight,top:band.top,bottom:band.bottom}); drawPhrase(c, h, cursor')
  .replace('return { map, bump };','return { map, bump, placements };');
 const code=buildSync({stdin:{contents:source,resolveDir:path.join(project,'src'),loader:'tsx'},bundle:true,write:false,format:'iife',globalName:'QariAtlas'}).outputFiles[0].text;
 browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--disable-gpu']});
 const page=await browser.newPage();
 const font=fs.readFileSync(path.join(project,'public/fonts/Amiri-Bold.ttf')).toString('base64');
 await page.setContent(`<style>@font-face{font-family:Amiri;src:url(data:font/ttf;base64,${font});font-weight:700}</style>`);
 await page.evaluate(()=>document.fonts.load('700 100px Amiri'));await page.addScriptTag({content:code});
 const result=await page.evaluate(()=>{const atlas=QariAtlas.engravedAtlas(8,4096),image=atlas.bump.image,data=image.getContext('2d').getImageData(0,0,image.width,image.height).data;let low=255,high=0,roughLow=255,roughHigh=0;for(let i=0;i<data.length;i+=4){low=Math.min(low,data[i]);high=Math.max(high,data[i]);roughLow=Math.min(roughLow,data[i+1]);roughHigh=Math.max(roughHigh,data[i+1]);}return {width:image.width,height:image.height,low,high,roughLow,roughHigh,placements:atlas.placements};});
 assert.equal(result.width,4096);assert.equal(result.height,1024);assert(result.low<100&&result.high>215);assert(result.roughLow<120&&result.roughHigh>230);
 for(const p of result.placements){assert(p.x>=8&&p.x+p.width<=4080);assert(p.y-p.maxHeight/2-4>p.top+24&&p.y+p.maxHeight/2+4<p.bottom-12);for(const q of result.placements){if(p===q||p.band!==q.band)continue;if(p.row===q.row&&q.x>p.x)assert(q.x-p.x-p.width>=24-1e-6);if(p.row!==q.row)assert(Math.abs(p.y-q.y)-(p.maxHeight+q.maxHeight)/2>=5);}}
 fs.mkdirSync(path.join(project,'docs/v1.4.8/sculpted'),{recursive:true});fs.writeFileSync(path.join(project,'docs/v1.4.8/sculpted/atlas-checks.json'),JSON.stringify(result,null,2));console.log('PASS actual atlas: packed relief/roughness range, complete inscription bounds, course separation and gutters');
}finally{await browser?.close()}})().catch(e=>{console.error(e);process.exitCode=1});
