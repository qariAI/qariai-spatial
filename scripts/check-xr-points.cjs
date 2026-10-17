// Execute the production Stars/Belt components with test-only hooks and real Three objects.
const fs=require('node:fs'),assert=require('node:assert/strict'),crypto=require('node:crypto'),{execFileSync}=require('node:child_process'),{buildSync}=require('esbuild'),THREE=require('three');
const base='f262034e6b6b0989db8824bf045092736d1830f2',src=fs.readFileSync('src/App.tsx','utf8'),old=execFileSync('git',['show',base+':src/App.tsx'],{encoding:'utf8'});
const extract=(s,a,b)=>s.slice(s.indexOf('function '+a+'('),s.indexOf('function '+b+'('));
const sections=s=>[extract(s,'Stars','OrbitLine'),extract(s,'Belt','LetterObject')];
const blank=s=>{for(const p of sections(s))s=s.replace(p,'POINT_COMPONENT');return s};assert.equal(blank(src),blank(old),'Every other application component must remain byte-identical');
for(let i=0;i<2;i++){
 const [before,after]=[sections(old)[i],sections(src)[i]];
 assert.equal(after.slice(after.indexOf('const geometry=useMemo'),after.indexOf('const {gl}')),before.slice(before.indexOf('const geometry=useMemo'),before.indexOf('const {gl}')),'Geometry generation/disposal unchanged');
 assert.equal(after.slice(after.indexOf('<pointsMaterial')),before.slice(before.indexOf('<pointsMaterial')),'Original material JSX unchanged');
}
const code=buildSync({stdin:{contents:"import {useMemo,useRef,useEffect} from 'react';import {useFrame,useThree} from '@react-three/fiber';import * as THREE from 'three';const Y=-9;"+sections(process.env.POINT_TEST_BASELINE==='1'?old:src).join('\n')+'\nexport {Stars,Belt}',loader:'tsx',resolveDir:process.cwd()},bundle:true,write:false,format:'cjs',external:['react','react/jsx-runtime','@react-three/fiber','three'],jsx:'automatic'}).outputFiles[0].text;
let callbacks=[],gl={xr:{isPresenting:false}};
const jsx=(tag,props)=>{if(tag==='pointsMaterial')return new THREE.PointsMaterial(props);if(tag==='points'){const p=new THREE.Points(props.geometry,props.children);if(props.ref)props.ref.current=p;return p}throw Error('Unexpected JSX '+tag)};
const m={exports:{}};new Function('require','module','exports',code)(id=>id==='react'?{useMemo:f=>f(),useRef:()=>({current:null}),useEffect:()=>{}}:id==='react/jsx-runtime'?{jsx,jsxs:jsx}:id==='@react-three/fiber'?{useFrame:f=>callbacks.push(f),useThree:()=>({gl})}:require(id),m,m.exports);
const hash=p=>crypto.createHash('sha256').update(Buffer.from(p.geometry.attributes.position.array.buffer)).digest('hex');
const cases=[];
for(const [name,create,size,count,xrCount] of [['stars-5200',()=>m.exports.Stars({count:5200,radius:620,opacity:.83,size:.8,seed:184}),.8,5200,2184],['stars-1400',()=>m.exports.Stars({count:1400,radius:290,opacity:.45,size:.55,seed:603}),.55,1400,588],['belt',()=>m.exports.Belt(),.3,1800,900]]){
 callbacks=[];const p=create(),parent=new THREE.Group();parent.add(p);const originalHash=hash(p);assert.equal(callbacks.length,1);
 for(const [xr,scale,expectedFactor]of[[false,[1,1,1],1],[true,[.014,.014,.014],.014],[true,[.028,.02,.01],.028],[true,[.007,.007,.007],.007],[false,[.014,.014,.014],1],[true,[.014,.014,.014],.014]]){
  gl.xr.isPresenting=xr;parent.scale.set(...scale);parent.updateMatrixWorld(true);callbacks[0]();assert.equal(p.material.size,size*expectedFactor,name+' world-scale correction / desktop reset');assert.equal(p.geometry.drawRange.count,xr?xrCount:count);assert.equal(hash(p),originalHash);
 }
 cases.push({name,count,xrCount,positionSHA256:originalHash,checks:'desktop unchanged; XR actual uniform/nonuniform/dynamic scale; exit reset; re-entry; identical geometry'});
}
const changed=execFileSync('git',['diff','--name-only',base,'--','src','public'],{encoding:'utf8'}).trim().split('\n').filter(Boolean);assert.deepEqual(changed,['src/App.tsx']);
const report={success:true,baseline:base,unchangedArtAndInteractions:'Every tracked src/public file except the two checked App components is identical to the pinned baseline',scope:'Only Stars and Belt changed; all geometry factories, material JSX and other App components byte-identical. No new GPU objects.',cases};fs.mkdirSync('docs/xr-point-size',{recursive:true});fs.writeFileSync('docs/xr-point-size/point-tests.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
