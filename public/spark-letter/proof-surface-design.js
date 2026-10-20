import * as THREE from 'three';
import {ENGRAVING_DESIGN as design} from './engraving-design.js';
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
export function designSurface(outline,worldScale){
 const bakedAt=performance.now();
 const w=SURFACE_WIDTH,h=SURFACE_HEIGHT,[xmin,ymin,xmax,ymax]=outline.bounds;
 const maskCanvas=document.createElement('canvas');maskCanvas.width=w;maskCanvas.height=h;const ctx=maskCanvas.getContext('2d',{willReadFrequently:true});
 const sx=w/(xmax-xmin),sy=h/(ymax-ymin);ctx.setTransform(sx,0,0,-sy,-xmin*sx,ymax*sy);ctx.fillStyle='#fff';ctx.fill(new Path2D(outline.path));
 const rgba=ctx.getImageData(0,0,w,h).data,alpha=new Uint8Array(w*h);for(let i=0;i<alpha.length;i++)alpha[i]=rgba[i*4+3];const distance=distanceInside(alpha,w,h),worldPixel=(xmax-xmin)*worldScale/w;
 // Three flowing material pockets; surface masks only, clipped by the source interior.
 const panels=document.createElement('canvas');panels.width=w;panels.height=h;const panelPen=panels.getContext('2d',{willReadFrequently:true});panelPen.setTransform(sx,0,0,-sy,-xmin*sx,ymax*sy);
 const panelPaths=[
  ['#ff0000','M91 58 C152 25 333 23 465 47 Q507 52 528 71 C418 95 238 86 91 73 Q80 66 91 58 Z'],
  ['#00ff00','M557 180 C574 270 555 390 536 488 L517 586 Q512 604 503 618 Q526 480 536 370 Q549 249 544 194 Z'],
  ['#0000ff','M116 318 Q185 306 244 322 Q273 333 286 359 Q258 378 220 391 Q204 401 207 418 Q211 437 233 445 L251 455 L231 469 Q184 444 190 410 Q198 380 244 365 Q201 346 116 340 Z']
 ];
 for(const [fill,path] of panelPaths){panelPen.fillStyle=fill;panelPen.fill(new Path2D(path))}
 const soft=document.createElement('canvas');soft.width=w;soft.height=h;const softPen=soft.getContext('2d',{willReadFrequently:true});softPen.filter='blur(1px)';softPen.drawImage(panels,0,0);
 const panelPixels=softPen.getImageData(0,0,w,h).data,panelSamples=[0,0,0];
 // Bake only resolvable ornament from the approved proof; no glyph construction.
 if(design.glyphPathSha256!==outline.pathSha256)throw Error('Engraving proof/source mismatch');
 const etchCanvas=document.createElement('canvas');etchCanvas.width=w;etchCanvas.height=h;const etchPen=etchCanvas.getContext('2d',{willReadFrequently:true});etchPen.setTransform(sx,0,0,-sy,-xmin*sx,ymax*sy);etchPen.lineCap='round';etchPen.lineJoin='round';
 for(let k=0;k<3;k++){
  etchPen.strokeStyle=['#ff0000','#00ff00','#0000ff'][k];etchPen.globalAlpha=1;etchPen.lineWidth=design.primaryWidth;etchPen.stroke(new Path2D(design.spines[k]));
  etchPen.globalAlpha=.68;etchPen.lineWidth=design.branchWidth;for(const path of design.branches[k])etchPen.stroke(new Path2D(path));
 }
 const etchPixels=etchPen.getImageData(0,0,w,h).data;let etchSamples=0;
 const etchAt=(x,y,weights)=>{const at=(Math.max(0,Math.min(h-1,y))*w+Math.max(0,Math.min(w-1,x)))*4;return Math.min(1,(etchPixels[at]*weights[0]+etchPixels[at+1]*weights[1]+etchPixels[at+2]*weights[2])*etchPixels[at+3]/65025)};

 const panelAt=(x,y)=>{const p=(Math.max(0,Math.min(h-1,y))*w+Math.max(0,Math.min(w-1,x)))*4;return Math.max(panelPixels[p],panelPixels[p+1],panelPixels[p+2])/255};
 const pigmentBytes=new Uint8Array(w*h*4),reliefBytes=new Uint8Array(w*h*4);
 const colours=hexes=>hexes.map(c=>new THREE.Color(c));
 const base=colours(['#172e4d','#254b6b','#10243f']),perimeter=new THREE.Color('#142a45'),ivory=new THREE.Color('#e8d4a7'),colour=new THREE.Color(),panelColour=new THREE.Color(),division=new THREE.Color('#0b2342');
 const gradients=[{x:[80,528],stops:[0,.32,.55,1],colours:colours(['#795326','#dfba78','#c99750','#886034'])},{x:[503,574],stops:[0,.45,.7,1],colours:colours(['#226574','#6dbebc','#3a8a94','#204f65'])},{x:[116,286],stops:[0,.5,1],colours:colours(['#784b64','#cb9299','#8b5b76'])}];
 const gradient=(target,t,stops,palette)=>{t=Math.max(0,Math.min(1,t));let k=0;while(k<stops.length-2&&t>stops[k+1])k++;return target.copy(palette[k]).lerp(palette[k+1],(t-stops[k])/(stops[k+1]-stops[k]))};
 let changed=0,edgeSamples=0,engravedSamples=0;const coarseRatio=worldPixel/.0043;
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const i=y*w+x,u=x/(w-1),v=1-y/(h-1),d=distance[i]*worldPixel;
  gradient(colour,(u+.3*v)/1.09,[0,.48,1],base).multiplyScalar(1.7);
  const core=smooth(.017,.043,d);colour.lerp(perimeter,1-core);if(core<.9&&alpha[i])edgeSamples++;
  const interior=smooth(.016,.025,d);
  const inset=Math.exp(-(((d-.034)/(.0017*coarseRatio))**2))*.52*interior;
  const weights=[0,1,2].map(k=>panelPixels[i*4+k]/255*smooth(.025,.038,d));
  const [polished,satin,engraved]=weights,panel=Math.max(...weights);
  weights.forEach((v,k)=>{if(v>.5)panelSamples[k]++});
  // Proof-authored, localized material tones; reflection remains physically view-dependent.
  const nativeX=xmin+u*(xmax-xmin);
  for(let k=0;k<3;k++){const g=gradients[k];gradient(panelColour,(nativeX-g.x[0])/(g.x[1]-g.x[0]),g.stops,g.colours);colour.lerp(panelColour,weights[k]*.94)}
  const panelEdge=Math.max(Math.abs(panelAt(x+1,y)-panelAt(x-1,y)),Math.abs(panelAt(x,y+1)-panelAt(x,y-1)))*interior;
  const etch=etchAt(x,y,weights);if(etch>.06)etchSamples++;
  const groove=Math.min(1,inset*.85+panelEdge*.28+etch*.60);
  // A restrained lip on the key-light-facing channel shoulder. It remains
  // within the same interior margin, never becoming a separate mark.
  const adjacent=etchAt(x-1,y+1,weights);
  const shoulder=Math.max(0,adjacent-etch)*interior;
  const lip=Math.exp(-(((d-.037)/(.0013*coarseRatio))**2))*.42*core+shoulder*.36;
  colour.multiplyScalar((1-.52*groove)*(1-.035*panel));colour.lerp(division,Math.min(.78,panelEdge*1.5+etch*.62));colour.lerp(ivory,lip*.48+panelEdge*.06);colour.convertLinearToSRGB();
  const p=((h-1-y)*w+x)*4; // Explicit row order matches canonical cap UVs.
  pigmentBytes.set([Math.round(colour.r*255),Math.round(colour.g*255),Math.round(colour.b*255),255],p);
  const grain=((Math.imul(x,374761393)^Math.imul(y,668265263))>>>0)%5;
  const brushed=.5+.3*Math.sin(x*.31+y*.027)+.2*Math.sin(x*.173-y*.019),height=225-84*groove+18*lip-5*panel+grain*(.16+.3*engraved);
  const rough=core<.55?190:Math.round(114*(1-panel)+80*polished+153*satin+174*engraved+15*groove+3*brushed+grain*.25);
  const metal=Math.round(177*(1-panel)+195*polished+184*satin+164*engraved);
  reliefBytes.set([Math.round(height),rough,metal,255],p);
  if(alpha[i]){changed++;if(groove>.15)engravedSamples++}
 }
 const pigment=new THREE.DataTexture(pigmentBytes,w,h);pigment.colorSpace=THREE.SRGBColorSpace;
 const relief=new THREE.DataTexture(reliefBytes,w,h);
 for(const texture of [pigment,relief]){texture.minFilter=THREE.LinearMipmapLinearFilter;texture.magFilter=THREE.LinearFilter;texture.generateMipmaps=true;texture.needsUpdate=true}
 const info={proofBaseLinearReflectanceCalibration:1.7,bakeMs:performance.now()-bakedAt,width:w,height:h,rawBytes:pigmentBytes.byteLength+reliefBytes.byteLength,rgba8WithMipsEstimate:(pigmentBytes.byteLength+reliefBytes.byteLength)*4/3,engraving:{curves:design.spines.length+design.branches.flat().length,samples:etchSamples,primary:3,branches:10,omittedHairlines:design.omittedHairlines,omittedBranches:design.omittedBranches,branchWidth:design.branchWidth,proofSvgSha256:design.proofSvgSha256,method:'proof-09 exact ornament path centres; resolution-limited selection, panel-owned coverage'},panels:{count:3,finishes:['polished','satin','fine engraved'],samples:panelSamples,method:'interior-gated auxiliary material/bump pockets; no physical cuts or new geometry'},coverageSamples:changed,perimeterSamples:edgeSamples,channelSamples:engravedSamples,opacity:'all surface texels opaque; no geometry discard or displacement',channels:'auxiliary bump/roughness shading, not physically cut grooves',palette:'sapphire field with three authored amber/turquoise/coral material regions and dark blue divisions; no full-face rainbow gradient'};
 return{pigment,relief,info,dispose(){pigment.dispose();relief.dispose()}};
}
