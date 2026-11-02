// A single allowlisted value; no storage, implicit activation or arbitrary forwarding.
export function orbitArtEnabled(search:string){const v=new URLSearchParams(search).getAll('orbitArt');return v.length===1&&v[0]==='study'}
