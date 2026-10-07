// Site title, main menu and access rules. Header and footer are rendered on every page.
const SITE = {
  title: 'Algo Visuals',
  tagline: 'Engineering topics, explained visually',
  // access: 'public' = anyone; 'premium' = walkthroughs need the premium or admin role
  sections: [
    { href: '/algo-dsa', label: 'Algo & DSA', access: 'public' },
    { href: '/system-design', label: 'System Design', access: 'premium' },
    { href: '/lld', label: 'LLD', access: 'premium' },
    { href: '/gen-ai', label: 'Gen AI', access: 'premium' },
    { href: '/frontend-system-design', label: 'Frontend System Design', access: 'premium' },
    { href: '/frontend-lld', label: 'Frontend LLD', access: 'premium' }
  ],
  roles: ['free', 'premium', 'admin'],
  // which roles may open walkthroughs in a premium track
  premiumRoles: ['premium', 'admin']
};
window.SITE = SITE;

(function () {
  const path = location.pathname.replace(/\/index\.html$/, '/').replace(/\/$/, '') || '/';
  const section = SITE.sections.find(s => path === s.href || path.startsWith(s.href + '/'));
  // A walkthrough inside a premium track is gated: hide content until auth.js decides.
  if (section && section.access === 'premium' && path !== section.href) {
    document.documentElement.classList.add('gated');
  }
  const nav = SITE.sections.map(s => {
    const here = section === s;
    const lock = s.access === 'premium' ? '<span class="lock" title="Members only" aria-hidden="true"></span>' : '';
    return `<a href="${s.href}"${here ? ' aria-current="page"' : ''}>${s.label}${lock}</a>`;
  }).join('');
  const header = document.createElement('header');
  header.className = 'site-header';
  header.innerHTML = `<div class="in"><a class="site-title" href="/"><span class="mark">{}</span>${SITE.title}</a><nav class="site-nav" aria-label="Main menu">${nav}</nav><div class="site-auth" id="siteAuth"></div></div>`;
  const footer = document.createElement('footer');
  footer.className = 'site-footer';
  footer.innerHTML = `<div class="in"><span><b>${SITE.title}</b>, ${SITE.tagline}</span><span>Built as a study aid. Problem statements belong to their sources.</span></div>`;
  document.body.prepend(header);
  document.body.append(footer);
})();
