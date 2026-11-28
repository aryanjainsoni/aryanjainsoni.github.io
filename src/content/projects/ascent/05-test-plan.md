---
title: Test Plan
kind: Tests
order: 5
version: '1.0'
updated: 2026-11-28
summary: How every change to Ascent is checked before it goes live — scope, environments, test cases by area, and pass/fail criteria.
---

## 1. Purpose and scope
This plan describes how Ascent is verified. Today testing is **manual and browser-based**, done for every change before pushing; Section 7 lists the automated tests planned next.

In scope: every public page, the private vault flows, settings, offline behaviour, both themes and both target widths. Out of scope: load testing (static hosting) and third-party uptime (LeetCode, GitHub).

## 2. Test environments
| Environment | Detail |
|---|---|
| Desktop | Chromium at ~1280×800 and 1000×565 (small laptop) |
| Mobile | 375×812 (iPhone-size) with touch emulation |
| Themes | Light and dark for every visual change |
| Modes | Calm mode on/off; `prefers-reduced-motion` |
| Build | `npm run build` locally must pass before push; GitHub Actions must go green after |

## 3. Entry and exit criteria
**Entry:** the change builds locally with no errors.
**Exit (ready to push):**
- No console errors on the changed pages
- No horizontal overflow at 375 px (`document.documentElement.scrollWidth <= innerWidth`)
- Both themes readable
- `AI_HANDOFF.md` updated in the same commit
- After push: the deploy run succeeds and the live page shows the change

## 4. Test cases — functional

### 4.1 Shell and navigation
| ID | Steps | Expected |
|---|---|---|
| T-G1 | Open any page | Header shows Journal · Basecamp · About + icons; footer socials |
| T-G2 | Toggle theme, reload | Theme kept, no flash of the wrong theme |
| T-G3 | Press `?` | Shortcut cheat sheet opens; shortcuts ignored while typing in a field |
| T-G4 | Open `/gym/#plan` | Redirects to `/basecamp/#plan` |

### 4.2 Journal and Daily Log
| ID | Steps | Expected |
|---|---|---|
| T-J1 | Add a dated `.md` file, build | New page at `/journal/<date>/`, heatmap and streak update |
| T-J2 | Type in Daily Log, close tab, reopen | Draft restored with "Saved" time |
| T-J3 | Press Publish | GitHub's new-file page opens with the entry pre-filled |
| T-J4 | Edit an auto-drafted field | Badge "your words ✓"; field stops auto-updating |

### 4.3 Basecamp
| ID | Steps | Expected |
|---|---|---|
| T-B1 | Open each tab by `#hash` | Correct tab active, fits one laptop screen |
| T-B2 | Tick a goal, reload | Tick kept for that date only |
| T-B3 | Diet: go to a past date | Past plan snapshot shown, not today's template |
| T-B4 | Notebook: open, flip, search, deep link | Pages flip; search highlights; `#guide/p-5` opens page 5 |

### 4.4 Projects
| ID | Steps | Expected |
|---|---|---|
| T-P1 | Open `/projects/` | One folder per project with status and document count |
| T-P2 | Open a folder, then a document | Contents list, readable tables, previous/next links |
| T-P3 | Open a *planned* document | "Coming soon" notice, not a 404 |

### 4.5 Vault and privacy
| ID | Steps | Expected |
|---|---|---|
| T-V1 | Unlock with passcode | Private tabs decrypt and render |
| T-V2 | Unlock with recovery key, set new passcode | Works; old passcode no longer works |
| T-V3 | Enter 5 wrong passcodes, reload | 30-second pause still active after reload |
| T-V4 | Wait past auto-lock time | Vault locks; data hidden |
| T-V5 | Inspect `localStorage["fit:vault"]` | Only base64 ciphertext, salts, IVs — no readable data |
| T-V6 | Search built `dist/` for private words | No matches |
| T-V7 | Fingerprint on a PRF-capable device | Registers and unlocks; removing it disables that slot |

### 4.6 Settings, backup, offline
| ID | Steps | Expected |
|---|---|---|
| T-S1 | Change units to lb / mi / 24 h | Displays convert; stored values unchanged |
| T-S2 | Full backup → clear storage → restore | Everything back, vault still locked and encrypted |
| T-S3 | Load a page, go offline, reload | Cached page shown; private tools still work |
| T-S4 | Calm mode on | No animation anywhere; videos paused |

## 5. Non-functional checks
| Area | Check |
|---|---|
| Accessibility | Tab through each changed page: every control reachable, focus visible; contrast AA in both themes |
| Performance | Pages are static HTML; videos lazy and paused when hidden; no large JS on pages that don't need it |
| Privacy | `git diff` reviewed for personal data before every commit |
| Resilience | Build succeeds with LeetCode blocked (returns `null`, section hides) |

## 6. Defect handling
A bug found in testing is fixed before push. A bug found live is fixed in the next commit, and anything learned is added to **Known gotchas** in `AI_HANDOFF.md` so it isn't repeated.

## 7. Next: automation (planned)
1. **Unit tests** (Vitest) for `src/lib/fit.ts` (targets, safety caps, ledger) and `src/lib/vault.ts` (wrap/unwrap round-trips, wrong-key failure, recovery-code normalisation).
2. **End-to-end** (Playwright) for T-G1, T-J2, T-B1, T-P1–P3, T-V1, T-V3 at 1280 px and 375 px.
3. **CI gate**: run both in GitHub Actions before deploy.
