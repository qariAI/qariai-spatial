import * as T from 'three';
import {SVGLoader} from 'three/examples/jsm/loaders/SVGLoader.js';
import {mergeGeometries} from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import outlines from './outlines.json';
export function makeSeal(){
 const root=new T.Group(),loader=new SVGLoader();const gold=new T.MeshStandardMaterial({color:'#c9c0a0',metalness:.72,roughness:.34}),bronze=new T.MeshStandardMaterial({color:'#705135',metalness:.72,roughness:.48}),dark=new T.MeshStandardMaterial({color:'#18212a',metalness:.52,roughness:.69});
 const canvas=document.createElement('canvas');canvas.width=canvas.height=256;const c=canvas.getContext('2d')!,pixels=c.createImageData(256,256);let seed=4837;for(let i=0;i<pixels.data.length;i+=4){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const n=96+(seed>>>25);pixels.data.set([n,n,n,255],i);}c.putImageData(pixels,0,0);const grain=new T.CanvasTexture(canvas);grain.wrapS=grain.wrapT=T.RepeatWrapping;grain.repeat.set(4,4);dark.bumpMap=grain;dark.bumpScale=.025;dark.roughnessMap=grain;gold.bumpMap=grain;gold.bumpScale=.003;bronze.bumpMap=grain;bronze.bumpScale=.009;
 function mesh(geometry:T.BufferGeometry,material:T.Material|T.Material[],z=0){const m=new T.Mesh(geometry,material);m.position.z=z;m.castShadow=true;m.receiveShadow=true;root.add(m);return m;}
 const plateShape=new T.Shape();plateShape.absarc(0,0,4.58,0,Math.PI*2,false);
 for(let i=0;i<7;i++){const angle=Math.PI/2-(i+.5)*Math.PI*2/7,c=Math.cos(angle),s=Math.sin(angle),p=(r:number,t:number)=>new T.Vector2(r*c-t*s,r*s+t*c);const hole=new T.Path(),a=p(2.14,0),b=p(2.7,.36),d=p(3.65,.34),e=p(4.03,0),f=p(3.65,-.34),g=p(2.7,-.36);hole.moveTo(a.x,a.y);hole.bezierCurveTo(b.x,b.y,d.x,d.y,e.x,e.y);hole.bezierCurveTo(f.x,f.y,g.x,g.y,a.x,a.y);plateShape.holes.push(hole);}
 mesh(new T.ExtrudeGeometry(plateShape,{depth:.4,steps:1,bevelEnabled:true,bevelSize:.018,bevelThickness:.018,bevelSegments:2,curveSegments:18}),[dark,bronze],-.45);
 const boss=mesh(new T.CylinderGeometry(1.84,1.88,.09,96,1),dark,.025);boss.rotation.x=Math.PI/2;
 function circle(radius:number,z:number,material:T.Material,tube=.018){const m=mesh(new T.TorusGeometry(radius,tube,6,160),material,z);m.castShadow=false;return m;}
 circle(4.48,-.035,bronze,.045);circle(4.34,.015,gold,.011);circle(4.16,-.015,bronze,.025);circle(1.91,.085,bronze,.024);circle(1.86,.09,gold,.008);
 const lattice:T.BufferGeometry[]=[];
 for(let i=0;i<14;i++){
  const a=i*Math.PI*2/14;const points=Array.from({length:33},(_,j)=>{const t=j/32,angle=a+(t-.5)*.54,r=2.12+1.87*Math.sin(t*Math.PI);return new T.Vector3(Math.cos(angle)*r,Math.sin(angle)*r,.006-.025*Math.cos(t*Math.PI*2));});
  lattice.push(new T.TubeGeometry(new T.CatmullRomCurve3(points),32,.026,5,false));
 }
 mesh(mergeGeometries(lattice),bronze);lattice.forEach(g=>g.dispose());
 // Broken engraved ticks are geometric, never pseudo-Arabic diacritic marks.
 const ticks:T.BufferGeometry[]=[];for(let i=0;i<70;i++){const a=i*Math.PI*2/70;const g=new T.BoxGeometry(i%5===0?.014:.007,i%5===0?.12:.05,.01);g.rotateZ(a-Math.PI/2);g.translate(Math.cos(a)*4.25,Math.sin(a)*4.25,.013);ticks.push(g);}mesh(mergeGeometries(ticks),bronze);ticks.forEach(g=>g.dispose());
 const glyphs:T.BufferGeometry[]=[],backs:T.BufferGeometry[]=[];
 function glyph(data:{path:string;bounds:number[]},x:number,y:number,angle:number,size:number,fitWidth=false){
  const [l,b,r,t]=data.bounds,s=size/(fitWidth?r-l:t-b);const paths=loader.parse(`<svg xmlns="http://www.w3.org/2000/svg"><path fill="#fff" fill-rule="nonzero" d="${data.path}"/></svg>`).paths;
  for(const path of paths){const shapes=SVGLoader.createShapes(path);if(!shapes.length)continue;const g=new T.ExtrudeGeometry(shapes,{depth:.145,bevelEnabled:false,curveSegments:10,steps:1});g.translate(-(l+r)/2,-(b+t)/2,0);g.scale(s,s,1);g.rotateZ(angle);g.translate(x,y,.065);glyphs.push(g);const back=new T.ExtrudeGeometry(shapes,{depth:.13,bevelEnabled:true,bevelSize:.003,bevelThickness:.008,bevelSegments:2,curveSegments:6});back.translate(-(l+r)/2,-(b+t)/2,0);back.scale(s,s,1);back.rotateZ(angle);back.translate(x,y,.05);backs.push(back);}
 }
 outlines.letters.forEach((data,i)=>{const angle=Math.PI/2-i*Math.PI*2/7;glyph(data,Math.cos(angle)*2.87,Math.sin(angle)*2.87,angle-Math.PI/2,1.74);});
 glyph(outlines.excerpt,0,.13,0,3.42,true);
 // Material groups from extrusion distinguish native outline caps and bronze sides.
 // Consolidate all cap/side groups into two draws, preserving every triangle.
 for(const materialIndex of [0,1]){const positions:number[]=[],normals:number[]=[],uvs:number[]=[];for(const g of glyphs){for(const part of g.groups){if(part.materialIndex!==materialIndex)continue;for(let i=part.start;i<part.start+part.count;i++){const n=g.index?g.index.getX(i):i;positions.push(g.attributes.position.getX(n),g.attributes.position.getY(n),g.attributes.position.getZ(n));normals.push(g.attributes.normal.getX(n),g.attributes.normal.getY(n),g.attributes.normal.getZ(n));uvs.push(g.attributes.uv.getX(n),g.attributes.uv.getY(n));}}}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('normal',new T.Float32BufferAttribute(normals,3));g.setAttribute('uv',new T.Float32BufferAttribute(uvs,2));mesh(g,materialIndex===0?gold:bronze);}
 glyphs.forEach(g=>g.dispose());mesh(mergeGeometries(backs),bronze);backs.forEach(g=>g.dispose());
 let geometryBytes=0,triangles=0;root.traverse(o=>{if(o instanceof T.Mesh){const g=o.geometry;for(const name of Object.keys(g.attributes))geometryBytes+=g.getAttribute(name).array.byteLength;if(g.index)geometryBytes+=g.index.array.byteLength;triangles+=(g.index?g.index.count:g.attributes.position.count)/3;}});root.userData.resources={geometryBytes,triangles,grainBytesWithMipmaps:256*256*4*4/3,shadowMapSize:512};
 root.userData.provenance={font:outlines.font.sha256,excerpt:outlines.excerpt.text,letters:outlines.letters.map(x=>x.text).join(' ')};
 return {root,dispose:()=>{root.traverse(o=>{if(o instanceof T.Mesh)o.geometry.dispose();});gold.dispose();bronze.dispose();dark.dispose();grain.dispose();}};
}
