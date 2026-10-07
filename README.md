# Algo Visuals

LeetCode problems explained with step-by-step animations. Plain static HTML, no build step.

## Structure

- `/` landing page with one card per track
- `/algo-dsa`, `/system-design`, `/lld`, `/gen-ai`, `/frontend-system-design`, `/frontend-lld` track pages
- `/algo-dsa/two-sum`, `/algo-dsa/add-two-numbers` walkthroughs

To add a walkthrough: create `<track>/<slug>/index.html`, then add a card for it on the track's `index.html` and on the home page.

## Customize

- Site title, tagline and the main menu live in `assets/site.js`.
- Design tokens (colours, type) and shared styles for the landing and track pages live in `assets/pages.css`. Pages with their own inline tokens use the same values.
- Long-form docs with a `<details class="toc">` get a sticky "On this page" rail from `assets/docs.js`.
- Header and footer styles live in `assets/site.css`.
- Each page is a single self-contained HTML file under its own folder.

## Run locally

Any static server works, for example:

    npx serve .

## Deploy to Vercel

1. Push this repo to GitHub.
2. In Vercel, choose "Add New Project", import the repo, keep the framework as "Other", leave the build settings empty, and deploy.

Or from the terminal:

    npm i -g vercel
    vercel

`vercel.json` turns on clean URLs so `/two-sum` serves `two-sum/index.html`.

## Sign-in, roles and members-only tracks

Google sign-in uses Firebase Auth; roles (`free`, `premium`, `admin`) live in Firestore at `users/{uid}.role`.
Tracks marked `access: 'premium'` in `assets/site.js` require the `premium` or `admin` role to open their walkthroughs;
track index pages stay public. Until `assets/firebase-config.js` is filled in, the site behaves as fully public.

Setup (about 10 minutes):

1. Create a project at https://console.firebase.google.com (Analytics off is fine).
2. Build → Authentication → Get started → Sign-in method → enable **Google** (set a support email).
3. Authentication → Settings → **Authorized domains** → add your Vercel domain (e.g. `algo-visuals-seven.vercel.app`).
4. Build → Firestore Database → Create database → production mode.
5. Firestore → Rules → replace with the contents of `firestore.rules` → Publish.
6. Project settings → Your apps → **Add app → Web** → register → copy the `firebaseConfig` object into `assets/firebase-config.js`. Commit and push.
7. Sign in on the site once (you'll be created as `free`), then in Firestore open `users/<your uid>` and set `role` to `admin`. That's the only manual promotion ever needed.
8. Visit `/admin` to manage everyone else's roles.

Note: this is client-side gating. The HTML of a members-only page is still downloadable by a determined visitor.
It keeps casual visitors out; if you ever charge for access, move gated content behind a server (Vercel middleware or Firebase Functions).
