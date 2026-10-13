// One bounded attempt. Reuses the existing baseline fixture; never downloads assets.
const fs=require('fs'),path=require('path'),{spawn}=require('child_process');
const project=path.resolve(__dirname,'..'),baseline=process.env.QARI_BASELINE_PROJECT;
if(!baseline||!fs.existsSync(path.join(baseline,'src/CalligraphyDepthArt.tsx')))throw Error('Provide the existing unmodified baseline fixture via QARI_BASELINE_PROJECT');
const root=path.join(project,'docs/v1.4.8/refinement/final');fs.mkdirSync(root,{recursive:true});
const start=Date.now();let child,finished=false;
const report={method:'unchanged camera callbacks stepped at 50ms; intermediate GPU draws suppressed; final frame rendered normally',budgetMs:90000,status:'running',captures:[]};
function write(){report.elapsedMs=Date.now()-start;fs.writeFileSync(path.join(root,'capture-result.json'),JSON.stringify(report,null,2));}
function kill(){if(child)try{process.kill(-child.pid,'SIGKILL')}catch{}}
const deadline=setTimeout(()=>{if(finished)return;report.status='unavailable';report.reason='Single 90-second pair-capture budget exceeded; no repeated long retries';write();kill();console.error(report.reason);process.exitCode=1;},90000);
async function run(cwd,label){
 if(cwd!==project) fs.copyFileSync(path.join(project,'scripts/calligraphy-desktop.cjs'),path.join(cwd,'scripts/calligraphy-desktop.cjs'));
 const output=path.join(root,label);fs.mkdirSync(output,{recursive:true});
 return await new Promise(resolve=>{child=spawn(process.execPath,['scripts/calligraphy-desktop.cjs'],{cwd,detached:true,stdio:'inherit',env:{...process.env,BASELINE:label==='before'?'1':'',CAPTURE_ONLY:'1',PREVIEW:'1',STEPPED_CAPTURE:'1',QARI_CAPTURE_DIR:output}});child.on('exit',(code,signal)=>{if(code===0)report.captures.push(label);else report.reason=`${label} failed (${signal||code})`;resolve(code===0);});});
}
(async()=>{try{
 let ok=await run(baseline,'before');if(ok&&Date.now()-start<90000)ok=await run(project,'after');
 if(ok){for(const view of ['far','close']){const a=JSON.parse(fs.readFileSync(path.join(root,'before',view+'-state.json'))),b=JSON.parse(fs.readFileSync(path.join(root,'after',view+'-state.json')));if(JSON.stringify(a.camera)!==JSON.stringify(b.camera)||JSON.stringify(a.target)!==JSON.stringify(b.target))throw Error('Camera endpoints do not match');}report.status='available';}
 else report.status='unavailable';
}catch(e){report.status='unavailable';report.reason=e.message;process.exitCode=1;}
finally{finished=true;clearTimeout(deadline);kill();write();console.log(JSON.stringify(report));if(report.status!=='available')process.exitCode=1;}})();
