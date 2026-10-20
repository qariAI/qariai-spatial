// Exact original function body from src/App.tsx at ad10ee39 (name/export only adapted).
import * as THREE from 'three';
export function arabicTexture(letter) {
 const canvas=document.createElement('canvas');canvas.width=256;canvas.height=256;
 const ctx=canvas.getContext('2d');ctx.clearRect(0,0,256,256);
 ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='bold 174px Amiri, serif';
 ctx.shadowColor='#ffb957';ctx.shadowBlur=25;ctx.fillStyle='#fff0b5';ctx.fillText(letter,128,132);
 ctx.shadowBlur=0;ctx.lineWidth=1.4;ctx.strokeStyle='rgba(255,251,214,.85)';ctx.strokeText(letter,128,132);
 const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;return texture;
}
// Sampling coverage only: same font, position and stroke. No shadows in this mask.
// The shared original face above is never overwritten, filtered or resampled here.
export function samplingMask(letter) {
 const c=document.createElement('canvas');c.width=c.height=256;const x=c.getContext('2d',{willReadFrequently:true});
 x.textAlign='center';x.textBaseline='middle';x.font='bold 174px Amiri, serif';
 x.fillStyle='#fff';x.fillText(letter,128,132);x.lineWidth=1.4;x.strokeStyle='#fff';x.strokeText(letter,128,132);
 return x.getImageData(0,0,256,256);
}
