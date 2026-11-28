---
title: Tech Stack & Deployment
kind: Stack
order: 3
version: '1.0'
updated: 2026-11-28
summary: Every tool Ascent is built with, why it was chosen, and exactly how a change goes from laptop to live.
---

## 1. Stack at a glance

| Area | Choice | Why |
|---|---|---|
| Framework | **Astro 7** | Static HTML by default, content collections, islands for the few interactive bits |
| Language | **TypeScript** | Types catch mistakes in data files and the fitness/crypto logic |
| UI islands | **React 19** via `@astrojs/react` | Animated hero components (Aurora, SplitText, ScrollReveal) |
| Animation | **GSAP** (hero only) + plain CSS | Small, controlled motion; everything respects Calm mode |
| Styling | Plain CSS + CSS variables | Two themes from one set of tokens; no framework lock-in |
| Fonts | Fraunces (serif), Inter (sans), JetBrains Mono | Editorial, quiet-luxury feel |
| Icons | Bootstrap Icons, Simple Icons (dev only) | Brand-coloured social logos |
| Crypto | Web Crypto API + WebAuthn | Built into every modern browser — no crypto library to trust |
| Storage | localStorage, IndexedDB | Private data stays on the device |
| Offline | Service worker (`public/sw.js`) + web manifest | Installable, works without network |
| Hosting | **GitHub Pages** | Free, HTTPS, tied to the repo |
| CI/CD | **GitHub Actions** (`withastro/action`, `deploy-pages`) | Build + deploy on every push, nightly refresh |
| Runtime | Node 24 (`.nvmrc`) | Astro 7 needs Node ≥ 22.23.4 |

## 2. Repository layout

```
src/
  content/       journal/ · guide/ · projects/      ← Markdown content
  data/          site.ts · profile.ts · projects.ts · meals.ts · foods.ts · words.ts …
  lib/           journal.ts · fit.ts · vault.ts · prefs.ts · steps.ts · photos.ts · leetcode.ts
  pages/         one .astro file per route
  layouts/       Base.astro (the shell)
  components/    Astro components + bits/ (React)
  scripts/       client-side TypeScript
  styles/        global.css · fit.css
public/          brand/ · icons/ · images/ · videos/ · audio/ · sw.js · manifest · owner.json
tools/           brand-icons.mjs (regenerates every icon from the logo mark)
scripts/         new-entry.mjs (npm run new → today's journal file)
AI_HANDOFF.md    the living brief for whoever works on the site next
```

## 3. Local development

```bash
nvm use            # Node 24
npm install
npm run dev        # http://localhost:4321
npm run build      # production build into dist/
npm run new        # create today's journal entry file
```

The service worker does not register on `localhost`, so development always shows fresh files.

## 4. Deployment pipeline

1. Commit on `main` and `git push`.
2. GitHub Actions workflow **Deploy to GitHub Pages** starts.
3. Job `build`: checkout → `withastro/action` (installs, runs `astro build`, uploads `dist/`).
4. Job `deploy`: `actions/deploy-pages` publishes to the `github-pages` environment.
5. Live at `https://aryanjainsoni.github.io` in about a minute.

Check the latest run:

```bash
gh run list -R aryanjainsoni/aryanjainsoni.github.io --limit 1
```

A nightly schedule (`35 18 * * *` UTC) re-runs the same workflow so LeetCode data refreshes — it makes no commit.

## 5. Media pipeline
- **Videos** (Basecamp orb loops): compressed with macOS `avconvert` (PresetMediumQuality), each with a `.jpg` poster.
- **Music**: royalty-free tracks re-encoded to 96 kbps AAC with `afconvert`, loudness measured and levelled.
- **Icons**: `tools/brand-icons.mjs` generates favicon, app icons (including maskable) and the share image from one SVG mark.
- Large pushes use `git -c http.postBuffer=524288000 push`.

## 6. Costs
Hosting, CI, domain (`github.io`), fonts and every API used are free. The only running cost is time.
