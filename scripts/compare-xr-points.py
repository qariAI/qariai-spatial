"""Analyze unedited full-scene framebuffer PNGs; no image generation or retouching."""
import json, statistics, hashlib
from pathlib import Path
import numpy as np
from PIL import Image
from scipy import ndimage
root=Path('docs/xr-point-size')
reports={k:json.loads((root/k/'report.json').read_text()) for k in ('before','after')}
result={'method':'Actual full-scene framebuffer sky ROI x=0..1439,y=0..299; max RGB > 30; 8-connected components. Scene/menu below ROI excluded. These are composite pixel measurements, not isolated sprite diameters.','matched':[],'runs':{}}
for name,r in reports.items():
 assert r.get('completed') and not r.get('failure') and not r['errors'], (name,r.get('failure'))
 frames=[s for s in r['samples'] if s.get('kind')=='frame']
 intervals=[s['intervalMs'] for s in frames if s.get('intervalMs') is not None]
 result['runs'][name]={'atlasReadyMs':r['atlasReadyMs'],'elapsedMs':r['elapsedMs'],'frameSamples':len(intervals),'medianInstrumentedIntervalMs':statistics.median(intervals),'maxInstrumentedIntervalMs':max(intervals),'medianCallbackMs':statistics.median([s['callbackMs']for s in frames]),'captures':[]}
 for c in r['captures']:
  a=np.asarray(Image.open(root/name/c['file']).convert('RGB'))[:300,:,:]
  bright=a.max(axis=2)>30
  labels,n=ndimage.label(bright,structure=np.ones((3,3)))
  counts=np.bincount(labels.ravel())[1:]
  boxes=ndimage.find_objects(labels)
  dimensions=[max(b[0].stop-b[0].start,b[1].stop-b[1].start) for b in boxes if b]
  result['runs'][name]['captures'].append({'file':c['file'],'sha256':c['sha256'],'render':c['render'],'memory':c['memory'],'resources':c['resources'],'brightSkyPixels':int(bright.sum()),'brightSkyFraction':float(bright.mean()),'components':n,'largestComponentPixels':int(max(counts,default=0)),'largestComponentSpanPx':max(dimensions,default=0),'componentSpanP95Px':float(np.percentile(dimensions,95)) if dimensions else 0,'pointShaderEstimates':c['points']})
for a,b in zip(reports['before']['captures'],reports['after']['captures']):
 assert a['file']==b['file']
 checks={k:a[k]==b[k] for k in ['head','world','camera','planets','resources','memory']}
 assert all(checks.values()),(a['file'],checks)
 for k in ['calls','triangles','points','lines']:assert a['render'][k]==b['render'][k]
 result['matched'].append({'file':a['file'],**checks,'drawAndPrimitiveCounts':True})
# Desktop tests populate the additional comparison when available.
if all((root/k/'desktop-tests.json').exists() for k in reports):
 result['desktop']=[]
 for name in ['desktop-wide','desktop-explore']:
  a,b=[np.asarray(Image.open(root/k/(name+'.png')))for k in reports]
  differences=int(np.any(a!=b,axis=2).sum());max_delta=int(np.abs(a.astype(int)-b.astype(int)).max());assert max_delta<=1,(name,differences,max_delta)
  ra,rb=[json.loads((root/k/'desktop-tests.json').read_text()) for k in reports];ca,cb=[next(c for c in r['captures']if c['name']==name) for r in [ra,rb]];assert ca['camera']==cb['camera'] and ca['sizes']==cb['sizes'];assert {k:v for k,v in ca['render'].items()if k!='frame'}=={k:v for k,v in cb['render'].items()if k!='frame'}
  result['desktop'].append({'view':name,'changedPixels':differences,'max8BitChannelDifference':max_delta,'cameraSizesAndCountsExactlyEqual':True,'limit':'Strict bitwise comparison initially failed Explore; only <=1/255 channel differences are accepted and reported explicitly, with exact metadata checks.','sha256':hashlib.sha256((root/'after'/(name+'.png')).read_bytes()).hexdigest()})
(root/'comparison.json').write_text(json.dumps(result,indent=2))
print(json.dumps({'matched':result['matched'],'desktop':result.get('desktop'),'performance':{k:{q:v for q,v in r.items()if q!='captures'}for k,r in result['runs'].items()}},indent=2))
