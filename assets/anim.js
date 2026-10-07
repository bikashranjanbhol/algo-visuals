// Animated diagram engine for guide pages.
// <div class="anim" data-spec="key"></div>; specs live in window.ANIM_SPECS.
// Every diagram exposes steps and gets Back / Play-Pause / Next controls.
(function () {
  const NS = 'http://www.w3.org/2000/svg';
  const ROWH = 100, NH = 50, PAD = 16, GAP = 84, MINW = 110;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const el = (tag, attrs = {}, parent) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; };
  const textW = (s, size = 12.5) => (String(s || '').length * size * 0.6);

  /* ---------- controls shared by every kind ---------- */
  // ctl: { count, show(i, animate) -> ms, hold(i) -> ms } ; engine handles the play loop, visibility and buttons
  function attachControls(root, ctl) {
    const bar = document.createElement('div'); bar.className = 'anim-bar';
    const I = { back: '<svg viewBox="0 0 16 16"><path d="M11 2v12L3 8z"/></svg>', next: '<svg viewBox="0 0 16 16"><path d="M5 2v12l8-6z"/></svg>', play: '<svg viewBox="0 0 16 16"><path d="M4 2v12l10-6z"/></svg>', pause: '<svg viewBox="0 0 16 16"><path d="M3 2h4v12H3zM9 2h4v12H9z"/></svg>' };
    bar.innerHTML = `<button type="button" class="an-btn" data-a="back" aria-label="Back">${I.back}<span>Back</span></button><button type="button" class="an-btn play" data-a="play" aria-label="Play">${I.play}<span>Play</span></button><button type="button" class="an-btn" data-a="next" aria-label="Next"><span>Next</span>${I.next}</button><span class="an-count"></span>`;
    root.appendChild(bar);
    const btn = a => bar.querySelector(`[data-a="${a}"]`), count = bar.querySelector('.an-count');
    let i = -1, playing = false, timer = null, userPaused = false;
    function show(k, animate) {
      i = (k + ctl.count) % ctl.count;
      clearTimeout(timer);
      const ms = ctl.show(i, animate && !reduce) || 0;
      count.textContent = `${i + 1} / ${ctl.count}`;
      if (playing) timer = setTimeout(() => show(i + 1, true), Math.max(ms, 0) + (ctl.hold ? ctl.hold(i) : 900));
    }
    function setPlaying(p) { playing = p; btn('play').innerHTML = (p ? I.pause : I.play) + `<span>${p ? 'Pause' : 'Play'}</span>`; btn('play').setAttribute('aria-label', p ? 'Pause' : 'Play'); if (!p) clearTimeout(timer); }
    btn('play').onclick = () => { if (playing) { setPlaying(false); userPaused = true; } else { userPaused = false; setPlaying(true); show(i < 0 ? 0 : i + 1, true); } };
    btn('next').onclick = () => { setPlaying(false); userPaused = true; show(i + 1, true); };
    btn('back').onclick = () => { setPlaying(false); userPaused = true; show(i - 1, true); };
    const start = () => { if (!playing && !userPaused) { setPlaying(true); show(0, true); } };
    const stop = () => { if (playing) setPlaying(false); };
    if (reduce) { show(ctl.count - 1, false); return; }
    show(0, false);
    if ('IntersectionObserver' in window) new IntersectionObserver(es => es.forEach(e => e.isIntersecting ? start() : stop()), { threshold: 0.25 }).observe(root); else start();
  }

  /* ---------- flow ---------- */
  function flow(root, spec) {
    const nodes = spec.nodes, byId = {};
    let maxC = 0, maxR = 0;
    nodes.forEach(n => { byId[n.id] = n; n.w = n.w || 1; maxC = Math.max(maxC, n.c + n.w - 1); maxR = Math.max(maxR, n.r); });
    const colW = []; for (let c = 0; c <= maxC; c++) colW[c] = MINW;
    nodes.forEach(n => { if (n.kind === 'group' || n.w > 1) return; const w = Math.max(textW(n.label) + 28, textW(n.sub, 10.5) + 24, MINW); colW[n.c] = Math.max(colW[n.c], Math.ceil(w)); });
    const colX = []; let x = PAD; for (let c = 0; c <= maxC; c++) { colX[c] = x; x += colW[c] + GAP; }
    const TOP = nodes.some(n => n.kind === 'group' && n.r === 0) ? 30 : 10;
    const W = x - GAP + PAD, H = PAD + TOP + maxR * ROWH + NH + 16;
    const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, class: 'anim-svg', role: 'img', 'aria-label': spec.alt || 'Animated diagram' });
    root.appendChild(svg);
    const defs = el('defs', {}, svg);
    const mk = (id, rev) => { const m = el('marker', { id, viewBox: '0 0 10 10', refX: rev ? 0 : 10, refY: 5, markerWidth: 8, markerHeight: 8, markerUnits: 'userSpaceOnUse', orient: rev ? 'auto-start-reverse' : 'auto' }, defs); el('path', { d: 'M0 0 10 5 0 10z', class: 'an-ah' }, m); };
    mk('an-arrow', false); mk('an-arrow-rev', true);
    const gG = el('g', {}, svg), gE = el('g', {}, svg), gN = el('g', {}, svg), gP = el('g', {}, svg);
    const pos = n => { const x0 = colX[n.c], x1 = colX[n.c + n.w - 1] + colW[n.c + n.w - 1]; return { x: x0, y: PAD + TOP + n.r * ROWH, w: x1 - x0, h: n.h ? n.h * ROWH - (ROWH - NH) : NH }; };
    const center = n => { const p = pos(n); return { x: p.x + p.w / 2, y: p.y + p.h / 2 }; };
    nodes.filter(n => n.kind === 'group').forEach(n => {
      const p = pos(n); const g = el('g', { class: 'an-group' }, gG);
      el('rect', { x: p.x - 12, y: p.y - 26, width: p.w + 24, height: p.h + 38, rx: 16 }, g);
      const t = el('text', { x: p.x - 2, y: p.y - 10, class: 'an-glabel' }, g); t.textContent = n.label;
    });
    const nodeEls = {};
    nodes.filter(n => n.kind !== 'group').forEach(n => {
      const p = pos(n); const g = el('g', { class: 'an-node ' + (n.kind || 'box'), 'data-id': n.id }, gN);
      el('rect', { x: p.x, y: p.y, width: p.w, height: p.h, rx: n.kind === 'client' ? p.h / 2 : 12 }, g);
      const t = el('text', { x: p.x + p.w / 2, y: p.y + (n.sub ? p.h / 2 - 3 : p.h / 2 + 5), 'text-anchor': 'middle', class: 'an-label' }, g); t.textContent = n.label;
      if (n.sub) { const s = el('text', { x: p.x + p.w / 2, y: p.y + p.h / 2 + 14, 'text-anchor': 'middle', class: 'an-sub' }, g); s.textContent = n.sub; }
      const badge = el('text', { x: p.x + p.w / 2, y: p.y - 7, 'text-anchor': 'middle', class: 'an-badge halo' }, g); badge.textContent = '';
      nodeEls[n.id] = g; if (n.hidden) g.classList.add('hidden');
    });
    const edgeEls = {};
    function anchors(a, b) {
      const pa = pos(a), pb = pos(b), ca = center(a), cb = center(b);
      if (a.r === b.r) return a.c < b.c ? [{ x: pa.x + pa.w, y: ca.y }, { x: pb.x, y: cb.y }] : [{ x: pa.x, y: ca.y }, { x: pb.x + pb.w, y: cb.y }];
      if (a.r < b.r) return [{ x: ca.x, y: pa.y + pa.h }, { x: cb.x, y: pb.y }];
      return [{ x: ca.x, y: pa.y }, { x: cb.x, y: pb.y + pb.h }];
    }
    // straight for same row/column; otherwise an orthogonal route that leaves A sideways, turns in the gap next to B's column, and enters B from the side
    const edgePath = (A, B) => {
      if (A.r === B.r || A.c === B.c) { const [s, t] = anchors(A, B); return [`M${s.x} ${s.y} L${t.x} ${t.y}`, s, t, null]; }
      const pa = pos(A), pb = pos(B), ca = center(A), cb = center(B), rr = 9;
      let s, t, mx, dir;
      if (B.c > A.c) { s = { x: pa.x + pa.w, y: ca.y }; t = { x: pb.x, y: cb.y }; mx = colX[B.c] - GAP / 2; dir = 1; }
      else { s = { x: pa.x, y: ca.y }; t = { x: pb.x + pb.w, y: cb.y }; mx = colX[B.c] + colW[B.c] + GAP / 2; dir = -1; }
      const v = t.y > s.y ? 1 : -1;
      const d = `M${s.x} ${s.y} L${mx - rr * dir} ${s.y} Q${mx} ${s.y} ${mx} ${s.y + rr * v} L${mx} ${t.y - rr * v} Q${mx} ${t.y} ${mx + rr * dir} ${t.y} L${t.x} ${t.y}`;
      return [d, s, t, { x: mx, y: (s.y + t.y) / 2 }];
    };
    (spec.edges || []).forEach(e => {
      const [a, b, opt = {}] = e, A = byId[a], B = byId[b]; const [d, s, t, mid] = edgePath(A, B);
      const p = el('path', { d, class: 'an-edge' + (opt.dashed ? ' dashed' : ''), 'marker-end': 'url(#an-arrow)' }, gE);
      if (opt.both) p.setAttribute('marker-start', 'url(#an-arrow-rev)');
      if (opt.label) { const lx = mid ? mid.x : (s.x + t.x) / 2, ly = mid ? mid.y + 4 : (A.r === B.r ? s.y - 9 : (s.y + t.y) / 2 + 4); const tl = el('text', { x: lx, y: ly, 'text-anchor': 'middle', class: 'an-elabel halo' }, gE); tl.textContent = opt.label; if (opt.hidden) tl.classList.add('hidden'); p._label = tl; }
      edgeEls[a + '>' + b] = p; if (!edgeEls[b + '>' + a]) edgeEls[b + '>' + a] = { rev: p };
      if (opt.hidden) p.classList.add('hidden');
    });
    const cap = document.createElement('div'); cap.className = 'anim-cap'; root.appendChild(cap);
    const frames = spec.frames || (spec.routes || []).map(r => ({ send: [r], cap: r.cap }));
    let rafs = [];
    function sendPacket(route, delay, animate) {
      const path = route.path, dur = route.dur || 650, legs = [];
      for (let i = 0; i < path.length - 1; i++) {
        let e = edgeEls[path[i] + '>' + path[i + 1]], rev = false;
        if (e && e.rev) { e = e.rev; rev = true; }
        if (!e) { const [d] = edgePath(byId[path[i]], byId[path[i + 1]]); e = el('path', { d, class: 'an-edge temp' }, gE); }
        legs.push({ e, rev });
      }
      if (!animate) { const ne = nodeEls[path[path.length - 1]]; if (ne) ne.classList.add('got'); return 0; }
      const g = el('g', { class: 'an-packet ' + (route.color || '') }, gP);
      el('circle', { r: 7 }, g);
      const t = el('text', { y: -13, 'text-anchor': 'middle', class: 'halo' }, g); t.textContent = route.label || '';
      const start = performance.now() + (delay || 0); let legIdx = 0;
      g.setAttribute('transform', 'translate(-100 -100)');
      function step(now) {
        if (now < start) { rafs.push(requestAnimationFrame(step)); return; }
        const leg = legs[legIdx], L = leg.e.getTotalLength(), t0 = start + legIdx * dur, k = Math.min(1, (now - t0) / dur);
        const pt = leg.e.getPointAtLength(leg.rev ? L * (1 - k) : L * k);
        g.setAttribute('transform', `translate(${pt.x} ${pt.y})`);
        if (k >= 1) { const ne = nodeEls[path[legIdx + 1]]; if (ne) { ne.classList.add('got'); ne.classList.remove('pop'); void ne.getBoundingClientRect(); ne.classList.add('pop'); } legIdx++; if (legIdx >= legs.length) { setTimeout(() => g.remove(), 150); return; } }
        rafs.push(requestAnimationFrame(step));
      }
      rafs.push(requestAnimationFrame(step));
      return (delay || 0) + legs.length * dur;
    }
    // show/hide/labels/edge visibility are cumulative; states and badges apply per frame. Rebuild 0..i so Back works.
    function apply(f, animate) {
      if (f.states) { for (const id in nodeEls) nodeEls[id].classList.remove('ok', 'fail', 'off', 'on', 'warn'); for (const id in f.states) nodeEls[id] && f.states[id] && nodeEls[id].classList.add(f.states[id]); }
      if (f.badges) { for (const id in nodeEls) nodeEls[id].querySelector('.an-badge').textContent = f.badges[id] || ''; }
      (f.show || []).forEach(id => nodeEls[id] && nodeEls[id].classList.remove('hidden'));
      (f.hide || []).forEach(id => nodeEls[id] && nodeEls[id].classList.add('hidden'));
      (f.edgesShow || []).forEach(k => { const e = edgeEls[k]; if (e && e.classList) { e.classList.remove('hidden'); e._label && e._label.classList.remove('hidden'); } });
      (f.edgesHide || []).forEach(k => { const e = edgeEls[k]; if (e && e.classList) { e.classList.add('hidden'); e._label && e._label.classList.add('hidden'); } });
      if (f.labels) for (const id in f.labels) { const ne = nodeEls[id]; if (ne) ne.querySelector('.an-label').textContent = f.labels[id]; }
      let longest = 0; (f.send || []).forEach((r, i) => { longest = Math.max(longest, sendPacket(r, r.delay != null ? r.delay : i * 250, animate)); });
      return longest;
    }
    function reset() {
      for (const id in nodeEls) { const g = nodeEls[id], n = byId[id]; g.classList.remove('ok', 'fail', 'off', 'on', 'warn', 'pulse', 'got', 'pop'); g.classList.toggle('hidden', !!n.hidden); g.querySelector('.an-badge').textContent = ''; g.querySelector('.an-label').textContent = n.label; }
      (spec.edges || []).forEach(e => { const p = edgeEls[e[0] + '>' + e[1]]; const hid = !!(e[2] && e[2].hidden); p.classList.toggle('hidden', hid); p._label && p._label.classList.toggle('hidden', hid); });
    }
    // one step per packet hop, so Next/Back walk the request one arrow at a time
    const steps = [];
    frames.forEach((f, fi) => {
      const sends = f.send || [];
      if (!sends.length) { steps.push({ fi, si: -1, leg: -1 }); return; }
      sends.forEach((r, si) => { for (let leg = 0; leg < r.path.length - 1; leg++) steps.push({ fi, si, leg }); });
    });
    function applyStatic(f) { const sends = f.send; f.send = null; apply(f, false); f.send = sends; }
    const ctl = {
      count: Math.max(1, steps.length),
      show(i, animate) {
        gP.innerHTML = ''; rafs.forEach(cancelAnimationFrame); rafs = []; gE.querySelectorAll('.temp').forEach(x => x.remove());
        reset();
        const st = steps[i] || { fi: 0, si: -1 };
        for (let k = 0; k < st.fi; k++) applyStatic(frames[k]);
        const f = frames[st.fi] || {}; applyStatic(f);
        cap.textContent = f.cap || (frames.slice(0, st.fi).map(x => x.cap).filter(Boolean).pop()) || spec.cap || '';
        if (st.si < 0) return 0;
        const r = f.send[st.si];
        // packets of earlier sends in this frame have already arrived: mark their last node
        for (let k = 0; k < st.si; k++) f.send[k].path.slice(1).forEach(id => nodeEls[id] && nodeEls[id].classList.add('got'));
        r.path.slice(1, st.leg + 1).forEach(id => nodeEls[id] && nodeEls[id].classList.add('got'));
        return sendPacket({ path: [r.path[st.leg], r.path[st.leg + 1]], label: r.label, color: r.color, dur: r.dur ? Math.min(r.dur, 900) : 700 }, 0, animate);
      },
      hold: i => { const st = steps[i]; if (!st || st.si < 0) { const f = frames[st ? st.fi : 0]; return f && f.t ? Math.min(f.t, 2400) : 1400; } const r = frames[st.fi].send[st.si]; const lastLeg = st.leg === r.path.length - 2; const lastSend = st.si === frames[st.fi].send.length - 1; return lastLeg && lastSend ? 1200 : 350; }
    };
    if (!frames.length) { cap.textContent = spec.cap || ''; return; }
    attachControls(root, ctl);
  }

  /* ---------- ring (consistent hashing) ---------- */
  function ring(root, spec) {
    const W = 560, H = 360, cx = 200, cy = 180, R = 130;
    const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, class: 'anim-svg' }, root);
    el('circle', { cx, cy, r: R, class: 'an-ring' }, svg);
    const cap = document.createElement('div'); cap.className = 'anim-cap'; root.appendChild(cap);
    const gS = el('g', {}, svg), gK = el('g', {}, svg), gL = el('g', {}, svg);
    [['A key hashes to a point on the ring,', 60], ['then walks clockwise to the', 78], ['next server it meets.', 96]].forEach(([s, y]) => { const t = el('text', { x: 365, y, class: 'an-sub' }, gL); t.textContent = s; });
    const pt = a => { const r = (a - 90) * Math.PI / 180; return { x: cx + R * Math.cos(r), y: cy + R * Math.sin(r) }; };
    const KEYS = [[30, 'user:7'], [140, 'user:42'], [300, 'user:19'], [320, 'user:88']];
    const base = [{ id: 'A', a: 0 }, { id: 'B', a: 90 }, { id: 'C', a: 180 }, { id: 'D', a: 270 }];
    const owner = (servers, a) => { const s = servers.slice().sort((p, q) => p.a - q.a); return s.find(x => x.a >= a) || s[0]; };
    function drawServers(servers, newId) {
      gS.innerHTML = '';
      servers.forEach(s => { const p = pt(s.a); const g = el('g', { class: 'an-node box' + (s.id === newId ? ' ok' : '') }, gS); el('rect', { x: p.x - 38, y: p.y - 16, width: 76, height: 32, rx: 10 }, g); const t = el('text', { x: p.x, y: p.y + 5, 'text-anchor': 'middle', class: 'an-label' }, g); t.textContent = 'Server ' + s.id; });
    }
    function drawKey(a, label) { const p = pt(a); const g = el('g', { class: 'an-key' }, gK); el('circle', { r: 6 }, g); const t = el('text', { y: -10, 'text-anchor': 'middle', class: 'halo' }, g); t.textContent = label; g.setAttribute('transform', `translate(${p.x} ${p.y})`); return g; }
    function slide(g, from, to) { let end = to; if (end < from) end += 360; const t0 = performance.now(), dur = 900; (function step(now) { const u = Math.min(1, (now - t0) / dur); const p = pt(from + (end - from) * u); g.setAttribute('transform', `translate(${p.x} ${p.y})`); if (u < 1) requestAnimationFrame(step); })(t0); return dur; }
    const caps = ['Four servers sit on a hash ring.', 'user:7 hashes to 30° and walks clockwise to Server B.', 'user:42 → Server C.', 'user:19 → Server A (wrapping past 360°).', 'user:88 → Server A as well.', 'Add Server E at 330°, between D and A.', 'Only keys in the slice between D and E move to E: user:19 and user:88. user:7 and user:42 stay put. With hash(key) % n, most keys would have moved.'];
    const ctl = { count: caps.length, show(i, animate) {
      gK.innerHTML = ''; const servers = base.slice(); if (i >= 5) servers.push({ id: 'E', a: 330 }); drawServers(servers, i === 5 ? 'E' : null); cap.textContent = caps[i];
      const nKeys = Math.min(4, Math.max(0, i)); let ms = 0;
      for (let k = 0; k < nKeys; k++) {
        const [a, label] = KEYS[k]; const own = i >= 6 ? owner(servers, a) : owner(base, a);
        const animateThis = animate && ((i === k + 1) || (i === 6 && own.id === 'E'));
        if (animateThis) { const from = i === 6 ? owner(base, a).a : a; const g = drawKey(from, label); ms = Math.max(ms, slide(g, from, own.a)); } else drawKey(own.a, label);
      }
      return ms;
    }, hold: i => i === 6 ? 2600 : 1100 };
    attachControls(root, ctl);
  }

  /* ---------- token bucket ---------- */
  function bucket(root, spec) {
    const W = 560, H = 220, CAP = 10;
    const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, class: 'anim-svg' }, root);
    const capEl = document.createElement('div'); capEl.className = 'anim-cap'; root.appendChild(capEl);
    el('rect', { x: 40, y: 40, width: 220, height: 120, rx: 14, class: 'an-bucket' }, svg);
    const lbl = el('text', { x: 150, y: 30, 'text-anchor': 'middle', class: 'an-sub' }, svg); lbl.textContent = 'bucket: capacity 10, refills over time';
    const gT = el('g', {}, svg);
    const stat = el('text', { x: 300, y: 70, class: 'an-label' }, svg), stat2 = el('text', { x: 300, y: 100, class: 'an-label ok-t' }, svg), stat3 = el('text', { x: 300, y: 130, class: 'an-label fail-t' }, svg);
    function draw(st) { gT.innerHTML = ''; for (let i = 0; i < st.tokens; i++) el('circle', { cx: 60 + (i % 5) * 42, cy: 70 + Math.floor(i / 5) * 42, r: 14, class: 'an-token' }, gT); stat.textContent = `tokens: ${st.tokens}`; stat2.textContent = `allowed: ${st.allowed}`; stat3.textContent = `rejected (429): ${st.rejected}`; }
    function req(s, n) { for (let i = 0; i < n; i++) { if (s.tokens > 0) { s.tokens--; s.allowed++; } else s.rejected++; } }
    const STEPS = [
      { cap: 'The bucket starts full with 10 tokens.', do: s => {} },
      { cap: 'A burst of 6 requests arrives: each takes a token, all are allowed.', do: s => req(s, 6) },
      { cap: 'Another burst of 6 right away: only 4 tokens are left, so 2 requests get 429.', do: s => req(s, 6) },
      { cap: 'Time passes: tokens refill at a steady rate (here 5 are back).', do: s => { s.tokens = Math.min(CAP, s.tokens + 5); } },
      { cap: 'A burst of 3 is allowed again. Bursts are fine; a sustained flood is not.', do: s => req(s, 3) }
    ];
    const ctl = { count: STEPS.length, show(i) { const s = { tokens: CAP, allowed: 0, rejected: 0 }; for (let k = 0; k <= i; k++) STEPS[k].do(s); draw(s); capEl.textContent = STEPS[i].cap; return 0; }, hold: () => 2000 };
    attachControls(root, ctl);
  }

  /* ---------- percentile ---------- */
  function percentile(root, spec) {
    const W = 600, H = 240, n = 100;
    const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, class: 'anim-svg' }, root);
    const capEl = document.createElement('div'); capEl.className = 'anim-cap'; root.appendChild(capEl);
    const vals = []; for (let i = 0; i < n; i++) vals.push(i < 50 ? 60 + i * 0.8 : i < 95 ? 100 + (i - 50) * 2 : i < 99 ? 200 + (i - 95) * 60 : 2400);
    const x0 = 40, bw = 5, base = 200, sc = v => Math.min(150, v / 400 * 150);
    const gB = el('g', {}, svg), gM = el('g', {}, svg);
    vals.forEach((v, i) => el('rect', { x: x0 + i * bw, y: base - sc(v), width: bw - 1, height: sc(v), class: 'an-bar' + (v > 400 ? ' hot' : '') }, gB));
    const axis = el('text', { x: x0, y: base + 18, class: 'an-sub' }, svg); axis.textContent = '100 requests sorted by latency (the last few go far off the chart)';
    const avg = Math.round(vals.reduce((a, b) => a + b) / n);
    const marks = [[50, 'P50 = 100 ms', 'p50', 70], [95, 'P95 = 190 ms', 'p95', 52], [99, 'P99 = 2.4 s', 'p99', 34]];
    const caps = [`The average is about ${avg} ms, which looks fine. It hides the slow tail.`, 'P50: half of all requests are faster than this.', 'P95: 95% are faster. Still looks healthy.', 'P99: the slowest 1% wait over two seconds. That is what your unhappiest users feel.'];
    const ctl = { count: 4, show(i) { gM.innerHTML = ''; for (let k = 1; k <= i; k++) { const [p, label, cls, y] = marks[k - 1], x = x0 + p * bw; el('line', { x1: x, y1: 30, x2: x, y2: base, class: 'an-mark ' + cls }, gM); const t = el('text', { x: x - 6, y, 'text-anchor': 'end', class: 'an-sub halo ' + cls }, gM); t.textContent = label; } capEl.textContent = caps[i]; return 0; }, hold: () => 1900 };
    attachControls(root, ctl);
  }

  /* ---------- waterfall (tracing) ---------- */
  function waterfall(root, spec) {
    const rows = spec.rows, W = 600, H = 30 + rows.length * 36 + 10, total = rows.reduce((a, r) => a + r.ms, 0);
    const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, class: 'anim-svg' }, root);
    const capEl = document.createElement('div'); capEl.className = 'anim-cap'; root.appendChild(capEl);
    const x0 = 150, span = 420; let acc = 0;
    const bars = rows.map((r, i) => { const y = 20 + i * 36; const t = el('text', { x: x0 - 10, y: y + 17, 'text-anchor': 'end', class: 'an-label' }, svg); t.textContent = r.label; const bx = x0 + acc / total * span; const b = el('rect', { x: bx, y, width: 0, height: 24, rx: 6, class: 'an-wbar' + (r.hot ? ' hot' : '') }, svg); const v = el('text', { x: bx + 6, y: y + 17, class: 'an-wval' }, svg); v.textContent = ''; const full = r.ms / total * span; acc += r.ms; return { b, v, full, r }; });
    const ctl = { count: rows.length + 1, show(i, animate) {
      bars.forEach((bar, k) => { bar.b.setAttribute('width', k < i ? bar.full : 0); bar.v.textContent = k < i ? bar.r.text : ''; });
      if (i === rows.length) { capEl.textContent = spec.cap1 || ''; return 0; }
      capEl.textContent = i === 0 ? (spec.cap0 || '') : `${rows[i].label}…`;
      const bar = bars[i], dur = animate ? Math.max(250, Math.min(1100, bar.full * 2.5)) : 0;
      if (!animate) { bar.b.setAttribute('width', bar.full); bar.v.textContent = bar.r.text; return 0; }
      const t0 = performance.now(); (function step(now) { const u = Math.min(1, (now - t0) / dur); bar.b.setAttribute('width', bar.full * u); if (u < 1) requestAnimationFrame(step); else bar.v.textContent = bar.r.text; })(t0); return dur;
    }, hold: i => i === rows.length ? 2600 : 400 };
    attachControls(root, ctl);
  }

  /* ---------- backoff ---------- */
  function backoff(root, spec) {
    const W = 600, H = 190, x0 = 120, span = 440, T = 16;
    const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, class: 'anim-svg' }, root);
    const capEl = document.createElement('div'); capEl.className = 'anim-cap'; root.appendChild(capEl);
    const row = (y, label) => { const t = el('text', { x: x0 - 10, y: y + 5, 'text-anchor': 'end', class: 'an-label' }, svg); t.textContent = label; el('line', { x1: x0, y1: y, x2: x0 + span, y2: y, class: 'an-axis' }, svg); };
    row(60, 'naive retry'); row(130, 'exponential backoff');
    for (let s = 0; s <= T; s += 4) { const t = el('text', { x: x0 + s / T * span, y: 170, 'text-anchor': 'middle', class: 'an-sub' }, svg); t.textContent = s + 's'; }
    const gD = el('g', {}, svg);
    const naive = []; for (let s = 0; s <= T; s += 0.5) naive.push(s);
    const expo = [0, 1, 3, 7, 15].map((s, i) => s + (i ? (((i * 37) % 7) / 10 - 0.3) : 0));
    function draw(tNow) { gD.innerHTML = ''; naive.filter(s => s <= tNow).forEach(s => el('circle', { cx: x0 + s / T * span, cy: 60, r: 5, class: 'an-dot fail' }, gD)); expo.filter(s => s <= tNow).forEach(s => el('circle', { cx: x0 + s / T * span, cy: 130, r: 6, class: 'an-dot ok' }, gD)); el('line', { x1: x0 + tNow / T * span, y1: 30, x2: x0 + tNow / T * span, y2: 150, class: 'an-mark p50' }, gD); }
    const stops = [1, 2, 4, 8, 16], caps = ['First failure at 0 s. Naive retries immediately; backoff waits 1 s.', 'By 2 s: naive has retried 4 times; backoff twice (0 s, 1 s).', 'By 4 s: naive has hammered the service 8 times; backoff waits 2 s, then 4 s.', 'By 8 s: 16 naive retries vs 4 backoff attempts.', 'By 16 s: 32 naive retries vs 5 spaced attempts, each with a little jitter so clients do not all retry together.'];
    let raf;
    const ctl = { count: stops.length, show(i, animate) { cancelAnimationFrame(raf); const from = i ? stops[i - 1] : 0, to = stops[i]; capEl.textContent = caps[i]; if (!animate) { draw(to); return 0; } const dur = 900, t0 = performance.now(); (function step(now) { const u = Math.min(1, (now - t0) / dur); draw(from + (to - from) * u); if (u < 1) raf = requestAnimationFrame(step); })(t0); return dur; }, hold: () => 1300 };
    attachControls(root, ctl);
  }

  const KINDS = { flow, ring, bucket, percentile, waterfall, backoff };
  function mount(root) {
    const spec = (window.ANIM_SPECS || {})[root.dataset.spec];
    if (!spec) { root.textContent = 'Missing diagram: ' + root.dataset.spec; return; }
    root.classList.add('anim-mounted');
    (KINDS[spec.kind || 'flow'])(root, spec);
  }
  window.ANIM = { mount, mountAll: root => (root || document).querySelectorAll('.anim:not(.anim-mounted)').forEach(mount) };
  document.addEventListener('DOMContentLoaded', () => window.ANIM.mountAll());
})();
