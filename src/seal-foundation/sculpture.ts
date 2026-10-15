import * as T from 'three';
import {mergeGeometries} from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {DEPTH_LEVELS,QUALITY,type Quality} from './config';

function maps(size:number){
  const height=new Float32Array(size*size);let seed=7349;
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    seed=(Math.imul(seed,1664525)+1013904223)>>>0;
    height[y*size+x]=.5+.018*Math.sin(x/size*Math.PI*96)+.01*Math.sin((x+y*2)/size*Math.PI*56)+.025*((seed>>>24)/255-.5);
  }
  const normal=new Uint8Array(size*size*4),orm=new Uint8Array(size*size*4);
  const at=(x:number,y:number)=>height[((y+size)%size)*size+(x+size)%size];
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const i=(y*size+x)*4,n=new T.Vector3((at(x-1,y)-at(x+1,y))*1.8,(at(x,y-1)-at(x,y+1))*1.8,1).normalize(),h=at(x,y);
    normal.set([Math.round((n.x*.5+.5)*255),Math.round((n.y*.5+.5)*255),Math.round((n.z*.5+.5)*255),255],i);
    orm.set([255,Math.round(135+h*70),Math.round(204+h*32),255],i);
  }
  const make=(data:Uint8Array<ArrayBuffer>)=>{const t=new T.DataTexture(data,size,size,T.RGBAFormat);t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(3,3);t.minFilter=T.LinearMipmapLinearFilter;t.magFilter=T.LinearFilter;t.generateMipmaps=true;t.colorSpace=T.NoColorSpace;t.needsUpdate=true;return t;};
  return {normal:make(normal),orm:make(orm)};
}
export function makeFoundation(profile:Quality){
  const q=QUALITY[profile],textures=maps(q.textureSize),root=new T.Group();root.name='NONSCRIPTURAL_GEOMETRIC_FOUNDATION';
  const materials={
    bronze:new T.MeshStandardMaterial({color:'#69503a',envMapIntensity:1.4,metalness:.96,roughness:.64,normalMap:textures.normal,normalScale:new T.Vector2(.26,.26),roughnessMap:textures.orm,metalnessMap:textures.orm}),
    slate:new T.MeshStandardMaterial({color:'#233844',metalness:.12,roughness:.96,normalMap:textures.normal,normalScale:new T.Vector2(.22,.22),roughnessMap:textures.orm,metalnessMap:textures.orm}),
    gold:new T.MeshStandardMaterial({color:'#cfbf92',envMapIntensity:1.5,metalness:1,roughness:.42,normalMap:textures.normal,normalScale:new T.Vector2(.14,.14),roughnessMap:textures.orm,metalnessMap:textures.orm}),
    inlay:new T.MeshStandardMaterial({color:'#326f73',metalness:.55,roughness:.48,emissive:'#10383b',emissiveIntensity:.12,normalMap:textures.normal,normalScale:new T.Vector2(.1,.1)}),
  };
  const batches:Record<keyof typeof materials,T.BufferGeometry[]>={bronze:[],slate:[],gold:[],inlay:[]};
  function add(g:T.BufferGeometry,material:keyof typeof materials,z=0){g.translate(0,0,z);g.clearGroups();const n=g.index?g.toNonIndexed():g;if(n!==g)g.dispose();batches[material].push(n);}
  function disk(radius:number,depth:number,top:number,mat:keyof typeof materials){const g=new T.CylinderGeometry(radius,radius,depth,q.radialSegments);g.rotateX(Math.PI/2);add(g,mat,top-depth/2);}
  disk(4.6,.35,-.18,'bronze');disk(4.24,.11,DEPTH_LEVELS[0],'slate');
  // Lathed architectural edge: recessed lip, bevel, flattened crown and outer shoulder.
  const rimProfile=[[4.15,-.19],[4.15,-.08],[4.22,-.055],[4.27,.08],[4.31,.11],[4.35,.15],[4.4,.15],[4.44,.09],[4.49,.07],[4.54,.03],[4.61,-.05],[4.65,-.16],[4.6,-.29],[4.47,-.34],[4.28,-.28],[4.15,-.19]];
  const rim=new T.LatheGeometry(rimProfile.map(([x,y])=>new T.Vector2(x,y)),q.radialSegments);rim.rotateX(Math.PI/2);add(rim,'bronze');
  const outline=(r:number,z:number,mat:keyof typeof materials,width=.012)=>{const shape=new T.Shape();shape.absarc(0,0,r+width/2,0,Math.PI*2,false);const hole=new T.Path();hole.absarc(0,0,r-width/2,0,Math.PI*2,true);shape.holes.push(hole);add(new T.ExtrudeGeometry(shape,{depth:.012,bevelEnabled:false,curveSegments:q.radialSegments/4}),mat,z-.012);};
  outline(4.34,.153,'gold',.014);outline(4.19,-.065,'inlay',.019);
  function rail(a:T.Vector2,b:T.Vector2,width:number,top:number,mat:keyof typeof materials,depth=.018){const d=b.clone().sub(a),g=new T.BoxGeometry(d.length(),width,depth);g.rotateZ(Math.atan2(d.y,d.x));g.translate((a.x+b.x)/2,(a.y+b.y)/2,0);add(g,mat,top-depth/2);}
  const polar=(r:number,a:number)=>new T.Vector2(Math.cos(a)*r,Math.sin(a)*r);
  // Pure eightfold polygonal filigree, no glyphs, pseudo-script or traced reference artwork.
  for(let i=0;i<16;i++){
    const a=i*Math.PI/8;
    rail(polar(3.74,a),polar(2.88,a+Math.PI/4),.016,DEPTH_LEVELS[1],'bronze',.012);
    rail(polar(3.74,a),polar(2.88,a-Math.PI/4),.016,DEPTH_LEVELS[1],'bronze',.012);
    rail(polar(3.74,a),polar(3.74,a+Math.PI/8),.012,DEPTH_LEVELS[2],'gold',.012);
  }
  // Seven physical face levels, with four positive non-text calibration contours.
  function polygon(radius:number,inner:number,top:number,mat:keyof typeof materials,points=8,rotation=Math.PI/8){
    const s=new T.Shape(),h=new T.Path();for(let i=0;i<=points;i++){const p=polar(radius,rotation+i*Math.PI*2/points);if(i===0)s.moveTo(p.x,p.y);else s.lineTo(p.x,p.y);}
    for(let i=0;i<=points;i++){const p=polar(inner,rotation-i*Math.PI*2/points);if(i===0)h.moveTo(p.x,p.y);else h.lineTo(p.x,p.y);}s.holes.push(h);
    add(new T.ExtrudeGeometry(s,{depth:.035,steps:1,bevelEnabled:true,bevelSize:.008,bevelThickness:.006,bevelSegments:q.bevelSegments,curveSegments:1}),mat,top-.041);
  }
  polygon(2.94,2.89,DEPTH_LEVELS[2],'bronze');
  for(let layer=3;layer<7;layer++)polygon(2.68-(layer-3)*.46,2.62-(layer-3)*.46,DEPTH_LEVELS[layer],layer%2?'bronze':'gold',8,Math.PI/8+(layer%2)*Math.PI/8);
  // Turquoise tesserae stay inside the support field, without bloom or particles.
  for(let i=0;i<16;i++){const a=i*Math.PI/8,p=polar(3.96,a);const g=new T.BoxGeometry(.055,.055,.012);g.rotateZ(a+Math.PI/4);g.translate(p.x,p.y,0);add(g,'inlay',-.07);}
  for(const key of Object.keys(batches) as (keyof typeof materials)[]){const list=batches[key];const geometry=mergeGeometries(list,false);list.forEach(g=>g.dispose());const mesh=new T.Mesh(geometry,materials[key]);mesh.name=`NONSCRIPTURAL_${key}`;mesh.castShadow=key!=='inlay';mesh.receiveShadow=true;root.add(mesh);}
  let geometryBytes=0,triangles=0;root.traverse(o=>{if(o instanceof T.Mesh){for(const name of Object.keys(o.geometry.attributes))geometryBytes+=o.geometry.getAttribute(name).array.byteLength;triangles+=o.geometry.attributes.position.count/3;}});
  root.userData.resources={profile,geometryBytes,triangles,depthLevels:[...DEPTH_LEVELS],materialMapBytesWithMipmaps:Math.ceil(2*q.textureSize*q.textureSize*4*4/3),shadowTargetBytesEstimate:q.shadowSize*q.shadowSize*8};
  return {root,dispose:()=>{root.traverse(o=>{if(o instanceof T.Mesh)o.geometry.dispose();});Object.values(materials).forEach(m=>m.dispose());textures.normal.dispose();textures.orm.dispose();}};
}
