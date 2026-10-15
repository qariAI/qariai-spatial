import {allowedDemoHost} from '../demo/mode';
async function boot(){
 if(!allowedDemoHost(location.hostname,import.meta.env.DEV)||new URLSearchParams(location.search).get('showcase')!=='1'){document.body.textContent='Showcase requires explicit ?showcase=1 on localhost or an isolated branch preview.';return;}
 const emulated=new URLSearchParams(location.search).get('emulate')==='1';
 if(emulated)await (await import('../demo/emulator')).installEmulator();
 if(document.body.dataset.appEntry==='orbit')await import('../main');else await import('../harf-xr/main');
 await (await import('./session')).connect(emulated);
}
void boot().catch(e=>{console.error(e);document.body.textContent='Showcase startup failed: '+String(e);});
