---
title: Software Requirements Specification
kind: SRS
order: 1
version: '1.0'
updated: 2026-11-28
summary: What Ascent must do and how well it must do it — written in the IEEE 830 style, section by section.
---

## 1. Introduction

### 1.1 Purpose
This document specifies the requirements for **Ascent**, the personal website of Aryan Jain at `aryanjainsoni.github.io`. It is written for two readers: future developers (human or AI) who take over the code, and anyone who wants to understand how the site was designed. It follows the structure of IEEE Std 830-1998.

### 1.2 Scope
Ascent is a **lifelong, public record of learning** — a journal, a training base (Basecamp), a project archive and an index of everything — plus a few **private, encrypted** areas that only the owner can open. It is a static site: there is no application server and no database. Everything private is stored and encrypted **in the visitor's own browser**.

Out of scope: user accounts for visitors, comments, server-side analytics, paid services or a custom domain.

### 1.3 Definitions, acronyms and abbreviations

| Term | Meaning |
|---|---|
| Owner | Aryan — the only person who writes content and opens private areas |
| Visitor | Anyone reading the public site |
| Vault | Encrypted browser storage for private data (`fit:vault`) |
| Data key | Random 256-bit AES key that encrypts the vault |
| PRF | WebAuthn pseudo-random function extension — lets a passkey produce a secret |
| PWA | Progressive Web App — installable, works offline |
| IST | India Standard Time (UTC+5:30), the site's reference time zone |
| SSG | Static site generation (HTML built ahead of time by Astro) |

### 1.4 References
- IEEE Std 830-1998, *Recommended Practice for Software Requirements Specifications*
- Astro documentation — docs.astro.build
- W3C Web Cryptography API and WebAuthn Level 3 (PRF extension)
- WCAG 2.2 (accessibility)
- The repository's `AI_HANDOFF.md` (living brief + changelog)

### 1.5 Overview
Section 2 describes the product as a whole. Section 3 lists the functional requirements section by section, then the non-functional requirements (security and privacy, performance, accessibility, offline/PWA, maintainability).

## 2. Overall description

### 2.1 Product perspective
Ascent is a self-contained static site built with Astro and hosted on GitHub Pages. Its only outside connections are read-only: LeetCode's public data (fetched at **build** time), GitHub's public commit search (fetched in the browser on the Daily Log page) and Google Fonts. A GitHub Actions workflow builds and deploys every push to `main`, and rebuilds nightly so LeetCode numbers stay fresh.

### 2.2 Product functions (summary)
- Home with story, topic cards and consistency heatmaps
- Journal: one entry per day, streaks, heatmap; Daily Log form that writes the entry
- Basecamp: steps, daily goals, adaptive fitness plan, diet tracker, BMI, and a sourced training notebook
- Projects: folders of professional documents (this page is one of them)
- Index: search and timeline across everything
- Private bucket list (*Rahasya*) inside the encrypted vault
- Settings drawer: theme, targets, units, privacy, backup, install, shortcuts

### 2.3 User classes
| Class | Needs | Access |
|---|---|---|
| Visitor | Read quickly on any device, find things | All public pages |
| Owner | Write daily, track private data on phone and laptop | Public pages + vault (passcode, recovery key or fingerprint) |
| Maintainer (future AI/dev) | Understand and change the code safely | Repository + `AI_HANDOFF.md` |

### 2.4 Operating environment
Current Chrome, Safari, Edge and Firefox on desktop and mobile; screen widths from 320 px to 1920 px+; light and dark colour schemes. Fingerprint unlock needs a browser and authenticator that support the WebAuthn PRF extension.

### 2.5 Design and implementation constraints
- **Free only**: GitHub Pages hosting, no paid APIs, no custom domain (for now).
- **Static hosting**: no server code, so no server-side secrets, sessions or email.
- **Public repository**: nothing private may ever be committed.
- **Design language**: "quiet luxury" — warm espresso/ivory palette, Fraunces + Inter, one ember accent, minimal motion.

### 2.6 Assumptions and dependencies
- LeetCode's unofficial GraphQL endpoint may change; the build must survive its failure.
- Browsers keep `localStorage` and IndexedDB unless the user clears them — so backups are the user's responsibility, and the site reminds them.

## 3. Specific requirements — functional

Each requirement has an ID. *Shall* = required; *should* = desired.

### 3.1 Global shell
| ID | Requirement |
|---|---|
| G-1 | Every page shall share one layout: logo (home link), header nav **Journal · Basecamp · About**, search, bucket, theme and settings icons, footer with socials. |
| G-2 | The site shall support light, dark and auto themes, remembered per browser. |
| G-3 | Keyboard shortcuts shall exist for navigation and common actions; `?` shall show a cheat sheet; shortcuts shall never fire while typing. |
| G-4 | Every text box should offer smart typing (suggestions, autocorrect with undo), except password, number and opt-out fields. |
| G-5 | Old addresses (`/gym/`, `/goals/`) shall redirect to their new home, keeping the `#hash`. |

### 3.2 Home
| ID | Requirement |
|---|---|
| H-1 | Home shall introduce the owner, show topic cards (ready ones link, others show *Soon*), and show journal + LeetCode consistency heatmaps. |
| H-2 | A topic card shall use a cover photo from `public/images/covers/<slug>` when present, else a gradient + emoji. |

