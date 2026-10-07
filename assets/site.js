// Edit the site title and the page list here. Header and footer are rendered on every page.
const SITE = {
  title: 'Algo Visuals',
  tagline: 'LeetCode problems, animated step by step',
  pages: [
    { href: '/', label: 'Home' },
    { href: '/two-sum', label: '1. Two Sum' },
    { href: '/add-two-numbers', label: '2. Add Two Numbers' }
  ]
};

(function () {
  const path = location.pathname.replace(/\/index\.html$/, '/').replace(/\/$/, '') || '/';
  const nav = SITE.pages.map(p => {
    const here = (p.href === '/' ? path === '/' : path === p.href);
    return `<a href="${p.href}"${here ? ' aria-current="page"' : ''}>${p.label}</a>`;
  }).join('');
  const header = document.createElement('header');
  header.className = 'site-header';
  header.innerHTML = `<div class="in"><a class="site-title" href="/"><span class="mark">{}</span>${SITE.title}</a><nav class="site-nav" aria-label="Pages">${nav}</nav></div>`;
  const footer = document.createElement('footer');
  footer.className = 'site-footer';
  footer.innerHTML = `<div class="in"><span><b>${SITE.title}</b>, ${SITE.tagline}</span><span>Built as a study aid. Problem statements belong to LeetCode.</span></div>`;
  document.body.prepend(header);
  document.body.append(footer);
})();
