// Guide-following geometry only. No stroke-order, pressure or mastery inference.
export type Point=Readonly<{x:number;y:number}>;
export type Stroke=Readonly<{points:readonly Point[];canceled:boolean}>;
export type Disk=Readonly<{center:Point;radius:number}>;
export type PathPart=Readonly<{kind:'path';id:string;points:readonly Point[];endpoints:readonly [Disk,Disk]}>;
export type DotPart=Readonly<{kind:'dot';id:string;region:Disk}>;
export type Rules=Readonly<{
 version:string;sourceHash:string;
 review:Readonly<{reference:string;annotationsApproved:boolean;fixturesApproved:boolean}>;
 diagonal:number;corridor:number;spacing:number;coverage:number;inside:number;
 parts:readonly (PathPart|DotPart)[];forbidden:readonly (readonly Point[])[];
}>;
export type Result={state:'unavailable'|'incomplete'|'complete';missing:string[];reason?:string};
const distance=(a:Point,b:Point)=>Math.hypot(a.x-b.x,a.y-b.y);
const finite=(p:Point)=>Number.isFinite(p.x)&&Number.isFinite(p.y);
function segmentDistance(p:Point,a:Point,b:Point){
 const dx=b.x-a.x,dy=b.y-a.y,length=dx*dx+dy*dy;
 const t=length?Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/length)):0;
 return Math.hypot(p.x-a.x-t*dx,p.y-a.y-t*dy);
}
const inDisk=(p:Point,d:Disk)=>distance(p,d.center)<=d.radius;
function inPolygon(p:Point,polygon:readonly Point[]){
 let inside=false;
 for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){
  const a=polygon[j],b=polygon[i];
  if(segmentDistance(p,a,b)<1e-9)return true;
  if((a.y>p.y)!==(b.y>p.y)&&p.x<(b.x-a.x)*(p.y-a.y)/(b.y-a.y)+a.x)inside=!inside;
 }
 return inside;
}
function crosses(a:Point,b:Point,polygon:readonly Point[]){
 if(inPolygon(a,polygon)||inPolygon(b,polygon))return true;
 const orient=(p:Point,q:Point,r:Point)=>(q.x-p.x)*(r.y-p.y)-(q.y-p.y)*(r.x-p.x);
 for(let i=0;i<polygon.length;i++){
  const c=polygon[i],d=polygon[(i+1)%polygon.length];
  const abC=orient(a,b,c),abD=orient(a,b,d),cdA=orient(c,d,a),cdB=orient(c,d,b);
  if(((abC>0&&abD<0)||(abC<0&&abD>0))&&((cdA>0&&cdB<0)||(cdA<0&&cdB>0)))return true;
  if(segmentDistance(c,a,b)<1e-9||segmentDistance(d,a,b)<1e-9)return true;
 }
 return false;
}
const diskValid=(d:Disk)=>finite(d.center)&&Number.isFinite(d.radius)&&d.radius>0;
export function rulesReady(rules:Rules|null,sourceHash:string):rules is Rules{
 if(!rules)return false;
 const r=rules;
 const dots=r.parts.filter((p):p is DotPart=>p.kind==='dot');
 if(dots.some((a,i)=>dots.some((b,j)=>j>i&&distance(a.region.center,b.region.center)<=a.region.radius+b.region.radius)))return false;
 return !!r.version.trim()&&r.sourceHash===sourceHash&&!!r.review.reference.trim()&&r.review.annotationsApproved&&r.review.fixturesApproved&&
  Number.isFinite(r.diagonal)&&r.diagonal>0&&Number.isFinite(r.corridor)&&r.corridor>0&&
  Number.isFinite(r.spacing)&&r.spacing>0&&r.spacing<=r.diagonal*.005&&r.corridor>=r.spacing&&r.corridor<=r.diagonal&&
  r.coverage>=.9&&r.coverage<=1&&r.inside>=.95&&r.inside<=1&&r.parts.length>0&&
  r.parts.length<=16&&new Set(r.parts.map(p=>p.id)).size===r.parts.length&&
  r.parts.every(p=>p.id.trim()&&(p.kind==='dot'?diskValid(p.region):p.points.length>=2&&p.points.length<=4096&&p.points.every(finite)&&p.points.some(q=>distance(q,p.points[0])>0)&&p.endpoints.length===2&&p.endpoints.every(diskValid)))&&
  r.forbidden.length<=32&&r.forbidden.every(p=>p.length>=3&&p.length<=256&&p.every(finite));
}
// Compiling once keeps reviewed target paths and the spatial ink index reusable.
export function compileGuide(rules:Rules|null,sourceHash:string){
 if(!rulesReady(rules,sourceHash))return (_strokes:readonly Stroke[],_active=false):Result=>({state:'unavailable',missing:[],reason:'Reviewed guide data unavailable'});
 const r=rules,paths=r.parts.filter((p):p is PathPart=>p.kind==='path'),dots=r.parts.filter((p):p is DotPart=>p.kind==='dot');
 let overBudget=false;
 const targets=paths.map(part=>{
  const samples:{point:Point;weight:number}[]=[];
  for(let i=1;i<part.points.length;i++){
   const a=part.points[i-1],b=part.points[i],length=distance(a,b),count=Math.ceil(length/r.spacing);
   if(!Number.isFinite(count)||samples.length+count>24000){overBudget=true;break}
   for(let j=0;j<count;j++){const t=(j+.5)/count;samples.push({point:{x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t},weight:length/count})}
  }
  return {part,samples,length:samples.reduce((n,s)=>n+s.weight,0)};
 });
 // Refuse pathological annotations before allocating an unbounded scoring grid.
 if(overBudget||targets.reduce((n,t)=>n+t.samples.length,0)>24000)return (_strokes:readonly Stroke[],_active=false):Result=>({state:'unavailable',missing:[],reason:'Guide data exceeds scoring budget'});
 const nearPath=(p:Point,part:PathPart)=>part.points.some((b,i)=>i>0&&segmentDistance(p,part.points[i-1],b)<=r.corridor);
 const allowed=(p:Point)=>paths.some(part=>nearPath(p,part))||dots.some(part=>inDisk(p,part.region));
 return (strokes:readonly Stroke[],active=false):Result=>{
  const incomplete=(missing:string[],reason?:string):Result=>({state:'incomplete',missing,reason});
  if(active)return incomplete([],'Finish the current stroke');
  if(strokes.reduce((n,s)=>n+s.points.length,0)>12000)return incomplete([],'Ink exceeds scoring budget');
  if(strokes.some(s=>s.points.some(p=>!finite(p))))return incomplete([],'Invalid ink coordinates');
  // A canceled stroke remains visible and counts against extra ink, but cannot
  // supply required coverage, endpoints or dots until replaced by finished ink.
  const completed=strokes.filter(s=>!s.canceled&&s.points.length);
  const grid=new Map<string,{a:Point;b:Point}[]>(),cell=r.corridor;
  const key=(x:number,y:number)=>`${x},${y}`;
  let totalLength=0,insideLength=0,samples=0;
  const completedMarks:Point[]=[];
  for(const stroke of strokes){
   for(const point of stroke.points){if(r.forbidden.some(poly=>inPolygon(point,poly)))return incomplete([],'Ink crosses a protected region')}
   if(stroke.points.length===1&&!allowed(stroke.points[0]))return incomplete([],'Ink outside the guide');
   if(!stroke.canceled&&stroke.points.length)completedMarks.push(stroke.points[0]);
   for(let i=1;i<stroke.points.length;i++){
    const a=stroke.points[i-1],b=stroke.points[i],length=distance(a,b);
    if(r.forbidden.some(poly=>crosses(a,b,poly)))return incomplete([],'Ink crosses a protected region');
    const count=Math.ceil(length/r.spacing);
    if(samples+count>24000)return incomplete([],'Ink exceeds scoring budget');samples+=count;
    for(let j=0;j<count;j++){
     const at=(t:number):Point=>({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t});
     const p=at((j+.5)/count);totalLength+=length/count;if(allowed(p))insideLength+=length/count;
     if(!stroke.canceled){
      const segment={a:at(j/count),b:at((j+1)/count)};
      // Index each tiny segment's bounds. Queries inspect neighbouring cells.
      for(let x=Math.floor(Math.min(segment.a.x,segment.b.x)/cell);x<=Math.floor(Math.max(segment.a.x,segment.b.x)/cell);x++)
       for(let y=Math.floor(Math.min(segment.a.y,segment.b.y)/cell);y<=Math.floor(Math.max(segment.a.y,segment.b.y)/cell);y++){
        const k=key(x,y),bucket=grid.get(k);if(bucket)bucket.push(segment);else grid.set(k,[segment]);
       }
     }
    }
   }
  }
  const covered=(p:Point)=>{
   const x=Math.floor(p.x/cell),y=Math.floor(p.y/cell);
   for(let dx=-1;dx<=1;dx++)for(let dy=-1;dy<=1;dy++)if(grid.get(key(x+dx,y+dy))?.some(s=>segmentDistance(p,s.a,s.b)<=r.corridor))return true;
   return completedMarks.some(mark=>distance(p,mark)<=r.corridor);
  };
  const touches=(stroke:Stroke,region:Disk)=>stroke.points.some(p=>inDisk(p,region))||stroke.points.some((b,i)=>i>0&&segmentDistance(region.center,stroke.points[i-1],b)<=region.radius);
  const missing=targets.filter(t=>t.samples.reduce((n,s)=>n+(covered(s.point)?s.weight:0),0)+t.length*1e-12<t.length*r.coverage||!t.part.endpoints.every(d=>completed.some(s=>touches(s,d)))).map(t=>t.part.id);
  // Each dot needs its own finished stroke, confined to its own reviewed region.
  // A long sweep touching two dots cannot satisfy either dot.
  for(const dot of dots)if(!completed.some(s=>s.points.every(p=>inDisk(p,dot.region))))missing.push(dot.id);
  if(missing.length)return incomplete(missing,'Required guide parts remain');
  if(!totalLength||insideLength/totalLength+1e-12<r.inside)return incomplete([],'Too much ink outside the guide');
  return {state:'complete',missing:[]};
 };
}
