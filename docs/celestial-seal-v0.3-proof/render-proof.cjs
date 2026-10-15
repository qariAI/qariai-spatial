// Documentation-only 2D proof. No application modules, WebGL, glyph warping or outline export.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const root=__dirname,source=JSON.parse(fs.readFileSync(path.join(root,'source-snapshots.json')));
const font=fs.readFileSync(path.join(root,'UthmanicHafs-Ver09.woff2')).toString('base64');
const license=fs.readFileSync(path.join(root,'FONT-LICENSE.txt'),'utf8');
const esc=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const words=source.primary.words,spans=[[0,5],[5,12],[12,14],[14,18]],texts=spans.map(([a,b])=>words.slice(a,b).join(' '));
assert.equal(texts.join(' '),source.secondary.verse);
const style=`@font-face{font-family:SealProof;src:url(data:font/woff2;base64,${font}) format('woff2')}text{font-family:Arial,sans-serif}.arabic{font-family:SealProof;font-synthesis:none}`;
function shell(body,w=1600,h=1600){return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><title>Al-Mulk 67:3 — provisional four-course 2D composition proof</title><desc>Original layout study using complete font-shaped phrases. Not bespoke Jali Thuluth; no 3D sculpture. Source text and marks unchanged.</desc><metadata>${esc(license)}</metadata><style>${style}</style>${body}</svg>`;}
const text=(s,x,y,size,fill='#e9dcba',extra='')=>`<text x="${x}" y="${y}" font-size="${size}" fill="${fill}" ${extra}>${esc(s)}</text>`;
const arabic=(s,x,y,size,fill='#eadbb6',extra='')=>text(s,x,y,size,fill,`class="arabic" lang="ar" direction="rtl" unicode-bidi="isolate" text-anchor="middle" ${extra}`);
(async()=>{let browser;try{
 browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--disable-gpu']});
 const page=await browser.newPage({viewport:{width:1600,height:1600},deviceScaleFactor:1});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setContent(`<style>${style}</style>`);await page.evaluate(async()=>{await document.fonts.load('100px SealProof');await document.fonts.ready;});
 const widths=await page.evaluate(items=>{const c=document.createElement('canvas').getContext('2d');c.font='100px SealProof';return items.map(t=>c.measureText(t).width);},texts);
 const size=Math.min(175,930/Math.max(...widths)*100);
 const baselines=[540,770,970,1180];
 let body='<rect width="1600" height="1600" fill="#101a20"/>';
 body+=text('QARIAI / CELESTIAL SEAL / v0.3 — 2D PROOF ONLY',80,65,19,'#b4a786');
 body+=text('Four courses · one proposed circular silhouette',80,112,34,'#f0e7d5');
 body+=text('Jali Thuluth commission reference; displayed lettering is provisional Uthmanic Hafs type.',80,150,19,'#a5b4bb');
 body+='<circle cx="800" cy="810" r="580" fill="#142027" stroke="#62736e" stroke-dasharray="3 12" stroke-width="1.5"/>';
 body+=text('PROPOSED ENVELOPE — NOT AN ENGRAVED RIM',800,1380,15,'#879b9a','text-anchor="middle"');
 const colors=['#eddab0','#e3cfaa','#d9c5a4','#f2dfb6'];
 texts.forEach((s,i)=>body+=arabic(s,800,baselines[i],size,colors[i],`id="course-${i+1}" data-first-word="${spans[i][0]+1}" data-last-word="${spans[i][1]}"`));
 body+=text('AL-MULK 67:3 / COMPLETE VERSE / 18 WORDS / BOTH PAUSE SIGNS RETAINED',80,1460,18,'#b5ac95');
 body+=text('Font-derived spatial study — no invented joins, letter stretching, text paths or displaced marks.',80,1500,19,'#a8b8be');
 body+=text('Custom interweaving and final Jali Thuluth paths require a qualified Arabic calligrapher.',80,1535,19,'#d0bd94');
 const clean=shell(body);
 fs.writeFileSync(path.join(root,'composition-proof.svg'),clean);
 async function render(svg,name,height=1600){await page.setViewportSize({width:1600,height});await page.setContent(`<style>body{margin:0;background:#101a20}</style>${svg}`);await page.evaluate(async()=>{await document.fonts.load('150px SealProof');await document.fonts.ready;});assert(await page.evaluate(()=>document.fonts.check('150px SealProof')));await page.screenshot({path:path.join(root,name),timeout:12000});}
 await render(clean,'composition-proof.png');
 const boxes=await page.locator('.arabic').evaluateAll(nodes=>nodes.map(n=>{const b=n.getBBox();return {text:n.textContent,x:b.x,y:b.y,width:b.width,height:b.height};}));
 for(let i=0;i<boxes.length-1;i++)assert(boxes[i].y+boxes[i].height+22<boxes[i+1].y,'Complete phrase bounds/marks need separation');
 for(const b of boxes){for(const x of [b.x,b.x+b.width])for(const y of [b.y,b.y+b.height])assert(Math.hypot(x-800,y-810)<580,'Full phrase including marks must stay within envelope');}
 let annotation='<defs><marker id="arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0L8 4L0 8" fill="none" stroke="#88bab4"/></marker></defs>';
 boxes.forEach((b,i)=>{annotation+=`<rect x="${b.x-12}" y="${b.y-12}" width="${b.width+24}" height="${b.height+24}" rx="16" fill="none" stroke="#66857e" stroke-width="1.2" stroke-dasharray="5 9"/>`;annotation+=text(`C${i+1} / W${String(spans[i][0]+1).padStart(2,'0')}–${String(spans[i][1]).padStart(2,'0')}`,60,b.y+b.height/2,16,'#a7c7bf');});
 for(let i=0;i<3;i++){const a=boxes[i],b=boxes[i+1],y=(a.y+a.height+b.y)/2;annotation+=`<path d="M${a.x-18} ${y} H${b.x+b.width+20}" fill="none" stroke="#88bab4" stroke-width="1.5" stroke-dasharray="4 7" marker-end="url(#arrow)"/>`;}
 annotation+=text('Read each course RTL. Dashed arrows return to the right for the next course; all annotations are editorial.',80,1575,16,'#a6b6bc');
 fs.writeFileSync(path.join(root,'labelled-study.svg'),shell(body+annotation));await render(shell(body+annotation),'labelled-study.png');
 let guide='<rect width="1600" height="1880" fill="#f6f2e9"/>';
 guide+=text('READING GUIDE / AL-MULK 67:3',80,70,33,'#24353c');guide+=text('Word numbers are editorial metadata; not additional sacred text. Every source mark stays with its word.',80,112,19,'#566970');
 const labels=['C1 / OPENING','C2 / MIDDLE CLAUSE','C3 / RETURN OF THE GAZE','C4 / FINAL QUESTION'];
 spans.forEach(([a,b],row)=>{const top=170+row*390;guide+=text(labels[row]+` / WORDS ${a+1}–${b}`,80,top,23,'#695634');guide+=arabic(texts[row],800,top+155,size*.83,'#26393d');const n=b-a,slot=1420/n;
 words.slice(a,b).forEach((w,j)=>{const x=1510-slot*(j+.5);guide+=text(String(a+j+1).padStart(2,'0'),x,top+232,18,'#7b6338','text-anchor="middle"');guide+=arabic(w,x,top+310,62,'#26393d');});
 if(row===0||row===1)guide+=text('Source pause sign U+06D6 stays attached to the final word of this course.',80,top+360,17,'#6d746a');});
 guide+=text('Read C1 → C2 → C3 → C4; within every course, start at the right. No circular reading direction is presumed.',80,1790,20,'#31474b');guide+=text('Provisional type proof. A calligrapher and Qur’anic text reviewer must approve the final vector composition.',80,1830,18,'#5d6d6d');
 fs.writeFileSync(path.join(root,'reading-guide.svg'),shell(guide,1600,1880));await render(shell(guide,1600,1880),'reading-guide.png',1880);
 assert.deepEqual(errors,[]);
 fs.writeFileSync(path.join(root,'render-check.json'),JSON.stringify({kind:'Actual Chromium 2D SVG/text proof rendering, no WebGL or generated imagery',fontLoaded:true,chromium:browser.version(),fontSize:size,viewport:[1600,1600],courseBounds:boxes,allMarksWithinEnvelope:true,courseBoundsDoNotOverlap:true,pageErrors:errors,artisticStatus:'Provisional source-font study; bespoke Jali Thuluth and visual correctness need expert review'},null,2)+'\n');
 console.log(JSON.stringify({size,widths,boxes,status:'PASS'}));
 }finally{await browser?.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
