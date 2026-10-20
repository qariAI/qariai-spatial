const {chromium}=require('playwright');
const fs=require('fs');
(async()=>{let b;const timer=setTimeout(()=>process.exit(2),45000);try{
b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--disable-accelerated-2d-canvas']});
const p=await b.newPage();await p.route('**/map-audit.html',r=>r.fulfill({contentType:'text/html',body:'<script type="importmap">{"imports":{"three":"/spark-letter/vendor/three.module.js"}}</script>'}));
await p.goto('http://127.0.0.1:5316/map-audit.html');
const result=await p.evaluate(async()=>{
const {designSurface}=await import('/spark-letter/proof-surface-design.js');const o=await(await fetch('/spark-letter/kaf-outline.json')).json();const s=designSurface(o,.002990625);const w=s.info.width,h=s.info.height;
const c=document.createElement('canvas');c.width=w;c.height=h;const ctx=c.getContext('2d',{willReadFrequently:true});const [x0,y0,x1,y1]=o.bounds;ctx.setTransform(w/(x1-x0),0,0,-h/(y1-y0),-x0*w/(x1-x0),y1*h/(y1-y0));ctx.fill(new Path2D(o.path));const mask=ctx.getImageData(0,0,w,h).data;
const channels={};for(const[name,t,k]of[['pigment',s.pigment,-1],['height',s.relief,0],['roughness',s.relief,1],['metalness',s.relief,2]]){const d=t.image.data;const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;const x=canvas.getContext('2d'),im=x.createImageData(w,h);const values=[];
for(let y=0;y<h;y++)for(let x=0;x<w;x++){const dst=(y*w+x)*4,src=((h-1-y)*w+x)*4;for(let k2=0;k2<3;k2++)im.data[dst+k2]=d[src+(k<0?k2:k)];im.data[dst+3]=mask[dst+3];if(mask[dst+3]>250)values.push(k<0?d[src]:d[src+k]);}
x.putImageData(im,0,0);values.sort((a,b)=>a-b);channels[name]={png:canvas.toDataURL(),min:values[0],p50:values[Math.floor(values.length*.5)],p95:values[Math.floor(values.length*.95)],max:values.at(-1)};}
const slopes=[];const d=s.relief.image.data;for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){const at=(y*w+x)*4,mi=((h-1-y)*w+x)*4;if(mask[mi+3]<250||mask[mi+7]<250||mask[mi-w*4+3]<250)continue;const dx=(d[at+4]-d[at])/255,dy=(d[at+w*4]-d[at])/255;slopes.push(Math.hypot(dx,dy));}slopes.sort((a,b)=>a-b);const selected=slopes.filter(x=>x>.01);const summary=scale=>({scale,oneTexelEstimateDegrees:{p50:Math.atan(selected[Math.floor(selected.length*.5)]*scale)*180/Math.PI,p95:Math.atan(selected[Math.floor(selected.length*.95)]*scale)*180/Math.PI,max:Math.atan(selected.at(-1)*scale)*180/Math.PI}});
return{info:s.info,channels,gradientSamples:selected.length,tiltEstimates:[summary(.005),summary(.5)],limits:'One-texel finite differences on source map at flat, orthogonal surface. Not measured framebuffer normals; screen derivatives, perspective, crown and mip filtering differ.'};});
const dir=__dirname;fs.mkdirSync(dir,{recursive:true});for(const[n,c]of Object.entries(result.channels)){fs.writeFileSync(dir+'/'+n+'.png',Buffer.from(c.png.split(',')[1],'base64'));delete c.png;}fs.writeFileSync(dir+'/report.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));
}finally{await b?.close();clearTimeout(timer)}})().catch(e=>{console.error(e);process.exit(1)});
