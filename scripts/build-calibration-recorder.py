# Offline review artifact only. No application imports or validation switches.
import json,pathlib
root=pathlib.Path(__file__).resolve().parent.parent
sources={'kaf':json.loads((root/'src/orbit-art/generated/kaf-outline.json').read_text())}
sources.update({{'ل':'lam','ف':'fa','ي':'ya'}[k]:v for k,v in json.loads((root/'src/orbit-art/generated/letter-outlines.json').read_text()).items()})
candidates=json.loads((root/'docs/orbit-art-v01/guide-annotations-v01/candidates.json').read_text())
assert all(not r['review']['annotationsApproved'] and not r['review']['fixturesApproved'] for r in candidates.values())
data=json.dumps({'sources':sources,'candidates':candidates},ensure_ascii=False).replace('<','\\u003c')
template=(root/'scripts/calibration-recorder.html').read_text()
(root/'docs/orbit-art-v01/calibration-recorder-v01/recorder.html').write_text(template.replace('__DATA__',data))
