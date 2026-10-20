import {createContext,useContext,useEffect,useMemo,useState} from 'react';
import {useThree} from '@react-three/fiber';
import {createKafAsset,type KafAsset} from './kafAsset';
const Assets=createContext<KafAsset|null>(null);
export function KafAssets({enabled,children}:{enabled:boolean;children:React.ReactNode}){
 const {gl}=useThree();const [asset,setAsset]=useState<KafAsset|null>(null);
 useEffect(()=>{if(!enabled)return;let built:KafAsset|undefined;try{built=createKafAsset(gl);setAsset(built)}catch(e){console.error('Sculptural kaf unavailable; retaining original letter',e)}return()=>{setAsset(null);built?.dispose()}},[enabled,gl]);
 return <Assets.Provider value={asset}>{children}</Assets.Provider>;
}
export function useKafAsset(){return useContext(Assets)}
export function SculptedKaf({asset,active}:{asset:KafAsset;active:boolean}){
 const owned=useMemo(()=>{const root=asset.group.clone(true),face=asset.gold.clone(),side=asset.side.clone();root.traverse(o=>{if('isMesh' in o)(o as import('three').Mesh).material=[face,side]});return{root,face,side}},[asset]);
 useEffect(()=>{owned.face.emissive.set('#ffe0a3');owned.face.emissiveIntensity=active?.18:0;owned.side.emissive.set('#8fa6bf');owned.side.emissiveIntensity=active?.08:0},[owned,active]);
 useEffect(()=>()=>{owned.face.dispose();owned.side.dispose()},[owned]);
 return <primitive object={owned.root} dispose={null}/>;
}
