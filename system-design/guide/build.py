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
            return f'<div class="anim" data-spec="{repl[idx[0]]}"></div>\n<details class="orig"><summary>View text version</summary><pre><code>{H.escape(code)}</code></pre></details>\n'
        return mo.group(0)
    body = re.sub(r'```(\w*)\n(.*?)```', sub, body, flags=re.S)
    body = body.replace('\n---\n', '\n')
    html = markdown.markdown(body, extensions=['tables', 'fenced_code'])
    html = post(key, html)
    return f'<h1 class="sec-title">{H.escape(title)}</h1>\n' + html

QUIZ = {
    1: ('Your single backend server is now CPU-bound at peak traffic. What would you add next?',
        [('CDN', 'A CDN speeds up static files and cuts origin load, but the bottleneck here is application CPU.'),
         ('Load balancer + more app servers', 'Yes. The constraint is compute, so scale the compute tier horizontally and put a load balancer in front.'),
         ('Kafka', 'An event stream helps with asynchronous work and fan-out. It does not add request-handling capacity.'),
         ('Database sharding', 'Sharding addresses database size or write throughput. The database is not the problem yet.')], 1)
}
def post(key, html):
    if key == 1:
        # "system qualities" h2+p pairs -> compact grid
        m = re.search(r'(<h2>Scalability</h2>.*?)(<p>Every component discussed below)', html, re.S)
        if m:
            pairs = re.findall(r'<h2>(.*?)</h2>\s*<p>(.*?)</p>', m.group(1), re.S)
            grid = '<div class="qgrid">' + ''.join(f'<div class="q"><b>{a}</b><span>{b}</span></div>' for a, b in pairs) + '</div>\n'
            html = html[:m.start(1)] + grid + html[m.start(2):]
    if key in QUIZ:
        q, opts, ans = QUIZ[key]
        html += '<div class="quiz"><h2>Why was this component added?</h2><p>' + H.escape(q) + '</p><div class="qopts">' + ''.join(
            f'<button type="button" data-ok="{1 if i == ans else 0}" data-why="{H.escape(w, quote=True)}">{H.escape(o)}</button>' for i, (o, w) in enumerate(opts)) + '</div><p class="qwhy" aria-live="polite"></p></div>'
    return html

manifest = []
for gname, keys in GROUPS:
    items = []
    for k in keys:
        if k not in sections: continue
        title = sections[k][0]
        sid = f's{k}'
        ready = k in READY
        words = len(re.findall(r'\w+', sections[k][1]))
        items.append({'id': sid, 'title': title, 'ready': ready, 'min': max(1, round(words / 180))})
        if ready:
            open(f'sections/{sid}.html', 'w').write(render(k))
    manifest.append({'group': gname, 'items': items})
intro_html = markdown.markdown(intro.split('\n', 1)[1] if intro.startswith('#') else intro)
open('manifest.js', 'w').write('window.GUIDE = ' + json.dumps({'intro': intro_html, 'groups': manifest}) + ';\n')
print('sections:', len(sections), 'ready:', sorted(k for k in READY), 'files:', sum(1 for g in manifest for i in g['items'] if i['ready']))
