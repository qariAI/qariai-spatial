"""Reproduce the single-letter outline directly from the unchanged bundled Amiri.
Requires fontTools only for offline extraction/checking. No generated ligatures.
"""
import hashlib,json,sys
from pathlib import Path
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.boundsPen import BoundsPen
root=Path(__file__).resolve().parent.parent
font_path=root/'public/fonts/Amiri-Bold.ttf'
font_hash=hashlib.sha256(font_path.read_bytes()).hexdigest()
assert font_hash=='65e3e6fe6af66bb6d24959bd537a89ea35de14083f5a2e2290c246136c2b047b'
f=TTFont(font_path);glyphs=f.getGlyphSet();name=f.getBestCmap()[0x643];glyph=glyphs[name]
p=SVGPathPen(glyphs);glyph.draw(p);b=BoundsPen(glyphs);glyph.draw(b)
d=p.getCommands()
result={'codepoint':'U+0643','letter':'ك','glyph':name,'fontSha256':font_hash,'fontVersion':f['name'].getDebugName(5),'unitsPerEm':f['head'].unitsPerEm,'advance':glyph.width,'bounds':list(b.bounds),'contourCount':d.count('M'),'path':d,'pathSha256':hashlib.sha256(d.encode()).hexdigest(),'license':'OFL-1.1; see /fonts/OFL-Amiri.txt','provenance':'Direct fontTools SVGPathPen output from original isolated glyph. No joins, tracing, simplification or shape redesign. Font-derived; not bespoke calligrapher-authenticated artwork.'}
output=root/'public/spark-letter/kaf-outline.json'
if '--check' in sys.argv:
 assert json.loads(output.read_text())==result,'Outline or provenance differs from the source font'
 print('PASS exact Amiri U+0643 vector curves, bounds, component count, source and path hashes')
else:
 output.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n');print(name, result['contourCount'],len(d),b.bounds)
