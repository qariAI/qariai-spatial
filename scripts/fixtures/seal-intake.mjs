// Synthetic squares/rectangles only. Source text is metadata, never drawn or converted to outlines.
// Reviewer names and records below are deliberately fictional TEST DATA, not real approvals.
const enc=s=>new TextEncoder().encode(s),clone=x=>structuredClone(x),assert=(yes,message)=>{if(!yes)throw Error(message);};
const rect=(x,y,w=6,h=10)=>`M${x} ${y}h${w}v${h}h${-w}Z`;
const boxUnion=bs=>{const x=Math.min(...bs.map(b=>b[0])),y=Math.min(...bs.map(b=>b[1]));return [x,y,Math.max(...bs.map(b=>b[0]+b[2]))-x,Math.max(...bs.map(b=>b[1]+b[3]))-y];};
function fixture(source){
 const canonical=source.primary.words.join(' '),chars=Array.from(canonical),a={schemaVersion:2,kind:'approved-original-calligraphy',assetSha256:'',manifestSha256:'',canonicalText:canonical,sourceSha256:'fbcf48fe24468963b5bdb0a5e729e4bbbc3fa1feb8cc5558fbc0d1a3f09da2fc',sourceUrl:source.primary.url,viewBox:[0,0,500,1100],coordinates:'svg-y-down',paths:[],components:[],glyphs:[],rigidGroups:[],words:[],paintOrder:[],overlaps:[],sharedContours:[],approvals:['calligrapher','quran-text'].map(role=>({role,reviewer:'SYNTHETIC FIXTURE — NOT AN EXPERT',date:'2000-01-01',record:'synthetic:test-only',assetSha256:'',manifestSha256:''})),rights:{holder:'SYNTHETIC FIXTURE',grantRecord:'synthetic:test-only',webXR:true,technical3DAdaptation:true,publicSourceDistribution:true,film:true}};
 const boxes={};let at=0;
 source.primary.words.forEach((word,w)=>{const indices=Array.from(word,(_,i)=>at+i),start=at;let column=0,base=-1;at+=indices.length+1;
  for(const i of indices){const isMark=/\p{M}/u.test(chars[i]);if(!isMark){base=i;column++;const id=`g${i}`;a.glyphs.push({id,wordId:w+1,sourceCodepoints:[],componentIds:[],rigidGroupId:`r${i}`,bounds:[0,0,1,1]});a.rigidGroups.push({id:`r${i}`,level:3});}
   const g=a.glyphs.at(-1),id=`c${i}`,pathId=`p${i}`,kind=isMark?(chars[i]==='\u06d6'?'pause':'diacritic'):'base',x=20+(column-1)*24+(isMark?(i-base-1)*4:0),y=40+w*55-(isMark?5:0),b=[x,y,isMark?3:6,isMark?2:10];
   const c={id,pathId,contours:[0],kind,sourceCodepoints:[i],glyphIds:[g.id],rigidGroupId:g.rigidGroupId,owners:isMark?[{baseComponentId:`c${base}`,glyphId:g.id,baseCodepoint:base}]:[]};
   a.components.push(c);g.sourceCodepoints.push(i);g.componentIds.push(id);boxes[id]=b;
   a.paths.push({id:pathId,d:rect(...b),fillRule:'nonzero',role:kind==='base'?'body':kind,wordIds:[w+1],sourceCodepoints:[i],componentIds:[id],rigidGroupId:g.rigidGroupId,level:3});
  }
  a.words.push({id:w+1,text:word,course:w<5?1:w<12?2:w<14?3:4,sourceSpan:[start,at-1],pathIds:a.paths.filter(p=>p.wordIds.includes(w+1)).map(p=>p.id)});
 });
 a.glyphs.forEach(g=>g.bounds=boxUnion(g.componentIds.map(id=>boxes[id])));a.paintOrder=a.paths.map(p=>p.id);return a;
}
function compound(a){const g=a.glyphs.find(g=>g.componentIds.length>1),cs=g.componentIds.map(id=>a.components.find(c=>c.id===id)),ps=cs.map(c=>a.paths.find(p=>p.id===c.pathId)),target=ps[0];
 target.d=ps.map(p=>p.d).join('');target.role='compound';target.componentIds=cs.map(c=>c.id);target.sourceCodepoints=cs.flatMap(c=>c.sourceCodepoints);
 cs.forEach((c,n)=>{c.pathId=target.id;c.contours=[n];});const remove=new Set(ps.slice(1).map(p=>p.id));a.paths=a.paths.filter(p=>!remove.has(p.id));a.paintOrder=a.paths.map(p=>p.id);a.words.forEach(w=>w.pathIds=a.paths.filter(p=>p.wordIds.includes(w.id)).map(p=>p.id));
}
function legacy(source){const canonical=source.primary.words.join(' '),paths=[{id:'body',d:rect(0,0),fillRule:'nonzero',role:'body',wordIds:Array.from({length:18},(_,i)=>i+1),sourceCodepoints:Array.from(canonical).flatMap((c,i)=>c===' '?[]:[i]),level:3},...[5,12].map(n=>({id:`pause${n}`,d:rect(n*10,0,3,2),fillRule:'nonzero',role:'pause',wordIds:[n],ownerWordId:n,sourceCodepoints:[n===5?41:92],level:3}))];return {kind:'approved-original-calligraphy',canonicalText:canonical,sourceSha256:'fbcf48fe24468963b5bdb0a5e729e4bbbc3fa1feb8cc5558fbc0d1a3f09da2fc',sourceUrl:source.primary.url,viewBox:[0,0,200,200],coordinates:'svg-y-down',paths,words:source.primary.words.map((text,i)=>({id:i+1,text,course:i<5?1:i<12?2:i<14?3:4,pathIds:paths.filter(p=>p.wordIds.includes(i+1)).map(p=>p.id)})),approvals:['calligrapher','quran-text'].map(role=>({role,reviewer:'SYNTHETIC FIXTURE — NOT AN EXPERT',date:'2000-01-01',record:'synthetic:test-only'})),rights:{holder:'SYNTHETIC FIXTURE',grantRecord:'synthetic:test-only',webXR:true,technical3DAdaptation:true,publicSourceDistribution:true,film:true}};}
async function seal(a,api,options={}){
 const pathStrings=a.paths.map(p=>`<path id="${p.id}" d="${p.d}" fill-rule="${p.fillRule}" ${options.pathAttr??''}/>`);
 const content=(options.reverseSVG?[...pathStrings].reverse():pathStrings).join('');
 const svg=options.svg??`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${a.viewBox.join(' ')}" ${options.rootAttr??''}>${options.nestedSVG?`<svg viewBox=\"1000 1000 200 200\">${content}</svg>`:options.groupAttr?`<g ${options.groupAttr}>${content}</g>`:content}</svg>`,bytes=enc(svg);
 a.assetSha256=await api.intakeDigest(bytes);if(a.schemaVersion===2)a.manifestSha256=await api.vectorManifestDigest(a);
 a.approvals.forEach(r=>{r.assetSha256=a.assetSha256;if(a.schemaVersion===2)r.manifestSha256=a.manifestSha256;});return bytes;
}
export async function runIntakeRegression(source,api,baseline){
 const report={fixtureKind:'SYNTHETIC NONSCRIPTURAL RECTANGLES; source text is metadata only; fictional approvals',valid:[],rejected:[],beforeAfter:[]};
 const canonical=source.primary.words.join(' '),chars=Array.from(canonical);
 assert(await api.intakeDigest(enc(canonical))==='fbcf48fe24468963b5bdb0a5e729e4bbbc3fa1feb8cc5558fbc0d1a3f09da2fc','Locked source bytes changed');assert(canonical===source.secondary.verse,'Saved sources differ');assert(source.primary.words.length===18&&chars.length===137,'Wrong word/codepoint count');assert(chars[41]==='\u06d6'&&chars[92]==='\u06d6'&&chars.filter(c=>c==='\u06d6').length===2,'Wrong pauses');
 report.lockedSource={wordCount:18,codepointCount:137,pauseWordIds:[5,12],pauseCodepointIndices:[41,92],normalization:'No normalization; exact locked SHA-256'};
 async function test(name,change=()=>{},options={},valid=false){const a=fixture(source);change(a);const bytes=await seal(a,api,options);let reason;try{await api.validateVectorIntake(a,bytes);}catch(e){reason=e.message;}if(valid){assert(!reason,`${name}: unexpectedly rejected: ${reason}`);report.valid.push(name);}else {assert(reason,`${name}: incorrectly accepted`);const guard={'overlap obscures sacred mark even if declared':'obscure sacred mark','sub-tolerance occluding strip is still rejected':'obscure sacred mark','cancelled evenodd filled area':'filled interior','swapped base owner in same word':'Swapped owner','detached mark outside reviewed glyph bounds':'Detached component','mark-only path falsely labelled body':'falsely classified'}[name];if(guard)assert(reason.includes(guard),`${name}: wrong rejection: ${reason}`);report.rejected.push({name,reason});}}
 await test('complete separated base/mark/pause components',()=>{},{},true);
 await test('independent glyph depths within the same word',a=>{a.rigidGroups.find(g=>g.id==='r4').level=4;a.paths.filter(p=>p.rigidGroupId==='r4').forEach(p=>p.level=4);},{},true);
 await test('reviewed visible mark above its base',a=>{a.paths.find(p=>p.id==='p2').d=rect(45,42,3,2);a.overlaps=[{frontPathId:'p2',backPathId:'p1',record:'synthetic:visible-mark-on-top'}];},{},true);
 await test('compound path with separate base and mark contours',compound,{},true);
 await test('original cubic and quadratic contour preserved',a=>a.paths[0].d='M20 40C22 40 24 40 26 40L26 50Q23 50 20 50Z',{},true);
 await test('original arc contour preserved',a=>{a.paths[0].d='M20 45A5 5 0 1 1 30 45A5 5 0 1 1 20 45Z';a.glyphs[0].bounds=[20,40,10,10];},{},true);
 await test('original relative and implicit line commands preserved',a=>a.paths[0].d='m20 40 6 0 0 10 -6 0z',{},true);
 await test('evenodd hole preserves nonzero filled area',a=>{a.paths[0].d=rect(20,40)+rect(21,41,4,8);a.paths[0].fillRule='evenodd';a.components[0].contours=[0,1];},{},true);
 await test('reviewed shared contour represents base plus attached marks',a=>{compound(a);const p=a.paths.find(p=>p.role==='compound');p.d=rect(44,40);a.glyphs.find(g=>g.rigidGroupId===p.rigidGroupId).bounds=[44,40,6,10];p.componentIds.forEach(id=>a.components.find(c=>c.id===id).contours=[0]);a.sharedContours=[{pathId:p.id,contour:0,componentIds:p.componentIds,record:'synthetic:shared-compound-review'}];},{},true);
 await test('many-to-many ligature components across two glyphs',a=>{const [g,h]=a.glyphs,base=a.components.find(c=>c.id===g.componentIds[0]),other=a.components.find(c=>c.id===h.componentIds[0]),p=a.paths.find(p=>p.id===base.pathId),q=a.paths.find(p=>p.id===other.pathId);p.d+=q.d;p.sourceCodepoints.push(...q.sourceCodepoints);base.contours.push(1);base.sourceCodepoints.push(...other.sourceCodepoints);base.glyphIds.push(h.id);a.components=a.components.filter(c=>c!==other);a.paths=a.paths.filter(v=>v!==q);h.componentIds[0]=base.id;h.rigidGroupId=g.rigidGroupId;h.componentIds.slice(1).forEach(id=>{const c=a.components.find(c=>c.id===id);c.rigidGroupId=g.rigidGroupId;c.owners.forEach(o=>o.baseComponentId=base.id);a.paths.find(p=>p.id===c.pathId).rigidGroupId=g.rigidGroupId;});g.bounds=[20,40,30,10];h.bounds=[20,35,31,15];a.paintOrder=a.paths.map(p=>p.id);a.words.forEach(w=>w.pathIds=a.paths.filter(p=>p.wordIds.includes(w.id)).map(p=>p.id));},{},true);
 function crossing(a){const p=a.paths.find(p=>p.sourceCodepoints[0]===4),c=a.components.find(c=>c.pathId===p.id),g=a.glyphs.find(g=>g.id===c.glyphIds[0]);p.d=rect(22,42,4,5);g.bounds=[22,35,49,12];a.overlaps=[{frontPathId:p.id,backPathId:'p0',record:'synthetic:reviewed-body-crossing'}];}
 await test('reviewed body interweaving with separate visible marks',crossing,{},true);
 await test('mark-only path falsely labelled body',a=>a.paths.find(p=>p.role==='diacritic').role='body');
 await test('combining sign falsely mapped to base component',a=>a.components.find(c=>c.kind==='diacritic').kind='base');
 await test('mark hidden inside body role of compound path',a=>{compound(a);a.paths.find(p=>p.role==='compound').role='body';});
 await test('missing combining-mark component',a=>{const c=a.components.find(c=>c.kind==='diacritic');c.sourceCodepoints=[0];});
 await test('missing mark owner',a=>a.components.find(c=>c.kind==='diacritic').owners=[]);
 await test('swapped base owner in same word',a=>{const c=a.components.find(c=>c.kind==='diacritic');c.owners[0]={baseComponentId:'c4',glyphId:'g4',baseCodepoint:4};});
 await test('mark and owner in different rigid groups',a=>{const c=a.components.find(c=>c.kind==='diacritic');c.rigidGroupId='r4';});
 await test('detached mark outside reviewed glyph bounds',a=>a.paths.find(p=>p.role==='diacritic').d=rect(450,1000,3,2));
 await test('shared contour without explicit review',a=>{compound(a);const p=a.paths.find(p=>p.role==='compound');p.componentIds.forEach(id=>a.components.find(c=>c.id===id).contours=[0]);});
 await test('malformed reciprocal glyph mapping',a=>a.glyphs[0].componentIds=[]);
 await test('wrong component contour',a=>a.components[0].contours=[9]);
 await test('unmapped original contour',a=>a.paths[0].d+=rect(25,45,1,1));
 await test('duplicate path IDs',a=>a.paths[1].id=a.paths[0].id);
 await test('duplicate character references',a=>a.components[0].sourceCodepoints.push(0));
 await test('wrong 18-word metadata count',a=>a.words.pop());
 await test('wrong exact character span',a=>a.words[0].sourceSpan[1]--);
 await test('wrong logical word order',a=>[a.words[0],a.words[1]]=[a.words[1],a.words[0]]);
 for(const attr of ['display="none"','visibility="hidden"','opacity="0"','fill-opacity="0"','fill="none"','fill="transparent"','stroke="black"','stroke-width="999"','style="display:none"','transform="translate(0)"','onclick="x()"'])await test(`path presentation ${attr}`,()=>{},{pathAttr:attr});
 for(const attr of ['opacity="0"','display="none"','visibility="hidden"','fill="none"'])await test(`inherited presentation ${attr}`,()=>{},{groupAttr:attr});
 await test('nested viewport changes geometry presentation',()=>{},{nestedSVG:true});
 await test('zero-width SVG viewport',()=>{},{rootAttr:'width="0"'});
 await test('unknown SVG element',()=>{},{svg:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 1100"><image/></svg>'});
 await test('wrong SVG namespace',()=>{},{svg:'<svg xmlns="urn:wrong" viewBox="0 0 500 1100"/>'});
 await test('live font text',()=>{},{svg:'<svg xmlns="http://www.w3.org/2000/svg"><text>NONScriptural test only</text></svg>'});
 await test('off-canvas path',a=>a.paths[0].d=rect(2000,2000));
 await test('curved off-canvas extremum',a=>a.paths[0].d='M20 40C-2000 40 -2000 50 20 50Z');
 await test('nonzero-length zero-area path',a=>a.paths[0].d='M20 40L26 50L20 40Z');
 await test('cancelled evenodd filled area',a=>{a.paths[0].d=rect(20,40)+rect(20,40);a.paths[0].fillRule='evenodd';a.components[0].contours=[0,1];});
 await test('compound mark contour has zero filled area',a=>{compound(a);a.paths.find(p=>p.role==='compound').d=rect(44,40)+'M44 35L47 37L44 35Z'+rect(48,35,3,2);});
 await test('compound mark mapped only to a hole',a=>{compound(a);const p=a.paths.find(p=>p.role==='compound');p.d=rect(44,40)+rect(45,42,3,2)+rect(48,35,3,2);p.fillRule='evenodd';});
 await test('malformed trailing SVG path command',a=>a.paths[0].d='M20 40L26 40L26Z');
 await test('undeclared body overlap',a=>{crossing(a);a.overlaps=[];});
 await test('reversed over/under order',a=>{crossing(a);[a.overlaps[0].frontPathId,a.overlaps[0].backPathId]=[a.overlaps[0].backPathId,a.overlaps[0].frontPathId];});
 await test('SVG paint order differs from reviewed manifest',()=>{},{reverseSVG:true});
 await test('overlap obscures sacred mark even if declared',a=>{crossing(a);const p=a.paths.find(p=>p.id==='p4');p.d=rect(44,35,7,15);a.glyphs.find(g=>g.id==='g4').bounds=[44,35,27,15];a.overlaps=['p1','p2','p3'].map(backPathId=>({frontPathId:'p4',backPathId,record:'synthetic:cannot-authorize-obscured-mark'}));});
 await test('sub-tolerance occluding strip is still rejected',a=>{crossing(a);a.paths.find(p=>p.id==='p4').d=rect(44,35,.00005,15);a.glyphs.find(g=>g.id==='g4').bounds=[44,35,27,15];a.overlaps=['p1','p2'].map(backPathId=>({frontPathId:'p4',backPathId,record:'synthetic:thin-strip'}));});
 await test('paint order conflicts with physical depth',a=>{crossing(a);a.rigidGroups.find(g=>g.id==='r4').level=2;a.paths.filter(p=>p.rigidGroupId==='r4').forEach(p=>p.level=2);});
 await test('removed pause sign',a=>a.canonicalText=a.canonicalText.replace('\u06d6',''));
 await test('pause incorrectly classified as diacritic',a=>{const c=a.components.find(c=>c.kind==='pause');c.kind='diacritic';a.paths.find(p=>p.id===c.pathId).role='diacritic';});
 await test('pause separated into an extra token',a=>a.canonicalText=a.canonicalText.replace('\u06d6',' \u06d6'));
 await test('NFD normalization changes locked bytes',a=>{const n=a.canonicalText.normalize('NFD');assert(n!==a.canonicalText,'NFD fixture must change bytes');a.canonicalText=n;});
 await test('presentation-form/compatibility normalization changes source',a=>a.canonicalText=a.canonicalText.normalize('NFKC'));
 await test('missing expert approval',a=>a.approvals=[]);
 await test('missing rights',a=>a.rights.film=false);
 await test('nonboolean rights',a=>a.rights.webXR='true');
 // Digest mutations must not be re-approved by the fixture's normal sealing helper.
 for(const [name,change] of [['approval wrong SVG digest',a=>a.approvals[0].assetSha256='0'.repeat(64)],['approval wrong manifest digest',a=>a.approvals[0].manifestSha256='0'.repeat(64)],['mapping altered after review',a=>a.components[0].sourceCodepoints=[4]],['overlap altered after review',a=>a.overlaps.push({frontPathId:'p4',backPathId:'p0',record:'changed'})],['SVG bytes altered after approval',()=>{}]]){
  const a=fixture(source);let bytes=await seal(a,api);change(a);if(name==='SVG bytes altered after approval')bytes=enc(new TextDecoder().decode(bytes)+' ');let reason;try{await api.validateVectorIntake(a,bytes);}catch(e){reason=e.message;}assert(reason,name+' incorrectly accepted');report.rejected.push({name,reason});
 }
 if(baseline){
  const comparisons=[
   ['mark falsely classified as body',a=>a.paths.find(p=>p.role==='diacritic').role='body',{}],
   ['swapped glyph/base owner',a=>a.components.find(c=>c.kind==='diacritic').owners[0]={baseComponentId:'c4',glyphId:'g4',baseCodepoint:4},{}],
   ['detached mark geometry',a=>a.paths.find(p=>p.role==='diacritic').d=rect(450,1000,3,2),{}],
   ['hidden path',()=>{},{pathAttr:'display="none"'}],['transparent ancestor',()=>{},{groupAttr:'opacity="0"'}],['unpainted path',()=>{},{pathAttr:'fill="none"'}],
   ['off-canvas path',a=>a.paths[0].d=rect(2000,2000),{}],['undeclared body overlap',a=>{crossing(a);a.overlaps=[];},{}],
   ['mismatched manifest approval',()=>{},{}]
  ];
  for(const [name,change,options] of comparisons){const a=fixture(source);change(a);
   // Compatibility annotations let the old validator reach the audited invariant.
   // Both validators receive the SAME v2 payload/bytes, including these extra word owners.
   a.paths.filter(p=>p.role==='diacritic'||p.role==='pause').forEach(p=>p.ownerWordId=p.wordIds[0]);
   const bytes=await seal(a,api,options);if(name==='mismatched manifest approval')a.approvals[0].manifestSha256='0'.repeat(64);
   await baseline(a,bytes);let reason;try{await api.validateVectorIntake(a,bytes);}catch(e){reason=e.message;}assert(reason,'Unsafe paired fixture accepted');
   report.beforeAfter.push({name,before10510f7:'ACCEPTED',after:'REJECTED',reason,samePayload:true});
  }
  const old=legacy(source),bytes=await seal(old,api);await baseline(old,bytes);let blocked=false;try{await api.validateVectorIntake(old,bytes);}catch{blocked=true;}assert(blocked,'Unversioned legacy fixture accepted');report.legacySchemaFailsClosed=true;
 }

 return {...report,result:'passed',validCount:report.valid.length,negativeCount:report.rejected.length};
}
