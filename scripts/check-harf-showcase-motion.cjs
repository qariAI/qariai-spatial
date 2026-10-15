const {buildSync}=require('esbuild'),assert=require('node:assert/strict'),fs=require('node:fs');
function load(path){const code=buildSync({entryPoints:[path],bundle:true,write:false,format:'cjs'}).outputFiles[0].text,m={exports:{}};new Function('module','exports',code)(m,m.exports);return m.exports;}
const {waypoints,jointSettled}=load('src/showcase/harf-motion.ts'),{Tracing,Pinch,GUIDE,DOT}=load('src/harf-xr/tracing.ts');const {Vector3}=require('three');
const results=[];
for(const fps of [15,30,72]){
 const trace=new Tracing(),pinch=new Pinch(),dt=1/fps;let time=0,previous=false,filtered=null,maxStep=0,jumps=0;
 function frame(point,gap){time+=dt*1000;const down=pinch.update(gap,time),a=1-Math.exp(-Math.min(.05,dt)*35);filtered=filtered?{x:filtered.x+(point.x-filtered.x)*a,y:filtered.y+(point.y-filtered.y)*a}:point;if(down&&!previous)trace.begin(filtered);if(down)trace.move(filtered);if(!down&&previous)trace.end();previous=down;if(trace.feedback.includes('tracking jump'))jumps++;}
 function settle(point,gap,minMs=45,minFrames=2){for(let n=1;;n++){frame(point,gap);if(n>=minFrames&&n*dt*1000>=minMs)break;}}
 function ramp(point,from,to){for(let i=1;i<=8;i++){const p=from+(to-from)*i/8;settle(point,.109*(1-p)+.0021*p,0,1);}settle(point,to?.0021:.109,to?100:220,3);}
 const points=waypoints(GUIDE);settle(points[0],.109,220,3);ramp(points[0],0,1);
 for(let i=1;i<points.length&&trace.phase==='body';i++){maxStep=Math.max(maxStep,Math.hypot(points[i].x-points[i-1].x,points[i].y-points[i-1].y));settle(points[i],.0021);}
 // Body independently reaches its real second learning step.
 assert.equal(trace.phase,'dot','body at '+fps+' FPS');const bodyProgress=trace.progress;const bodySeconds=time/1000;assert.equal(jumps,0);assert(maxStep<=4);
 ramp(points.at(-1),1,0);const start=filtered;const steps=Math.ceil(Math.hypot(DOT.x-start.x,DOT.y-start.y)/8);for(let i=1;i<=steps;i++)settle({x:start.x+(DOT.x-start.x)*i/steps,y:start.y+(DOT.y-start.y)*i/steps},.109,0,1);settle(DOT,.109,220,3);
 assert.equal(trace.phase,'dot','moving an open hand must not place dot');ramp(DOT,0,1);assert.equal(trace.phase,'complete','separate dot at '+fps+' FPS');ramp(DOT,1,0);assert(!pinch.down);
 results.push({fps,body:'dot learning step observed',bodyProgress,bodySeconds:Number(bodySeconds.toFixed(2)),dot:'complete observed only after separate close',combined:'complete',trackingJumpWarnings:jumps,maxCommandStepPixels:maxStep});
}
assert(!jointSettled(new Vector3(.1,0,0),new Vector3(.1,.001,0),new Vector3(),1));assert(!jointSettled(new Vector3(),new Vector3(0,.1,0),new Vector3(),1));assert(jointSettled(new Vector3(),new Vector3(0,.002,0),new Vector3(),1));
const report={kind:'Unchanged validator/filter/pinch simulation, NOT rendered XR/UI or Quest evidence',results};fs.writeFileSync('docs/vr-showcase/motion-regression.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
