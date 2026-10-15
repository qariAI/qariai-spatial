import {SVGLoader} from 'three/examples/jsm/loaders/SVGLoader.js';
import {ShapeUtils,ShapePath} from 'three';
import type {ApprovedVectorAsset} from './vectorIntake';
export type Bounds=[number,number,number,number];
const requireThat=(v:unknown,m:string)=>{if(!v)throw new Error(`Vector geometry: ${m}`);};
const number='[-+]?(?:\\d*\\.\\d+|\\d+\\.?\\d*)(?:[eE][-+]?\\d+)?';
const tokenRE=new RegExp(`[MmLlHhVvCcSsQqTtAaZz]|${number}`,'g');
const pairRE=new RegExp(`^[Mm]\\s*(${number})[\\s,]*(${number})`);
const NS='http://www.w3.org/2000/svg';
const inside=(b:Bounds,a:Bounds,e:number)=>b[0]>=a[0]-e&&b[1]>=a[1]-e&&b[0]+b[2]<=a[0]+a[2]+e&&b[1]+b[3]<=a[1]+a[3]+e;
// Do not use a positive overlap tolerance: that could hide very small marks.
const intersect=(a:Bounds,b:Bounds,_e:number)=>Math.min(a[0]+a[2],b[0]+b[2])-Math.max(a[0],b[0])>0&&Math.min(a[1]+a[3],b[1]+b[3])-Math.max(a[1],b[1])>0;
const union=(boxes:Bounds[]):Bounds=>{const x=Math.min(...boxes.map(b=>b[0])),y=Math.min(...boxes.map(b=>b[1]));return [x,y,Math.max(...boxes.map(b=>b[0]+b[2]))-x,Math.max(...boxes.map(b=>b[1]+b[3]))-y];};

// Strict grammar first: browser SVG parsers otherwise tolerate malformed trailing commands.
function contours(d:string):string[]{
  requireThat(typeof d==='string'&&d.length<=200000&&d.replace(tokenRE,'').replace(/[\s,]/g,'')==='','Unsupported path syntax');
  const t=d.match(tokenRE)??[];requireThat(t.length<=12000,'Path analysis token budget exceeded');const arity:Record<string,number>={M:2,L:2,H:1,V:1,C:6,S:4,Q:4,T:2,A:7};let open=false;
  for(let i=0;i<t.length;){const cmd=t[i++],upper=cmd.toUpperCase();requireThat(/^[MmLlHhVvCcSsQqTtAaZz]$/.test(cmd),'Missing path command');
    if(upper==='Z'){requireThat(open,'Unexpected close');open=false;continue;}
    requireThat(open||upper==='M','Every contour must start with move and explicitly close');
    if(upper==='M'){requireThat(!open,'Unclosed contour');open=true;}
    const values:number[]=[];while(i<t.length&&!/^[A-Za-z]$/.test(t[i]))values.push(Number(t[i++]));
    requireThat(values.length>0&&values.length%arity[upper]===0&&values.every(x=>Number.isFinite(x)&&Math.abs(x)<1e7),'Malformed path parameters');
    if(upper==='A')for(let n=0;n<values.length;n+=7)requireThat(values[n]>=0&&values[n+1]>=0&&[0,1].includes(values[n+3])&&[0,1].includes(values[n+4]),'Invalid arc');
  }
  requireThat(t.length>0&&!open,'Missing/unfinished closed contour');
  let previous:[number,number]=[0,0];
  return d.split(/(?=[Mm])/).filter(s=>s.trim()).map(raw=>{
    const m=raw.match(pairRE);requireThat(m,'Invalid contour move');const x=Number(m![1])+(raw[0]==='m'?previous[0]:0),y=Number(m![2])+(raw[0]==='m'?previous[1]:0);previous=[x,y];
    let rest=raw.slice(m![0].length);if(raw[0]==='m'&&/^\s*,?\s*[-+.\d]/.test(rest))rest='l'+rest.replace(/^\s*,/,'');
    // Analysis copy only: resolve the initial relative move so each contour can be measured alone.
    return `M${x} ${y}${rest}`;
  });
}

