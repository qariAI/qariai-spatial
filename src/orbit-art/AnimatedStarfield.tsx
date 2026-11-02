import {useEffect,useMemo,useRef} from 'react';
import {useFrame,useThree} from '@react-three/fiber';
import * as THREE from 'three';
// Two existing seeded shells, no CPU position rewriting, no Gaussian sorting or textures.
export function AnimatedStars({count,radius,opacity,size,seed,paused}:{count:number;radius:number;opacity:number;size:number;seed:number;paused:boolean}){
 const ref=useRef<THREE.Points>(null),time=useRef(0),angle=useRef(0);const {gl}=useThree();
 const scale=useMemo(()=>new THREE.Vector3(),[]),buffer=useMemo(()=>new THREE.Vector2(),[]);
 const geometry=useMemo(()=>{let x=seed>>>0;const rand=()=>{x=(1664525*x+1013904223)>>>0;return x/4294967296};const a=new Float32Array(count*3),ids=new Float32Array(count);for(let i=0;i<count;i++){const theta=rand()*Math.PI*2,u=rand()*2-1,r=radius*(.48+rand()*.52),h=Math.sqrt(1-u*u);a[i*3]=r*h*Math.cos(theta);a[i*3+1]=r*u*.7;a[i*3+2]=r*h*Math.sin(theta);ids[i]=((i*137+seed)%997)/997}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(a,3));g.setAttribute('starSeed',new THREE.BufferAttribute(ids,1));return g},[count,radius,seed]);
 const material=useMemo(()=>new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,fog:true,toneMapped:false,uniforms:{...THREE.UniformsUtils.clone(THREE.UniformsLib.fog),uTime:{value:0},uDesktopDetail:{value:1},uSize:{value:size},uWorldScale:{value:1},uHeight:{value:800},uOpacity:{value:opacity},uMaxPixels:{value:Math.min(16,gl.getContext().getParameter(gl.getContext().ALIASED_POINT_SIZE_RANGE)[1])}},vertexShader:`attribute float starSeed;
 uniform float uTime,uSize,uWorldScale,uHeight,uMaxPixels;varying float vSeed;
 #include <fog_pars_vertex>
 void main(){vSeed=starSeed;vec4 mvPosition=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*mvPosition;gl_PointSize=clamp(uSize*uWorldScale*uHeight*.5/max(.001,-mvPosition.z)*(1.25+3.*starSeed*starSeed),1.,uMaxPixels);
 #include <fog_vertex>
 }`,fragmentShader:`uniform float uTime,uOpacity,uDesktopDetail;varying float vSeed;
 #include <fog_pars_fragment>
 void main(){vec2 p=gl_PointCoord*2.-1.;float r2=dot(p,p);if(r2>1.)discard;float soft=(exp(-4.*r2)-exp(-4.))/(1.-exp(-4.));float pulse;vec3 color;
 // Coherent uniform branch: preserve the original XR shading and its cost.
 if(uDesktopDetail>.5){
   pulse=(.9+.07*sin(uTime*(.28+vSeed*.31)+vSeed*30.)+.03*sin(uTime*.17+vSeed*71.))*mix(.62,1.,smoothstep(.12,.96,vSeed));
   color=mix(vec3(.70,.80,1.),vec3(1.,.86,.65),smoothstep(.94,1.,vSeed));
 }else{
   pulse=.88+.12*sin(uTime*(.35+vSeed*.45)+vSeed*30.);
   color=mix(vec3(.52,.69,1.),vec3(1.,.89,.68),smoothstep(.88,1.,vSeed));
 }
 gl_FragColor=vec4(color,uOpacity*soft*pulse);
 #include <fog_fragment>
 #include <colorspace_fragment>
 }`}),[gl,opacity,size]);
 useEffect(()=>()=>{geometry.dispose();material.dispose()},[geometry,material]);
 useFrame((_,dt)=>{if(!ref.current)return;const xr=gl.xr.isPresenting;if(!paused){time.current+=Math.min(dt,.05);if(!xr)angle.current+=Math.min(dt,.05)*.0015}ref.current.rotation.y=angle.current;gl.getDrawingBufferSize(buffer);const view=xr?(gl.xr.getCamera().cameras[0] as THREE.Camera&{viewport?:THREE.Vector4})?.viewport:undefined;ref.current.getWorldScale(scale);material.uniforms.uTime.value=time.current;material.uniforms.uDesktopDetail.value=xr?0:1;material.uniforms.uHeight.value=view?.w??buffer.y;material.uniforms.uWorldScale.value=xr?Math.max(scale.x,scale.y,scale.z):1;geometry.setDrawRange(0,xr?Math.min(count,Math.ceil(count*.42)):count)});
 return <points ref={ref} name={'qari-art-stars-'+seed} geometry={geometry} material={material} userData={{kind:'procedural-soft-stars',count,additionalBytes:count*4,noTexture:true}}/>;
}
