# Rebuild review diagrams from authored draft data. No application assets edited.
import json,math,pathlib,html
root=pathlib.Path(__file__).resolve().parent.parent
out=root/'docs/orbit-art-v01/guide-annotations-v01'
sources={'kaf':json.loads((root/'src/orbit-art/generated/kaf-outline.json').read_text())}
sources.update({{'ل':'lam','ف':'fa','ي':'ya'}[k]:v for k,v in json.loads((root/'src/orbit-art/generated/letter-outlines.json').read_text()).items()})
allrules=json.loads((out/'candidates.json').read_text())
assert set(allrules)==set(sources)
for mode,rules in allrules.items():
 source=sources[mode]
 assert rules['sourceHash']==source['pathSha256']
 assert not rules['review']['annotationsApproved'] and not rules['review']['fixturesApproved']
 x0,y0,x1,y1=source['bounds'];corridor=rules['corridor'];parts=rules['parts']
 # Original glyph coordinates and exact path; fit via uniform SVG transform.
 scale=min(450/(x1-x0),510/(y1-y0));tx=300-(x0+x1)/2*scale;ty=340+(y0+y1)/2*scale
 svg=['<svg xmlns="http://www.w3.org/2000/svg" width="600" height="720" viewBox="0 0 600 720" role="img" aria-labelledby="title desc">',f'<title id="title">{mode}: draft practice annotations</title>','<desc id="desc">Original outline in sapphire; candidate paths in gold; corridors in translucent gold; endpoint regions in turquoise; dot regions in purple; protected regions in red. Draft only. No stroke order prescribed.</desc>','<rect width="600" height="720" fill="#07111c"/>',f'<text x="24" y="34" fill="#f5dca5" font-size="20" font-family="sans-serif">{mode.upper()} · DRAFT ANNOTATIONS</text>','<text x="24" y="60" fill="#b6c8d3" font-size="13" font-family="sans-serif">Review geometry; no stroke order or direction prescribed.</text>',f'<g transform="translate({tx} {ty}) scale({scale} {-scale})">',f'<path id="source" d="{html.escape(source["path"],quote=True)}" fill="#284f70"/>']
 for poly in rules['forbidden']:svg.append('<polygon data-layer="protected" points="'+' '.join(f'{p["x"]},{p["y"]}' for p in poly)+'" fill="#f16c7740" stroke="#f16c77" stroke-width="1.5"/>')
 for part in parts:
  if part['kind']=='path':
   coords=' '.join(f'{p["x"]},{p["y"]}' for p in part['points'])
   svg.append(f'<polyline data-layer="corridor" points="{coords}" fill="none" stroke="#f5c46b28" stroke-width="{corridor*2}" stroke-linecap="round" stroke-linejoin="round"/>')
   svg.append(f'<polyline data-layer="path" points="{coords}" fill="none" stroke="#f5c46b" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>')
   for d in part['endpoints']:svg.append(f'<circle data-layer="endpoint" cx="{d["center"]["x"]}" cy="{d["center"]["y"]}" r="{d["radius"]}" fill="#82dfc22e" stroke="#82dfc2" stroke-width="2"/>')
  else:
   d=part['region'];svg.append(f'<circle data-layer="dot" cx="{d["center"]["x"]}" cy="{d["center"]["y"]}" r="{d["radius"]}" fill="#d6a5ff40" stroke="#d6a5ff" stroke-width="2"/>')
 svg+=['</g>','<g font-family="sans-serif" font-size="13"><text x="24" y="646" fill="#f5c46b">Gold: path + tolerance corridor</text><text x="24" y="667" fill="#82dfc2">Turquoise: endpoints · Purple: separate dots</text><text x="24" y="688" fill="#f16c77">Red: proposed protected regions</text></g>','</svg>']
 (out/(mode+'.svg')).write_text('\n'.join(svg)+'\n')
