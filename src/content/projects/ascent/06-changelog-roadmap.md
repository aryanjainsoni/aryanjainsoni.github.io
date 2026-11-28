---
title: Changelog & Roadmap
kind: Roadmap
order: 6
version: '1.0'
updated: 2026-11-28
summary: How Ascent grew from an empty Astro project, and what comes next.
---

## 1. Milestones so far

| Date | Milestone |
|---|---|
| 27 Nov 2026 | Project started with Astro; design system, Home and About, light/dark mode |
| 27 Nov 2026 | Journal with streak heatmap and first entry; Daily Log form; weekly LinkedIn post generator; Goals; Index; installable app icon |
| 28 Nov 2026 | Gym page with steps; adaptive fitness system (Today · Plan · Diet · Body) |
| 28 Nov 2026 | Private tabs encrypted in the browser: passcode, recovery key, fingerprint, owner gate, lockout + attempt log |
| 28 Nov 2026 | Diet tracker: date-based, food search with ~150 Indian vegetarian foods, live calorie calculator |
| 28 Nov 2026 | Smart typing on every text box |
| 28 Nov 2026 | Gym Notebook: 12 sourced chapters with charts, later a real spiral notebook *Altitude* |
| 28 Nov 2026 | Live video tab icons with per-tab music |
| 28 Nov 2026 | Settings drawer, then Settings v2: targets, reminders, privacy, auto-lock, backup, offline, units, shortcuts |
| 28 Nov 2026 | New brand mark *Circle Summit* and animated header logo |
| 28 Nov 2026 | Private bucket list *Rahasya*: treasure-cove scene, WebGL cinemagraph, padlock, encrypted memory photos |
| 28 Nov 2026 | Cleanup: Gym → **Basecamp**, Goals merged into Today, header = Journal · Basecamp · About |
| 28 Nov 2026 | **Projects** section with document folders (this one) |

The full, line-by-line changelog lives in `AI_HANDOFF.md` in the repository.

## 2. Roadmap

### Next
- **Project case studies** — every project gets a folder like this one; Parkinson's Disease Detection results once training finishes.
- **Notes library** — handwritten notes as searchable PDFs.
- **Achievements gallery** — certificates and newspaper clippings.
- **Polish** — GitHub README, share images, sitemap.

### Basecamp ideas
- Phase engine (habit → fat loss → diet break → finish)
- Sunday weekly check-in "coach"
- Sleep tracker
- Workout log with progressive overload

### Engineering
- Unit tests for the fitness engine and vault; Playwright end-to-end tests in CI (see *Test Plan*).
- Projects documents searchable from the Index.

## 3. Versioning of these documents
Each document carries a version and an *updated* date in its header. A change in behaviour updates the matching document in the same commit as the code.
