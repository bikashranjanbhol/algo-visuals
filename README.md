# Algo Visuals

LeetCode problems explained with step-by-step animations. Plain static HTML, no build step.

## Structure

- `/` landing page with one card per track
- `/algo-dsa`, `/system-design`, `/lld`, `/gen-ai`, `/frontend-system-design`, `/frontend-lld` track pages
- `/algo-dsa/two-sum`, `/algo-dsa/add-two-numbers` walkthroughs

To add a walkthrough: create `<track>/<slug>/index.html`, then add a card for it on the track's `index.html` and on the home page.

## Customize

- Site title, tagline and the main menu live in `assets/site.js`.
- Shared styles for the landing and track pages live in `assets/pages.css`.
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
