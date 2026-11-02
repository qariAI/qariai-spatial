import {guideFeedback,guidePartLabel} from './feedback';
import {orbitArtEnabled} from '../../orbit-art/mode';
import {PRACTICES,type PracticeId} from '../../integration/practice';
import {experienceHref,inspectionHref} from '../../integration/routes';
import {compileGuide,rulesReady,type Stroke,type Result} from './engine';
import {REVIEWED_GUIDES} from './reviews';

// With missing review data this leaves the original ungraded page untouched.
export function installGuideCompletion(mode:PracticeId,sourceHash:string,board:SVGSVGElement,feedback:Element){
 const rules=REVIEWED_GUIDES[mode];
 if(!orbitArtEnabled(location.search)||!rulesReady(rules,sourceHash))return (_strokes:readonly Stroke[],_active=false,_canceled=false)=>{};
 const evaluate=compileGuide(rules,sourceHash);
 if(evaluate([]).state==='unavailable')return (_strokes:readonly Stroke[],_active=false,_canceled=false)=>{};
 board.dataset.graded='guide-following';board.dataset.guideComplete='false';
 const overlays=new Map<string,SVGGElement>();
 const ns='http://www.w3.org/2000/svg',overlay=document.createElementNS(ns,'g');overlay.id='practiceGuide';overlay.setAttribute('aria-hidden','true');
 // Practice overlay only: original source path and 3D artwork stay unchanged.
 for(const part of rules.parts){
  const group=document.createElementNS(ns,'g');group.dataset.part=part.id;group.dataset.state='remaining';overlays.set(part.id,group);overlay.append(group);
  if(part.kind==='path'){const line=document.createElementNS(ns,'polyline');line.setAttribute('points',part.points.map(p=>`${p.x},${p.y}`).join(' '));line.setAttribute('fill','none');line.setAttribute('stroke','#e8d49d');line.setAttribute('stroke-width','3');line.setAttribute('stroke-dasharray','7 9');line.setAttribute('stroke-linecap','round');group.append(line);
   for(const end of part.endpoints){const marker=document.createElementNS(ns,'circle');marker.setAttribute('cx',String(end.center.x));marker.setAttribute('cy',String(end.center.y));marker.setAttribute('r',String(end.radius*.4));marker.setAttribute('fill','#82dfc2');group.append(marker)}
  }else{const marker=document.createElementNS(ns,'circle');marker.setAttribute('cx',String(part.region.center.x));marker.setAttribute('cy',String(part.region.center.y));marker.setAttribute('r',String(part.region.radius));marker.setAttribute('fill','#d6a5ff33');marker.setAttribute('stroke','#d6a5ff');marker.setAttribute('stroke-width','2');group.append(marker)}
 }
 board.querySelector('[data-practice-outline]')!.parentElement!.append(overlay);
 board.setAttribute('aria-label',`Practice guide for ${PRACTICES[mode].label}. Shape following only.`);
 document.title=`Harf Studio — ${PRACTICES[mode].name} practice guide`;
 document.querySelector('.panelTitle > span')!.textContent=`Practice guide · ${PRACTICES[mode].letter} (${PRACTICES[mode].name})`;
 document.querySelector('.side h2')!.textContent=`${PRACTICES[mode].name} · practice guide`;
 document.querySelector('#phaseLabel')!.textContent='Practice guide · shape following';
 document.querySelector('#counter')!.textContent='Stroke order not graded';
 document.querySelector('.legend > span')!.textContent='Follow every guide part, including detached components and dots.';
 document.querySelector('.hero p')!.textContent='Follow the practice guide. This checks shape following, not stroke order, pressure or calligraphic mastery.';
 const side=document.querySelector('.side')!;
 for(const p of side.querySelectorAll('p'))p.remove();
 const explanation=document.createElement('p');explanation.textContent='Completion checks the reviewed guide parts and extra ink. It does not assess stroke order, pen pressure or calligraphic mastery.';side.querySelector('h2')!.after(explanation);
 const partsList=document.createElement('ul');partsList.id='guideParts';partsList.setAttribute('aria-label','Guide parts, checked after each finished stroke');
 partsList.style.cssText='list-style:none;margin:0;padding:0;display:grid;gap:8px';
 const partItems=new Map<string,HTMLLIElement>();
 for(const part of rules.parts){const item=document.createElement('li');item.className='step';item.dataset.part=part.id;item.dataset.state='remaining';item.textContent=`${guidePartLabel(part.id)} · To trace`;partsList.append(item);partItems.set(part.id,item)}
 explanation.after(partsList);
 const status=document.createElement('p');status.id='guideCompletion';status.setAttribute('role','status');status.setAttribute('aria-live','polite');
 const inspect=document.createElement('a');inspect.id='inspectCompleted';inspect.className='pill';inspect.textContent='Inspect in 3D →';inspect.href=inspectionHref(location.search)??experienceHref('/',location.search);inspect.hidden=true;
 feedback.after(status,inspect);
 status.textContent=guideFeedback(evaluate([]),rules.parts,{mode,active:false,canceled:false,hasInk:false,hasStrokeLength:false});
 return (strokes:readonly Stroke[],active=false,canceled=false)=>{
  const result:Result=canceled?{state:'incomplete',missing:[],reason:'Stroke canceled · Retry or undo this stroke.'}:evaluate(strokes,active),complete=result.state==='complete';
  board.dataset.guideComplete=String(complete);
  if(feedback.textContent!=='Guide following only · Stroke order and pressure are not graded.')feedback.textContent='Guide following only · Stroke order and pressure are not graded.';
  inspect.hidden=!complete||inspectionHref(location.search)===null;
  status.textContent=guideFeedback(result,rules.parts,{mode,active,canceled,hasInk:strokes.some(s=>s.points.length>0),hasStrokeLength:strokes.some(s=>s.points.some((p,i)=>i>0&&(p.x!==s.points[i-1].x||p.y!==s.points[i-1].y)))});
  // The engine can stop before checking individual parts when ink crosses a
  // protected region. Show that uncertainty rather than claiming parts passed.
  if(!active){
   const known=!canceled&&(complete||result.reason==='Required guide parts remain'||result.reason==='Too much ink outside the guide');
   for(const part of rules.parts){const state=known?(result.missing.includes(part.id)?'remaining':'traced'):'unchecked';const item=partItems.get(part.id)!,group=overlays.get(part.id)!;item.dataset.state=state;item.textContent=`${guidePartLabel(part.id)} · ${state==='remaining'?'To trace':state==='traced'?'Traced':'Check ink first'}`;group.dataset.state=state;group.setAttribute('opacity',state==='traced'?'.3':'1')}
  }
 };
}
