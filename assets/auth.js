// Google sign-in with Firebase Auth, roles stored in Firestore (users/{uid}.role).
// Exposes window.AlgoAuth = { ready, user, role, signIn, signOut, db, fs }.
import { firebaseConfig } from '/assets/firebase-config.js';

const SITE = window.SITE;
const slot = document.getElementById('siteAuth');
const path = location.pathname.replace(/\/index\.html$/, '/').replace(/\/$/, '') || '/';
const section = SITE.sections.find(s => path === s.href || path.startsWith(s.href + '/'));
const isGatedPage = !!(section && section.access === 'premium' && path !== section.href);

const Auth = { user: null, role: null, enabled: !!firebaseConfig.apiKey, db: null, fs: null };
let resolveReady; Auth.ready = new Promise(r => resolveReady = r);
window.AlgoAuth = Auth;

function unlock(){ document.documentElement.classList.remove('gated'); }
// Safety net: if Firebase can't load (offline, blocked), don't leave a blank page forever.
setTimeout(() => { if (document.documentElement.classList.contains('gated')) { console.warn('Auth did not resolve; showing content.'); unlock(); } }, 8000);

if (!Auth.enabled) {
  // Not configured yet: behave as a public site.
  unlock(); resolveReady(Auth);
} else {
  const [{ initializeApp }, authMod, fsMod] = await Promise.all([
    import('https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js'),
    import('https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js'),
    import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js')
  ]);
  const app = initializeApp(firebaseConfig);
  const auth = authMod.getAuth(app);
  const db = fsMod.getFirestore(app);
  Auth.db = db; Auth.fs = fsMod;

  Auth.signIn = async () => {
    const provider = new authMod.GoogleAuthProvider();
    try { await authMod.signInWithPopup(auth, provider); }
    catch (e) { if (e.code === 'auth/popup-blocked') await authMod.signInWithRedirect(auth, provider); else console.error(e); }
  };
  Auth.signOut = () => authMod.signOut(auth);

  async function loadRole(user){
    const ref = fsMod.doc(db, 'users', user.uid);
    const snap = await fsMod.getDoc(ref);
    if (snap.exists()) {
      // keep profile fresh; role is never written from here
      fsMod.updateDoc(ref, { name: user.displayName || '', email: user.email || '', photo: user.photoURL || '', lastSeen: fsMod.serverTimestamp() }).catch(()=>{});
      return snap.data().role || 'free';
    }
    await fsMod.setDoc(ref, { name: user.displayName || '', email: user.email || '', photo: user.photoURL || '', role: 'free', createdAt: fsMod.serverTimestamp(), lastSeen: fsMod.serverTimestamp() });
    return 'free';
  }

  authMod.onAuthStateChanged(auth, async user => {
    Auth.user = user;
    Auth.role = user ? await loadRole(user) : null;
    renderSlot();
    applyGate();
    resolveReady(Auth);
    document.dispatchEvent(new CustomEvent('algo-auth', { detail: Auth }));
  });
}

function renderSlot(){
  if (!slot) return;
  if (!Auth.user) {
    slot.innerHTML = `<button class="auth-btn" id="authSignIn"><svg viewBox="0 0 18 18" width="16" height="16"><path fill="#4285F4" d="M17.6 9.2c0-.6-.1-1.2-.2-1.8H9v3.4h4.8a4.1 4.1 0 0 1-1.8 2.7v2.2h2.9c1.7-1.6 2.7-3.9 2.7-6.5z"/><path fill="#34A853" d="M9 18c2.4 0 4.5-.8 6-2.2l-2.9-2.2c-.8.5-1.8.9-3.1.9-2.4 0-4.4-1.6-5.1-3.8H.9v2.3A9 9 0 0 0 9 18z"/><path fill="#FBBC05" d="M3.9 10.7a5.4 5.4 0 0 1 0-3.4V5H.9a9 9 0 0 0 0 8l3-2.3z"/><path fill="#EA4335" d="M9 3.6c1.3 0 2.5.5 3.4 1.3l2.6-2.6A9 9 0 0 0 .9 5l3 2.3C4.6 5.2 6.6 3.6 9 3.6z"/></svg>Sign in with Google</button>`;
    document.getElementById('authSignIn').onclick = Auth.signIn;
  } else {
    const u = Auth.user, img = u.photoURL ? `<img src="${u.photoURL}" alt="" referrerpolicy="no-referrer">` : '';
    slot.innerHTML = `<div class="auth-user">${img}<span class="auth-name">${u.displayName || u.email}</span><span class="role role-${Auth.role}">${Auth.role}</span>${Auth.role==='admin' ? '<a class="auth-link" href="/admin">Admin</a>' : ''}<button class="auth-btn ghost" id="authSignOut">Sign out</button></div>`;
    document.getElementById('authSignOut').onclick = Auth.signOut;
  }
}

function applyGate(){
  const old = document.getElementById('gateWall'); if (old) old.remove();
  if (!isGatedPage) { unlock(); return; }
  if (Auth.user && SITE.premiumRoles.includes(Auth.role)) { unlock(); return; }
  const main = document.querySelector('main');
  const wall = document.createElement('div');
  wall.id = 'gateWall'; wall.className = 'gate-wall';
  wall.innerHTML = Auth.user
    ? `<div class="gate-card"><h2>Members only</h2><p>${section.label} walkthroughs are for premium members. You're signed in as <b>${Auth.user.email}</b> with the <b>${Auth.role}</b> role.</p><p class="gate-small">Ask an admin to upgrade your account, then reload this page.</p><a class="auth-btn" href="${section.href}">Back to ${section.label}</a></div>`
    : `<div class="gate-card"><h2>Members only</h2><p>${section.label} walkthroughs are for premium members. Sign in to continue.</p><button class="auth-btn" id="gateSignIn">Sign in with Google</button><a class="gate-small" href="${section.href}">Back to ${section.label}</a></div>`;
  (main ? main.parentNode : document.body).insertBefore(wall, main);
  if (main) main.classList.add('gate-hidden');
  const b = document.getElementById('gateSignIn'); if (b) b.onclick = Auth.signIn;
  document.documentElement.classList.remove('gated');
  document.documentElement.classList.add('gate-locked');
}
