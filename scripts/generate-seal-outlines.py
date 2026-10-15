"""Build-time only: fontTools + uharfbuzz. No reference-image tracing."""
import json,hashlib,sys
from pathlib import Path
import uharfbuzz as hb
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.roundingPen import RoundingPen
from fontTools.pens.boundsPen import BoundsPen
root=Path(__file__).resolve().parent.parent
fontpath=root/'public/fonts/Amiri-Bold.ttf';data=fontpath.read_bytes();tt=TTFont(fontpath);glyphs=tt.getGlyphSet();names=tt.getGlyphOrder();upem=tt['head'].unitsPerEm
font=hb.Font(hb.Face(data));font.scale=(upem,upem);hb.ot_font_set_funcs(font)
source=json.loads((root/'docs/v1.4.7/source-words.json').read_text())['21:33']
text=' '.join(source['words'][7:11]);assert text=='كُلّٞ فِي فَلَكٖ يَسۡبَحُونَ'
def shape(text):
 buf=hb.Buffer();buf.add_str(text);buf.direction='rtl';buf.script='arab';buf.language='ar';hb.shape(font,buf)
 parts=[];audit=[];bounds=[];x=0;y=0
 for info,pos in zip(buf.glyph_infos,buf.glyph_positions):
  assert info.codepoint!=0,'Missing glyph'
  name=names[info.codepoint];pen=SVGPathPen(glyphs);transform=(1/upem,0,0,1/upem,(x+pos.x_offset)/upem,(y+pos.y_offset)/upem)
  glyphs[name].draw(TransformPen(RoundingPen(pen,roundFunc=lambda n:round(n,6)),transform));parts.append(pen.getCommands())
  b=BoundsPen(glyphs);glyphs[name].draw(TransformPen(b,transform))
  if b.bounds: bounds.append(b.bounds)
  audit.append({'gid':info.codepoint,'cluster':info.cluster,'advance':[pos.x_advance,pos.y_advance],'offset':[pos.x_offset,pos.y_offset]})
  x+=pos.x_advance;y+=pos.y_advance
 return {'text':text,'path':' '.join(parts),'bounds':[min(b[0] for b in bounds),min(b[1] for b in bounds),max(b[2] for b in bounds),max(b[3] for b in bounds)],'glyphs':audit}
result={'font':{'file':'public/fonts/Amiri-Bold.ttf','sha256':hashlib.sha256(data).hexdigest(),'license':'SIL OFL 1.1','upem':upem},'shaper':{'name':'HarfBuzz / uharfbuzz','version':hb.__version__,'direction':'rtl','script':'arab','language':'ar'},'excerpt':{**shape(text),'citation':'Qur’an 21:33, words 8–11 (excerpt, not whole verse)','source':source['source'],'sourceChecked':source['checked'],'orthography':'Exact cached Quran Foundation Uthmani word text, unnormalized'},'letters':[shape(c) for c in 'كلفيفلك']}
(root/'src/seal/outlines.json').write_text(json.dumps(result,ensure_ascii=False,separators=(',',':'))+'\n')
print('Generated seven source-font isolated motifs and complete verified excerpt; no missing glyphs.')
