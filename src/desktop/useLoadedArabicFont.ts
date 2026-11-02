import {useCallback,useEffect,useRef,useState} from 'react';

export type LoadingState='loading'|'ready'|'failed';
const FONT='700 100px Amiri';
const SAMPLE='ك ل ف ي';

// The initial path uses the original CSS face. A rejected FontFace keeps its
// rejected promise, so Retry fetches the SAME asset into a fresh face instead.
export function useLoadedArabicFont(){
 const [state,setState]=useState<LoadingState>('loading');
 const [attempt,setAttempt]=useState(0);
 const busy=useRef(true);
 const retry=useCallback(()=>{if(busy.current)return;busy.current=true;setState('loading');setAttempt(n=>n+1)},[]);
 useEffect(()=>{
  let active=true;const abort=new AbortController();
  const timer=setTimeout(()=>{if(active){active=false;abort.abort();busy.current=false;setState('failed')}},30000);
  const load=async()=>{
   if(attempt===0){
    const faces=await document.fonts.load(FONT,SAMPLE);
    if(!faces.length||!faces.every(face=>face.status==='loaded'&&face.family.replace(/["']/g,'')==='Amiri'))throw Error('Authoritative Amiri face unavailable');
   }else{
    const response=await fetch('/fonts/Amiri-Bold.ttf',{cache:'reload',signal:abort.signal});
    if(!response.ok)throw Error('Amiri request failed');
    const face=await new FontFace('Amiri',await response.arrayBuffer(),{weight:'700',style:'normal'}).load();
    if(!active)return;
    document.fonts.add(face);
   }
   if(active){clearTimeout(timer);busy.current=false;setState('ready')}
  };
  load().catch(()=>{if(active){clearTimeout(timer);busy.current=false;setState('failed')}});
  return()=>{active=false;clearTimeout(timer);abort.abort()};
 },[attempt]);
 return{state,retry};
}
