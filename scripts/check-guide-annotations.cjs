const fs=require('node:fs'),assert=require('node:assert/strict'),crypto=require('node:crypto'),{buildSync}=require('esbuild'),{chromium}=require('playwright');
const out='docs/orbit-art-v01/guide-annotations-v01',rules=JSON.parse(fs.readFileSync(out+'/candidates.json'));
const sources={kaf:JSON.parse(fs.readFileSync('src/orbit-art/generated/kaf-outline.json')),...Object.fromEntries(Object.entries(JSON.parse(fs.readFileSync('src/orbit-art/generated/letter-outlines.json'))).map(([k,v])=>[{'ل':'lam','ف':'fa','ي':'ya'}[k],v]))};
const code=buildSync({entryPoints:['src/harf-xr/guide-validation/engine.ts'],bundle:true,write:false,format:'cjs'}).outputFiles[0].text,m={exports:{}};new Function('module','exports',code)(m,m.exports);const {compileGuide}=m.exports;
const stroke=points=>({points,canceled:false}),fixtures={};
for(const [mode,r]of Object.entries(rules)){
 assert.equal(r.sourceHash,crypto.createHash('sha256').update(sources[mode].path).digest('hex'));assert.equal(r.review.annotationsApproved,false);assert.equal(r.review.fixturesApproved,false);
 const ink=r.parts.map(p=>stroke(p.kind==='path'?p.points:[p.region.center]));assert.equal(compileGuide(r,r.sourceHash)(ink).state,'unavailable','draft data cannot activate production grading');
 // Test-only approval copy exercises candidate geometry. Never write it to the
 // candidate files or live review registry; these are algorithmic fixtures.
 const evaluate=compileGuide({...r,review:{reference:'candidate geometry test only',annotationsApproved:true,fixturesApproved:true}},r.sourceHash);
 const cases=[{id:'candidate-paths',ink,expected:'complete'},{id:'blank',ink:[],expected:'incomplete'}, {id:'single-body-tap',ink:[stroke([r.parts[0].points[0]])],expected:'incomplete'}, {id:'canceled-guide',ink:ink.map(s=>({...s,canceled:true})),expected:'incomplete'}];
 const body=r.parts[0].points,a=body[0],b=body.at(-1),short=stroke([a,b]);cases.push({id:'body-shortcut',ink:[short,...ink.slice(1)],expected:'incomplete'});
 const lo=Math.floor(body.length*.25),hi=Math.ceil(body.length*.75);cases.push({id:'missing-middle',ink:[stroke(body.slice(0,lo)),stroke(body.slice(hi)),...ink.slice(1)],expected:'incomplete'});
 if(ink.length>1)for(let i=1;i<ink.length;i++)cases.push({id:'missing-'+r.parts[i].id,ink:ink.filter((_,j)=>j!==i),expected:'incomplete'});
 const [x0,,x1,y1]=sources[mode].bounds;cases.push({id:'extra-ink',ink:[...ink,stroke([{x:x0-100,y:y1+100},{x:x1+100,y:y1+100}])],expected:'incomplete'});
 r.forbidden.forEach((poly,i)=>{const xs=poly.map(p=>p.x),ys=poly.map(p=>p.y),y=(Math.min(...ys)+Math.max(...ys))/2;cases.push({id:'protected-crossing-'+i,ink:[...ink,stroke([{x:Math.min(...xs)-10,y},{x:Math.max(...xs)+10,y}])],expected:'incomplete'})});
 const dots=r.parts.filter(p=>p.kind==='dot');if(dots.length>1)cases.push({id:'one-stroke-for-two-dots',ink:[ink[0],stroke(dots.map(d=>d.region.center))],expected:'incomplete'});
 // Small offset/dense/reversed input exercises permitted geometric variation;
 // it makes no claim about human-written acceptance or stroke direction.
 const offset=ink.map((s,i)=>r.parts[i].kind==='dot'?s:stroke(s.points.map(p=>({x:p.x+r.corridor*.15,y:p.y}))));cases.push({id:'small-geometric-offset',ink:offset,expected:'complete'});
 cases.push({id:'reversed-directions',ink:ink.map(s=>stroke([...s.points].reverse())),expected:'complete'});
 for(const c of cases){c.actual=evaluate(c.ink).state;assert.equal(c.actual,c.expected,mode+' '+c.id)}
 fixtures[mode]={sourceHash:r.sourceHash,annotationReview:'pending',fixturesReview:'pending',origin:'Algorithmic candidate tests; not human handwriting or specialist acceptance evidence.',cases};
}
fs.writeFileSync(out+'/fixtures.json',JSON.stringify(fixtures,null,2)+'\n');
(async()=>{let browser;const report={success:false,scope:'Candidate geometry only; no app activation or human correctness certification.',cases:[]};try{
 browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});const p=await browser.newPage({viewport:{width:1200,height:1440}});let markup='<body style="margin:0;display:grid;grid-template-columns:600px 600px;background:#07111c">';
 for(const mode of Object.keys(rules))markup+=`<div data-mode="${mode}">${fs.readFileSync(out+'/'+mode+'.svg','utf8')}</div>`;await p.setContent(markup);
 for(const [mode,r]of Object.entries(rules)){
 const source=p.locator(`[data-mode="${mode}"] #source`);assert.equal(await source.getAttribute('d'),sources[mode].path);
 const fill=await source.evaluate((source,r)=>{let count=0;const outside=[];for(const part of r.parts){if(part.kind==='dot'){count++;if(!source.isPointInFill(new DOMPoint(part.region.center.x,part.region.center.y)))outside.push(part.region.center);continue}for(let i=1;i<part.points.length;i++){const a=part.points[i-1],b=part.points[i],n=Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)/r.spacing);for(let j=0;j<=n;j++){const t=j/n,x=a.x+(b.x-a.x)*t,y=a.y+(b.y-a.y)*t;count++;if(!source.isPointInFill(new DOMPoint(x,y)))outside.push({x,y})}}}return {count,outside}},r);assert.deepEqual(fill.outside,[],mode+' candidate samples must lie inside the original source fill');
 if(mode==='fa'){const counter=await source.evaluate(el=>el.isPointInFill(new DOMPoint(770,385)));assert.equal(counter,false,'original fa counter stays open')}
 report.cases.push({mode,exactOriginalPath:true,sourceFillSamples:fill.count,outside:0,fixtureCases:fixtures[mode].cases.length,productionReview:'pending'});
 }
 await p.screenshot({path:out+'/review-grid.png'});report.success=true;console.log('PASS four exact source overlays, all candidate path/dot samples inside source fills, open fa counter and '+Object.values(fixtures).reduce((n,r)=>n+r.cases.length,0)+' candidate algorithmic cases');
 }finally{fs.writeFileSync(out+'/checks.json',JSON.stringify(report,null,2)+'\n');await browser?.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
