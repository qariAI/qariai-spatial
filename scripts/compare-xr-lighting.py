"""Offline analysis of genuine native PNGs and read-only lighting snapshots."""
import json,statistics,math,hashlib
from pathlib import Path
import numpy as np
from PIL import Image
p=Path('docs/xr-lighting');runs={k:json.loads((p/k/'report.json').read_text())for k in ['before','after']};result={'matched':[],'pixels':{},'attenuation':[],'performance':{}}
for name,r in runs.items():
 assert r.get('completed')and not r.get('failure')and not r['errors'],(name,r.get('failure'))
 result['performance'][name]={'atlasReadyMs':r['atlasReadyMs'],'elapsedMs':r['elapsedMs'],'phases':{}}
 for phase in ['xr-normal','xr-nearer','xr-farther']:
  full=[f for f in r['frames']if f['phase']==phase and f.get('fullyRendered')]
  steady=full[4:];intervals=[f['intervalMs']for f in steady if f.get('intervalMs')is not None]
  assert len(intervals)>=3,(name,phase,len(intervals))
  result['performance'][name]['phases'][phase]={'fullyRenderedFrames':len(full),'steadyIntervalSamples':len(intervals),'medianFullDrawIntervalMs':statistics.median(intervals),'maxFullDrawIntervalMs':max(intervals),'medianCallbackMs':statistics.median(f['callbackMs']for f in steady),'note':'GPU-suppressed warmup, first full frame, capture and following interval excluded; software diagnostic, not Quest FPS'}
for a,b in zip(runs['before']['captures'],runs['after']['captures']):
 assert a['name']==b['name'];name=a['name'];xr=name.startswith('xr-');assert a['canvas']==b['canvas']
 assert max(abs(x-y)for x,y in zip(a['view']['matrix'],b['view']['matrix']))<1e-6,(name,'camera')
 assert max(abs(x-y)for x,y in zip(a['view']['projection'],b['view']['projection']))<1e-6
 assert a['anchor']==b['anchor'];assert a['renderer']==b['renderer'],(name,'renderer')
 for k in ['geometryBytes','textureRGBA8MipsEstimateBytes']:assert a['resources'][k]==b['resources'][k]
 for k in ['calls','triangles','points','lines']:assert a['render'][k]==b['render'][k],(name,k)
 assert a['memory']==b['memory']
 for ma,mb in zip(a['materials'],b['materials']):
  for k in ['type','color','emissive','emissiveIntensity','metalness','roughness','toneMapped']:assert ma.get(k)==mb.get(k),(name,ma['name'],k)
  for k in ['detail','bumpScale']:assert abs(ma.get(k,0)-mb.get(k,0))<2e-5,(name,ma['name'],k,ma.get(k),mb.get(k))
 if xr:
  assert a['settled']['stable']>=5 and b['settled']['stable']>=5
  assert b['resources']['attenuationFloor']['allCurrentPBRSurfacesAboveFloor'],(name,'floor bound')
 direction=next(l for l in b['lights']if l['type']=='DirectionalLight')['direction'];authored=runs['before']['captures'][0]['lights'][1]['direction'];assert max(abs(x-y)for x,y in zip(direction,authored))<1e-10
 if not xr:
  assert a['lights']==b['lights'] or all(all(la.get(k)==lb.get(k)for k in ['type','intensity','distance','decay','world','direction'])for la,lb in zip(a['lights'],b['lights']))
 image_a=np.asarray(Image.open(p/'before'/(name+'.png')).convert('RGB'));image_b=np.asarray(Image.open(p/'after'/(name+'.png')).convert('RGB'));delta=np.abs(image_a.astype(int)-image_b.astype(int));changed=int(np.any(delta,axis=2).sum());max_delta=int(delta.max())
 if not xr:assert max_delta<=1,(name,'desktop appearance changed',changed,max_delta)
 result['matched'].append({'name':name,'cameraProjectionAndWorldMatch':True,'drawsGeometryTexturesMatch':True,'baseMaterialsMatch':True,'maxDetailDifference':max(abs(x-y)for x,y in zip(a['settled']['details'],b['settled']['details'])),'desktopChangedPixels':changed if not xr else None,'desktopMax8BitChannelDifference':max_delta if not xr else None,'beforeSHA256':a['sha256'],'afterSHA256':b['sha256']})
 result['pixels'][name]={'beforeBrightPixelsAllRGBAtLeast230':int((image_a.min(axis=2)>=230).sum()),'afterBrightPixelsAllRGBAtLeast230':int((image_b.min(axis=2)>=230).sum()),'limitation':'Whole native framebuffer, includes intended luminous Sun, gold, lettering and menu; not an isolated material or point measurement'}
 if xr:
  desktop=runs['after']['captures'][0]
  for x,y in zip(desktop['probes'][1]['pointLights'],b['probes'][1]['pointLights']):
   ratio=y['intensityTimesAttenuation']/x['intensityTimesAttenuation'];assert abs(ratio-1)<1e-9,(name,'attenuation',ratio)
   result['attenuation'].append({'pose':name,'authoredIntensity':x['intensity'],'desktopFactor':x['intensityTimesAttenuation'],'correctedXRFactor':y['intensityTimesAttenuation'],'ratio':ratio,'method':'Shader-equation reconstruction from actual positions/light values; final pixels measured separately'})
result['limitations']=['Native LOD/frame callbacks run during GPU-suppressed warmup, stock XR camera/matrix updates retained, then three genuine full frames before capture. No real-time performance inferred from warmup.','Camera matching is baseline versus correction within each modality; desktop and XR use their existing distinct FOVs. Near XR viewer pose derives from Explore; normal/farther are physical viewer emulation. No production camera edits.','Only native software-rendered frames; actual Quest stereo, lighting, comfort and text legibility remain hardware review.']
(p/'comparison.json').write_text(json.dumps(result,indent=2));print(json.dumps(result,indent=2))
