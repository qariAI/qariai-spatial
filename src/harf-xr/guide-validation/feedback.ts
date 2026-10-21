import type {PracticeId} from '../../integration/practice';
import type {Result,Rules} from './engine';

export function guidePartLabel(id:string){
 return ({body:'Main stroke','detached component':'Detached inner stroke','upper dot':'Upper dot','left dot':'Left lower dot','right dot':'Right lower dot'} as Record<string,string>)[id]??id;
}
// Presentation only: this does not change any validation result or threshold.
export function guideFeedback(result:Result,parts:Rules['parts'],context:{mode:PracticeId;active:boolean;canceled:boolean;hasInk:boolean;hasStrokeLength:boolean}){
 if(context.canceled)return 'The partial stroke was canceled and does not count toward the guide. Undo it or trace that part again.';
 if(context.active)return 'Finish the current stroke to check it.';
 if(result.state==='complete')return 'Practice guide completed';
 if(result.state==='unavailable')return 'Guide checking is unavailable. You can keep drawing freely.';
 if(!context.hasInk)return parts.some(p=>p.kind==='dot')?'Trace the dashed paths and add the marked dots, in any order.':'Trace the dashed paths, including both end markers.';
 if(result.reason==='Ink crosses a protected region'){
  if(context.mode==='fa')return 'A stroke crosses the counter or the gap below the dot. Undo that stroke and keep those spaces clear.';
  if(context.mode==='ya')return 'A stroke crosses the body-to-dot gap or joins the dots. Undo that stroke and place each dot separately.';
  return 'A stroke joins areas that must stay separate. Undo it and trace the main and detached strokes separately.';
 }
 if(result.reason==='Too much ink outside the guide'||result.reason==='Ink outside the guide'){
  if(!context.hasStrokeLength)return 'Follow the dashed paths with a stroke. Dots may be placed with a separate tap.';
  return 'Ink outside the guide is preventing completion. Undo the extra stroke or choose Try again.';
 }
 if(result.reason==='Ink exceeds scoring budget')return 'This sheet has reached its drawing limit. Choose Try again to start a fresh sheet.';
 if(result.reason==='Invalid ink coordinates')return 'This stroke could not be checked. Undo it and try again.';
 const remaining=parts.filter(p=>result.missing.includes(p.id));
 if(remaining.length&&remaining.every(p=>p.kind==='dot')){
  if(remaining.length===2)return 'Add both lower dots separately, using a tap or short stroke for each.';
  return `Add the ${guidePartLabel(remaining[0].id).toLowerCase()} with a separate tap or short stroke.`;
 }
 if(remaining.length===1&&remaining[0].id==='detached component')return 'Trace the detached inner stroke, keeping it separate from the main stroke. Reach both end markers.';
 if(remaining.length===1&&remaining[0].id==='body')return 'Continue along the main dashed path and reach both end markers.';
 return remaining.length?`Still to trace: ${remaining.map(p=>guidePartLabel(p.id).toLowerCase()).join(', ')}.`:'Continue following the practice guide.';
}
