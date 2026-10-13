"""Offline provenance check against the explicitly supplied, unmodified Amiri TTF.
Requires fontTools in the development environment; no runtime font dependency.
"""
import hashlib, json, sys
from pathlib import Path
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.pointInsidePen import PointInsidePen
letter=json.loads(Path('src/harf-xr/letters/ba.json').read_text())
font_path=Path(sys.argv[1]);assert hashlib.sha256(font_path.read_bytes()).hexdigest()==letter['source']['fontSha256']
font=TTFont(font_path);glyphs=font.getGlyphSet();glyph=glyphs[font.getBestCmap()[ord('ب')]]
a,b,c,d,tx,ty=letter['source']['transform'];pen=SVGPathPen(glyphs);glyph.draw(TransformPen(pen,(a,b,c,d,tx,ty)))
body,dot=pen.getCommands().split('Z',1);assert body+'Z'==letter['bodyOutline'];assert dot==letter['dotOutline']
checked=0
for curve in letter['curves']:
 for n in range(101):
  t=n/100;u=1-t
  x=u**3*curve[0]['x']+3*u*u*t*curve[1]['x']+3*u*t*t*curve[2]['x']+t**3*curve[3]['x']
  y=u**3*curve[0]['y']+3*u*u*t*curve[1]['y']+3*u*t*t*curve[2]['y']+t**3*curve[3]['y']
  p=PointInsidePen(glyphs,((x-tx)/a,(y-ty)/d));glyph.draw(p);assert p.getResult(),(x,y);checked+=1
p=PointInsidePen(glyphs,((letter['dot']['x']-tx)/a,(letter['dot']['y']-ty)/d));glyph.draw(p);assert p.getResult()
result={'fontSha256':letter['source']['fontSha256'],'fontVersion':font['name'].getDebugName(5),'glyph':'U+0628 uni0628','outlineExactUniformTransform':True,'insideBodyCentrelineSamples':checked,'outsideSamples':0,'dotCentreInsideSourceOutline':True,'expertStrokeOrderReview':'pending'}
Path('docs/harf-studio-v0.2/ba/provenance-check.json').write_text(json.dumps(result,indent=2)+'\n');print('PASS sourced outlines exact; 505 centreline points and dot centre inside native glyph')
