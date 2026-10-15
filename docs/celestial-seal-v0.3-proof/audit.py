"""Offline reproducible audit of captured primary-source text; no artwork or app imports."""
from pathlib import Path
import csv,hashlib,itertools,json,unicodedata
root=Path(__file__).resolve().parent
s=json.loads((root/'source-snapshots.json').read_text(encoding='utf-8'))
words=s['primary']['words'];a=' '.join(words);b=s['secondary']['verse']
expected='fbcf48fe24468963b5bdb0a5e729e4bbbc3fa1feb8cc5558fbc0d1a3f09da2fc'
with (root/'character-audit.csv').open('w',encoding='utf-8',newline='') as f:
 w=csv.writer(f,lineterminator="\n");w.writerow(['index_zero_based','primary_codepoint','primary_name','secondary_codepoint','matches'])
 for i,(x,y) in enumerate(itertools.zip_longest(a,b,fillvalue='')):
  w.writerow([i,f'U+{ord(x):04X}' if x else 'MISSING',unicodedata.name(x,'UNNAMED') if x else 'MISSING',f'U+{ord(y):04X}' if y else 'MISSING',x==y])
assert a==b,'Character-level source disagreement'
assert hashlib.sha256(a.encode('utf-8')).hexdigest()==expected,'Selected representation changed'
assert len(words)==18 and len(a)==137 and a.count('\u06d6')==2
assert '\n' not in a and '\r' not in a
assert not any(c in a for c in '\u200e\u200f\u202a\u202b\u202c\u202d\u202e\u2066\u2067\u2068\u2069')
allocation=[];start=0
for i,word in enumerate(words,1):
 band='C1' if i<=5 else 'C2' if i<=12 else 'C3' if i<=14 else 'C4'
 allocation.append({'wordId':f'w{i:02}','text':word,'band':band,'codepointSpan':[start,start+len(word)],'pauseSign':'U+06D6' if '\u06d6' in word else None})
 start+=len(word)+1
assert ' '.join(x['text'] for x in allocation)==a
assert [x['wordId'] for x in allocation if x['pauseSign']]==['w05','w12']
result={'status':'PASS','checked':s['checked'],'sha256_utf8_without_newline':expected,'codepoints':len(a),'utf8_bytes':len(a.encode()),'words':len(words),'combining_marks':sum(unicodedata.category(c).startswith('M') for c in a),'pause_signs':[i for i,c in enumerate(a) if c=='\u06d6'],'normalization_applied':False,'band_word_counts':{'C1':5,'C2':7,'C3':2,'C4':4},'allocation':allocation,'limits':'Audits extracted text and proposed allocation, not source HTTP bytes, calligraphy vectors, font appearance, religious authenticity or recitation stopping rules.'}
(root/'audit-result.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({k:v for k,v in result.items() if k!='allocation'},indent=2))
