"""Measure same-pixel planet/Sun core disks; do not modify capture PNGs."""
from pathlib import Path
import json,math
import numpy as np
from PIL import Image
root=Path('docs/xr-lighting');r={k:json.loads((root/k/'report.json').read_text())for k in ['before','after']};result=[]
for before,after in zip(r['before']['captures'],r['after']['captures']):
 if not before['name'].startswith('xr-'):continue
 w,h=before['canvas'];M=np.array(before['view']['matrix']).reshape((4,4),order='F');P=np.array(before['view']['projection']).reshape((4,4),order='F');A=np.array(before['anchor']['matrix']).reshape((4,4),order='F');scale=before['anchor']['scale'][0];yy,xx=np.mgrid[0:h,0:w]
 def project(q):
  v=P@np.linalg.inv(M)@q;return np.array([(v[0]/v[3]+1)*w/2,(1-v[1]/v[3])*h/2]),v[3]
 for name,radius,distance,initial in [('Sun',6,0,0),('Mercury',1,13,2.2),('Earth',2,27,2.8),('Mars',1.45,36,.9),('Jupiter',4,49,5.1),('Saturn',3.75,65,4),('Venus',1.65,19,4.3)]:
  center=A@np.array([math.cos(initial)*distance,-9,math.sin(initial)*distance*.74,1]);c,depth=project(center);edge=center.copy();edge[:3]+=M[:3,0]*radius*scale;e,_=project(edge);rad=float(np.linalg.norm(e-c)*.45)
  if depth<=0 or rad<1 or not (rad<c[0]<w-rad and rad<c[1]<h-rad):continue
  mask=(xx+.5-c[0])**2+(yy+.5-c[1])**2<=rad**2
  a,b=[np.asarray(Image.open(root/k/(before['name']+'.png')).convert('RGB'))[mask]for k in ['before','after']]
  delta=np.abs(a.astype(int)-b.astype(int));result.append({'pose':before['name'],'object':name,'pixelCenter':c.tolist(),'coreRadiusPx':rad,'pixelCount':len(a),'beforeMeanRGB':a.mean(axis=0).tolist(),'afterMeanRGB':b.mean(axis=0).tolist(),'beforeNearWhiteAllChannelsAtLeast230':int((a.min(axis=1)>=230).sum()),'afterNearWhiteAllChannelsAtLeast230':int((b.min(axis=1)>=230).sum()),'maxChannelDelta':int(delta.max())})
assert all(x['maxChannelDelta']==0 for x in result if x['object']=='Sun'),'Sun opaque core changed'
(root/'planet-sun-pixels.json').write_text(json.dumps({'method':'Analytically project original paused planet centers and 45%-radius core disks using recorded matrices. Same pixel masks for each baseline/corrected pair; actual framebuffer RGB values, not shader estimates. PNGs unedited.','samples':result},indent=2));print(json.dumps(result,indent=2))
