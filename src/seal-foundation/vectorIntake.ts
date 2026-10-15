import {LOCKED_SOURCE} from './config';
export type Approval = {reviewer:string; role:'calligrapher'|'quran-text'; date:string; assetSha256:string; record:string};
export type VectorPath = {id:string; d:string; fillRule:'nonzero'|'evenodd'; role:'body'|'diacritic'|'pause'; wordIds:number[]; sourceCodepoints:number[]; ownerWordId?:number; level:0|1|2|3|4|5|6};
export type ApprovedVectorAsset = {
  kind:'approved-original-calligraphy'; assetSha256:string; canonicalText:string; sourceSha256:string;
  sourceUrl:string; viewBox:[number,number,number,number]; coordinates:'svg-y-down';
  paths:VectorPath[];
  words:{id:number; text:string; course:1|2|3|4; pathIds:string[]}[];
  approvals:Approval[];
  rights:{holder:string; grantRecord:string; webXR:boolean; technical3DAdaptation:boolean; publicSourceDistribution:boolean; film:boolean};
};
export class IntakeError extends Error {}
const check=(yes:unknown,message:string):void=>{if(!yes)throw new IntakeError(message);};
const digest=async(text:string)=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text)))).map(b=>b.toString(16).padStart(2,'0')).join('');
/** Metadata + digest gate only. No text-to-outline generation and no sculpture loading.
 * Paths use one declared Y inversion and uniform scale at a FUTURE approved importer.
 * A passing digest is not proof of authenticity; human approval records must be checked. */
