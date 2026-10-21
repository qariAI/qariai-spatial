import {orbitArtEnabled} from '../orbit-art/mode';
const PATHS = ['/', '/harf-studio.html', '/harf-studio-xr.html'] as const;
type ExperiencePath = typeof PATHS[number];

export function requestedPractice(search:string):'kaf'|null{const values=new URLSearchParams(search).getAll('practice');return values.length===1&&values[0]==='kaf'?'kaf':null;}

// Carry only the explicitly selected, supported treatment. No return URL,
// storage, arbitrary query forwarding or external navigation is accepted.
export function experienceHref(path: ExperiencePath, search: string): string {
  if (!(PATHS as readonly string[]).includes(path)) throw Error('Unknown experience path');
  const values = new URLSearchParams(search).getAll('calligraphyRelief');
  const query=new URLSearchParams();
  if(values.length===1&&values[0]==='texture')query.set('calligraphyRelief','texture');
  if(orbitArtEnabled(search))query.set('orbitArt','study');
  if(path!=='/harf-studio-xr.html'&&requestedPractice(search))query.set('practice','kaf');
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

// Selected kāf goes to explicitly ungraded desktop practice. Other letters keep
// the established Bāʾ destination; no external path or arbitrary letter is accepted.
export function orbitPracticeHref(search:string,letter:string|null|undefined){
 if(orbitArtEnabled(search)&&letter==='ك'){
  const query=new URLSearchParams(search);query.delete('practice');query.set('practice','kaf');
  return experienceHref('/harf-studio.html','?'+query.toString());
 }
 return experienceHref('/harf-studio-xr.html',search);
}
