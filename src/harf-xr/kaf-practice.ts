import outline from '../orbit-art/generated/kaf-outline.json';
import {experienceHref,preserveExperienceLinks} from '../integration/routes';
import {installSapphireGuide} from './desktop-finish';

// The exact reviewed Amiri contour, including the detached component. No
// centreline, score, stroke order or completion rule is inferred from its shape.
if(outline.letter!=='ك'||outline.contourCount!==2||outline.pathSha256!=='2c381807e055fc8a08b6e03f4e4c605e4279af6cbc26334e272763b862b8d8c4')throw Error('Kāf source mismatch');
preserveExperienceLinks(document,location.search);
const ns='http://www.w3.org/2000/svg';
const board=document.querySelector<SVGSVGElement>('#board')!;
const ink=document.createElementNS(ns,'g'),shape=document.createElementNS(ns,'path'),form=document.createElementNS(ns,'g');
const defs=document.createElementNS(ns,'defs');
shape.id='kafGuide';shape.setAttribute('d',outline.path);shape.setAttribute('stroke','none');
const [xmin,ymin,xmax,ymax]=outline.bounds,scale=Math.min(660/(xmax-xmin),370/(ymax-ymin));
form.setAttribute('transform',`translate(${450-(xmin+xmax)*scale/2} ${265+(ymin+ymax)*scale/2}) scale(${scale} ${-scale})`);
form.append(shape);ink.id='freeInk';
board.replaceChildren(defs,form,ink);
// The shared ramp is presentation only; its coordinates are expressed in the
// source glyph's local frame, leaving every path byte intact.
installSapphireGuide(board,shape);
const gradient=defs.querySelector('linearGradient')!;
gradient.setAttribute('y1',String(ymax));gradient.setAttribute('y2',String(ymin));
shape.setAttribute('stroke','none');
board.dataset.letter='ك';board.dataset.practice='kaf';board.dataset.graded='false';
board.setAttribute('aria-label','Free practice of kāf, including its detached component. Not graded.');
board.style.userSelect='none';
document.title='Harf Studio — Kāf free practice';
document.querySelector('.hero h1')!.textContent='Continue with kāf.';
document.querySelector('.hero p')!.textContent='The same Amiri form you selected in Living Orbit. Free practice only; stroke order and guidance await qualified calligrapher review.';
document.querySelector('.panelTitle > span')!.textContent='Free practice · ك (Kāf)';
document.querySelector('#phaseLabel')!.textContent='Free practice · ungraded';
document.querySelector('.legend > span')!.textContent='Explore the body and detached component. No stroke order is prescribed.';
document.querySelector('#counter')!.textContent='No score';
document.querySelector<HTMLElement>('.progress')!.hidden=true;
document.querySelector<HTMLButtonElement>('#demo')!.hidden=true;
const feedback=document.querySelector('#feedback')!;
feedback.textContent='Draw freely over the source form. This practice does not grade accuracy, order or completion.';
const side=document.querySelector('.side')!;
side.replaceChildren();
for(const [tag,text] of [['div','ك'],['h2','Kāf · free practice'],['p','Original Amiri Bold contours, including the detached inner component. The silhouette is shared with Living Orbit.'],['p','No accuracy score, prescribed stroke direction or completion badge. Qualified calligrapher review is required before graded guidance.']] as const){const e=document.createElement(tag);e.textContent=text;if(tag==='div'){e.className='letter';e.lang='ar';e.dir='rtl'}side.append(e)}
const baLink=document.createElement('a'),query=new URLSearchParams(location.search);query.delete('practice');
baLink.href=experienceHref('/harf-studio.html','?'+query.toString());baLink.textContent='Open Bāʾ guided practice →';baLink.style.color='#91d9c7';side.append(baLink);

let pointer:number|null=null,path:SVGPathElement|null=null,points:string[]=[],visible=true,total=0;
function point(event:PointerEvent){const matrix=board.getScreenCTM();if(!matrix)return null;const p=board.createSVGPoint();p.x=event.clientX;p.y=event.clientY;const q=p.matrixTransform(matrix.inverse());return Number.isFinite(q.x)&&Number.isFinite(q.y)?q:null;}
function release(){const prior=pointer;pointer=null;path=null;points=[];if(prior!==null&&board.hasPointerCapture(prior))board.releasePointerCapture(prior);}
board.addEventListener('pointerdown',event=>{
 if(pointer!==null||!event.isPrimary||event.button!==0)return;
 event.preventDefault();if(total>=12000){feedback.textContent='Choose Try again to start a fresh practice sheet.';return}
 const p=point(event);if(!p)return;
 pointer=event.pointerId;board.setPointerCapture(pointer);path=document.createElementNS(ns,'path');path.setAttribute('fill','none');path.setAttribute('stroke','#ffd183');path.setAttribute('stroke-width','8');path.setAttribute('stroke-linecap','round');path.setAttribute('stroke-linejoin','round');points=[`M${p.x} ${p.y}`,`L${p.x+.001} ${p.y}`];path.setAttribute('d',points.join(' '));ink.append(path);total++;
});
board.addEventListener('pointermove',event=>{if(event.pointerId!==pointer||!path||total>=12000)return;event.preventDefault();const p=point(event);if(!p)return;points.push(`L${p.x} ${p.y}`);path.setAttribute('d',points.join(' '));total++;});
board.addEventListener('pointerup',release);board.addEventListener('pointercancel',release);board.addEventListener('lostpointercapture',release);
document.querySelector<HTMLButtonElement>('#reset')!.onclick=()=>{release();ink.replaceChildren();total=0;feedback.textContent='Fresh sheet · Free practice, not graded.';};
document.querySelector<HTMLButtonElement>('#guideToggle')!.onclick=event=>{visible=!visible;form.setAttribute('visibility',visible?'visible':'hidden');const button=event.currentTarget as HTMLButtonElement;button.textContent=visible?'Hide guide':'Show guide';button.setAttribute('aria-pressed',String(visible));};
window.addEventListener('pagehide',release,{once:true});
