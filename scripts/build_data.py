#!/usr/bin/env python3
"""Turn the Tantraraja Markdown chapters into HTML fragments for the reader.
Usage: python3 -I scripts/build_data.py <md-dir> <md-iast-dir> <repo-root>
"""
import json, re, sys, markdown
from pathlib import Path
md_dir, iast_dir, root = map(Path, sys.argv[1:4])
def conv(text):
    # Devanagari digits followed by '. ' must not become list items
    text = re.sub(r'(?m)^([०-९0-9]+)\. ', r'\1\\. ', text)
    html = markdown.markdown(text, output_format='html')
    html = re.sub(r'<em>(प्\.[^<]*|p\.[^<]*)</em>', r'<span class="pg">\1</span>', html)
    return html
toc = []
for f in sorted(md_dir.glob('*.md')):
    k = f.stem
    for d, src in (('dev', f), ('iast', iast_dir / f.name)):
        t = src.read_text(encoding='utf-8')
        title = t.split('\n', 1)[0].lstrip('# ').strip()
        (root / 'data' / d / f'{k}.html').write_text(conv(t), encoding='utf-8')
        if d == 'dev': dev_title = title
        else: iast_title = title
    toc.append({'id': k, 'dev': dev_title, 'iast': iast_title})
(root / 'data' / 'toc.json').write_text(json.dumps(toc, ensure_ascii=False, indent=1), encoding='utf-8')
print(len(toc), 'chapters')
