const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto'),{buildSync,build}=require('esbuild'),{chromium}=require('playwright');
const {SOURCE,baselineBundle}=require('./relief-v02-helpers.cjs');
const root=path.resolve(__dirname,'..'),out=path.join(root,'docs/raised-calligraphy-v0.2');
(async()=>{let browser;try{
 const before=baselineBundle(root);
 const after=(await build({entryPoints:[path.join(root,'src/CalligraphyDepthArt.tsx')],bundle:true,write:false,format:'iife',globalName:'V02',plugins:[{name:'forbid-mesh-construction',setup(build){build.onResolve({filter:/\.\/calligraphy\/raisedRelief$/},()=>({path:'forbidden',namespace:'guard'}));build.onLoad({filter:/.*/,namespace:'guard'},()=>({contents:'export function buildRaisedRelief(){throw Error("Texture-only path constructed physical geometry")}',loader:'js'}));}}]})).outputFiles[0].text;
 const auxiliary=buildSync({entryPoints:[path.join(root,'src/calligraphy/textureRelief.ts')],bundle:true,write:false,format:'iife',globalName:'Profile'}).outputFiles[0].text;
 browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--disable-gpu']});const p=await browser.newPage();
 await p.setContent(`<style>@font-face{font-family:Amiri;src:url(data:font/ttf;base64,${fs.readFileSync(path.join(root,'public/fonts/Amiri-Bold.ttf')).toString('base64')});font-weight:700}</style>`);await p.evaluate(()=>document.fonts.load('700 100px Amiri'));
 for(const code of [before,after,auxiliary])await p.addScriptTag({content:code});console.log('READY exact source comparison');
 const proof=await p.evaluate(()=>{
  const t=performance.now(),a=PR28.engravedAtlas(1,4096,true),baselineBakeMs=performance.now()-t;
  const start=performance.now(),b=V02.engravedAtlas(1,4096,'texture'),textureBakeMs=performance.now()-start;
  const pixels=c=>{if(!c.data)return c.getContext('2d').getImageData(0,0,4096,1024).data;const d=new Uint8Array(c.data.length);for(let y=0;y<1024;y++)d.set(c.data.subarray((1023-y)*4096*4,(1024-y)*4096*4),y*4096*4);return d;};
  const ca=pixels(a.map.image),cb=pixels(b.map.image),ma=pixels(a.heroMask),mb=pixels(b.heroMask),ha=pixels(a.bump.image),hb=pixels(b.bump.image);
  let faceDifferences=0,maskDifferences=0,otherBandDifferences=0,coverageDifferences=0,heroHeightDifferences=0,heroRoughnessDifferences=0,faintPixels=0,missingFaintPixels=0,counterPixels=0;
  for(let i=0;i<ca.length;i++){
   const row=Math.floor(i/4/4096),hero=row>=344&&row<680;
   if(ca[i]!==cb[i])faceDifferences++;
   if(i%4===3&&ma[i]!==mb[i])maskDifferences++;
   if((row<320||row>=704)&&ha[i]!==hb[i])otherBandDifferences++;
   if(hero&&i%4===2&&hb[i]!==mb[i+1])coverageDifferences++;
   if(hero&&i%4===0&&ha[i]!==hb[i])heroHeightDifferences++;
   if(hero&&i%4===1&&ha[i]!==hb[i])heroRoughnessDifferences++;
   if(hero&&i%4===3){if(ma[i]>0&&ma[i]<128){faintPixels++;if(mb[i]!==ma[i])missingFaintPixels++;}if(ma[i]===0&&ha[i-1]===0){counterPixels++;if(hb[i-1]!==0)coverageDifferences++;}}
  }
  const alpha=new Uint8Array(4096*336);for(let i=0;i<alpha.length;i++)alpha[i]=mb[(344*4096+i)*4+3];
  const seen=new Uint8Array(alpha.length),queue=new Int32Array(alpha.length);let components=0,smallComponents=0,closedOpenings=0;
  for(const ink of [true,false]){seen.fill(0);for(let i=0;i<alpha.length;i++)if(!!alpha[i]===ink&&!seen[i]){
   let head=0,tail=1,border=false;queue[0]=i;seen[i]=1;
   while(head<tail){const j=queue[head++],x=j%4096,y=Math.floor(j/4096);if(x===0||x===4095||y===0||y===335)border=true;
    for(const [nx,ny]of[[x-1,y],[x+1,y],[x,y-1],[x,y+1]])if(nx>=0&&nx<4096&&ny>=0&&ny<336){const k=ny*4096+nx;if(!seen[k]&&!!alpha[k]===ink){seen[k]=1;queue[tail++]=k;}}}
   if(ink){components++;if(tail<=4)smallComponents++;}else if(!border)closedOpenings++;
  }}
  const synthetic=new Uint8Array(16*16);for(let y=3;y<12;y++)for(let x=3;x<12;x++)if(x===3||x===11||y===3||y===11)synthetic[y*16+x]=255;synthetic[1]=1;synthetic[14*16+14]=128;const copy=synthetic.slice(),packed=new Uint8ClampedArray(16*20*4).fill(153),original=packed.slice();
  const fixture=Profile.bakeTextureRelief(packed,synthetic,16,16,2);let syntheticCoverageDifferences=0,syntheticBoundsDifferences=0;
  for(let i=0;i<synthetic.length;i++)if(synthetic[i]!==copy[i]||packed[(2*16+i)*4+2]!==copy[i])syntheticCoverageDifferences++;
  for(let i=0;i<packed.length;i++)if((i<2*16*4||i>=18*16*4)&&i%4!==3&&packed[i]!==original[i])syntheticBoundsDifferences++;
  return{faceDifferences,maskDifferences,otherBandDifferences,coverageDifferences,heroHeightDifferences,heroRoughnessDifferences,faintPixels,missingFaintPixels,counterPixels,components,smallComponents,closedOpenings,syntheticCoverageDifferences,syntheticBoundsDifferences,
   meshBuilderGuardPassed:true,raisedIsNull:b.raised===null,profile:b.textureProfile,baselineBakeMs,textureBakeMs,fixture,
   source:'Exact PR28 baker versus v0.2, immutable tile coverage and complete face atlas; counters/openings are mask topology, not inferred sacred-text semantics'};
 });
 fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'integrity.json'),JSON.stringify(proof,null,2));
 for(const f of ['faceDifferences','maskDifferences','otherBandDifferences','coverageDifferences','missingFaintPixels','syntheticCoverageDifferences','syntheticBoundsDifferences'])assert.equal(proof[f],0,f);
 assert(proof.heroHeightDifferences>0&&proof.heroRoughnessDifferences>0&&proof.raisedIsNull&&proof.meshBuilderGuardPassed);assert.equal(proof.components,2188);assert(proof.closedOpenings>0&&proof.smallComponents>0);
 assert.equal(proof.profile.addedTriangles,0);assert.equal(proof.profile.addedGeometryBytes,0);assert.equal(proof.profile.addedTextures,0);console.log('PASS',JSON.stringify(proof));
}finally{await browser?.close()}})().catch(e=>{console.error(e);process.exitCode=1});
