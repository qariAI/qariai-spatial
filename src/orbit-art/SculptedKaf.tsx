import {createContext,useContext,useEffect,useMemo,useState} from 'react';
import {useThree} from '@react-three/fiber';
import {createKafAsset,type KafAsset,type OrbitLetter} from './kafAsset';
const Assets=createContext<Map<OrbitLetter,KafAsset>>(new Map());
export function KafAssets({enabled,children}:{enabled:boolean;children:React.ReactNode}){
 const {gl}=useThree();const [asset,setAsset]=useState<Map<OrbitLetter,KafAsset>>(new Map());
 useEffect(()=>{if(!enabled)return;const built=new Map<OrbitLetter,KafAsset>();try{const kaf=createKafAsset(gl);built.set('ك',kaf);for(const letter of ['ل','ف','ي'] as const)built.set(letter,createKafAsset(gl,letter,kaf.gold.envMap!));const all=[...built.values()];if(all.reduce((n,a)=>n+a.info.triangles,0)>60000||all.reduce((n,a)=>n+a.info.geometryBytes,0)>6*1024*1024)throw Error('Shared letter collection budget exceeded');setAsset(built)}catch(e){built.forEach(a=>a.dispose());built.clear();console.error('Sculptural letters unavailable; retaining originals',e)}return()=>{built.forEach(a=>a.dispose())}},[enabled,gl]);
 return <Assets.Provider value={asset}>{children}</Assets.Provider>;
}
export function useKafAsset(letter:string){return useContext(Assets).get(letter as OrbitLetter)}
export function SculptedKaf({asset,active}:{asset:KafAsset;active:boolean}){
 const owned=useMemo(()=>{const root=asset.group.clone(true),face=asset.gold.clone(),side=asset.side.clone();root.traverse(o=>{if('isMesh' in o)(o as import('three').Mesh).material=[face,side]});return{root,face,side}},[asset]);
 useEffect(()=>{owned.face.emissive.set('#ffffff');owned.face.emissiveIntensity=active?.75:.45;owned.side.emissive.set('#244d78');owned.side.emissiveIntensity=active?.32:.18},[owned,active]);
 useEffect(()=>()=>{owned.face.dispose();owned.side.dispose()},[owned]);
 return <primitive object={owned.root} dispose={null}/>;
}
