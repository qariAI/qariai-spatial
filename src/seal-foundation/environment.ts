import * as T from 'three';
export function makeStudioEnvironment(gl:T.WebGLRenderer,size:number){
  // Analytic studio radiance, not an AI image or an external artwork texture.
  const directions=[new T.Vector3(-.5,.7,.7).normalize(),new T.Vector3(.8,.15,.4).normalize()];
  const faces=Array.from({length:6},(_,face)=>{const c=document.createElement('canvas');c.width=c.height=size;const ctx=c.getContext('2d')!,data=ctx.createImageData(size,size);
    for(let y=0;y<size;y++)for(let x=0;x<size;x++){const u=(x+.5)/size*2-1,v=(y+.5)/size*2-1;
      const d=new T.Vector3(...([[1,-v,-u],[-1,-v,u],[u,1,v],[u,-1,-v],[u,-v,1],[-u,-v,-1]][face] as [number,number,number])).normalize();
      const a=Math.exp(28*(d.dot(directions[0])-1)),b=Math.exp(45*(d.dot(directions[1])-1));
      data.data.set([Math.min(255,32+a*215+b*150),Math.min(255,36+a*215+b*116),Math.min(255,44+a*211+b*75),255],(y*size+x)*4);
    }ctx.putImageData(data,0,0);return c;});
  const cube=new T.CubeTexture(faces);cube.colorSpace=T.SRGBColorSpace;cube.needsUpdate=true;
  const generator=new T.PMREMGenerator(gl),target=generator.fromCubemap(cube);generator.dispose();cube.dispose();
  return {texture:target.texture,bytes:target.width*target.height*8,dispose:()=>target.dispose()};
}
