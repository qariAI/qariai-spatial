import {endBeforeNavigation, type NavigableSession} from '../integration/navigation';
import {experienceHref} from '../integration/routes';
export type MenuAction='open'|'pause'|'inspect'|'nearer'|'farther'|'return'|'harf'|'close';
export class SpatialMenuState {
  open=false;
  inspecting=false;
  busy=false;
  advance=0;
  limit=.6;
  hover:MenuAction|null=null;
  message='';
  revision=0;
  resetInput:()=>void=()=>{};
  private priorPause=false;
  private actionAfter=-Infinity;
  constructor(public getPaused:()=>boolean, public setPaused:(value:boolean)=>void){}
  get blocksScene(){return this.open||this.busy}
  touch(){this.revision++}
  private transition(){this.hover=null;this.touch();this.resetInput()}
  interrupt(){
    if(this.inspecting){this.setPaused(this.priorPause);this.inspecting=false}
    this.advance=0;this.open=false;this.message='';this.transition();
  }
  dispatch(action:MenuAction,now:number){
    if(this.busy||now<this.actionAfter||(!this.open&&action!=='open'))return false;
    if(this.inspecting&&!['nearer','farther','return','close'].includes(action))return false;
    if(!this.inspecting&&['nearer','farther','return'].includes(action))return false;
    if(action==='harf')return false; // Async navigation has its own guarded API.
    this.actionAfter=now+.35; // Shared barrier also prevents same-frame two-hand activation.
    if(action==='open'){this.open=true;this.message=''}
    else if(action==='pause')this.setPaused(!this.getPaused());
    else if(action==='inspect'){this.priorPause=this.getPaused();this.setPaused(true);this.inspecting=true;this.advance=0}
    else if(action==='nearer')this.advance=Math.min(this.limit,this.advance+.15);
    else if(action==='farther')this.advance=Math.max(0,this.advance-.15);
    else if(action==='return'){this.setPaused(this.priorPause);this.inspecting=false;this.advance=0}
    else if(action==='close')this.interrupt();
    this.transition();return true;
  }
  async navigate(session:NavigableSession|null,search:string,assign:(path:string)=>void,now:number,timeout=5000){
    if(!this.open||this.inspecting||this.busy||now<this.actionAfter)return false;
    this.busy=true;this.actionAfter=now+.35;this.message='Leaving VR safely…';this.transition();
    try{await endBeforeNavigation(session,()=>assign(experienceHref('/harf-studio-xr.html',search)),timeout);return true}
    catch{this.open=true;this.message='Could not leave VR. Open your hand and retry.';return false}
    finally{this.busy=false;this.transition()}
  }
}
