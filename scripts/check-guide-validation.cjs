const assert=require('node:assert/strict'),fs=require('node:fs'),{buildSync}=require('esbuild');
const load=file=>{const code=buildSync({entryPoints:[file],bundle:true,write:false,format:'cjs'}).outputFiles[0].text,m={exports:{}};new Function('module','exports',code)(m,m.exports);return m.exports};
const {compileGuide,rulesReady}=load('src/harf-xr/guide-validation/engine.ts');
const {REVIEWED_GUIDES}=load('src/harf-xr/guide-validation/reviews.ts');
const routes=load('src/integration/routes.ts');
const point=(x,y)=>({x,y}),stroke=(points,canceled=false)=>({points,canceled});
const line=[point(0,80),point(40,20),point(90,40)];
const disk=(x,y)=>({center:point(x,y),radius:5});
const path={kind:'path',id:'body',points:line,endpoints:[disk(0,80),disk(90,40)]};
const dot=(id,x,y)=>({kind:'dot',id,region:disk(x,y)});
// Abstract geometry fixtures exercise the algorithm. They are not Arabic paths,
// specialist review, calibration evidence or a way to activate live grading.
const base={version:'synthetic-v1',sourceHash:'synthetic',review:{reference:'synthetic-test-only',annotationsApproved:true,fixturesApproved:true},diagonal:200,corridor:5,spacing:1,coverage:.9,inside:.95,parts:[path],forbidden:[]};
let checks=0;const state=(evaluate,ink,expected,active=false)=>{assert.equal(evaluate(ink,active).state,expected);checks++};
for(const [mode,extra] of Object.entries({lam:[],kaf:[{kind:'path',id:'detached',points:[point(130,50),point(150,70)],endpoints:[disk(130,50),disk(150,70)]}],fa:[dot('upper dot',130,0)],ya:[dot('left dot',120,0),dot('right dot',140,0)]})){
 const rules={...base,parts:[path,...extra]},evaluate=compileGuide(rules,'synthetic');
 const ink=[stroke(line),...extra.map(p=>stroke(p.kind==='dot'?[p.region.center]:p.points))];
 state(evaluate,ink,'complete');state(evaluate,[],'incomplete');state(evaluate,[stroke([point(0,80)])],'incomplete');
 if(extra.length)state(evaluate,ink.slice(0,-1),'incomplete');
 state(evaluate,[stroke([line[0],line[2]]),...ink.slice(1)],'incomplete'); // shortcut
 state(evaluate,[...ink,stroke([point(0,200),point(200,200)])],'incomplete');
 state(evaluate,ink,'incomplete',true);
 state(evaluate,ink.map(s=>({...s,canceled:true})),'incomplete');
 state(evaluate,ink,'complete'); // Redo can restore exactly the prior visible ink
 const repeated=[stroke(Array(100).fill(point(0,80))),...ink.slice(1)];state(evaluate,repeated,'incomplete');
 const dense=ink.map(s=>stroke(s.points.flatMap((p,i,all)=>i===all.length-1?[p]:Array.from({length:20},(_,j)=>point(p.x+(all[i+1].x-p.x)*j/20,p.y+(all[i+1].y-p.y)*j/20)))));
 state(evaluate,dense,'complete');
 // Uniform source-coordinate scaling preserves results.
 for(const scale of [.1,3]){
  const p=q=>point(q.x*scale,q.y*scale),d=x=>({center:p(x.center),radius:x.radius*scale});
  const scaled={...rules,diagonal:rules.diagonal*scale,corridor:rules.corridor*scale,spacing:rules.spacing*scale,parts:rules.parts.map(part=>part.kind==='dot'?{...part,region:d(part.region)}:{...part,points:part.points.map(p),endpoints:part.endpoints.map(d)})};
  state(compileGuide(scaled,'synthetic'),ink.map(s=>stroke(s.points.map(p))),'complete');
 }
 state(compileGuide(rules,'different-source'),ink,'unavailable');
 assert(REVIEWED_GUIDES[mode]?.review.annotationsApproved,'owner-attested review is registered');
 assert.equal(compileGuide(REVIEWED_GUIDES[mode],REVIEWED_GUIDES[mode].sourceHash)([]).state,'incomplete','registered guide rejects blank ink');
 state(compileGuide(REVIEWED_GUIDES[mode],'synthetic'),ink,'unavailable');
 const query='?calligraphyRelief=texture&orbitArt=study&practice='+mode;
 assert.equal(routes.initialInspectionSelection(query,'#inspect-practice'),{kaf:0,lam:1,fa:2,ya:3}[mode]);
 assert.equal(routes.inspectionHref(query),'/?calligraphyRelief=texture&orbitArt=study&practice='+mode+'#inspect-practice');
}
const evaluate=compileGuide(base,'synthetic');
state(evaluate,[stroke(line),stroke([point(NaN,0)])],'incomplete');
state(evaluate,[stroke(Array(12001).fill(point(0,80)))],'incomplete');
state(evaluate,[stroke([point(-1e200,0),point(1e200,0)])],'incomplete');
const protectedRules={...base,forbidden:[[point(40,49),point(50,49),point(50,51),point(40,51)]]};
const protectedEval=compileGuide(protectedRules,'synthetic');state(protectedEval,[stroke(line)],'complete');
// Sparse input leaps across a thin forbidden region; endpoint checks alone fail.
state(protectedEval,[stroke(line),stroke([point(45,40),point(45,60)])],'incomplete');
const straight={...base,parts:[{...path,points:[point(0,0),point(100,0)],endpoints:[disk(0,0),disk(100,0)]}]};
const gapInk=[stroke([point(0,0),point(45,0)]),stroke([point(65,0),point(100,0)])];
state(compileGuide(straight,'synthetic'),gapInk,'complete'); // exactly 90 covered units
state(compileGuide({...straight,coverage:.91},'synthetic'),gapInk,'incomplete');
const extraInk=[stroke([point(0,0),point(100,0)]),stroke([point(0,100),point(100/19,100)])];
state(compileGuide(straight,'synthetic'),extraInk,'complete'); // exactly 95% allowed length
state(compileGuide(straight,'synthetic'),[extraInk[0],stroke([point(0,100),point(5.4,100)])],'incomplete');
assert.equal(rulesReady({...base,parts:[path,dot('a',120,0),dot('b',121,0)]},'synthetic'),false);
const twoDots={...base,parts:[path,dot('left',120,0),dot('right',140,0)]};
state(compileGuide(twoDots,'synthetic'),[stroke(line),stroke([point(120,0),point(140,0)])],'incomplete');
for(const changed of [{review:{...base.review,annotationsApproved:false}},{review:{...base.review,fixturesApproved:false}},{review:{...base.review,reference:''}},{coverage:.89},{inside:.94},{spacing:2},{corridor:0},{parts:[]},{diagonal:Infinity}]){
 assert.equal(rulesReady({...base,...changed},'synthetic'),false);checks++;
}
state(compileGuide({...base,spacing:1e-100},'synthetic'),[],'unavailable');
for(const search of ['?practice=kaf','?orbitArt=study&practice=__proto__','?orbitArt=study&practice=kaf&practice=lam','?orbitArt=study&orbitArt=study&practice=kaf']){
 assert.equal(routes.initialInspectionSelection(search,'#inspect-practice'),null);assert.equal(routes.inspectionHref(search),null);checks++;
}
assert.equal(routes.initialInspectionSelection('?orbitArt=study&practice=kaf','#inspect-practice/evil'),null);
const report={success:true,checks,scope:'Synthetic engine geometry and strict inspection intent only; not calibrated Arabic acceptance fixtures. Owner-attested guide records are registered; mismatched source identities remain unavailable.'};
if(process.env.GUIDE_VALIDATION_REPORT)fs.writeFileSync(process.env.GUIDE_VALIDATION_REPORT,JSON.stringify(report,null,2));
console.log('PASS '+checks+' guide validation cases; source/review gates, coverage, endpoints, separate dots, protected crossings, sampling/scale invariance, input bounds and inspection intent');
