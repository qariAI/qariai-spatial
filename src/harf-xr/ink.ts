import { BA, sampleBody, type Point } from './letters/definition';
// Provisional display parameters, not historical Naskh rules or measured pressure.
export const NIB = { angleDegrees: 35, span: 25, thickness: 4, angleVariationDegrees: 3 };
export const GOLD_STOPS = [[0, '#92662e'], [.28, '#efd59b'], [.58, '#c59a54'], [1, '#e3bd77']] as const;
const guide=sampleBody(BA), distance=(a:Point,b:Point)=>Math.hypot(a.x-b.x,a.y-b.y);
export function smoothStroke(points:Point[]):Point[] {
  if(points.length<3)return points.map(p=>({x:p.x,y:p.y}));
  // One corner-cutting pass, with exact endpoints and no extrapolation.
  // Raw samples remain untouched for proximity/direction validation.
  const result=[{x:points[0].x,y:points[0].y}];
  for(let i=0;i<points.length-1;i++){
    const a=points[i],b=points[i+1];result.push({x:.75*a.x+.25*b.x,y:.75*a.y+.25*b.y},{x:.25*a.x+.75*b.x,y:.25*a.y+.75*b.y});
  }
  result.push({x:points.at(-1)!.x,y:points.at(-1)!.y});return result;
}
export function nibCorners(p:Point,tangent:Point):Point[] {
  const angle=(NIB.angleDegrees+NIB.angleVariationDegrees*Math.sin(Math.atan2(tangent.y,tangent.x)))*Math.PI/180;
  const terminalDistance=Math.min(distance(p,guide[0]),distance(p,guide.at(-1)!));
  const t=Math.min(1,terminalDistance/18), taper=.45+.55*t*t*(3-2*t);
  const a=NIB.span*taper/2,b=NIB.thickness*taper/2,c=Math.cos(angle),s=Math.sin(angle);
  return [[-a,-b],[a,-b],[a,b],[-a,b]].map(([x,y])=>({x:p.x+x*c-y*s,y:p.y+x*s+y*c}));
}
function hull(points:Point[]):Point[] {
  const sorted=[...points].sort((a,b)=>a.x-b.x||a.y-b.y);
  const cross=(a:Point,b:Point,c:Point)=>(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);
  const half=(list:Point[])=>{const out:Point[]=[];for(const p of list){while(out.length>=2&&cross(out[out.length-2],out.at(-1)!,p)<=0)out.pop();out.push(p);}return out;};
  const lower=half(sorted),upper=half([...sorted].reverse());return [...lower.slice(0,-1),...upper.slice(0,-1)];
}
export function inkPath(strokes:Point[][]):string {
  const polygons:string[]=[];
  for(const stroke of strokes){const points=smoothStroke(stroke);for(let i=1;i<points.length;i++){
    const a=points[i-1],b=points[i],t={x:b.x-a.x,y:b.y-a.y};if(Math.hypot(t.x,t.y)<.01)continue;
    const polygon=hull([...nibCorners(a,t),...nibCorners(b,t)]);
    polygons.push(polygon.map((p,j)=>`${j?'L':'M'}${p.x.toFixed(3)} ${p.y.toFixed(3)}`).join(' ')+'Z');
  }}
  return polygons.join(' ');
}
