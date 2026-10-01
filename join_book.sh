#!/bin/bash
set -euo pipefail
# Assembles book.json from ch01..ch32.json + meta.json in CWD
python3 - <<'PY'
import json, pathlib
root=pathlib.Path('.')
meta=json.loads((root/'meta.json').read_text(encoding='utf-8'))
chs=[]
for i in range(1, meta['chapterCount']+1):
  p=root/f'ch{i:02d}.json'
  chs.append(json.loads(p.read_text(encoding='utf-8')))
book={'title':meta['title'],'subtitle':meta.get('subtitle'),'author':meta.get('author'),'chapters':chs}
(root/'book.json').write_text(json.dumps(book,ensure_ascii=False),encoding='utf-8')
print('ok',len(chs))
PY
