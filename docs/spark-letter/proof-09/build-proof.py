"""Documentation-only surface proof. Copies the exact source glyph and panel paths.
No runtime assets, geometry, maps, cameras or lighting are modified.
"""
from pathlib import Path
import json,re,hashlib,html
root=Path(__file__).resolve().parents[3];out=Path(__file__).resolve().parent
glyph=json.loads((root/'public/spark-letter/kaf-outline.json').read_text())
source=(root/'public/spark-letter/surface-design.js').read_text()
block=source.split('const panelPaths=[',1)[1].split('\n ];',1)[0]
panels=[p for _,p in re.findall(r"\['(#[^']+)','([^']+)'\]",block)]
assert len(panels)==3
assert hashlib.sha256(glyph['path'].encode()).hexdigest()==glyph['pathSha256']
# All engraving is abstract surface ornament, never an alternative letter outline.
spines=[
'M117 59 C219 37 392 48 502 68',
'M551 198 C563 294 542 439 509 597',
'M133 328 Q197 319 260 350 Q280 363 250 379 Q210 400 205 416 Q204 435 239 452'
]
branches=[
['M145 55 Q163 67 187 70','M180 49 Q192 34 215 33','M223 47 Q242 62 271 65','M269 48 Q286 35 315 36','M316 51 Q333 64 360 69','M366 55 Q386 45 410 47','M416 60 Q431 72 459 75'],
['M550 229 Q558 239 558 259','M552 285 Q543 299 543 322','M545 353 Q550 368 546 391','M535 427 Q526 439 524 460','M521 507 Q526 519 520 540'],
['M153 327 Q162 334 181 336','M210 333 Q222 327 238 332','M262 352 Q251 352 240 360','M228 394 Q230 405 219 417','M208 425 Q219 425 227 435']
]
fine=[
['M127 66 C192 49 281 51 329 57','M294 57 Q372 67 413 67','M425 64 Q456 66 478 71'],
['M548 227 Q554 275 548 315','M540 366 Q538 396 532 418','M520 493 Q514 541 510 559'],
['M143 332 Q184 328 210 336','M224 405 Q218 416 221 425']
]
def strokes(paths,colour,width,opacity=1):return ''.join(f'<path d="{p}" fill="none" stroke="{colour}" stroke-width="{width}" opacity="{opacity}" stroke-linecap="round" stroke-linejoin="round"/>' for p in paths)
engraving=''
for i in range(3):
 engraving+=f'<g clip-path="url(#panel{i})">'
 engraving+=strokes([spines[i]],'#172d42',2.5,.85)+strokes([spines[i]],'#ffe2a5',.55,.8)
 engraving+=strokes(branches[i],'#223d4b',1.2,.72)+strokes(fine[i],'#f0d9a8',.48,.66)
 engraving+='</g>'