export async function validateVectorIntake(value:unknown,originalSvgBytes:Uint8Array):Promise<Readonly<ApprovedVectorAsset>> {
  check(value!==null&&typeof value==='object','Missing approved vector bundle');
  const asset=value as ApprovedVectorAsset;
  check(asset.kind==='approved-original-calligraphy','Font proofs and placeholders are not original calligraphy');
  check(typeof asset.canonicalText==='string'&&asset.sourceSha256===LOCKED_SOURCE.sha256,'Wrong locked verse representation');
  check(await digest(asset.canonicalText)===LOCKED_SOURCE.sha256,'Verse text/codepoints changed');
  check(typeof asset.sourceUrl==='string'&&/^https:\/\//.test(asset.sourceUrl),'Missing source citation');
  const svgDigest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new Uint8Array(originalSvgBytes)))).map(b=>b.toString(16).padStart(2,'0')).join('');
  check(asset.assetSha256===svgDigest,'Approval must identify the exact original SVG bytes');
  check(originalSvgBytes.byteLength<=5_000_000,'SVG exceeds intake size limit');
  const svg=new TextDecoder('utf-8',{fatal:true}).decode(originalSvgBytes);
  check(/<svg[\s>]/.test(svg)&&!/<\s*(script|image|foreignObject|text|use|clipPath|mask|filter)\b|\bon\w+\s*=|\bhref\s*=|url\s*\(|<!DOCTYPE|<!ENTITY/i.test(svg),'Only self-contained original path artwork is eligible');
  const doc=new DOMParser().parseFromString(svg,'image/svg+xml');
  check(!doc.querySelector('parsererror')&&doc.documentElement.localName==='svg','Malformed SVG');
  check(Array.from(doc.querySelectorAll('*')).every(n=>['svg','g','path','title','desc','metadata'].includes(n.localName)),'Unsupported SVG element; supply an approved flattened path master');
  check(!Array.from(doc.querySelectorAll('*')).some(n=>n.hasAttribute('transform')||n.hasAttribute('style')),'Transforms/styles must be resolved by the artist before approval');
  const originalPaths=Array.from(doc.querySelectorAll('path'));
  check(asset.coordinates==='svg-y-down'&&Array.isArray(asset.viewBox)&&asset.viewBox.length===4&&asset.viewBox.every(Number.isFinite)&&asset.viewBox[2]>0&&asset.viewBox[3]>0,'Invalid declared coordinate system');
  check(Array.isArray(asset.paths)&&asset.paths.length>0&&asset.paths.length<=10000,'Missing or excessive vector paths');
  check(originalPaths.length===asset.paths.length,'SVG and metadata path counts differ');
  const svgViewBox=doc.documentElement.getAttribute('viewBox')?.trim().split(/[\s,]+/).map(Number);
  check(svgViewBox?.length===4&&svgViewBox.every((x,i)=>x===asset.viewBox[i]),'SVG viewBox differs from declared coordinates');
  const canonical=Array.from(asset.canonicalText),coverage=new Set<number>();
  const wordSpans:number[][]=[];let offset=0;for(const word of asset.canonicalText.split(' ')){wordSpans.push(Array.from(word,(_,i)=>offset+i));offset+=Array.from(word).length+1;}
  const ids=new Set<string>();let pathBytes=0;
  for(const p of asset.paths){
    check(typeof p.id==='string'&&p.id.length>0&&!ids.has(p.id),'Duplicate or missing path ID');ids.add(p.id);
    check(typeof p.d==='string'&&p.d.length<=200000&&/^[Mm]/.test(p.d)&&/^[MmZzLlHhVvCcSsQqTtAa\d.,+\-\seE]+$/.test(p.d),'Unsafe or unsupported path data');
    pathBytes+=p.d.length;check(pathBytes<=5_000_000,'Combined path data exceeds intake limit');
    check((p.d.match(/[-+]?(?:\d*\.?\d+)(?:[eE][-+]?\d+)?/g)??[]).every(n=>Number.isFinite(Number(n))&&Math.abs(Number(n))<1e7),'Nonfinite or excessive path coordinate');
    check(p.d.split(/(?=[Mm])/).filter(Boolean).every(part=>/[Zz]\s*$/.test(part)),'Every approved contour must explicitly close');
    const original=originalPaths.find(n=>n.id===p.id);
    check(original&&original.getAttribute('d')===p.d&&original.getAttribute('fill-rule')===p.fillRule&&['nonzero','evenodd'].includes(p.fillRule),'Original curve or fill-rule metadata mismatch');
    check(original&&Number.isFinite(original.getTotalLength())&&original.getTotalLength()>0,'Empty or invalid path geometry');
    check(['body','diacritic','pause'].includes(p.role)&&Number.isInteger(p.level)&&p.level>=0&&p.level<7,'Invalid path role/depth');
    check(Array.isArray(p.wordIds)&&p.wordIds.length>0&&p.wordIds.every(i=>Number.isInteger(i)&&i>=1&&i<=18),'Unmapped vector path');
    check(Array.isArray(p.sourceCodepoints)&&p.sourceCodepoints.length>0&&p.sourceCodepoints.every(i=>Number.isInteger(i)&&i>=0&&i<canonical.length&&canonical[i]!==' '&&p.wordIds.some(w=>wordSpans[w-1]?.includes(i))),'Invalid source character/path mapping');
    p.sourceCodepoints.forEach(i=>coverage.add(i));
    if(p.role!=='body')check(Number.isInteger(p.ownerWordId)&&p.wordIds.includes(p.ownerWordId!),'Detached mark ownership');
  }
  check(canonical.every((c,i)=>c===' '||coverage.has(i)),'Unmapped source character or diacritic');
  check(Array.isArray(asset.words)&&asset.words.length===18,'Exactly 18 words required');
  check(asset.words.map(w=>w.text).join(' ')===asset.canonicalText,'Word sequence differs from canonical source');
  asset.words.forEach((w,i)=>{
    const expectedCourse=i<5?1:i<12?2:i<14?3:4;
    check(w.id===i+1&&w.course===expectedCourse,'Wrong word/course reading order');
    check(Array.isArray(w.pathIds)&&w.pathIds.length>0&&w.pathIds.every(id=>ids.has(id)),'Incomplete word-to-path mapping');
    for(const id of w.pathIds){const p=asset.paths.find(p=>p.id===id)!;check(p.wordIds.includes(w.id),'Asymmetric word/path mapping');}
  });
  for(const p of asset.paths){for(const id of p.wordIds)check(asset.words[id-1].pathIds.includes(p.id),'Unreferenced path/word association');
    if(p.ownerWordId){check(p.sourceCodepoints.every(i=>wordSpans[p.ownerWordId!-1]?.includes(i)&&/\p{M}/u.test(canonical[i])),'Mark metadata must identify actual owner-word combining signs');if(p.role==='pause')check(p.sourceCodepoints.every(i=>canonical[i]==='\u06d6'),'Pause metadata must identify the source pause sign');const bodies=asset.paths.filter(b=>b.role==='body'&&b.wordIds.includes(p.ownerWordId!));check(bodies.length>0&&bodies.every(b=>b.level===p.level),'Marks and owner must share a rigid depth level');}}
  for(const i of [5,12])check(asset.paths.some(p=>p.role==='pause'&&p.ownerWordId===i),'Missing mapped Qur’anic pause sign');
  check(Array.isArray(asset.approvals)&&['calligrapher','quran-text'].every(role=>asset.approvals.some(a=>a.role===role&&a.assetSha256===svgDigest&&Boolean(a.reviewer?.trim()&&a.record?.trim())&&/^\d{4}-\d{2}-\d{2}$/.test(a.date))),'Missing asset-specific expert approval records');
  const r=asset.rights;check(r&&r.holder?.trim()&&r.grantRecord?.trim()&&r.webXR===true&&r.technical3DAdaptation===true&&r.publicSourceDistribution===true&&r.film===true,'Incomplete artwork usage/adaptation rights');
  // Defensive copy: callers cannot alter the checked input through the original object.
  return structuredClone(asset);
}