### 3.3 Journal and Daily Log
| ID | Requirement |
|---|---|
| J-1 | Each Markdown file in `src/content/journal/` (named by date) shall become a page at `/journal/<date>/`. |
| J-2 | The Journal shall show streaks and a heatmap calculated in IST. |
| J-3 | The Daily Log form shall turn answers into a Markdown entry and open GitHub's "new file" page pre-filled, so the owner commits it. |
| J-4 | The Daily Log shall auto-fill the day's public GitHub commits and auto-draft reflection fields, keeping them live until the owner edits them. |
| J-5 | Drafts shall save on every keystroke and survive closing the browser. |

### 3.4 Basecamp
| ID | Requirement |
|---|---|
| B-1 | Basecamp shall have tabs **Steps · Today · Plan · Diet · BMI · Notebook**, each deep-linkable by `#hash`. |
| B-2 | Steps shall chart steps from journal front-matter (7D/30D/90D/1Y), streaks and a heatmap against the step goal. |
| B-3 | Today shall show daily and weekly goals with ticks stored per date in the browser. |
| B-4 | Plan, Diet and BMI shall compute targets from the owner's private scans and logs, which live only in the encrypted vault. |
| B-5 | Diet shall be date-based (week strip, history) and snapshot the plan per day so past days never change. |
| B-6 | Notebook shall render each chapter file from `src/content/guide/` as pages of a spiral notebook, with index, search and deep links. |

### 3.5 Projects
| ID | Requirement |
|---|---|
| P-1 | `/projects/` shall list each project as a folder with status and document count. |
| P-2 | Each folder shall list its documents; each document shall be a readable page with contents and previous/next links. |
| P-3 | A document marked *planned* shall render with a "coming soon" notice instead of being hidden. |

### 3.6 Index (search)
| ID | Requirement |
|---|---|
| X-1 | `/explore/` shall search across journal, projects, skills, achievements and more, with a category view and a timeline. |
| X-2 | Search state shall be shareable through the URL (`?q=&view=&year=`). |

### 3.7 Private areas
| ID | Requirement |
|---|---|
| V-1 | Private fitness data and the bucket list shall be readable only after unlocking the vault. |
| V-2 | The vault shall unlock with a passcode, a one-time recovery key, or a registered fingerprint/passkey. |
| V-3 | Wrong attempts shall trigger an escalating pause that survives refresh, and shall be logged on that device. |
| V-4 | The vault shall auto-lock after a configurable idle time. |
| V-5 | Bucket-list photos shall be encrypted with the same data key before being stored. |

### 3.8 Settings
| ID | Requirement |
|---|---|
| S-1 | Settings shall cover appearance, targets, reminders (`.ics` download), units, privacy, backup/restore, install and shortcuts. |
| S-2 | Only non-default preferences shall be stored, in one key (`pref:settings`); changes shall redraw open pages. |
| S-3 | A full backup shall export all browser data (vault still encrypted); restore shall ask before overwriting. |

## 4. Non-functional requirements

### 4.1 Security and privacy
| ID | Requirement |
|---|---|
| NF-S1 | The repository and built HTML shall contain **no private data** (no phone, address, date of birth, medical details, body metrics or wishes). |
| NF-S2 | Private data shall be encrypted with AES-256-GCM using keys derived in the browser; no secret shall be stored in plain form. |
| NF-S3 | Passcodes shall be stretched with PBKDF2-SHA256 at 310,000 iterations and a random salt. |
| NF-S4 | No visitor data shall be collected; the site shall use no analytics or tracking cookies. |
| NF-S5 | A lost passcode shall not be resettable by anyone, by design — only the recovery key or a fingerprint can recover access. |

### 4.2 Performance
| ID | Requirement |
|---|---|
| NF-P1 | Pages shall be pre-rendered HTML; JavaScript shall load only where a page needs interactivity. |
| NF-P2 | Heavy media (videos, music) shall load lazily, never be cached by the service worker, and pause when not visible. |
| NF-P3 | The build shall succeed even when an outside API (LeetCode) fails. |

### 4.3 Accessibility
| ID | Requirement |
|---|---|
| NF-A1 | Text shall meet WCAG AA contrast in both themes. |
| NF-A2 | All controls shall be reachable by keyboard with a visible focus style. |
| NF-A3 | `prefers-reduced-motion` and the site's **Calm mode** shall remove animation. |
| NF-A4 | Text size shall be adjustable (S/M/L) in Settings. |
| NF-A5 | Pages shall work at 375 px wide with no horizontal scrolling. |

### 4.4 Offline and PWA
| ID | Requirement |
|---|---|
| NF-O1 | The site shall be installable (web manifest, icons including maskable). |
| NF-O2 | A service worker shall serve pages network-first with a cached fallback, and built assets cache-first. |
| NF-O3 | Private tools (vault, diet, goals) shall keep working offline, since all their data is local. |

### 4.5 Maintainability
| ID | Requirement |
|---|---|
| NF-M1 | Personal content shall live in data files (`src/data/*.ts`) and Markdown collections, not inside page code. |
| NF-M2 | Every change shall update `AI_HANDOFF.md` (brief + changelog) in the same commit. |
| NF-M3 | Code comments should be in simple Hinglish so the owner can follow them. |
