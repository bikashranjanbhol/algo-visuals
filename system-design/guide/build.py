"""Builds section fragments + manifest for the guide page. Only sections listed in READY are rendered.
Usage: python3 build.py  (run from this folder)"""
import re, json, html as H, markdown

READY = {  # section number -> {block index: spec key}  (diagram blocks replaced by animations; original kept in a fold)
    1: {0: 'g1_simple', 1: 'g1_evolved', 2: 'g1_surround'},
}
GROUPS = [
    ('Start here', [1]), ('Networking & entry layer', list(range(2, 8))), ('Compute', list(range(8, 14))),
    ('Databases', list(range(14, 24))), ('Caching', list(range(24, 32))), ('Messaging & events', list(range(32, 38))),
    ('Services', list(range(38, 43))), ('Communication', [43, 44]), ('Consistency & transactions', list(range(45, 55))),
    ('Reliability', list(range(55, 68))), ('Rate limiting', list(range(68, 74))), ('Authentication & authorization', list(range(74, 82))),
    ('Storage', list(range(82, 86))), ('Search', [86, 87]), ('Distributed building blocks', list(range(88, 94))),
    ('Observability', list(range(94, 100))), ('Background & data processing', list(range(100, 107))),
    ('Configuration & secrets', list(range(107, 111))), ('Security', list(range(111, 120))), ('Multi-region', list(range(120, 126))),
    ('Putting it together', list(range(126, 134))), ('Growing from 100 to 100M users', [134, 'S1', 'S2', 'S3', 'S4', 'S5', 'S6']),
    ('Thinking like a designer', list(range(135, 143))),
]

md = open('guide.md').read()
parts = re.split(r'(?m)^# ', md)
intro = parts[0]
sections = {}
order = []
stage = 0
for p in parts[1:]:
    title = p.split('\n', 1)[0].strip()
    m = re.match(r'(\d+)\.', title)
    if m: key = int(m.group(1))
    elif title.startswith('Stage'): stage += 1; key = f'S{stage}'
    else: continue
    sections[key] = (title, p.split('\n', 1)[1])
    order.append(key)

def render(key):
    title, body = sections[key]
    repl = READY.get(key, {})
    idx = [-1]
    def sub(mo):
        idx[0] += 1
        lang, code = mo.group(1), mo.group(2)
        if idx[0] in repl:
            return f'<div class="anim" data-spec="{repl[idx[0]]}"></div>\n<details class="orig"><summary>Original text diagram</summary><pre><code>{H.escape(code)}</code></pre></details>\n'
        return mo.group(0)
    body = re.sub(r'```(\w*)\n(.*?)```', sub, body, flags=re.S)
    body = body.replace('\n---\n', '\n')
    html = markdown.markdown(body, extensions=['tables', 'fenced_code'])
    return f'<h1 class="sec-title">{H.escape(title)}</h1>\n' + html

manifest = []
for gname, keys in GROUPS:
    items = []
    for k in keys:
        if k not in sections: continue
        title = sections[k][0]
        sid = f's{k}'
        ready = k in READY
        items.append({'id': sid, 'title': title, 'ready': ready})
        if ready:
            open(f'sections/{sid}.html', 'w').write(render(k))
    manifest.append({'group': gname, 'items': items})
intro_html = markdown.markdown(intro.split('\n', 1)[1] if intro.startswith('#') else intro)
open('manifest.js', 'w').write('window.GUIDE = ' + json.dumps({'intro': intro_html, 'groups': manifest}) + ';\n')
print('sections:', len(sections), 'ready:', sorted(k for k in READY), 'files:', sum(1 for g in manifest for i in g['items'] if i['ready']))