/** Conservative preflight, NOT a contour-to-sculpture adapter.
 * Bounds/overlap guards intentionally fail closed; no curves or approved source bytes are rewritten. */
export function inspectVectorGeometry(svg:string,a:ApprovedVectorAsset):true {
  requireThat(!/<!DOCTYPE|<!ENTITY|<\?/.test(svg),'Declarations/entities are not allowed');
  const doc=new DOMParser().parseFromString(svg,'image/svg+xml'),root=doc.documentElement;
  requireThat(!doc.querySelector('parsererror')&&root.localName==='svg'&&root.namespaceURI===NS,'Malformed SVG/namespace');
  const presentation=['fill','fill-rule','opacity','fill-opacity','visibility','display','stroke'];
  const allowed:Record<string,string[]>={svg:['xmlns','viewBox','id','version',...presentation],g:['id',...presentation],path:['id','d',...presentation],title:['id'],desc:['id'],metadata:['id']};
  const ids=new Set<string>();
  for(const el of Array.from(doc.querySelectorAll('*'))){
    requireThat(el.namespaceURI===NS&&Object.hasOwn(allowed,el.localName)&&(el.localName!=='svg'||el===root),'Unpermitted element/namespace/nested viewport');
    requireThat(el===root||['svg','g'].includes(el.parentElement?.localName??''),'Invalid SVG hierarchy');
    for(const attr of Array.from(el.attributes))requireThat(allowed[el.localName].includes(attr.name)&&(attr.namespaceURI===null||attr.name==='xmlns'),'Unpermitted SVG attribute');
    if(el.hasAttribute('id')){const id=el.getAttribute('id')!;requireThat(id.trim()&&!ids.has(id),'Duplicate/empty SVG ID');ids.add(id);}
    if(el.hasAttribute('fill'))requireThat(/^(?:#[\da-f]{3}|#[\da-f]{6}|black|white)$/i.test(el.getAttribute('fill')!),'Nonopaque/nonfilled presentation');
    for(const name of ['opacity','fill-opacity'])if(el.hasAttribute(name))requireThat(Number(el.getAttribute(name))===1,'Transparent artwork/ancestor');
    for(const [name,value] of [['visibility','visible'],['display','inline'],['stroke','none']])if(el.hasAttribute(name))requireThat(el.getAttribute(name)===value,'Hidden/stroked artwork/ancestor');
    if(el.hasAttribute('fill-rule'))requireThat(['evenodd','nonzero'].includes(el.getAttribute('fill-rule')!),'Unsupported fill rule');
    if(el.hasAttribute('version'))requireThat(el.getAttribute('version')==='1.1','Unsupported SVG version');
    if(['title','desc','metadata'].includes(el.localName))requireThat(el.children.length===0,'Metadata must be plain text');
    else requireThat(Array.from(el.childNodes).every(n=>n.nodeType!==Node.TEXT_NODE||!n.textContent?.trim()),'Unexpected text content');
  }
  const view=root.getAttribute('viewBox')?.trim().split(/[\s,]+/).map(Number);
  requireThat(view?.length===4&&view.every((x,i)=>x===a.viewBox[i]),'SVG/manifest viewBox mismatch');
  const originals=Array.from(doc.querySelectorAll('path'));
  requireThat(originals.length===a.paths.length&&originals.every((p,i)=>p.id===a.paintOrder[i]),'SVG paint order/count differs from manifest');
  const contourData=new Map<string,string[]>();
  const nodes=new Map(originals.map(p=>[p.id,p])),boxes=new Map<string,Bounds[]>(),pathBoxes=new Map<string,Bounds>();
  const e=Math.max(a.viewBox[2],a.viewBox[3])*1e-7;
  // The hidden measurement host contains only vetted source path clones, never live fonts/scripts.
  const host=document.createElementNS(NS,'svg');host.setAttribute('viewBox',a.viewBox.join(' '));host.setAttribute('width',String(a.viewBox[2]));host.setAttribute('height',String(a.viewBox[3]));
  host.style.cssText='position:fixed;left:-100000px;top:0;visibility:hidden;pointer-events:none';document.body.append(host);
  try{
    const measure=(d:string):Bounds=>{const p=document.createElementNS(NS,'path');p.setAttribute('d',d);host.append(p);try{const b=p.getBBox();return [b.x,b.y,b.width,b.height];}finally{p.remove();}};
    let pathBytes=0;
    for(const p of a.paths){const node=nodes.get(p.id);requireThat(node&&node.getAttribute('d')===p.d&&node.getAttribute('fill-rule')===p.fillRule,'Approved original path/fill rule mismatch');
      pathBytes+=p.d.length;requireThat(pathBytes<=5_000_000,'Excessive combined curves');
      const parts=contours(p.d);requireThat(parts.length<=2000,'Excessive contours');const bs=parts.map(measure),b=measure(p.d);
      requireThat(b.every(Number.isFinite)&&b[2]>0&&b[3]>0&&inside(b,a.viewBox,0),'Off-canvas/degenerate path bounds');
      pathBoxes.set(p.id,b);boxes.set(p.id,bs);contourData.set(p.id,parts);
    }
  }finally{host.remove();}
  // Tessellation supplies candidate interior points; the browser's original SVG fill rule
  // decides visibility. This rejects cancelled evenodd contours that SVGLoader alone accepts.
  const parsed=new SVGLoader().parse(svg);let budget=0;
  requireThat(parsed.paths.length===originals.length,'Geometry parser dropped a path');
  function filledInterior(path:typeof parsed.paths[number],d:string,fillRule:string,ownerD=d):boolean {
    const probe=document.createElementNS(NS,'path'),owner=document.createElementNS(NS,'path');
    probe.setAttribute('d',d);owner.setAttribute('d',ownerD);probe.setAttribute('fill-rule',fillRule);owner.setAttribute('fill-rule',fillRule);host.append(probe,owner);document.body.append(host);
    try{for(const shape of SVGLoader.createShapes(path)){
      const points=shape.extractPoints(32),faces=ShapeUtils.triangulateShape(points.shape,points.holes),vertices=[...points.shape,...points.holes.flat()];
      for(const [ia,ib,ic] of faces){const [a0,b0,c0]=[vertices[ia],vertices[ib],vertices[ic]];
        const area=Math.abs((b0.x-a0.x)*(c0.y-a0.y)-(b0.y-a0.y)*(c0.x-a0.x))/2;
        if(area<=a.viewBox[2]*a.viewBox[3]*1e-12)continue;
        const x=(a0.x+b0.x+c0.x)/3,y=(a0.y+b0.y+c0.y)/3,delta=Math.min(e/10,Math.sqrt(area)*.001);
        if([[x,y],[x+delta,y],[x-delta,y],[x,y+delta],[x,y-delta]].every(([px,py])=>{const p=new DOMPoint(px,py);return probe.isPointInFill(p)&&owner.isPointInFill(p);}))return true;
      }
    }return false;}finally{probe.remove();owner.remove();host.remove();}
  }
  const parsedById=new Map(originals.map((p,i)=>[p.id,parsed.paths[i]]));
  for(const p of a.paths){const path=parsedById.get(p.id)!;
    for(const sub of path.subPaths){const points=sub.getPoints(32);budget+=points.length;requireThat(points.length<=4096&&budget<=100000,'Curve analysis budget exceeded');}
    requireThat(filledInterior(path,p.d,p.fillRule),'No nondegenerate filled interior (including holes/cancellation)');
  }
  const components=new Map(a.components.map(c=>[c.id,c])),componentBoxes=new Map<string,Bounds>();
  for(const c of a.components){const bs=boxes.get(c.pathId)!;requireThat(c.contours.every(n=>n<bs.length),'Missing component contour');componentBoxes.set(c.id,union(c.contours.map(n=>bs[n])));
    const original=a.paths.find(p=>p.id===c.pathId)!,path=parsedById.get(c.pathId)!;
    const subset=Object.assign(new ShapePath(),path,{subPaths:c.contours.map(n=>path.subPaths[n])}) as typeof path;
    requireThat(filledInterior(subset,c.contours.map(n=>contourData.get(c.pathId)![n]).join(''),original.fillRule,original.d),'Component has no visible filled interior in its original path');
  }
  const sharedKeys=new Set<string>();
  for(const r of a.sharedContours){const key=`${r.pathId}:${r.contour}`;requireThat(!sharedKeys.has(key)&&typeof r.record==='string'&&r.record.trim(),'Missing/duplicate shared-contour review');sharedKeys.add(key);
    const expected=a.components.filter(c=>c.pathId===r.pathId&&c.contours.includes(r.contour)).map(c=>c.id);
    requireThat(Array.isArray(r.componentIds)&&new Set(r.componentIds).size===r.componentIds.length&&expected.length>1&&expected.length===r.componentIds.length&&expected.every(id=>r.componentIds.includes(id)),'Wrong shared-contour mapping');
  }
  for(const [id,bs] of boxes)bs.forEach((_,n)=>{const cs=a.components.filter(c=>c.pathId===id&&c.contours.includes(n));requireThat(cs.length>0,'Unmapped original contour');if(cs.length>1)requireThat(sharedKeys.has(`${id}:${n}`),'Shared contour needs explicit specialist review');});
  for(const g of a.glyphs){const b=union(g.componentIds.map(id=>componentBoxes.get(id)!));requireThat(inside(g.bounds,a.viewBox,0)&&b.every((v,i)=>Math.abs(v-g.bounds[i])<=e),'Detached component: approved glyph bounds differ');}
  const relations=new Map<string,{frontPathId:string;backPathId:string;record:string}>(),key=(x:string,y:string)=>[x,y].sort().join('\u0000');
  for(const r of a.overlaps){requireThat(r&&r.frontPathId!==r.backPathId&&pathBoxes.has(r.frontPathId)&&pathBoxes.has(r.backPathId)&&typeof r.record==='string'&&r.record.trim(),'Malformed overlap review');const k=key(r.frontPathId,r.backPathId);requireThat(!relations.has(k),'Duplicate/contradictory overlap');relations.set(k,r);
    requireThat(intersect(pathBoxes.get(r.frontPathId)!,pathBoxes.get(r.backPathId)!,e),'Spurious overlap declaration');
  }
  for(let i=0;i<a.paths.length;i++)for(let j=i+1;j<a.paths.length;j++){
    const x=a.paths[i],y=a.paths[j];if(!intersect(pathBoxes.get(x.id)!,pathBoxes.get(y.id)!,e))continue;
    const r=relations.get(key(x.id,y.id));requireThat(r,'Undeclared overlap candidate');const front=a.paths.find(p=>p.id===r!.frontPathId)!,back=a.paths.find(p=>p.id===r!.backPathId)!;
    requireThat(front.level>=back.level&&a.paintOrder.indexOf(front.id)>a.paintOrder.indexOf(back.id),'Over/under depth or paint-order conflict');
    // Fail closed on mark-bounds interference, even when filled silhouettes might be disjoint.
    for(const id of back.componentIds){const c=components.get(id)!;if(c.kind!=='base')requireThat(!intersect(componentBoxes.get(id)!,pathBoxes.get(front.id)!,e),'Overlap could obscure sacred mark/pause');}
  }
  return true;
}
