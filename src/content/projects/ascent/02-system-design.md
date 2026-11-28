---
title: System Design & Architecture
kind: Design
order: 2
version: '1.0'
updated: 2026-11-28
summary: How Ascent is put together — a static site with a "server" that lives in each visitor's browser.
---

## 1. Design goals
1. **Free forever** — static hosting, no backend to pay for or patch.
2. **Private by construction** — the server never sees private data, because there is no server.
3. **Content as files** — writing a journal entry or a notebook chapter is adding one Markdown file.
4. **Fast and calm** — HTML first, JavaScript only where needed, motion that can be switched off.

## 2. High-level view

```
 Owner's laptop                 GitHub                          Visitor's browser
 ─────────────                  ──────                          ─────────────────
 edit .md / .ts  ──git push──▶  repo (main)                      static HTML/CSS/JS
                                   │                                  │
                                   ▼                                  ├─ localStorage  (prefs, goals, drafts)
                              GitHub Actions ──build──▶ Pages ──────▶ ├─ fit:vault     (AES-GCM, private)
                              (Astro SSG, nightly too)                ├─ IndexedDB     (encrypted photos)
                                   ▲                                  └─ service worker (offline cache)
                         LeetCode GraphQL (build time)
                                                       GitHub commit search (Daily Log, in browser)
```

The build turns content into HTML once. After that, the browser is the only place where anything changes.

## 3. Layers

| Layer | Where | What it does |
|---|---|---|
| Content | `src/content/journal`, `guide`, `projects` | Markdown with typed front-matter (Astro content collections + Zod schemas) |
| Data | `src/data/*.ts` | Site config, profile, topics, meals, foods, words, project folders |
| Logic | `src/lib/*.ts` | Pure functions: journal stats, fitness engine, vault crypto, prefs, steps |
| Pages | `src/pages/**.astro` | One file per route; dynamic routes for journal and projects |
| Shell | `src/layouts/Base.astro` | Head, header, settings drawer, footer, global scripts |
| Islands | `src/components/bits/*.tsx` | React only for the animated home hero |
| Client scripts | `src/scripts/*.ts` | Settings, shortcuts, PWA, smart typing, Basecamp app, notebook, bucket |

## 4. Key modules

### 4.1 Content collections
`src/content.config.ts` declares three collections — `journal`, `guide`, `projects` — each loaded with Astro's `glob()` loader and validated by a schema. A bad front-matter field fails the build instead of shipping a broken page.

### 4.2 Fitness engine (`src/lib/fit.ts`)
A pure module: BMR and energy burn, goal validation with safety checks, daily calorie/macro/step targets, a 7-day adaptive ledger that rebalances the next days within caps, and a diet builder. `src/scripts/fit-app.ts` renders it into Basecamp's Today, Plan, Diet and BMI tabs.

### 4.3 Vault (`src/lib/vault.ts`)
Envelope encryption: data is encrypted with a random data key; the data key is wrapped separately by the passcode, the recovery key and each fingerprint. Details are in the *Security & Privacy Design* document.

### 4.4 Preferences (`src/lib/prefs.ts`)
One JSON object in `localStorage["pref:settings"]` holds only non-default values. `setPrefs()` fires an `ascent:prefs` event; open pages listen and redraw. Inline scripts in the page head read the same key early, so the theme and text size apply before first paint (no flash).

### 4.5 Event bridges
Modules talk through DOM events rather than imports where they live on different pages:
- `ascent:prefs` — settings changed
- `ascent:vault` — vault unlocked (carries a get/set bridge) or locked (`null`), used by the bucket list

### 4.6 Settings drawer
Lives in the shell, so it is on every page. On pages other than Basecamp it lazy-loads the Basecamp app only when the owner opens *Security & data*, keeping normal pages light.

## 5. Data model (browser storage)

| Key | Store | Content | Encrypted |
|---|---|---|---|
| `pref:settings` | localStorage | Non-default preferences | No (not private) |
| `goals:YYYY-MM-DD`, `goals:YYYY-Www`, `goals:config` | localStorage | Goal ticks and edited goal list | No |
| `log:draft:DATE` | localStorage | Daily Log drafts | No |
| `smart:vocab` | localStorage | Words learned by smart typing | No |
| `fit:vault` | localStorage | Scans, goal, daily logs, foods, bucket list | **Yes** |
| `fit:guard` | localStorage | Wrong-attempt counter and log (no secrets) | No |
| `ascent` / `bucket-photos` | IndexedDB | Bucket-list memory photos | **Yes** |

## 6. Routing

| Route | Source |
|---|---|
| `/` | `index.astro` |
| `/journal/`, `/journal/[id]/` | Journal list + one page per entry |
| `/log/`, `/post/` | Daily Log form, weekly LinkedIn draft |
| `/basecamp/` | Steps · Today · Plan · Diet · BMI · Notebook |
| `/projects/`, `/projects/[folder]/`, `/projects/[folder]/[doc]/` | This section |
| `/explore/` | Index: search + timeline |
| `/bucket/` | Private bucket list (noindex) |
| `/about/` | About |
| `/gym/`, `/goals/` | Redirects to Basecamp |

## 7. Build and deploy
`git push` to `main` → GitHub Actions runs `withastro/action` (install + `astro build`) → `actions/deploy-pages` publishes `dist/`. A cron at 18:35 UTC (~00:05 IST) rebuilds nightly without committing, so build-time data refreshes. A deploy takes about a minute.

## 8. Design decisions and trade-offs

| Decision | Why | Cost |
|---|---|---|
| Static site, no backend | Free, nothing to hack on a server, fast | No cross-device sync; no remote alerts |
| Encrypt in the browser | Private data never leaves the device | Lost passcode + lost recovery key = data gone |
| Journal written through GitHub's web editor | Real commits, no write token stored on the site | One extra click (Commit) |
| LeetCode at build time | No CORS issues, no visitor requests | Numbers are up to a day old |
| Astro with small React islands | HTML-first, JS only where needed | Two component styles in one codebase |
| Markdown collections for docs | Easy to write, typed, versioned in Git | Rich diagrams need hand-written components |