metadata=html.escape(json.dumps({'kind':'2D surface design proposal, NOT application rendering','letter':'ك','glyphPathSha256':glyph['pathSha256'],'fontSha256':glyph['fontSha256'],'panelPaths':'copied exactly from surface-design.js','newArabicContours':False,'scripture':False},ensure_ascii=False))
defs=f'''<defs>
<path id="glyph" d="{glyph['path']}"/>
<clipPath id="glyphClip" clipPathUnits="userSpaceOnUse"><use href="#glyph"/></clipPath>
{''.join(f'<clipPath id="panel{i}" clipPathUnits="userSpaceOnUse"><path d="{p}"/></clipPath>' for i,p in enumerate(panels))}
<linearGradient id="sapphire" x1="0" y1="0" x2="1" y2=".3" gradientUnits="objectBoundingBox"><stop stop-color="#172e4d"/><stop offset=".48" stop-color="#254b6b"/><stop offset="1" stop-color="#10243f"/></linearGradient>
<linearGradient id="amber"><stop stop-color="#795326"/><stop offset=".32" stop-color="#dfba78"/><stop offset=".55" stop-color="#c99750"/><stop offset="1" stop-color="#886034"/></linearGradient>
<linearGradient id="teal"><stop stop-color="#226574"/><stop offset=".45" stop-color="#6dbebc"/><stop offset=".7" stop-color="#3a8a94"/><stop offset="1" stop-color="#204f65"/></linearGradient>
<linearGradient id="coral"><stop stop-color="#784b64"/><stop offset=".5" stop-color="#cb9299"/><stop offset="1" stop-color="#8b5b76"/></linearGradient>
<filter id="grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".63" numOctaves="2" seed="29"/><feColorMatrix type="saturate" values="0"/></filter>
<clipPath id="detailStem" clipPathUnits="userSpaceOnUse"><rect x="495" y="195" width="75" height="405"/></clipPath>
<g id="art"><use href="#glyph" fill="url(#sapphire)"/><g clip-path="url(#glyphClip)">
<use href="#glyph" fill="none" stroke="#091a30" stroke-width="12"/>
<use href="#glyph" fill="none" stroke="#6a8292" stroke-width="1.2" opacity=".48"/>
{''.join(f'<path d="{p}" fill="url(#{name})" stroke="#091d31" stroke-width="3" stroke-linejoin="round"/>' for p,name in zip(panels,['amber','teal','coral']))}
{engraving}
<rect x="40" y="-20" width="570" height="850" filter="url(#grain)" opacity=".055" style="mix-blend-mode:soft-light"/>
</g></g></defs>'''
# Uniform scaling and Y-up -> screen conversion preserve Arabic proportions/direction.
face=f'''<svg xmlns="http://www.w3.org/2000/svg" width="900" height="1200" viewBox="0 0 900 1200"><title>Amiri kāf — proposed surface design, not a 3D render</title><metadata>{metadata}</metadata>{defs}<rect width="900" height="1200" fill="#050c13"/><text x="60" y="65" font-family="Arial" font-size="13" fill="#c1b58e" letter-spacing="3">SURFACE PROOF · 09 / 2D PROPOSAL</text><use href="#art" transform="translate(72 1050) scale(1.2 -1.2)"/><text x="60" y="1150" font-family="Arial" font-size="13" fill="#91a7b4">Exact Amiri outline · Existing three regions · No 3D implementation</text></svg>'''
(out/'face-proof.svg').write_text(face)
# Labelled board: whole composition plus enlarged excerpts from this same art.
board=f'''<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1200" viewBox="0 0 1600 1200"><title>Letter / Light — surface design approval proof</title><metadata>{metadata}</metadata>{defs}
<rect width="1600" height="1200" fill="#050c13"/>
<g font-family="Arial" fill="#e5ddc7"><text x="70" y="63" font-size="13" letter-spacing="3">QARIAI / SPATIAL</text><text x="1530" y="63" text-anchor="end" font-size="12" letter-spacing="2" fill="#acbaa8">09 / DESIGN PROOF ONLY</text>
<text x="70" y="120" font-size="36" font-family="Georgia">A surface with intention.</text><text x="70" y="151" font-size="15" fill="#9aabb6">One exact Amiri kāf. Three existing regions. Engraving proposed for review.</text>
<use href="#art" transform="translate(100 1052) scale(1.03 -1.03)"/>
<path d="M872 190 V1080" stroke="#263b4c"/>
<text x="930" y="218" font-size="13" letter-spacing="2" fill="#d7b77d">01 / SATIN SAPPHIRE</text><text x="930" y="249" font-size="16">Quiet field. Clear silhouette. No glow.</text>
<text x="930" y="300" font-size="13" letter-spacing="2" fill="#d7b77d">02 / CONTROLLED METAL</text><text x="930" y="331" font-size="16">Amber polish · turquoise satin · coral engraving</text>
<rect x="930" y="357" width="520" height="164" rx="9" fill="#091520" stroke="#273d4d"/>
<svg x="945" y="372" width="490" height="132" viewBox="80 -98 455 95"><g transform="scale(1 -1)"><use href="#art"/></g></svg>
<text x="930" y="550" font-size="13" letter-spacing="2" fill="#d7b77d">03 / UNEQUAL INCISIONS</text><text x="930" y="581" font-size="16">One main course. Sparse branches. Open rests.</text>
<rect x="930" y="607" width="250" height="216" rx="9" fill="#091520" stroke="#273d4d"/>
<svg x="946" y="623" width="218" height="184" viewBox="145 -470 140 160"><g transform="scale(1 -1)"><use href="#art"/></g></svg>
<rect x="1200" y="607" width="250" height="216" rx="9" fill="#091520" stroke="#273d4d"/>
<svg x="1216" y="623" width="218" height="184" viewBox="495 -600 75 405"><g transform="scale(1 -1)" clip-path="url(#detailStem)"><use href="#art"/></g></svg>
<text x="930" y="872" font-size="13" letter-spacing="2" fill="#d7b77d">FIXED FOUNDATION</text><text x="930" y="903" font-size="15" fill="#9aabb6">Original outline and detached component retained.</text><text x="930" y="930" font-size="15" fill="#9aabb6">No new colour regions, ligatures or scripture.</text><text x="930" y="957" font-size="15" fill="#9aabb6">Geometry, framing and lighting remain untouched.</text>
<text x="930" y="1009" font-size="13" fill="#d4b98a">Review the design before any texture baking.</text><text x="930" y="1035" font-size="13" fill="#8c9fae">Hairline resolution and material response remain unproven.</text>
<path d="M70 1104 H1530" stroke="#263b4c"/><text x="70" y="1141" font-size="13" fill="#a3b3bc">Illustrative 2D finish proof — NOT a browser/Quest rendering or a new calligraphic composition.</text><text x="70" y="1167" font-size="12" fill="#788e9f">Original font-derived letter. Surface ornament is nonscriptural. Expert calligraphy approval is not claimed.</text></g></svg>'''
(out/'labelled-proof.svg').write_text(board)
print('Created exact-outline 2D face and labelled material proof')
