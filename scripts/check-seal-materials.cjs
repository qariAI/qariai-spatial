// No WebGL or Arabic assets: compare the real generated meshes against the reviewed foundation.
const fs=require('node:fs'),assert=require('node:assert/strict'),{execFileSync}=require('node:child_process'),{pathToFileURL}=require('node:url'),{createHash}=require('node:crypto'),ts=require('typescript');
const baseline='b3752db314f0988be271519a97cdcc5aa1ec5ee1',base=p=>execFileSync('git',['show',`${baseline}:${p}`],{encoding:'utf8'}),read=p=>fs.readFileSync(p,'utf8');
const url=s=>'data:text/javascript;base64,'+Buffer.from(s).toString('base64');
const transpile=s=>ts.transpileModule(s,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText;
const config=url(transpile(read('src/seal-foundation/config.ts')));
const moduleFor=s=>url(transpile(s).replaceAll("'three'",JSON.stringify(pathToFileURL(require('node:path').join(require('node:path').dirname(require.resolve('three')),'three.module.js')).href)).replaceAll("'three/examples/jsm/utils/BufferGeometryUtils.js'",JSON.stringify(pathToFileURL(require.resolve('three/examples/jsm/utils/BufferGeometryUtils.js')).href)).replaceAll("'./config'",JSON.stringify(config)));
(async()=>{
  const [before,after]=await Promise.all([import(moduleFor(base('src/seal-foundation/sculpture.ts'))),import(moduleFor(read('src/seal-foundation/sculpture.ts')))]);
  const profiles={};
  for(const profile of ['desktop','quest']){
    const a=before.makeFoundation(profile),b=after.makeFoundation(profile),hash=createHash('sha256');
    assert.equal(a.root.children.length,4);assert.equal(b.root.children.length,4);
    for(let i=0;i<4;i++){
      const old=a.root.children[i],next=b.root.children[i];assert.equal(old.name,next.name);
      assert.deepEqual(old.matrix.elements,next.matrix.elements);
      for(const key of ['position','normal','uv']){
        const x=old.geometry.getAttribute(key),y=next.geometry.getAttribute(key);
        assert.equal(x.itemSize,y.itemSize);assert.equal(x.count,y.count);assert.deepEqual(x.array,y.array,`${profile}/${next.name}/${key} changed`);
        hash.update(Buffer.from(y.array.buffer,y.array.byteOffset,y.array.byteLength));
      }
      assert.deepEqual(old.geometry.index,next.geometry.index);
      assert.equal(old.castShadow,next.castShadow);assert.equal(old.receiveShadow,next.receiveShadow);
      if(/bronze|gold/.test(next.name)){
        assert(next.material.vertexColors);const c=next.geometry.getAttribute('color');assert(c.normalized);assert(c.array instanceof Uint8Array);
        assert(c.array.some(v=>v===255));assert(c.array.some(v=>v<255));
      }
    }
    assert.equal(a.root.userData.resources.materialMapBytesWithMipmaps,b.root.userData.resources.materialMapBytesWithMipmaps);
    assert.equal(a.root.userData.resources.triangles,b.root.userData.resources.triangles);
    assert.deepEqual(a.root.userData.resources.depthLevels,b.root.userData.resources.depthLevels);
    profiles[profile]={before:a.root.userData.resources,after:b.root.userData.resources,unchangedPositionNormalUvSHA256:hash.digest('hex'),geometryComparison:'Exact typed-array equality; original positions, normals, UVs, topology, transforms and shadow flags preserved'};
    a.dispose();b.dispose();
  }
  // Only the light declaration may change in the entry page, including camera/control/diagnostic code.
  const withoutLights=s=>s.replace(/^function Lights\(.*$/m,'LIGHTS');
  assert.equal(withoutLights(base('src/seal-foundation/main.tsx')),withoutLights(read('src/seal-foundation/main.tsx')));
  for(const p of ['config.ts','vectorIntake.ts','style.css'])assert.equal(base(`src/seal-foundation/${p}`),read(`src/seal-foundation/${p}`));
  const report={baseline,checkedAt:new Date().toISOString(),result:'passed',cameraAndEntryPageOutsideLights:'byte-identical',vectorIntakeAndDepthConfiguration:'byte-identical',profiles};
  fs.mkdirSync('docs/celestial-seal-v0.4/polish',{recursive:true});fs.writeFileSync('docs/celestial-seal-v0.4/polish/preservation.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
})().catch(e=>{console.error(e);process.exitCode=1;});
