import type {Tracing} from './tracing';
// Presentation follows learning state; the raw coverage remains available.
export function progressDisplay(trace:Pick<Tracing,'phase'|'progress'>){
 return {label:trace.phase==='complete'?'Letter complete ✓':trace.phase==='dot'?'Body complete · Add the dot':`${Math.round(trace.progress*100)}% traced`,percent:trace.phase==='body'?Math.round(trace.progress*100):100};
}
