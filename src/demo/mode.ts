export interface DemoMode { enabled:boolean; emulate:boolean; redirect:boolean }
export function allowedDemoHost(host:string,dev=false){return dev||host==='localhost'||host==='127.0.0.1'||(host.includes('-git-')&&host.endsWith('.vercel.app'));}
export function prepareDemo():DemoMode {
 const params=new URLSearchParams(location.search),key='qari-competition-demo';
 if(!allowedDemoHost(location.hostname,import.meta.env.DEV)||params.get('competitionDemo')==='0'){sessionStorage.removeItem(key);return {enabled:false,emulate:false,redirect:false};}
 if(params.get('competitionDemo')==='1'){
  const emulate=params.get('xrEmulator')==='1';sessionStorage.setItem(key,JSON.stringify({emulate}));return {enabled:true,emulate,redirect:false};
 }
 const stored=sessionStorage.getItem(key);
 if(stored){try{const {emulate}=JSON.parse(stored);const next=new URL(location.href);next.searchParams.set('competitionDemo','1');if(emulate)next.searchParams.set('xrEmulator','1');location.replace(next);return {enabled:false,emulate:false,redirect:true};}catch{sessionStorage.removeItem(key);}}
 return {enabled:false,emulate:false,redirect:false};
}
