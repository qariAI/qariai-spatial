const assert=require('node:assert/strict'),{buildSync}=require('esbuild'),fs=require('node:fs');
const load=file=>{const code=buildSync({entryPoints:[file],bundle:true,write:false,format:'cjs'}).outputFiles[0].text,m={exports:{}};new Function('module','exports',code)(m,m.exports);return m.exports;};
const {OrbitPinch}=load('src/xr/OrbitPinch.ts'),{experienceHref}=load('src/integration/routes.ts'),{endBeforeNavigation}=load('src/integration/navigation.ts');
(async()=>{
 const scenarios=[];
 for(const hand of ['left','right'])for(const target of ['letter','phase']){
  const gate=new OrbitPinch();let now=1,cooldown=0,actions=0;
  const sample=d=>{now+=.05;const press=gate.update(d);if(press&&now>cooldown){actions++;cooldown=now+.35;}return press;};
  const open=()=>{sample(.05);sample(.05)};
  for(let i=0;i<5;i++)sample(.02);assert.equal(actions,0,'initial closed hand blocked');
  sample(.05);sample(.03);sample(.02);assert.equal(actions,0,'one open frame or hysteresis band cannot arm');
  open();sample(.026);assert.equal(actions,0,'unchanged close threshold');sample(.025);assert.equal(actions,1);
  sample(.03);sample(.037);sample(.02);assert.equal(actions,1,'hysteresis prevents duplicate presses');sample(.038);assert.equal(gate.pinching,false);
  sample(.02);assert.equal(actions,1,'existing cooldown retained');sample(.05);now+=.4;sample(.02);assert.equal(actions,2);
  for(const reason of ['missing tip','missing thumb','missing wrist','hidden hand','blurred session','session end','session restart','source disconnected']){
   gate.loseTracking();const previous=actions;
   for(let i=0;i<5;i++)sample(.02);assert.equal(actions,previous,reason+' must block closed recovery');
   sample(.038);sample(.02);assert.equal(actions,previous,'single open sample insufficient');
   open();now+=.4;sample(.02);assert.equal(actions,previous+1,reason+' deliberate reopen/pinch recovers');
  }
  for(const invalid of [NaN,Infinity,-1]){gate.update(invalid);sample(.02);assert.equal(gate.pinching,false);}
  scenarios.push({hand,target,passed:true});
 }
 const left=new OrbitPinch(),right=new OrbitPinch();left.update(.05);left.update(.05);right.update(.05);right.update(.05);left.loseTracking();assert.equal(left.update(.02),false);assert.equal(right.update(.02),true,'independent hand gates');
 const paths=['/','/harf-studio.html','/harf-studio-xr.html'];
 for(const path of paths){
  assert.equal(experienceHref(path,'?calligraphyRelief=texture'),path+'?calligraphyRelief=texture');
  for(const search of ['', '?calligraphyRelief=physical','?calligraphyRelief=Texture','?raisedCalligraphy=1','?calligraphyRelief=texture&calligraphyRelief=texture','?calligraphyRelief=texture&calligraphyRelief=bad','?return=https://evil.test'])assert.equal(experienceHref(path,search),path);
  assert.equal(experienceHref(path,'?calligraphyRelief=texture&return=//evil.test&raisedCalligraphy=1'),path+'?calligraphyRelief=texture');
 }
 for(const path of ['//evil.test','https://evil.test/','/\\evil.test','/harf-studio-xr.html?return=//evil.test','/../','javascript:alert(1)'])assert.throws(()=>experienceHref(path,'?calligraphyRelief=texture'));
 for(const search of ['', '?calligraphyRelief=texture']){
  const studio=experienceHref('/harf-studio-xr.html',search),svg=experienceHref('/harf-studio.html',new URL(studio,'https://test.local').search),orbit=experienceHref('/',new URL(svg,'https://test.local').search);assert.equal(orbit,'/'+search);
 }
 class Session{listeners=new Set();addEventListener(_,f){this.listeners.add(f)}removeEventListener(_,f){this.listeners.delete(f)}async end(){setTimeout(()=>this.listeners.forEach(f=>f()),5)}}
 let destination;await endBeforeNavigation(new Session(),()=>destination=experienceHref('/','?calligraphyRelief=texture'),100);assert.equal(destination,'/?calligraphyRelief=texture');
 const stuck=new Session();stuck.end=async()=>{};destination=null;await assert.rejects(()=>endBeforeNavigation(stuck,()=>destination='unsafe',10));assert.equal(destination,null);
 const report={success:true,scenarios,navigation:'allowlisted paths; explicit texture only; default/invalid/duplicate/external values excluded; SVG detour/reload-safe query; session end/timeout retained',limits:'Deterministic logic tests, not physical Quest evidence'};
 fs.mkdirSync('docs/quest-readiness',{recursive:true});fs.writeFileSync('docs/quest-readiness/focused-tests.json',JSON.stringify(report,null,2));console.log('PASS',JSON.stringify(report));
})().catch(e=>{console.error(e);process.exitCode=1});
