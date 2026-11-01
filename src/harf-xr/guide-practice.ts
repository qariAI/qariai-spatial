import kaf from '../orbit-art/generated/kaf-outline.json';
import outlines from '../orbit-art/generated/letter-outlines.json';
import {PRACTICES,type PracticeId} from '../integration/practice';
import {compileGuide,rulesReady,type Point,type Result} from './guide-validation/engine';
import {REVIEWED_GUIDES} from './guide-validation/reviews';
import {guideFeedback} from './guide-validation/feedback';

const sources={kaf,lam:outlines['ل'],fa:outlines['ف'],ya:outlines['ي']};
const hashes={kaf:'2c381807e055fc8a08b6e03f4e4c605e4279af6cbc26334e272763b862b8d8c4',lam:'53c482d183e898a58f8cf983f20aeafb0db830b34600f7f14e04b8fc312c9a65',fa:'a2b5545bbb9b7e2b61b924179f83e89258393d11a0529826890e1a399994ff92',ya:'2605a72025fc298bb0081a93b8dd17d29ab5f46bf85e6b2a0411b23c590ee722'};
export const GUIDE_IDS=Object.keys(PRACTICES) as PracticeId[];
/** Uses the same source contours, hashes and completion engine as SVG practice. */
export class GuidePractice {
 mode:PracticeId;
 strokes:Point[][]=[];
 private canceled=new Set<Point[]>();
 private future:{points:Point[];canceled:boolean}[]=[];
 active=false;
 phase:'body'|'dot'|'complete'='body';
 feedback='';
 result:Result={state:'incomplete',missing:[]};
 private evaluate:ReturnType<typeof compileGuide>;
 source:typeof kaf;
 scale=1;cx=0;cy=0;
 constructor(mode:PracticeId){this.mode=mode;this.source=sources[mode];this.evaluate=compileGuide(null,'');this.select(mode)}
 get rules(){return REVIEWED_GUIDES[this.mode]}
 get progress(){return this.result.state==='complete'?1:0}
 get canUndo(){return !this.active&&this.strokes.length>0}
 get canRedo(){return !this.active&&this.future.length>0}
 select(mode:PracticeId){
  this.mode=mode;this.source=sources[mode];
  if(this.source.letter!==PRACTICES[mode].letter||this.source.fontSha256!==kaf.fontSha256||this.source.pathSha256!==hashes[mode])throw Error('Practice source mismatch');
  this.evaluate=compileGuide(this.rules,this.source.pathSha256);
  const [xmin,ymin,xmax,ymax]=this.source.bounds;
  this.scale=Math.min(680/(xmax-xmin),270/(ymax-ymin));this.cx=(xmin+xmax)/2;this.cy=(ymin+ymax)/2;this.reset();
 }
 toSource(p:Point):Point{return {x:(p.x-450)/this.scale+this.cx,y:(285-p.y)/this.scale+this.cy}}
 toBoard(p:Point):Point{return {x:450+(p.x-this.cx)*this.scale,y:285-(p.y-this.cy)*this.scale}}
 private check(){
  this.result=this.evaluate(this.strokes.map(points=>({points:points.map(p=>this.toSource(p)),canceled:this.canceled.has(points)})),this.active);
  this.phase=this.result.state==='complete'?'complete':'body';
  this.feedback=this.rules&&rulesReady(this.rules,this.source.pathSha256)?guideFeedback(this.result,this.rules.parts,{mode:this.mode,active:this.active,canceled:false,hasInk:this.strokes.length>0,hasStrokeLength:this.strokes.some(s=>s.length>1)}):'Guide checking unavailable · free practice only';
 }
 reset(){this.strokes=[];this.canceled.clear();this.future=[];this.active=false;this.check()}
 begin(p:Point){if(this.active||this.strokes.reduce((n,s)=>n+s.length,0)>=12000||p.y<140||p.y>430)return false;this.strokes.push([{...p}]);this.future=[];this.active=true;this.check();return true}
 move(p:Point){
  if(!this.active)return;
  const s=this.strokes.at(-1)!,last=s.at(-1)!;
  if(Math.hypot(p.x-last.x,p.y-last.y)<.6)return;
  if(p.y<140||p.y>430||Math.hypot(p.x-last.x,p.y-last.y)>65||this.strokes.reduce((n,s)=>n+s.length,0)>=12000){this.cancel();return}
  s.push({...p});
 }
 end(){if(!this.active)return;this.active=false;this.check()}
 cancel(){if(!this.active)return;this.canceled.add(this.strokes.at(-1)!);this.active=false;this.check();this.feedback='Tracking interrupted · partial stroke does not count. Undo it or trace again.'}
 undo(){if(!this.canUndo)return;const points=this.strokes.pop()!;this.future.push({points,canceled:this.canceled.has(points)});this.canceled.delete(points);this.check()}
 redo(){if(!this.canRedo)return;const item=this.future.pop()!;this.strokes.push(item.points);if(item.canceled)this.canceled.add(item.points);this.check()}
 paint(ctx:CanvasRenderingContext2D){
  ctx.fillStyle='#eed6a1';ctx.font='bold 27px sans-serif';ctx.textAlign='left';ctx.fillText(`HARF STUDIO / ${PRACTICES[this.mode].name.toUpperCase()}`,35,38);
  ctx.fillStyle='#b9d4d3';ctx.font='17px sans-serif';ctx.fillText('Shape following only · stroke order, pressure and mastery are not graded',35,67);
  for(const [i,id] of GUIDE_IDS.entries()){ctx.fillStyle=id===this.mode?'#35645d':'#263f50';ctx.fillRect(35+i*212,84,195,42);ctx.fillStyle='#f4dfad';ctx.textAlign='center';ctx.fillText(PRACTICES[id].name,132+i*212,112)}
  ctx.font='12px sans-serif';ctx.fillStyle='#a7c8ca';ctx.textAlign='center';ctx.fillText('Pinch to draw · release to check · hold buttons briefly',450,141);
  ctx.save();ctx.translate(450,285);ctx.scale(this.scale,-this.scale);ctx.translate(-this.cx,-this.cy);
  ctx.fillStyle='#355565';ctx.fill(new Path2D(this.source.path));ctx.strokeStyle='#91a9aa';ctx.lineWidth=1/this.scale;ctx.stroke(new Path2D(this.source.path));ctx.restore();
  if(this.rules&&rulesReady(this.rules,this.source.pathSha256))for(const part of this.rules.parts){
   ctx.strokeStyle='#e8d49d';ctx.fillStyle='#97e2cf';ctx.lineWidth=2;ctx.setLineDash([6,7]);ctx.beginPath();
   if(part.kind==='path'){part.points.forEach((p,i)=>{const q=this.toBoard(p);if(i)ctx.lineTo(q.x,q.y);else ctx.moveTo(q.x,q.y)});ctx.stroke();ctx.setLineDash([]);for(const end of part.endpoints){const p=this.toBoard(end.center);ctx.beginPath();ctx.arc(p.x,p.y,Math.max(3,end.radius*this.scale*.4),0,Math.PI*2);ctx.fill()}}
   else{const p=this.toBoard(part.region.center);ctx.setLineDash([]);ctx.arc(p.x,p.y,part.region.radius*this.scale,0,Math.PI*2);ctx.stroke()}
  }
  ctx.setLineDash([]);ctx.strokeStyle='#ffd183';ctx.fillStyle='#ffd183';ctx.lineWidth=5;ctx.lineCap='round';ctx.lineJoin='round';
  for(const stroke of this.strokes){ctx.beginPath();stroke.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));if(stroke.length===1){ctx.arc(stroke[0].x,stroke[0].y,3,0,Math.PI*2);ctx.fill()}else ctx.stroke()}
  ctx.textAlign='center';ctx.font='bold 19px sans-serif';ctx.fillStyle=this.phase==='complete'?'#97e2cf':'#d7e5df';ctx.fillText(this.phase==='complete'?'Practice guide completed':this.active?'Release pinch to check stroke':'Follow each dashed part and place dots separately',450,455);
  for(const [i,label]of ['Undo','Redo','Try again',this.phase==='complete'?'Inspect in 3D':'Finish guide first'].entries()){
   const enabled=i===0?this.canUndo:i===1?this.canRedo:i===3?this.phase==='complete':true;
   ctx.fillStyle=enabled?'#263f50':'#172f3b';ctx.fillRect(35+i*212,480,195,46);ctx.fillStyle=enabled?'#f4dfad':'#73858b';ctx.fillText(label,132+i*212,510);
  }
  for(const [x,label]of [[110,'NEXT GUIDE'],[510,'RETURN TO ORBIT']] as const){ctx.fillStyle='#263f50';ctx.fillRect(x,550,280,62);ctx.strokeStyle='#b2935f';ctx.strokeRect(x,550,280,62);ctx.fillStyle='#f4dfad';ctx.fillText(label,x+140,590)}
  ctx.font='15px sans-serif';ctx.fillStyle='#b6d3cc';ctx.fillText(this.feedback,450,637,850);
 }
}
