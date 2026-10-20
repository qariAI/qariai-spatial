import {orbitArtEnabled} from '../orbit-art/mode';
const PATHS = ['/', '/harf-studio.html', '/harf-studio-xr.html'] as const;
type ExperiencePath = typeof PATHS[number];

// Carry only the explicitly selected, supported treatment. No return URL,
// storage, arbitrary query forwarding or external navigation is accepted.
export function experienceHref(path: ExperiencePath, search: string): string {
  if (!(PATHS as readonly string[]).includes(path)) throw Error('Unknown experience path');
  const values = new URLSearchParams(search).getAll('calligraphyRelief');
  const query=new URLSearchParams();
  if(values.length===1&&values[0]==='texture')query.set('calligraphyRelief','texture');
  if(orbitArtEnabled(search))query.set('orbitArt','study');
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
