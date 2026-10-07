# Algo Visuals

LeetCode problems explained with step-by-step animations. Plain static HTML, no build step.

## Pages

- `/` landing page
- `/two-sum` LeetCode 1: brute force, why it needs optimizing, one-pass hash map
- `/add-two-numbers` LeetCode 2: linked-list intuition, column addition with carries

## Customize

- Site title, tagline and the nav links live in `assets/site.js`.
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
