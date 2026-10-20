import * as THREE from 'three';
export const SURFACE_WIDTH=384,SURFACE_HEIGHT=576;
// Distance is auxiliary surface data only. It is never used to cut, move or
// threshold the source geometry. Holes and background are always distance zero.
export function distanceInside(alpha,w,h){
 const d=new Float32Array(w*h);for(let i=0;i<d.length;i++)d[i]=alpha[i]>=128?Math.max(w,h):0;
 const diag=Math.SQRT2;
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=y*w+x;if(x)d[i]=Math.min(d[i],d[i-1]+1);if(y){d[i]=Math.min(d[i],d[i-w]+1);if(x)d[i]=Math.min(d[i],d[i-w-1]+diag);if(x+1<w)d[i]=Math.min(d[i],d[i-w+1]+diag)}}
 for(let y=h-1;y>=0;y--)for(let x=w-1;x>=0;x--){const i=y*w+x;if(x+1<w)d[i]=Math.min(d[i],d[i+1]+1);if(y+1<h){d[i]=Math.min(d[i],d[i+w]+1);if(x)d[i]=Math.min(d[i],d[i+w-1]+diag);if(x+1<w)d[i]=Math.min(d[i],d[i+w+1]+diag)}}return d;
}
const smooth=(a,b,v)=>{const t=Math.max(0,Math.min(1,(v-a)/(b-a)));return t*t*(3-2*t)};
const spot=(u,v,x,y,rx,ry)=>Math.exp(-2.5*(((u-x)/rx)**2+((v-y)/ry)**2));
export function designSurface(outline,worldScale){
 const w=SURFACE_WIDTH,h=SURFACE_HEIGHT,[xmin,ymin,xmax,ymax]=outline.bounds;
 const maskCanvas=document.createElement('canvas');maskCanvas.width=w;maskCanvas.height=h;const ctx=maskCanvas.getContext('2d',{willReadFrequently:true});
 const sx=w/(xmax-xmin),sy=h/(ymax-ymin);ctx.setTransform(sx,0,0,-sy,-xmin*sx,ymax*sy);ctx.fillStyle='#fff';ctx.fill(new Path2D(outline.path));
 const rgba=ctx.getImageData(0,0,w,h).data,alpha=new Uint8Array(w*h);for(let i=0;i<alpha.length;i++)alpha[i]=rgba[i*4+3];const distance=distanceInside(alpha,w,h),worldPixel=(xmax-xmin)*worldScale/w;
 // Deliberate, non-scriptural engraving paths follow the existing body courses.
 // They are UV surface detail only. A margin gate confines them to stroke interiors.
 const lines=document.createElement('canvas');lines.width=w;lines.height=h;const pen=lines.getContext('2d',{willReadFrequently:true});pen.setTransform(sx,0,0,-sy,-xmin*sx,ymax*sy);pen.strokeStyle='#fff';pen.lineWidth=2.4;pen.lineCap='round';
 for(const path of ['M91 57 C230 36 479 29 568 118','M575 182 C574 320 527 598 488 748','M115 321 C181 312 257 319 293 377 C315 409 233 410 205 428 C203 454 246 485 284 546'])pen.stroke(new Path2D(path));
 const channel=pen.getImageData(0,0,w,h).data,pigmentBytes=new Uint8Array(w*h*4),reliefBytes=new Uint8Array(w*h*4);
 const sapphire=new THREE.Color('#163c69'),perimeter=new THREE.Color('#102b50'),amber=new THREE.Color('#ffc079'),coral=new THREE.Color('#ef777e'),turquoise=new THREE.Color('#32c7c5'),ivory=new THREE.Color('#e8d4a7'),colour=new THREE.Color();
 let changed=0,edgeSamples=0,engravedSamples=0;const coarseRatio=worldPixel/.0043;
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const i=y*w+x,u=x/(w-1),v=1-y/(h-1),d=distance[i]*worldPixel;
  const warm=spot(u,v,.24,.08,.44,.13),rose=spot(u,v,.80,.19,.27,.24)+.7*spot(u,v,.32,.48,.22,.19),teal=spot(u,v,.82,.74,.20,.31)+.65*spot(u,v,.39,.67,.18,.13);
  colour.copy(sapphire);colour.lerp(amber,Math.min(.94,warm*.98));colour.lerp(coral,Math.min(.88,rose*.87));colour.lerp(turquoise,Math.min(.94,teal*.94));
  const core=smooth(.011,.030,d);colour.lerp(perimeter,1-core);if(core<.9&&alpha[i])edgeSamples++;
  const interior=smooth(.016,.025,d),trace=channel[i*4+3]/255*interior;
  const inset=Math.exp(-(((d-.034)/(.0017*coarseRatio))**2))*.52*interior;
  const groove=Math.min(1,trace*.82+inset*.6);
  // A fine reflected lip around the dark valley; never a disconnected dot or mark.
  const lip=Math.exp(-(((d-.037)/(.0013*coarseRatio))**2))*.28*core;
  colour.multiplyScalar(1-.48*groove);colour.lerp(ivory,lip*.32);colour.convertLinearToSRGB();
  const p=((h-1-y)*w+x)*4; // Explicit row order matches canonical cap UVs.
  pigmentBytes.set([Math.round(colour.r*255),Math.round(colour.g*255),Math.round(colour.b*255),255],p);
  const grain=((Math.imul(x,374761393)^Math.imul(y,668265263))>>>0)%5;
  const brushed=.5+.5*Math.sin(x*.63+y*.045),height=225-60*groove+grain*.16;
  const rough=core<.55?190:Math.round(143+23*groove+3*brushed+grain*.25);
  reliefBytes.set([Math.round(height),rough,255,255],p);
  if(alpha[i]){changed++;if(groove>.15)engravedSamples++}
 }
 const pigment=new THREE.DataTexture(pigmentBytes,w,h);pigment.colorSpace=THREE.SRGBColorSpace;
 const relief=new THREE.DataTexture(reliefBytes,w,h);
 for(const texture of [pigment,relief]){texture.minFilter=THREE.LinearMipmapLinearFilter;texture.magFilter=THREE.LinearFilter;texture.generateMipmaps=true;texture.needsUpdate=true}
 const info={width:w,height:h,rawBytes:pigmentBytes.byteLength+reliefBytes.byteLength,rgba8WithMipsEstimate:(pigmentBytes.byteLength+reliefBytes.byteLength)*4/3,coverageSamples:changed,perimeterSamples:edgeSamples,channelSamples:engravedSamples,opacity:'all surface texels opaque; no geometry discard or displacement',channels:'auxiliary bump/roughness shading, not physically cut grooves',palette:'dark sapphire perimeter with localized amber/coral/turquoise fields; no full-face rainbow gradient'};
 return{pigment,relief,info,dispose(){pigment.dispose();relief.dispose()}};
}
