const {execFileSync}=require('node:child_process'),{buildSync}=require('esbuild'),path=require('node:path');
const SOURCE='dc95a7cc06c3194318e099b8a3802eb4ae8cc272';
function baselineBundle(root){
 const old=execFileSync('git',['show',SOURCE+':src/CalligraphyDepthArt.tsx'],{cwd:root,encoding:'utf8'});
 const a=old.indexOf('BANDS.map',old.indexOf('const materials = useMemo')),b=old.indexOf(', [maps, details]);',a);
 const c=old.indexOf('const raisedMaterials = useMemo(() => {')+'const raisedMaterials = useMemo(() => {'.length,d=old.indexOf('}, [maps, details]);',c);
 if(a<0||b<0||d<0)throw Error('Immutable PR28 comparison factory not found');
 const extra=`\nexport function comparisonMaterials(maps,details){return ${old.slice(a,b)};}\nexport function comparisonRaisedMaterials(maps,details){${old.slice(c,d)}}\nexport function comparisonGroup(raised,materials){const g=new THREE.Group();g.add(new THREE.Mesh(raised.faces,materials[0]),new THREE.Mesh(raised.walls,materials[1]));return g;}`;
 return buildSync({stdin:{contents:old+extra,resolveDir:path.join(root,'src'),loader:'tsx'},bundle:true,write:false,format:'iife',globalName:'PR28'}).outputFiles[0].text;
}
module.exports={SOURCE,baselineBundle};
