const assert=require('node:assert/strict'),{buildSync}=require('esbuild');
const code=buildSync({entryPoints:['src/harf-xr/guide-practice.ts'],bundle:true,write:false,format:'cjs'}).outputFiles[0].text,m={exports:{}};new Function('module','exports',code)(m,m.exports);const {GuidePractice,GUIDE_IDS}=m.exports;
for(const id of GUIDE_IDS){
 const g=new GuidePractice(id);assert.equal(g.phase,'body');
 const finish=()=>{for(const part of g.rules.parts){const points=(part.kind==='path'?part.points:[part.region.center]).map(p=>g.toBoard(p));assert(g.begin(points[0]));for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i],n=Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)/4);for(let j=1;j<=n;j++)g.move({x:a.x+(b.x-a.x)*j/n,y:a.y+(b.y-a.y)*j/n})}assert.notEqual(g.phase,'complete','held stroke cannot complete');g.end()}};
 finish();assert.equal(g.phase,'complete',id+' all source parts');g.undo();assert.notEqual(g.phase,'complete');g.redo();assert.equal(g.phase,'complete');
 g.reset();const first=g.toBoard(g.rules.parts[0].points[0]);g.begin(first);g.cancel();assert.notEqual(g.phase,'complete');assert(!g.active);g.undo();assert.equal(g.strokes.length,0);
 g.begin(first);g.move({x:first.x+100,y:first.y});assert(!g.active,'tracking jump cancels rather than connecting');g.reset();assert.equal(g.strokes.length,0);
}
console.log('PASS all four XR adapters: source-coordinate conversion, actual guide parts, release requirement, Undo/Redo, cancel, tracking jumps and reset');
