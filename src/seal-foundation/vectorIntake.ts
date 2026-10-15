import {LOCKED_SOURCE} from './config';
import {inspectVectorGeometry,type Bounds} from './vectorIntakeGeometry';

export type Approval={reviewer:string;role:'calligrapher'|'quran-text';date:string;assetSha256:string;manifestSha256:string;record:string};
export type VectorPath={id:string;d:string;fillRule:'nonzero'|'evenodd';role:'body'|'diacritic'|'pause'|'compound';wordIds:number[];sourceCodepoints:number[];componentIds:string[];rigidGroupId:string;level:0|1|2|3|4|5|6};
export type VectorComponent={id:string;pathId:string;contours:number[];kind:'base'|'diacritic'|'pause';sourceCodepoints:number[];glyphIds:string[];rigidGroupId:string;owners:{baseComponentId:string;glyphId:string;baseCodepoint:number}[]};
export type ApprovedVectorAsset={
  schemaVersion:2;kind:'approved-original-calligraphy';assetSha256:string;manifestSha256:string;canonicalText:string;sourceSha256:string;sourceUrl:string;
  viewBox:Bounds;coordinates:'svg-y-down';paths:VectorPath[];components:VectorComponent[];
  glyphs:{id:string;wordId:number;sourceCodepoints:number[];componentIds:string[];rigidGroupId:string;bounds:Bounds}[];
  rigidGroups:{id:string;level:number}[];
  words:{id:number;text:string;course:number;sourceSpan:[number,number];pathIds:string[]}[];
  paintOrder:string[];overlaps:{frontPathId:string;backPathId:string;record:string}[];
  sharedContours:{pathId:string;contour:number;componentIds:string[];record:string}[];
  approvals:Approval[];
  rights:{holder:string;grantRecord:string;webXR:boolean;technical3DAdaptation:boolean;publicSourceDistribution:boolean;film:boolean};
};
export class IntakeError extends Error {}
function check(yes:unknown,message:string):asserts yes {if(!yes)throw new IntakeError(message);}
const text=(v:unknown):v is string=>typeof v==='string'&&v.trim().length>0;
const list=(v:unknown):v is unknown[]=>Array.isArray(v)&&v.length<=20000;
const unique=(a:unknown[])=>new Set(a).size===a.length;
const same=(a:unknown[],b:unknown[])=>a.length===b.length&&a.every(x=>b.includes(x));
const bounds=(b:unknown):b is Bounds=>Array.isArray(b)&&b.length===4&&b.every(Number.isFinite)&&b[2]>0&&b[3]>0;
const mark=(c:string)=>/\p{M}/u.test(c),pause=(c:string)=>c==='\u06d6';
export const intakeDigest=async(bytes:Uint8Array)=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new Uint8Array(bytes)))).map(b=>b.toString(16).padStart(2,'0')).join('');
// Sorted object keys; array order is authoritative. No Unicode/text/path normalization.
function canonicalJSON(value:unknown):string {
  if(value===null||typeof value!=='object'){check(value===null||['string','boolean','number'].includes(typeof value),'Review manifest must be JSON data');check(typeof value!=='number'||Number.isFinite(value),'Nonfinite review manifest number');return JSON.stringify(value);}
  if(Array.isArray(value))return '['+value.map(canonicalJSON).join(',')+']';
  return '{'+Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+canonicalJSON((value as Record<string,unknown>)[k])).join(',')+'}';
}
/** Both reviewers must approve this exact manifest as well as the original SVG bytes.
 * Excludes only the digest itself and approval records, avoiding a circular hash. */
export async function vectorManifestDigest(asset:unknown):Promise<string>{
  check(asset!==null&&typeof asset==='object','Missing review manifest');
  const {manifestSha256:_hash,approvals:_approvals,...reviewed}=asset as Record<string,unknown>;
  return intakeDigest(new TextEncoder().encode(canonicalJSON(reviewed)));
}

/** Future intake gate only; never rewrites curves or connects artwork to the sculpture.
 * Metadata assertions/record links are NOT authentication of a reviewer or of Arabic shapes. */
