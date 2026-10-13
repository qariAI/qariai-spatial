import {useEffect} from 'react';
import {useThree} from '@react-three/fiber';
import {endBeforeNavigation} from './navigation';
// Bind the ordinary DOM link inside Canvas, where the active XR session is owned.
export function OrbitPracticeLink(){const {gl}=useThree();useEffect(()=>{
 const link=document.getElementById('practice-calligraphy') as HTMLAnchorElement|null;if(!link)return;
 let busy=false;
 const click=async(event:MouseEvent)=>{event.preventDefault();if(busy)return;if(document.getElementById('enter-xr')?.dataset.xrStarting==='true'){link.title='Wait for VR entry to finish before opening Harf Studio.';return;}busy=true;link.setAttribute('aria-disabled','true');try{await endBeforeNavigation(gl.xr.getSession(),()=>location.assign('/harf-studio-xr.html'));}catch(error){console.error('Practice navigation cancelled',error);link.title='Exit VR with the Quest system menu, then try again.';}finally{busy=false;link.removeAttribute('aria-disabled');}};
 link.addEventListener('click',click);return()=>link.removeEventListener('click',click);
},[gl]);return null;}
