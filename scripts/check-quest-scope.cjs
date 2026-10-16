const {execFileSync}=require('node:child_process'),fs=require('node:fs'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const base='6f4fd70a19ae6914d2035752413467867845de0b';
const approved=new Set(['src/App.tsx','src/xr/OrbitPinch.ts','src/integration/routes.ts','src/integration/OrbitPracticeLink.tsx','src/harf-xr/main.ts','src/harf-xr/desktop.ts']);
const files=execFileSync('git',['ls-tree','-r','--name-only',base],{encoding:'utf8'}).trim().split('\n').filter(f=>f.startsWith('src/')||f.startsWith('public/')||['package.json','package-lock.json','harf-studio.html','harf-studio-xr.html','index.html','vite.config.ts'].includes(f));
const verified=[];for(const file of files){if(approved.has(file))continue;const old=execFileSync('git',['show',base+':'+file]),now=fs.readFileSync(file);assert(old.equals(now),file+' changed outside approved scope');verified.push({file,sha256:crypto.createHash('sha256').update(now).digest('hex')});}
const oldApp=execFileSync('git',['show',base+':src/App.tsx'],{encoding:'utf8'}),app=fs.readFileSync('src/App.tsx','utf8');
const outsideTracking=s=>s.replace("import { OrbitPinch } from './xr/OrbitPinch';\n",'').replace(/function HandTracking\([\s\S]*?(?=function ImmersiveButton\()/,'');
assert.equal(outsideTracking(app),outsideTracking(oldApp),'Orbit artwork, cameras, UI, scene, phase choreography and session entry must stay exact');
const changed=execFileSync('git',['diff','--name-only',base,'--','src'],{encoding:'utf8'}).trim().split('\n').filter(Boolean);assert(changed.every(f=>approved.has(f)));
const report={success:true,base,scope:'Only Orbit recovery and internal navigation adapters; all other tracked source/public assets and package/HTML configuration byte-identical',orbitOutsideHandTracking:'byte-identical',verified};
fs.mkdirSync('docs/quest-readiness',{recursive:true});fs.writeFileSync('docs/quest-readiness/scope.json',JSON.stringify(report,null,2));console.log('PASS',verified.length,'unchanged source/assets; complete Orbit outside HandTracking byte-identical');
