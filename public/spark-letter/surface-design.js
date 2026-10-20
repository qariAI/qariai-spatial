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
 // Three flowing material pockets; surface masks only, clipped by the source interior.
 const panels=document.createElement('canvas');panels.width=w;panels.height=h;const panelPen=panels.getContext('2d',{willReadFrequently:true});panelPen.setTransform(sx,0,0,-sy,-xmin*sx,ymax*sy);
 const panelPaths=[
  ['#ff0000','M104 59 C155 32 330 27 465 49 Q499 54 507 68 Q447 80 376 76 C268 69 160 84 104 59 Z'],
  ['#00ff00','M547 184 Q563 292 535 433 L514 553 L498 616 Q520 465 533 348 Q545 245 536 196 Z'],
  ['#0000ff','M116 318 Q185 306 244 322 Q273 333 286 359 Q258 378 220 391 Q204 401 207 418 Q211 437 233 445 L251 455 L231 469 Q184 444 190 410 Q198 380 244 365 Q201 346 116 340 Z']
 ];
 for(const [fill,path] of panelPaths){panelPen.fillStyle=fill;panelPen.fill(new Path2D(path))}
 const soft=document.createElement('canvas');soft.width=w;soft.height=h;const softPen=soft.getContext('2d',{willReadFrequently:true});softPen.filter='blur(1px)';softPen.drawImage(panels,0,0);
 const panelPixels=softPen.getImageData(0,0,w,h).data,panelSamples=[0,0,0];
 const panelAt=(x,y)=>{const p=(Math.max(0,Math.min(h-1,y))*w+Math.max(0,Math.min(w-1,x)))*4;return Math.max(panelPixels[p],panelPixels[p+1],panelPixels[p+2])/255};
 const channel=pen.getImageData(0,0,w,h).data,pigmentBytes=new Uint8Array(w*h*4),reliefBytes=new Uint8Array(w*h*4);
 const sapphire=new THREE.Color('#163c69'),perimeter=new THREE.Color('#163f78'),amber=new THREE.Color('#ffc079'),coral=new THREE.Color('#ef777e'),turquoise=new THREE.Color('#32c7c5'),ivory=new THREE.Color('#e8d4a7'),colour=new THREE.Color();
 let changed=0,edgeSamples=0,engravedSamples=0;const coarseRatio=worldPixel/.0043;
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const i=y*w+x,u=x/(w-1),v=1-y/(h-1),d=distance[i]*worldPixel;
  const warm=spot(u,v,.24,.08,.30,.095),rose=spot(u,v,.80,.19,.19,.17)+.7*spot(u,v,.32,.48,.16,.13),teal=spot(u,v,.84,.80,.15,.22)+.65*spot(u,v,.39,.67,.13,.10);
  colour.copy(sapphire);colour.lerp(amber,Math.min(.94,warm*.98));colour.lerp(coral,Math.min(.88,rose*.87));colour.lerp(turquoise,Math.min(.94,teal*.94));
  const core=smooth(.017,.043,d);colour.lerp(perimeter,1-core);if(core<.9&&alpha[i])edgeSamples++;
  const interior=smooth(.016,.025,d),trace=channel[i*4+3]/255*interior;
  const inset=Math.exp(-(((d-.034)/(.0017*coarseRatio))**2))*.52*interior;
  const weights=[0,1,2].map(k=>panelPixels[i*4+k]/255*smooth(.025,.038,d));
  const [polished,satin,engraved]=weights,panel=Math.max(...weights);
  weights.forEach((v,k)=>{if(v>.5)panelSamples[k]++});
  const panelEdge=Math.max(Math.abs(panelAt(x+1,y)-panelAt(x-1,y)),Math.abs(panelAt(x,y+1)-panelAt(x,y-1)))*interior;
  const hatch=(.5+.5*Math.sin(x*.66+y*.12))**8*engraved;
  const groove=Math.min(1,trace*.94+inset*.85+panelEdge*.22+hatch*.16);
  // A restrained lip on the key-light-facing channel shoulder. It remains
  // within the same interior margin, never becoming a separate mark.
  const adjacent=channel[(Math.min(h-1,y+1)*w+Math.max(0,x-1))*4+3]/255;
  const shoulder=Math.max(0,adjacent-channel[i*4+3]/255)*interior;
  const lip=Math.exp(-(((d-.037)/(.0013*coarseRatio))**2))*.42*core+shoulder*.36;
  colour.multiplyScalar((1-.64*groove)*(1-.07*panel));colour.lerp(ivory,lip*.50);colour.convertLinearToSRGB();
  const p=((h-1-y)*w+x)*4; // Explicit row order matches canonical cap UVs.
  pigmentBytes.set([Math.round(colour.r*255),Math.round(colour.g*255),Math.round(colour.b*255),255],p);
  const grain=((Math.imul(x,374761393)^Math.imul(y,668265263))>>>0)%5;
  const brushed=.5+.5*Math.sin(x*.63+y*.045),height=225-84*groove+18*lip-5*panel+grain*(.16+.3*engraved);
  const rough=core<.55?190:Math.round(114*(1-panel)+80*polished+153*satin+174*engraved+15*groove+3*brushed+grain*.25);
  const metal=Math.round(177*(1-panel)+195*polished+184*satin+164*engraved);
  reliefBytes.set([Math.round(height),rough,metal,255],p);
  if(alpha[i]){changed++;if(groove>.15)engravedSamples++}
 }
 const pigment=new THREE.DataTexture(pigmentBytes,w,h);pigment.colorSpace=THREE.SRGBColorSpace;
 const relief=new THREE.DataTexture(reliefBytes,w,h);
 for(const texture of [pigment,relief]){texture.minFilter=THREE.LinearMipmapLinearFilter;texture.magFilter=THREE.LinearFilter;texture.generateMipmaps=true;texture.needsUpdate=true}
 const info={width:w,height:h,rawBytes:pigmentBytes.byteLength+reliefBytes.byteLength,rgba8WithMipsEstimate:(pigmentBytes.byteLength+reliefBytes.byteLength)*4/3,panels:{count:3,finishes:['polished','satin','fine engraved'],samples:panelSamples,method:'interior-gated auxiliary material/bump pockets; no physical cuts or new geometry'},coverageSamples:changed,perimeterSamples:edgeSamples,channelSamples:engravedSamples,opacity:'all surface texels opaque; no geometry discard or displacement',channels:'auxiliary bump/roughness shading, not physically cut grooves',palette:'stronger sapphire perimeter; tightened amber/coral/turquoise fields; no full-face rainbow gradient'};
 return{pigment,relief,info,dispose(){pigment.dispose();relief.dispose()}};
}
