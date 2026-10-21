import {orbitArtEnabled} from '../../orbit-art/mode';
import {PRACTICES,type PracticeId} from '../../integration/practice';
import {experienceHref,inspectionHref} from '../../integration/routes';
import {compileGuide,rulesReady,type Stroke} from './engine';
import {REVIEWED_GUIDES} from './reviews';

// With missing review data this leaves the original ungraded page untouched.
export function installGuideCompletion(mode:PracticeId,sourceHash:string,board:SVGSVGElement,feedback:Element){
 const rules=REVIEWED_GUIDES[mode];
 if(!orbitArtEnabled(location.search)||!rulesReady(rules,sourceHash))return (_strokes:readonly Stroke[],_active=false,_canceled=false)=>{};
 const evaluate=compileGuide(rules,sourceHash);
 if(evaluate([]).state==='unavailable')return (_strokes:readonly Stroke[],_active=false,_canceled=false)=>{};
 board.dataset.graded='guide-following';board.dataset.guideComplete='false';
 const ns='http://www.w3.org/2000/svg',overlay=document.createElementNS(ns,'g');overlay.id='practiceGuide';overlay.setAttribute('aria-hidden','true');
 // Practice overlay only: original source path and 3D artwork stay unchanged.
 for(const part of rules.parts){
  if(part.kind==='path'){const line=document.createElementNS(ns,'polyline');line.setAttribute('points',part.points.map(p=>`${p.x},${p.y}`).join(' '));line.setAttribute('fill','none');line.setAttribute('stroke','#e8d49d');line.setAttribute('stroke-width','3');line.setAttribute('stroke-dasharray','7 9');line.setAttribute('stroke-linecap','round');overlay.append(line);
   for(const end of part.endpoints){const marker=document.createElementNS(ns,'circle');marker.setAttribute('cx',String(end.center.x));marker.setAttribute('cy',String(end.center.y));marker.setAttribute('r',String(end.radius*.4));marker.setAttribute('fill','#82dfc2');overlay.append(marker)}
  }else{const marker=document.createElementNS(ns,'circle');marker.setAttribute('cx',String(part.region.center.x));marker.setAttribute('cy',String(part.region.center.y));marker.setAttribute('r',String(part.region.radius));marker.setAttribute('fill','#d6a5ff33');marker.setAttribute('stroke','#d6a5ff');marker.setAttribute('stroke-width','2');overlay.append(marker)}
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
 const status=document.createElement('p');status.id='guideCompletion';status.setAttribute('role','status');status.setAttribute('aria-live','polite');
 const inspect=document.createElement('a');inspect.id='inspectCompleted';inspect.className='pill';inspect.textContent='Inspect in 3D →';inspect.href=inspectionHref(location.search)??experienceHref('/',location.search);inspect.hidden=true;
 feedback.after(status,inspect);
 status.textContent='Follow every part of the practice guide.';
 return (strokes:readonly Stroke[],active=false,canceled=false)=>{
  const result=canceled?{state:'incomplete',missing:[],reason:'Stroke canceled · Retry or undo this stroke.'}:evaluate(strokes,active),complete=result.state==='complete';
  board.dataset.guideComplete=String(complete);
  feedback.textContent='Guide following only · Stroke order and pressure are not graded.';
  inspect.hidden=!complete||inspectionHref(location.search)===null;
  status.textContent=complete?'Practice guide completed':result.state==='unavailable'?'Guide validation unavailable · Continue free practice':active?'Finish the current stroke':result.missing.length?`Continue: ${result.missing.join(', ')}`:result.reason??'Follow the practice guide';
 };
}
