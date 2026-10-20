import * as THREE from 'three';

// Study-only camera inspection. Moves neither glyph nor lights; no animation,
// pan or inertia. Preset buttons restore the original matched camera endpoints.
export function enableInspection({element,goal,target,onChange,onReset}){
 const spherical=new THREE.Spherical(),offset=new THREE.Vector3();
 const events=[],listen=(node,type,handler,options)=>{node.addEventListener(type,handler,options);events.push(()=>node.removeEventListener(type,handler,options))};
 let pointer=null,lastX=0,lastY=0,maxRadius=20;
 const sync=()=>{offset.copy(goal).sub(target);spherical.setFromVector3(offset)};
 const stop=()=>{if(pointer!==null&&element.hasPointerCapture(pointer))element.releasePointerCapture(pointer);pointer=null;element.classList.remove('dragging')};
 const apply=()=>{spherical.phi=THREE.MathUtils.clamp(spherical.phi,.26,Math.PI-.26);spherical.radius=THREE.MathUtils.clamp(spherical.radius,3.8,maxRadius);goal.copy(offset.setFromSpherical(spherical)).add(target);onChange()};
 listen(element,'pointerdown',e=>{if(pointer!==null||e.button!==0)return;sync();pointer=e.pointerId;lastX=e.clientX;lastY=e.clientY;element.setPointerCapture(pointer);element.focus({preventScroll:true});element.classList.add('dragging');e.preventDefault()});
 listen(element,'pointermove',e=>{if(e.pointerId!==pointer)return;const dx=e.clientX-lastX,dy=e.clientY-lastY;lastX=e.clientX;lastY=e.clientY;spherical.theta-=dx*.006;spherical.phi-=dy*.006;apply()});
 for(const name of ['pointerup','pointercancel','lostpointercapture'])listen(element,name,e=>{if(e.pointerId===pointer)stop()});
 listen(window,'blur',stop);
 listen(element,'wheel',e=>{if(e.ctrlKey)return;e.preventDefault();sync();spherical.radius*=Math.exp(THREE.MathUtils.clamp(e.deltaY,-150,150)*.0015);apply()},{passive:false});
 listen(element,'keydown',e=>{if(e.key==='Home'){stop();onReset();e.preventDefault();return}if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','=','-'].includes(e.key))return;e.preventDefault();sync();if(e.key==='ArrowLeft')spherical.theta-=.1;if(e.key==='ArrowRight')spherical.theta+=.1;if(e.key==='ArrowUp')spherical.phi-=.1;if(e.key==='ArrowDown')spherical.phi+=.1;if(['+','='].includes(e.key))spherical.radius*=.9;if(e.key==='-')spherical.radius*=1.1;apply()});
 sync();return{reset(){stop();sync();maxRadius=Math.max(12,spherical.radius*1.7)},dispose(){stop();events.forEach(remove=>remove())}};
}
