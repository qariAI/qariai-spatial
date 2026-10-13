export interface NavigableSession {
 end():Promise<void>;
 addEventListener(type:'end',listener:()=>void):void;
 removeEventListener(type:'end',listener:()=>void):void;
}
// An end() promise alone is insufficient: wait for the explicit end event too.
export async function endBeforeNavigation(session:NavigableSession|null,navigate:()=>void,timeoutMs=5000){
 if(!session){navigate();return;}
 let listener:()=>void=()=>{},timer:ReturnType<typeof setTimeout>|undefined;
 const ended=new Promise<void>((resolve,reject)=>{listener=resolve;session.addEventListener('end',listener);timer=setTimeout(()=>reject(Error('VR session has not ended; navigation cancelled.')),timeoutMs);});
 // Observe timeout rejection immediately even if the browser stalls end().
 const finish=Promise.all([Promise.resolve().then(()=>session.end()),ended]);
 try{await finish;navigate();}
 finally{if(timer)clearTimeout(timer);session.removeEventListener('end',listener);}
}
