// Site title and main menu. Header and footer are rendered on every page.
const SITE = {
  title: 'Algo Visuals',
  tagline: 'Engineering topics, explained visually',
  sections: [
    { href: '/algo-dsa', label: 'Algo & DSA' },
    { href: '/system-design', label: 'System Design' },
    { href: '/lld', label: 'LLD' },
    { href: '/gen-ai', label: 'Gen AI' },
    { href: '/frontend-system-design', label: 'Frontend System Design' },
    { href: '/frontend-lld', label: 'Frontend LLD' }
  ]
};

(function () {
  const path = location.pathname.replace(/\/index\.html$/, '/').replace(/\/$/, '') || '/';
  const nav = SITE.sections.map(s => {
    const here = path === s.href || path.startsWith(s.href + '/');
    return `<a href="${s.href}"${here ? ' aria-current="page"' : ''}>${s.label}</a>`;
  }).join('');
  const header = document.createElement('header');
  header.className = 'site-header';
  header.innerHTML = `<div class="in"><a class="site-title" href="/"><span class="mark">{}</span>${SITE.title}</a><nav class="site-nav" aria-label="Main menu">${nav}</nav></div>`;
  const footer = document.createElement('footer');
  footer.className = 'site-footer';
  footer.innerHTML = `<div class="in"><span><b>${SITE.title}</b>, ${SITE.tagline}</span><span>Built as a study aid. Problem statements belong to their sources.</span></div>`;
  document.body.prepend(header);
  document.body.append(footer);
})();
