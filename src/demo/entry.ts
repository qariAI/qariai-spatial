import {prepareDemo} from './mode';
async function boot(){
 const mode=prepareDemo();if(mode.redirect)return;
 const kind=document.body.dataset.appEntry;
 if(mode.enabled&&mode.emulate&&kind!=='harf-svg'){
  try{await (await import('./emulator')).installEmulator();}
  catch(error){console.error('Demo emulator unavailable; desktop fallback',error);}
 }
 if(kind==='orbit')await import('../main');
 else if(kind==='harf-xr')await import('../harf-xr/main');
 else if(kind==='harf-svg')await import('../harf-xr/desktop');
 if(mode.enabled)await (await import('./client')).connectCapture(mode);
}
void boot();
