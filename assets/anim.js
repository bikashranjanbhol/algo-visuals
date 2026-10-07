// Animated diagram engine for guide pages.
// A diagram is <div class="anim" data-spec="key"></div>; specs live in window.ANIM_SPECS.
// kind "flow": nodes on a grid, edges, and frames that send packets and change node states.
// Special kinds: ring, bucket, percentile, waterfall, backoff.
(function () {
  const NS = 'http://www.w3.org/2000/svg';
  const COLW = 160, ROWH = 86, NW = 128, NH = 48, PAD = 14;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const el = (tag, attrs = {}, parent) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; };
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');

  /* ---------- flow ---------- */
  function flow(root, spec) {
    const nodes = spec.nodes, byId = {};
    let maxC = 0, maxR = 0;
    nodes.forEach(n => { byId[n.id] = n; n.w = (n.w || 1); maxC = Math.max(maxC, n.c + n.w - 1); maxR = Math.max(maxR, n.r); });
    const TOP = nodes.some(n => n.kind === 'group' && n.r === 0) ? 28 : 0;
    const W = PAD * 2 + maxC * COLW + NW, H = PAD * 2 + maxR * ROWH + NH + 28 + TOP;
    const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, class: 'anim-svg', role: 'img', 'aria-label': spec.alt || 'Animated diagram' });
    root.appendChild(svg);
    const gE = el('g', {}, svg), gN = el('g', {}, svg), gP = el('g', {}, svg);
    const pos = n => ({ x: PAD + n.c * COLW, y: PAD + TOP + n.r * ROWH, w: NW + (n.w - 1) * COLW, h: n.h ? n.h * ROWH - (ROWH - NH) : NH });
    const center = n => { const p = pos(n); return { x: p.x + p.w / 2, y: p.y + p.h / 2 }; };
    // groups first (background)
    nodes.filter(n => n.kind === 'group').forEach(n => {
      const p = pos(n); const g = el('g', { class: 'an-group' }, gN);
      el('rect', { x: p.x - 10, y: p.y - 24, width: p.w + 20, height: p.h + 34, rx: 16 }, g);
      const t = el('text', { x: p.x, y: p.y - 8, class: 'an-glabel' }, g); t.textContent = n.label;
    });
    const nodeEls = {};
    nodes.filter(n => n.kind !== 'group').forEach(n => {
      const p = pos(n); const g = el('g', { class: 'an-node ' + (n.kind || 'box'), 'data-id': n.id }, gN);
      el('rect', { x: p.x, y: p.y, width: p.w, height: p.h, rx: n.kind === 'client' ? p.h / 2 : 12 }, g);
      const t = el('text', { x: p.x + p.w / 2, y: p.y + (n.sub ? p.h / 2 - 2 : p.h / 2 + 5), 'text-anchor': 'middle', class: 'an-label' }, g); t.textContent = n.label;
      if (n.sub) { const s = el('text', { x: p.x + p.w / 2, y: p.y + p.h / 2 + 15, 'text-anchor': 'middle', class: 'an-sub' }, g); s.textContent = n.sub; }
      const badge = el('text', { x: p.x + p.w - 6, y: p.y - 6, 'text-anchor': 'end', class: 'an-badge' }, g); badge.textContent = '';
      nodeEls[n.id] = g;
      if (n.hidden) g.classList.add('hidden');
    });
    // edges
    const edgeEls = {};
    function anchors(a, b) {
      const pa = pos(a), pb = pos(b), ca = center(a), cb = center(b);
      if (a.r === b.r) return a.c < b.c ? [{ x: pa.x + pa.w, y: ca.y }, { x: pb.x, y: cb.y }] : [{ x: pa.x, y: ca.y }, { x: pb.x + pb.w, y: cb.y }];
      if (a.r < b.r) return [{ x: ca.x, y: pa.y + pa.h }, { x: cb.x, y: pb.y }];
      return [{ x: ca.x, y: pa.y }, { x: cb.x, y: pb.y + pb.h }];
    }
    (spec.edges || []).forEach(e => {
      const [a, b, opt = {}] = e, A = byId[a], B = byId[b];
      const [s, t] = anchors(A, B);
      let d;
      if (A.r === B.r || A.c === B.c) d = `M${s.x} ${s.y} L${t.x} ${t.y}`;
      else { const my = (s.y + t.y) / 2; d = `M${s.x} ${s.y} C ${s.x} ${my}, ${t.x} ${my}, ${t.x} ${t.y}`; }
      const key = a + '>' + b;
      const p = el('path', { d, class: 'an-edge' + (opt.dashed ? ' dashed' : '') + (opt.both ? ' both' : ''), 'marker-end': 'url(#an-arrow)' }, gE);
      if (opt.both) p.setAttribute('marker-start', 'url(#an-arrow-rev)');
      if (opt.label) { const m = p.getPointAtLength ? null : null; const lx = (s.x + t.x) / 2, ly = (s.y + t.y) / 2 - 6; const tl = el('text', { x: lx, y: ly, 'text-anchor': 'middle', class: 'an-elabel' }, gE); tl.textContent = opt.label; }
      edgeEls[key] = p; edgeEls[b + '>' + a] = { rev: p };
      if (opt.hidden) { p.classList.add('hidden'); }
    });
    // markers
    const defs = el('defs', {}, svg);
    const mk = (id, rev) => { const m = el('marker', { id, viewBox: '0 0 10 10', refX: rev ? 0 : 10, refY: 5, markerWidth: 8, markerHeight: 8, markerUnits: 'userSpaceOnUse', orient: rev ? 'auto-start-reverse' : 'auto' }, defs); el('path', { d: 'M0 0 10 5 0 10z', class: 'an-ah' }, m); };
    mk('an-arrow', false); mk('an-arrow-rev', true);
    // caption
    const cap = document.createElement('div'); cap.className = 'anim-cap'; root.appendChild(cap);

    // frames
    const frames = spec.frames || (spec.routes || []).map(r => ({ send: [r], cap: r.cap }));
    if (!frames.length) { cap.textContent = spec.cap || ''; return; }
    let fi = 0, timer = null, running = false, rafs = [];
    function setStates(map, on) {
      for (const id in map) { const g = nodeEls[id]; if (!g) continue; g.classList.remove('ok', 'fail', 'off', 'on', 'warn'); if (on && map[id]) g.classList.add(map[id]); }
    }
    function setBadges(map) { for (const id in nodeEls) nodeEls[id].querySelector('.an-badge').textContent = (map && map[id]) || ''; }
    function sendPacket(route, delay) {
      const path = route.path, label = route.label || '', color = route.color || '';
      const g = el('g', { class: 'an-packet ' + color }, gP);
      el('circle', { r: 7 }, g);
      const t = el('text', { y: -12, 'text-anchor': 'middle' }, g); t.textContent = label;
      const dur = route.dur || 650;
      const legs = [];
      for (let i = 0; i < path.length - 1; i++) {
        let e = edgeEls[path[i] + '>' + path[i + 1]], rev = false;
        if (e && e.rev) { e = e.rev; rev = true; }
        if (!e) { // ad-hoc straight line
          const [s, tt] = anchors(byId[path[i]], byId[path[i + 1]]);
          e = el('path', { d: `M${s.x} ${s.y} L${tt.x} ${tt.y}`, class: 'an-edge temp' }, gE);
        }
        legs.push({ e, rev });
      }
      const start = performance.now() + (delay || 0);
      let legIdx = 0;
      function step(now) {
        if (now < start) { rafs.push(requestAnimationFrame(step)); return; }
        const leg = legs[legIdx], L = leg.e.getTotalLength(), t0 = start + legIdx * dur, k = Math.min(1, (now - t0) / dur);
        const pt = leg.e.getPointAtLength(leg.rev ? L * (1 - k) : L * k);
        g.setAttribute('transform', `translate(${pt.x} ${pt.y})`);
        if (k >= 1) { const id = path[legIdx + 1]; const ne = nodeEls[id]; if (ne) { ne.classList.add('pulse'); setTimeout(() => ne.classList.remove('pulse'), 350); } legIdx++; if (legIdx >= legs.length) { setTimeout(() => g.remove(), 120); return; } }
        rafs.push(requestAnimationFrame(step));
      }
      rafs.push(requestAnimationFrame(step));
      return (delay || 0) + legs.length * dur;
    }
    function playFrame() {
      const f = frames[fi];
      gP.innerHTML = ''; rafs.forEach(cancelAnimationFrame); rafs = [];
      gE.querySelectorAll('.temp').forEach(x => x.remove());
      cap.textContent = f.cap || '';
      if (f.states) { for (const id in nodeEls) nodeEls[id].classList.remove('ok', 'fail', 'off', 'on', 'warn'); setStates(f.states, true); }
      if (f.show) f.show.forEach(id => nodeEls[id] && nodeEls[id].classList.remove('hidden'));
      if (f.hide) f.hide.forEach(id => nodeEls[id] && nodeEls[id].classList.add('hidden'));
      if (f.edgesShow) f.edgesShow.forEach(k => edgeEls[k] && edgeEls[k].classList && edgeEls[k].classList.remove('hidden'));
      if (f.edgesHide) f.edgesHide.forEach(k => edgeEls[k] && edgeEls[k].classList && edgeEls[k].classList.add('hidden'));
      if (f.labels) for (const id in f.labels) { const ne = nodeEls[id]; if (ne) ne.querySelector('.an-label').textContent = f.labels[id]; }
      setBadges(f.badges);
      let longest = 0;
      (f.send || []).forEach((r, i) => { longest = Math.max(longest, sendPacket(r, r.delay != null ? r.delay : i * 250)); });
      const t = f.t || (longest + 700);
      timer = setTimeout(() => { fi = (fi + 1) % frames.length; if (running) playFrame(); }, t);
    }
    function start() { if (running || reduce) return; running = true; fi = 0; playFrame(); }
    function stop() { running = false; clearTimeout(timer); rafs.forEach(cancelAnimationFrame); rafs = []; gP.innerHTML = ''; }
    if (reduce) { cap.textContent = frames.map(f => f.cap).filter(Boolean).join(' ') || spec.cap || ''; return; }
    observe(root, start, stop);
  }

  /* ---------- visibility ---------- */
  function observe(root, start, stop) {
    if (!('IntersectionObserver' in window)) { start(); return; }
    new IntersectionObserver(es => es.forEach(e => e.isIntersecting ? start() : stop()), { threshold: 0.2 }).observe(root);
  }

  /* ---------- ring (consistent hashing) ---------- */
  function ring(root, spec) {
    const W = 520, H = 360, cx = 200, cy = 180, R = 130;
    const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, class: 'anim-svg' }, root);
    el('circle', { cx, cy, r: R, class: 'an-ring' }, svg);
    const cap = document.createElement('div'); cap.className = 'anim-cap'; root.appendChild(cap);
    const servers = [{ id: 'A', a: 0 }, { id: 'B', a: 90 }, { id: 'C', a: 180 }, { id: 'D', a: 270 }];
    const pt = a => { const r = (a - 90) * Math.PI / 180; return { x: cx + R * Math.cos(r), y: cy + R * Math.sin(r) }; };
    const gS = el('g', {}, svg), gK = el('g', {}, svg), legend = el('g', {}, svg);
    function drawServers() {
      gS.innerHTML = '';
      servers.forEach(s => { const p = pt(s.a); const g = el('g', { class: 'an-node box' + (s.isNew ? ' ok' : '') }, gS); el('rect', { x: p.x - 36, y: p.y - 16, width: 72, height: 32, rx: 10 }, g); const t = el('text', { x: p.x, y: p.y + 5, 'text-anchor': 'middle', class: 'an-label' }, g); t.textContent = 'Server ' + s.id; });
    }
    const lt = el('text', { x: 370, y: 60, class: 'an-sub' }, legend); lt.textContent = 'A key hashes to a point on the ring,';
    const lt2 = el('text', { x: 370, y: 78, class: 'an-sub' }, legend); lt2.textContent = 'then walks clockwise to the next server.';
    drawServers();
    let keys = [], timer = null, running = false;
    function owner(a) { const sorted = servers.slice().sort((p, q) => p.a - q.a); return sorted.find(s => s.a >= a) || sorted[0]; }
    function addKey(a, label) {
      const p = pt(a); const g = el('g', { class: 'an-key' }, gK); el('circle', { cx: 0, cy: 0, r: 6 }, g); const t = el('text', { y: -10, 'text-anchor': 'middle' }, g); t.textContent = label;
      g.setAttribute('transform', `translate(${p.x} ${p.y})`);
      const k = { a, g, label }; keys.push(k); return k;
    }
    function moveKey(k, toA, cb) {
      const from = k.a; let to = toA; if (to < from) to += 360; const t0 = performance.now(), dur = 900;
      (function step(now) { const u = Math.min(1, (now - t0) / dur); const a = from + (to - from) * u; const p = pt(a); k.g.setAttribute('transform', `translate(${p.x} ${p.y})`); if (u < 1) requestAnimationFrame(step); else { k.a = toA; cb && cb(); } })(t0);
    }
    const script = [
      () => { cap.textContent = 'Keys land at their hash position and move clockwise to the next server.'; keys.forEach(k => k.g.remove()); keys = []; servers.length = 4; servers.forEach(s => s.isNew = false); drawServers(); },
      () => { const k = addKey(30, 'user:7'); moveKey(k, owner(30).a); },
      () => { const k = addKey(140, 'user:42'); moveKey(k, owner(140).a); },
      () => { const k = addKey(300, 'user:19'); moveKey(k, owner(300).a); },
      () => { const k = addKey(320, 'user:88'); moveKey(k, owner(320).a); },
      () => { cap.textContent = 'Add Server E between D and A. Only the keys in that slice move; everything else stays put.'; servers.push({ id: 'E', a: 330, isNew: true }); drawServers(); },
      () => { keys.forEach(k => { const o = owner(k.a === 0 ? 0 : k.a); }); const moved = keys.filter(k => k.a === 0 || k.a === 360).length; const toE = keys.filter(k => k.label === 'user:19' || k.label === 'user:88'); toE.forEach(k => { k.a = k.label === 'user:19' ? 300 : 320; moveKey(k, 330); }); cap.textContent = 'user:19 and user:88 move to E. user:7 and user:42 are untouched. With hash(key) % n, most keys would have moved.'; }
    ];
    let i = 0;
    function tick() { script[i](); i = (i + 1) % script.length; timer = setTimeout(tick, i === 0 ? 2600 : 1500); }
    function start() { if (running || reduce) return; running = true; i = 0; tick(); }
    function stop() { running = false; clearTimeout(timer); }
    if (reduce) { script[0](); [30, 140, 300, 320].forEach((a, j) => { const k = addKey(owner(a).a, ['user:7', 'user:42', 'user:19', 'user:88'][j]); }); return; }
    observe(root, start, stop);
  }

  /* ---------- token bucket ---------- */
  function bucket(root, spec) {
    const W = 560, H = 220, cap = 10;
    const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, class: 'anim-svg' }, root);
    const capEl = document.createElement('div'); capEl.className = 'anim-cap'; root.appendChild(capEl);
    el('rect', { x: 40, y: 40, width: 220, height: 120, rx: 14, class: 'an-bucket' }, svg);
    const lbl = el('text', { x: 150, y: 30, 'text-anchor': 'middle', class: 'an-sub' }, svg); lbl.textContent = 'bucket (capacity 10, refills 1 token / 0.5 s)';
    const gT = el('g', {}, svg), gR = el('g', {}, svg);
    const stat = el('text', { x: 300, y: 70, class: 'an-label' }, svg), stat2 = el('text', { x: 300, y: 100, class: 'an-label ok-t' }, svg), stat3 = el('text', { x: 300, y: 130, class: 'an-label fail-t' }, svg);
    let tokens = cap, allowed = 0, rejected = 0, timer = null, running = false, phase = 0;
    function draw() {
      gT.innerHTML = '';
      for (let i = 0; i < tokens; i++) el('circle', { cx: 60 + (i % 5) * 42, cy: 70 + Math.floor(i / 5) * 42, r: 14, class: 'an-token' }, gT);
      stat.textContent = `tokens: ${tokens}`; stat2.textContent = `allowed: ${allowed}`; stat3.textContent = `rejected (429): ${rejected}`;
    }
    function request(n) {
      for (let i = 0; i < n; i++) { if (tokens > 0) { tokens--; allowed++; } else rejected++; }
      draw();
    }
    const steps = [
      () => { capEl.textContent = 'A burst of 6 requests arrives: each one takes a token.'; request(6); },
      () => { capEl.textContent = 'Another burst of 6: only 4 tokens are left, so 2 requests are rejected with 429.'; request(6); },
      () => { capEl.textContent = 'Tokens refill at a steady rate, so a client can burst briefly but not exceed the long-run rate.'; },
      () => { request(3); capEl.textContent = 'A small burst after refilling is allowed again.'; },
      () => { tokens = cap; allowed = 0; rejected = 0; draw(); capEl.textContent = 'Reset.'; }
    ];
    let i = 0, refill;
    function start() { if (running || reduce) return; running = true; tokens = cap; allowed = 0; rejected = 0; i = 0; draw(); refill = setInterval(() => { if (tokens < cap) { tokens++; draw(); } }, 500); timer = setInterval(() => { steps[i](); i = (i + 1) % steps.length; }, 2200); }
    function stop() { running = false; clearInterval(timer); clearInterval(refill); }
    draw(); if (reduce) { capEl.textContent = 'Each request consumes a token; tokens refill over time; an empty bucket means 429.'; return; }
    observe(root, start, stop);
  }

  /* ---------- percentile ---------- */
  function percentile(root, spec) {
    const W = 600, H = 240, n = 100;
    const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, class: 'anim-svg' }, root);
    const capEl = document.createElement('div'); capEl.className = 'anim-cap'; root.appendChild(capEl);
    const vals = []; for (let i = 0; i < n; i++) vals.push(i < 50 ? 60 + i * 0.8 : i < 95 ? 100 + (i - 50) * 2 : i < 99 ? 200 + (i - 95) * 60 : 2400);
    const maxV = 2400, x0 = 40, bw = 5, base = 200, sc = v => Math.min(150, v / 400 * 150);
    const gB = el('g', {}, svg), gM = el('g', {}, svg);
    vals.forEach((v, i) => { el('rect', { x: x0 + i * bw, y: base - sc(v), width: bw - 1, height: sc(v), class: 'an-bar' + (v > 400 ? ' hot' : '') }, gB); });
    const axis = el('text', { x: x0, y: base + 18, class: 'an-sub' }, svg); axis.textContent = '100 requests sorted by latency (a few are far off the chart)';
    const marks = [[50, 'P50 = 100 ms'], [95, 'P95 = 190 ms'], [99, 'P99 = 2.4 s']];
    const avg = vals.reduce((a, b) => a + b) / n;
    function mark(i, label, cls) { const x = x0 + i * bw; el('line', { x1: x, y1: 40, x2: x, y2: base, class: 'an-mark ' + cls }, gM); const t = el('text', { x: x + 4, y: 52 + (cls === 'p99' ? 0 : cls === 'p95' ? 16 : 32), class: 'an-sub ' + cls }, gM); t.textContent = label; }
    let timer, running = false, step = 0;
    const frames = [
      () => { gM.innerHTML = ''; capEl.textContent = `The average is about ${Math.round(avg)} ms, which looks fine. It hides the slow tail.`; },
      () => { mark(50, 'P50 = 100 ms', 'p50'); capEl.textContent = 'P50: half of all requests are faster than this.'; },
      () => { mark(95, 'P95 = 190 ms', 'p95'); capEl.textContent = 'P95: 95% are faster. Still looks healthy.'; },
      () => { mark(99, 'P99 = 2.4 s', 'p99'); capEl.textContent = 'P99: the slowest 1% wait over two seconds. That is what your unhappiest users feel.'; }
    ];
    function start() { if (running || reduce) return; running = true; step = 0; timer = setInterval(() => { frames[step](); step = (step + 1) % frames.length; }, 2000); }
    function stop() { running = false; clearInterval(timer); }
    if (reduce) { frames.forEach(f => f()); return; }
    observe(root, start, stop);
  }

  /* ---------- waterfall (tracing) ---------- */
  function waterfall(root, spec) {
    const rows = spec.rows, W = 600, H = 30 + rows.length * 36 + 10, total = rows.reduce((a, r) => a + r.ms, 0);
    const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, class: 'anim-svg' }, root);
    const capEl = document.createElement('div'); capEl.className = 'anim-cap'; root.appendChild(capEl);
    const x0 = 150, span = 420; let acc = 0;
    const bars = rows.map((r, i) => {
      const y = 20 + i * 36; const t = el('text', { x: x0 - 10, y: y + 17, 'text-anchor': 'end', class: 'an-label' }, svg); t.textContent = r.label;
      const b = el('rect', { x: x0 + acc / total * span, y, width: 0, height: 24, rx: 6, class: 'an-wbar' + (r.hot ? ' hot' : '') }, svg);
      const v = el('text', { x: x0 + acc / total * span + 6, y: y + 17, class: 'an-wval' }, svg); v.textContent = '';
      const full = r.ms / total * span; acc += r.ms; return { b, v, full, r };
    });
    let running = false, timer, i = 0;
    function animateBar(k) { const bar = bars[k]; const t0 = performance.now(), dur = Math.max(250, Math.min(1100, bar.full * 2.5)); (function step(now) { const u = Math.min(1, (now - t0) / dur); bar.b.setAttribute('width', bar.full * u); if (u < 1) requestAnimationFrame(step); else { bar.v.textContent = bar.r.text; } })(t0); return dur; }
    function reset() { bars.forEach(b => { b.b.setAttribute('width', 0); b.v.textContent = ''; }); }
    function next() { if (!running) return; if (i === 0) { reset(); capEl.textContent = spec.cap0 || 'One request, one trace id, timing recorded at every hop.'; } const d = animateBar(i); const last = i === bars.length - 1; i = (i + 1) % bars.length; timer = setTimeout(() => { if (last) { capEl.textContent = spec.cap1 || ''; timer = setTimeout(next, 2200); } else next(); }, d + 150); }
    function start() { if (running || reduce) return; running = true; i = 0; next(); }
    function stop() { running = false; clearTimeout(timer); }
    if (reduce) { bars.forEach(b => { b.b.setAttribute('width', b.full); b.v.textContent = b.r.text; }); capEl.textContent = spec.cap1 || ''; return; }
    observe(root, start, stop);
  }

  /* ---------- backoff ---------- */
  function backoff(root, spec) {
    const W = 600, H = 190;
    const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, class: 'anim-svg' }, root);
    const capEl = document.createElement('div'); capEl.className = 'anim-cap'; root.appendChild(capEl);
    const x0 = 120, span = 440, T = 16; // seconds shown
    const row = (y, label) => { const t = el('text', { x: x0 - 10, y: y + 5, 'text-anchor': 'end', class: 'an-label' }, svg); t.textContent = label; el('line', { x1: x0, y1: y, x2: x0 + span, y2: y, class: 'an-axis' }, svg); };
    row(60, 'naive retry'); row(130, 'exponential backoff');
    for (let s = 0; s <= T; s += 4) { const t = el('text', { x: x0 + s / T * span, y: 170, 'text-anchor': 'middle', class: 'an-sub' }, svg); t.textContent = s + 's'; }
    const gD = el('g', {}, svg);
    const naive = []; for (let s = 0; s <= T; s += 0.5) naive.push(s);
    const expo = [0, 1, 3, 7, 15].map((s, i) => s + (i ? (Math.random() * 0.6 - 0.3) : 0));
    let running = false, timer, t = 0;
    function draw(tNow) {
      gD.innerHTML = '';
      naive.filter(s => s <= tNow).forEach(s => el('circle', { cx: x0 + s / T * span, cy: 60, r: 5, class: 'an-dot fail' }, gD));
      expo.filter(s => s <= tNow).forEach(s => el('circle', { cx: x0 + s / T * span, cy: 130, r: 6, class: 'an-dot ok' }, gD));
      const pl = el('line', { x1: x0 + tNow / T * span, y1: 30, x2: x0 + tNow / T * span, y2: 150, class: 'an-mark p50' }, gD);
    }
    function start() { if (running || reduce) return; running = true; t = 0; capEl.textContent = 'The service is down. Naive retries hammer it every half second; backoff waits 1, 2, 4, 8 seconds (with jitter).'; timer = setInterval(() => { t += 0.25; if (t > T) t = 0; draw(t); }, 90); }
    function stop() { running = false; clearInterval(timer); }
    draw(reduce ? T : 0); if (reduce) { capEl.textContent = 'Naive retries hammer a failing service; exponential backoff spaces attempts out.'; return; }
    observe(root, start, stop);
  }

  const KINDS = { flow, ring, bucket, percentile, waterfall, backoff };
  function mount(root) {
    const spec = (window.ANIM_SPECS || {})[root.dataset.spec];
    if (!spec) { root.textContent = 'Missing diagram: ' + root.dataset.spec; return; }
    root.classList.add('anim-mounted');
    (KINDS[spec.kind || 'flow'])(root, spec);
  }
  document.addEventListener('DOMContentLoaded', () => document.querySelectorAll('.anim').forEach(mount));
})();
