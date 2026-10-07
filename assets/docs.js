// Long-form docs: turns <details class="toc"> into a sticky "On this page" rail with scroll-spy.
// The details element stays in place and is shown on narrow screens (see .toc in pages.css).
(function () {
  function init() {
    const toc = document.querySelector('details.toc'), doc = document.querySelector('.doc');
    if (!toc || !doc) return;
    const links = [...toc.querySelectorAll('.toc-grid a')];
    const targets = links.map(a => document.getElementById(decodeURIComponent(a.hash.slice(1)))).filter(Boolean);
    if (!targets.length) return;

    const grid = document.createElement('div'); grid.className = 'docs-grid';
    doc.parentNode.insertBefore(grid, doc); grid.appendChild(doc);
    const rail = document.createElement('aside'); rail.className = 'otp'; rail.setAttribute('aria-label', 'On this page');
    rail.innerHTML = `<p class="otp-h">On this page</p><nav>${links.map(a => `<a href="${a.getAttribute('href')}">${a.textContent}</a>`).join('')}</nav><a class="otp-top" href="#">Back to top ↑</a>`;
    grid.appendChild(rail);
    document.body.classList.add('has-otp');
    rail.querySelector('.otp-top').onclick = e => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); };

    const railLinks = [...rail.querySelectorAll('nav a')];
    const byId = new Map(railLinks.map(a => [decodeURIComponent(a.hash.slice(1)), a]));
    let active = null;
    function setActive(id) {
      const a = byId.get(id); if (!a || a === active) return;
      if (active) active.removeAttribute('aria-current');
      a.setAttribute('aria-current', 'true'); active = a;
      // keep the active link visible inside the rail without scrolling the page
      const top = a.offsetTop - rail.clientHeight / 3;
      rail.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
    }
    // the last heading above the top quarter of the viewport is the current section
    let ticking = false;
    function spy() {
      ticking = false;
      const line = window.innerHeight * 0.25;
      let cur = targets[0];
      for (const t of targets) { if (t.getBoundingClientRect().top <= line) cur = t; else break; }
      setActive(cur.id);
    }
    window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(spy); } }, { passive: true });
    spy();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