export async function validateVectorIntake(value:unknown,originalSvgBytes:Uint8Array):Promise<Readonly<ApprovedVectorAsset>> {
  check(value!==null&&typeof value==='object','Missing approved vector bundle');
  const a=value as ApprovedVectorAsset;
  check(a.schemaVersion===2&&a.kind==='approved-original-calligraphy','Original calligraphy schema v2 required; legacy/font proofs need new reviewed mappings');
  check(originalSvgBytes instanceof Uint8Array&&originalSvgBytes.byteLength>0&&originalSvgBytes.byteLength<=5_000_000,'Invalid/excessive original SVG bytes');
  check(typeof a.canonicalText==='string'&&a.sourceSha256===LOCKED_SOURCE.sha256,'Wrong locked verse representation');
  check(await intakeDigest(new TextEncoder().encode(a.canonicalText))===LOCKED_SOURCE.sha256,'Verse text/codepoints changed');
  check(text(a.sourceUrl)&&/^https:\/\//.test(a.sourceUrl),'Missing source citation');
  check(await intakeDigest(originalSvgBytes)===a.assetSha256,'Original SVG digest mismatch');
  check(await vectorManifestDigest(a)===a.manifestSha256,'Reviewed mapping/geometry manifest digest mismatch');
  check(bounds(a.viewBox)&&a.coordinates==='svg-y-down','Invalid coordinate system/viewBox');
  for(const key of ['paths','components','glyphs','rigidGroups','words','paintOrder','overlaps','sharedContours','approvals'] as const)check(list(a[key]),`Invalid ${key} array`);
  check(a.paths.length>0&&a.paths.length<=1000&&a.components.length>0&&a.glyphs.length>0,'Missing/excessive paths, components or glyphs');
  const chars=Array.from(a.canonicalText),words=a.canonicalText.split(' '),spans:number[][]=[];let offset=0;
  for(const word of words){const s=Array.from(word,(_,i)=>offset+i);spans.push(s);offset+=s.length+1;}
  check(words.length===18&&a.words.length===18,'Exactly 18 source words required');
  check(same(chars.flatMap((c,i)=>pause(c)?[i]:[]),[41,92])&&chars[41]==='\u06d6'&&chars[92]==='\u06d6','Locked pause positions changed');
  const index=<T extends {id:string}>(items:T[],label:string)=>{check(items.every(v=>v&&text(v.id))&&unique(items.map(v=>v.id)),`Duplicate/missing ${label} ID`);return new Map(items.map(v=>[v.id,v]));};
  const paths=index(a.paths,'path'),components=index(a.components,'component'),glyphs=index(a.glyphs,'glyph'),groups=index(a.rigidGroups,'rigid group');
  for(const g of a.rigidGroups)check(Number.isInteger(g.level)&&g.level>=0&&g.level<7,'Invalid rigid depth');
  const refs=(v:unknown,known:Map<string,unknown>,label:string)=>{check(list(v)&&v.length>0&&unique(v)&&v.every(id=>typeof id==='string'&&known.has(id)),`Malformed ${label} mapping`);};
  const cps=(v:unknown)=>{check(list(v)&&v.length>0&&unique(v)&&v.every(i=>Number.isInteger(i)&&Number(i)>=0&&Number(i)<chars.length&&chars[Number(i)]!==' '),'Invalid codepoint mapping');};
  for(const p of a.paths){
    check(['body','diacritic','pause','compound'].includes(p.role)&&['nonzero','evenodd'].includes(p.fillRule),'Invalid path role/fill rule');
    check(groups.has(p.rigidGroupId)&&p.level===groups.get(p.rigidGroupId)!.level,'Path rigid depth mismatch');
    refs(p.componentIds,components,'path/component');cps(p.sourceCodepoints);
    check(list(p.wordIds)&&p.wordIds.length>0&&unique(p.wordIds)&&p.wordIds.every(w=>Number.isInteger(w)&&w>=1&&w<=18),'Invalid path/word mapping');
    check(same(p.sourceCodepoints.flatMap(i=>spans.flatMap((s,w)=>s.includes(i)?[w+1]:[])).filter((w,i,all)=>all.indexOf(w)===i),p.wordIds),'Path words differ from character spans');
  }
  const covered=new Set<number>();
  for(const c of a.components){
    check(paths.has(c.pathId)&&paths.get(c.pathId)!.componentIds.includes(c.id),'Asymmetric component/path mapping');
    check(c.rigidGroupId===paths.get(c.pathId)!.rigidGroupId,'Component rigid group mismatch');
    cps(c.sourceCodepoints);refs(c.glyphIds,glyphs,'component/glyph');
    check(list(c.contours)&&c.contours.length>0&&unique(c.contours)&&c.contours.every(n=>Number.isInteger(n)&&n>=0),'Invalid component contour mapping');
    check(['base','diacritic','pause'].includes(c.kind)&&list(c.owners),'Invalid component kind/owners');
    if(c.kind==='base')check(c.sourceCodepoints.every(i=>!mark(chars[i]))&&c.owners.length===0,'Combining marks cannot be classified as base/body components');
    else check(c.sourceCodepoints.every(i=>mark(chars[i])&&(c.kind==='pause'?pause(chars[i]):!pause(chars[i])))&&c.owners.length>0,'Unaccounted/misclassified combining mark or pause');
    c.sourceCodepoints.forEach(i=>covered.add(i));
  }
  check(chars.every((c,i)=>c===' '||covered.has(i)),'Missing source character/diacritic/pause component');
  for(const p of a.paths){
    const cs=p.componentIds.map(id=>components.get(id)!);
    check(cs.every(c=>c.pathId===p.id)&&same([...new Set(cs.flatMap(c=>c.sourceCodepoints))],p.sourceCodepoints),'Path/component character mapping mismatch');
    const kinds=new Set(cs.map(c=>c.kind));
    check(p.role==='compound'?kinds.has('base')&&cs.length>1:p.role==='body'?kinds.size===1&&kinds.has('base'):kinds.size===1&&kinds.has(p.role),'Mark path falsely classified as body or invalid compound');
  }
  for(const g of a.glyphs){
    cps(g.sourceCodepoints);refs(g.componentIds,components,'glyph/component');
    check(Number.isInteger(g.wordId)&&g.wordId>=1&&g.wordId<=18&&g.sourceCodepoints.every(i=>spans[g.wordId-1].includes(i)),'Glyph spans wrong source word');
    check(groups.has(g.rigidGroupId)&&bounds(g.bounds),'Missing glyph rigid group/approved bounds');
    const cs=g.componentIds.map(id=>components.get(id)!);
    check(cs.every(c=>c.glyphIds.includes(g.id)&&c.rigidGroupId===g.rigidGroupId)&&same([...new Set(cs.flatMap(c=>c.sourceCodepoints.filter(i=>g.sourceCodepoints.includes(i))))],g.sourceCodepoints),'Glyph component coverage/group mismatch');
    // A glyph cluster contains every combining sign attached to its declared base(s).
    for(const i of g.sourceCodepoints){if(mark(chars[i])){let base=i-1;while(base>=0&&mark(chars[base]))base--;check(g.sourceCodepoints.includes(base),'Mark outside its glyph source cluster');}else {for(let n=i+1;n<chars.length&&mark(chars[n]);n++)check(g.sourceCodepoints.includes(n),'Glyph omitted attached combining sign');}}
  }
  for(const c of a.components){
    check(c.glyphIds.every(id=>glyphs.get(id)!.componentIds.includes(c.id))&&c.sourceCodepoints.every(i=>c.glyphIds.some(id=>glyphs.get(id)!.sourceCodepoints.includes(i))),'Asymmetric/unmapped component glyph');
    if(c.kind==='base')continue;
    const expected=c.sourceCodepoints.map(i=>{let base=i-1;while(base>=0&&mark(chars[base]))base--;return base;});
    check(c.owners.every(o=>o&&Number.isInteger(o.baseCodepoint)&&components.get(o.baseComponentId)?.kind==='base'&&glyphs.has(o.glyphId)),'Missing mark owner base/glyph');
    for(const o of c.owners){const base=components.get(o.baseComponentId)!,g=glyphs.get(o.glyphId)!;
      check(expected.includes(o.baseCodepoint)&&base.sourceCodepoints.includes(o.baseCodepoint)&&c.glyphIds.includes(o.glyphId)&&base.glyphIds.includes(o.glyphId)&&g.sourceCodepoints.includes(o.baseCodepoint)&&base.rigidGroupId===c.rigidGroupId,'Swapped owner or detached mark rigid group');}
    check(expected.every(i=>c.owners.some(o=>o.baseCodepoint===i)),'Missing combining-mark owner mapping');
  }
  a.words.forEach((w,i)=>{
    check(w&&w.id===i+1&&w.text===words[i]&&w.course===(i<5?1:i<12?2:i<14?3:4),'Wrong word/course reading order');
    check(Array.isArray(w.sourceSpan)&&w.sourceSpan.length===2&&w.sourceSpan[0]===spans[i][0]&&w.sourceSpan[1]===spans[i].at(-1)!+1,'Wrong exact word codepoint span');
    refs(w.pathIds,paths,'word/path');check(same(w.pathIds,a.paths.filter(p=>p.wordIds.includes(w.id)).map(p=>p.id)),'Asymmetric word/path mapping');
  });
  refs(a.paintOrder,paths,'paint order');check(a.paintOrder.length===a.paths.length,'Incomplete paint order');
  const geometry=inspectVectorGeometry(new TextDecoder('utf-8',{fatal:true}).decode(originalSvgBytes),a);
  check(geometry,'Invalid SVG geometry');
  const validDate=(s:unknown)=>typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&Number.isFinite(Date.parse(s))&&new Date(s).toISOString().slice(0,10)===s;
  check(['calligrapher','quran-text'].every(role=>a.approvals.some(r=>r&&r.role===role&&r.assetSha256===a.assetSha256&&r.manifestSha256===a.manifestSha256&&text(r.reviewer)&&text(r.record)&&validDate(r.date))),'Missing matching SVG + manifest expert approval records');
  const r=a.rights;check(r&&text(r.holder)&&text(r.grantRecord)&&r.webXR===true&&r.technical3DAdaptation===true&&r.publicSourceDistribution===true&&r.film===true,'Incomplete artwork usage/adaptation rights');
  return structuredClone(a);
}
