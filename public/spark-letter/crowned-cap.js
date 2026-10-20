import * as THREE from 'three';
// Refine cap triangles in Z only. XY is preserved under midpoint subdivision.
// The source boundary and projected letter silhouette never move.
export function crownCap(source,shape,{scale,tx,ty,bevel,height=.004,width=.055}){
 const outline=shape.extractPoints(12),rings=[outline.shape,...outline.holes].map(r=>r.map(p=>new THREE.Vector2(p.x*scale+tx,p.y*scale+ty)));
 const distance=(x,y)=>{let best=Infinity,gx=0,gy=0;for(const ring of rings)for(let i=0;i<ring.length;i++){const a=ring[i],b=ring[(i+1)%ring.length],dx=b.x-a.x,dy=b.y-a.y,len=dx*dx+dy*dy;if(!len)continue;const t=THREE.MathUtils.clamp(((x-a.x)*dx+(y-a.y)*dy)/len,0,1),xx=x-a.x-t*dx,yy=y-a.y-t*dy,d=Math.hypot(xx,yy);if(d<best){best=d;gx=d?xx/d:0;gy=d?yy/d:0}}return{d:best,gx,gy}};
 const pos=[],norm=[],uv=[],groups=[],a=source.attributes.position,n=source.attributes.normal,u=source.attributes.uv;
 let refined=0;
 const vertex=(v,crown)=>{pos.push(v[0],v[1],v[2]);uv.push(v[6],v[7]);if(!crown){norm.push(v[3],v[4],v[5]);return}const q=distance(v[0],v[1]),t=THREE.MathUtils.clamp((q.d-bevel)/width,0,1),h=height*t*t*(3-2*t),slope=t>0&&t<1?height*6*t*(1-t)/width:0;pos[pos.length-1]+=h;const normal=new THREE.Vector3(-q.gx*slope,-q.gy*slope,1).normalize();norm.push(normal.x,normal.y,normal.z)};
 const middle=(a,b)=>a.map((x,i)=>(x+b[i])*.5);
 const triangle=(a,b,c,depth)=>{if(depth){const ab=middle(a,b),bc=middle(b,c),ca=middle(c,a);triangle(a,ab,ca,depth-1);triangle(ab,b,bc,depth-1);triangle(ca,bc,c,depth-1);triangle(ab,bc,ca,depth-1)}else{vertex(a,true);vertex(b,true);vertex(c,true);refined++}};
 for(const group of source.groups){const start=pos.length/3;for(let i=group.start;i<group.start+group.count;i+=3){const v=[0,1,2].map(k=>[a.getX(i+k),a.getY(i+k),a.getZ(i+k),n.getX(i+k),n.getY(i+k),n.getZ(i+k),u.getX(i+k),u.getY(i+k)]);if(group.materialIndex===0&&v.every(p=>p[5]>.99))triangle(...v,1);else v.forEach(p=>vertex(p,false))}groups.push({start,count:pos.length/3-start,materialIndex:group.materialIndex})}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(norm,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));groups.forEach(x=>g.addGroup(x.start,x.count,x.materialIndex));g.computeBoundingBox();
 return{geometry:g,refinedTriangles:refined,profile:{height,width,projectedSilhouette:'unchanged; existing triangles partitioned by midpoint subdivision; Z-only crown'}};
}
