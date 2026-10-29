"""Exact original isolated Amiri outlines; offline only, no tracing or simplification."""
import hashlib,json,sys
from pathlib import Path
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.boundsPen import BoundsPen
root=Path(__file__).resolve().parent.parent
font=root/'public/fonts/Amiri-Bold.ttf';sha=hashlib.sha256(font.read_bytes()).hexdigest()
assert sha=='65e3e6fe6af66bb6d24959bd537a89ea35de14083f5a2e2290c246136c2b047b'
f=TTFont(font);glyphs=f.getGlyphSet();out={}
for letter in 'لفي':
 name=f.getBestCmap()[ord(letter)];g=glyphs[name];pen=SVGPathPen(glyphs);g.draw(pen);b=BoundsPen(glyphs);g.draw(b);path=pen.getCommands()
 out[letter]={'codepoint':f'U+{ord(letter):04X}','letter':letter,'glyph':name,'fontSha256':sha,'fontVersion':f['name'].getDebugName(5),'unitsPerEm':f['head'].unitsPerEm,'advance':g.width,'bounds':list(b.bounds),'contourCount':path.count('M'),'path':path,'pathSha256':hashlib.sha256(path.encode()).hexdigest(),'license':'OFL-1.1; public/fonts/OFL-Amiri.txt','provenance':'Direct unchanged cmap glyph via fontTools SVGPathPen. No joins, tracing, simplification or modified proportions. Original dot/counter contours retained.'}
p=root/'src/orbit-art/generated/letter-outlines.json'
if '--check' in sys.argv:assert json.loads(p.read_text())==out;print('PASS exact Amiri lam/fa/ya curves, marks, advances, bounds and hashes')
else:p.write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n');print([(x,v['contourCount'],v['pathSha256'])for x,v in out.items()])
