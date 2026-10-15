const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{execFileSync}=require('node:child_process');
const base='b1521ea1149872debeb840b5a8c8d47c4558ca92', report={base,unchanged:{}};
for(const file of ['src/App.tsx','src/style.css','src/calligraphy/content.ts','src/calligraphy/heroBevel.ts','public/fonts/Amiri-Bold.ttf','src/harf-xr/tracing.ts','src/harf-xr/ink.ts','src/harf-xr/session.ts','vite.config.ts','package.json']){
 const original=execFileSync('git',['show',base+':'+file]),current=fs.readFileSync(file);assert(original.equals(current),file+' changed');report.unchanged[file]=crypto.createHash('sha256').update(current).digest('hex');
}
const old=execFileSync('git',['show',base+':src/CalligraphyDepthArt.tsx'],{encoding:'utf8'}),now=fs.readFileSync('src/CalligraphyDepthArt.tsx','utf8');
for(const [name,start,end]of [ ['bandDefinitions','const BANDS:','function strokeRule'],['faceGeometry','function faceGeometry','function bronzeArchitecture'],['bronzeBacking','function bronzeArchitecture','function lightTexture'],['pointsGeometry','function lightTexture','export function CalligraphyDepthArt'] ]){
 assert.equal(now.slice(now.indexOf(start),now.indexOf(end)),old.slice(old.indexOf(start),old.indexOf(end)),name+' changed');report[name]='byte-identical';
}
assert(now.includes('position={[0, -17.7, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[1, .74, 1]}'));
report.rootTransform='unchanged';report.applicationChanges='Only CalligraphyDepthArt.tsx and the new raisedRelief.ts module are allowed';
const changed=execFileSync('git',['diff','--name-only',base,'--','src'],{encoding:'utf8'}).trim().split('\n').filter(Boolean);assert(changed.every(f=>['src/CalligraphyDepthArt.tsx','src/calligraphy/raisedRelief.ts'].includes(f)));
const directory=path.join('docs','raised-calligraphy-v0.1');fs.mkdirSync(directory,{recursive:true});fs.writeFileSync(path.join(directory,'scope.json'),JSON.stringify(report,null,2));console.log('PASS exact base geometry, transforms, content, font, bevel mask painter, camera/App, styles, Harf modules and package configuration unchanged');
