import {orbitArtEnabled} from '../orbit-art/mode';
import {PRACTICES,practiceForLetter,type PracticeId} from './practice';
export {practiceForLetter} from './practice';
const PATHS = ['/', '/harf-studio.html', '/harf-studio-xr.html'] as const;
type ExperiencePath = typeof PATHS[number];

export function requestedPractice(search:string):PracticeId|null{const values=new URLSearchParams(search).getAll('practice');return values.length===1&&Object.prototype.hasOwnProperty.call(PRACTICES,values[0])?values[0] as PracticeId:null;}
export function initialPracticeSelection(search:string):number|null{const mode=requestedPractice(search);return mode?PRACTICES[mode].index:null;}

// An inspection intent only, never a correctness credential. Keep the existing
// inspector accessible; no source/rule approval can be supplied through a URL.
export function initialInspectionSelection(search:string,hash:string):number|null{
 return orbitArtEnabled(search)&&hash==='#inspect-practice'?initialPracticeSelection(search):null;
}
export function inspectionHref(search:string):string|null{
 return orbitArtEnabled(search)&&requestedPractice(search)?experienceHref('/',search)+'#inspect-practice':null;
}

// Carry only the explicitly selected, supported treatment. No return URL,
// storage, arbitrary query forwarding or external navigation is accepted.
export function experienceHref(path: ExperiencePath, search: string): string {
  if (!(PATHS as readonly string[]).includes(path)) throw Error('Unknown experience path');
  const values = new URLSearchParams(search).getAll('calligraphyRelief');
  const query=new URLSearchParams();
  if(values.length===1&&values[0]==='texture')query.set('calligraphyRelief','texture');
  if(orbitArtEnabled(search))query.set('orbitArt','study');
  if(path!=='/harf-studio-xr.html'&&requestedPractice(search))query.set('practice',requestedPractice(search)!);
  return path+(query.size?'?'+query.toString():'');
}

export function preserveExperienceLinks(root: ParentNode, search: string) {
  for (const link of root.querySelectorAll<HTMLAnchorElement>('a[href]')) {
    const href = link.getAttribute('href');
    if ((PATHS as readonly (string | null)[]).includes(href)) {
      link.setAttribute('href', experienceHref(href as ExperiencePath, search));
    }
  }
}

// Only the four source-backed Orbit letters can select ungraded desktop practice.
// No selection preserves the established Bāʾ destination; paths stay internal.
export function orbitPracticeHref(search:string,letter:string|null|undefined){
 const practice=practiceForLetter(letter);
 if(orbitArtEnabled(search)&&practice){
  const query=new URLSearchParams(search);query.delete('practice');query.set('practice',practice.id);
  return experienceHref('/harf-studio.html','?'+query.toString());
 }
 return experienceHref('/harf-studio-xr.html',search);
}
