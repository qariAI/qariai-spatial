import * as THREE from 'three';
import {distanceInside} from './generated/proof-surface-design';
type Outline={path:string;bounds:number[];letter:string};
const smooth=(a:number,b:number,x:number)=>{const t=THREE.MathUtils.clamp((x-a)/(b-a),0,1);return t*t*(3-2*t)};
// Material ornament only. The source contours exclusively determine the geometry.
// All dot/counter locations stay in the same full-glyph coordinate system.
export function designLetterSurface(outline:Outline,scale:number){
 const started=performance.now(),w=384,h=576,[xmin,ymin,xmax,ymax]=outline.bounds;
 const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;const ctx=canvas.getContext('2d',{willReadFrequently:true})!;
 ctx.setTransform(w/(xmax-xmin),0,0,-h/(ymax-ymin),-xmin*w/(xmax-xmin),ymax*h/(ymax-ymin));ctx.fill(new Path2D(outline.path));const mask=ctx.getImageData(0,0,w,h).data,alpha=new Uint8Array(w*h);for(let i=0;i<alpha.length;i++)alpha[i]=mask[i*4+3];
 const distance=distanceInside(alpha,w,h) as Float32Array,pixel=(xmax-xmin)*scale/w,pigmentBytes=new Uint8Array(w*h*4),reliefBytes=new Uint8Array(w*h*4);
 const sapphire=new THREE.Color('#254b6b').multiplyScalar(1.7),rim=new THREE.Color('#142a45'),amber=new THREE.Color('#c99750'),teal=new THREE.Color('#3a8a94'),coral=new THREE.Color('#b57d8e'),color=new THREE.Color();let covered=0;
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const i=y*w+x,u=x/(w-1),v=1-y/(h-1),d=distance[i]*pixel,interior=smooth(.017,.040,d);
  const goldBand=outline.letter==='ي'?.43:.18;
  const a=interior*Math.exp(-Math.pow((v-goldBand)/.12,2)),t=interior*smooth(.52,.82,u)*smooth(.32,.7,v),c=interior*(1-smooth(.25,.52,u))*smooth(.32,.57,v);
  color.copy(sapphire).lerp(rim,1-interior).lerp(amber,a*.94).lerp(teal,t*.88).lerp(coral,c*.72);
  // Source dots stay warm and readable; this changes pigment, never their shape.
  if(outline.letter==='ي'&&v<.21)color.lerp(amber,interior*.92);
  if(outline.letter==='ف'&&v>.82)color.lerp(amber,interior*.92);
  const valley=Math.exp(-Math.pow((d-.030)/Math.max(pixel,.0018),2))*interior,lip=Math.exp(-Math.pow((d-.036)/Math.max(pixel*.8,.0013),2))*interior;
  color.multiplyScalar(1-.08*valley).convertLinearToSRGB();const p=((h-1-y)*w+x)*4;const byte=(n:number)=>Math.round(THREE.MathUtils.clamp(n,0,255));
  pigmentBytes.set([byte(color.r*255),byte(color.g*255),byte(color.b*255),255],p);
  const grain=((Math.imul(x,374761393)^Math.imul(y,668265263))>>>0)%5;
  reliefBytes.set([byte(225-38*valley+12*lip+grain*.1),byte(interior<.55?190:122-40*a+21*t+46*c+10*valley),byte(112+45*a+21*t+6*c),255],p);if(alpha[i])covered++;
 }
 const pigment=new THREE.DataTexture(pigmentBytes,w,h);pigment.colorSpace=THREE.SRGBColorSpace;const relief=new THREE.DataTexture(reliefBytes,w,h);
 for(const texture of[pigment,relief]){texture.minFilter=THREE.LinearMipmapLinearFilter;texture.magFilter=THREE.LinearFilter;texture.generateMipmaps=true;texture.needsUpdate=true}
 return{pigment,relief,info:{width:w,height:h,rawBytes:pigmentBytes.byteLength+reliefBytes.byteLength,rgba8WithMipsEstimate:(pigmentBytes.byteLength+reliefBytes.byteLength)*4/3,coverageSamples:covered,bakeMs:performance.now()-started,method:'source-interior material shading; sapphire rim, warm stroke/dot accents, teal/coral satin; no glyph cuts/discard/displacement',channels:'R auxiliary height; G roughness; B metalness; opaque alpha',limits:'Provisional surface ornament, not original or historically authenticated calligraphy'},dispose(){pigment.dispose();relief.dispose()}};
}
