---
title: Security & Privacy Design
kind: Security
order: 4
version: '1.0'
updated: 2026-11-28
summary: How a public static website keeps private data private — client-side AES-GCM envelope encryption, no server, nothing secret in the repo.
---

## 1. Threat model

**What we protect:** the owner's private fitness data (scans, goals, daily logs, custom foods), the bucket list and its photos.

**Who we protect it from:**
| Adversary | Can they… | Defence |
|---|---|---|
| Any visitor on the internet | Read the repo and every built page | Private data is never in the repo or HTML |
| Someone using the owner's unlocked laptop later | Open the browser | Auto-lock after idle time, *Lock now*, privacy blur |
| Someone with the device who guesses passcodes | Try many passcodes | PBKDF2 cost + escalating pauses + attempt log |
| Someone who copies the browser storage | Get the encrypted blob | AES-256-GCM; key needs passcode / recovery key / fingerprint |
| A compromised server | Change data in transit or at rest | There is no server holding data; HTTPS via GitHub Pages |

**Out of scope:** malware on the owner's own device (it could read the screen after unlock), and a malicious change pushed to the repo itself.

## 2. Principle: no server, nothing to steal
Ascent is static. There is no login endpoint, no database and no API that stores user data. Private data is created, encrypted, stored and decrypted **inside the owner's browser**. The site's host only ever serves the same public files to everyone.

## 3. Vault — envelope encryption

```
                 ┌───────────── random 256-bit DATA KEY ─────────────┐
                 │                                                   │
  private JSON ──AES-256-GCM (random 96-bit IV)──▶ data.ct           │
                                                                     │
  DATA KEY wrapped three ways (each AES-GCM, own IV):                │
    passcode     ─PBKDF2-SHA256, 310,000 it., 16-byte salt─▶ KEK ─wraps┤
    recovery key ─PBKDF2-SHA256, 100,000 it., 16-byte salt─▶ KEK ─wraps┤
    fingerprint  ─passkey PRF output ─HKDF-SHA256──────────▶ KEK ─wraps┘
```

- Any **one** way of unlocking recovers the data key; the data itself is encrypted only once.
- Changing the passcode re-wraps the data key — the data is not touched.
- Stored: salts, IVs, iteration counts and ciphertexts. **Never stored:** the passcode, the recovery code, the data key or any fingerprint data.
- AES-GCM is authenticated: a wrong key or a tampered blob fails to decrypt instead of returning garbage.

### 3.1 Recovery key
160 random bits, shown once at setup as 32 Crockford base32 characters in groups of four. Input is normalised (case, `O→0`, `I/L→1`) so it is easy to type. Fewer PBKDF2 iterations are needed because the code itself is high-entropy.

### 3.2 Fingerprint / Touch ID
A WebAuthn passkey with the **PRF extension** produces a secret that only that authenticator can produce, and only after a successful fingerprint check. HKDF-SHA256 turns it into a key-encryption key. Each registered device gets its own wrapped slot, which can be removed individually. Browsers without PRF simply don't offer this option.

### 3.3 Photos
Bucket-list photos are resized in the browser (~1100 px JPEG), encrypted with the same data key and stored in IndexedDB, because localStorage is too small.

## 4. Owner gate on new devices
A new browser has no vault yet, so anyone could try to "create" one. To prevent a visitor from setting up a space, the site publishes `public/owner.json`: a **one-way PBKDF2-SHA256 check value (600,000 iterations, random salt)** of the owner's passcode. A new device must prove it knows the passcode before a space can be created. The value reveals nothing about the data; because it is public, the passcode must be long (10+ characters). The comparison is constant-time.

## 5. Guessing protection
| Wrong tries in a row | Pause |
|---|---|
| 5 | 30 seconds |
| 10 | 1 minute |
| 15 | 5 minutes |
| 20 | 15 minutes |
| 25+ | 1 hour |

The counter lives in `fit:guard` and **survives refresh**. Each wrong try is logged on that device (time, method, browser + OS — no location) and shown as an alert after the next successful unlock. Because there is no server, there are no remote alerts.

## 6. Session protection
- **Auto-lock** after 1, 5 (default), 15 or 30 minutes idle, or never — the decrypted data and key are dropped from memory.
- **Lock now** in Settings and on the vault screen.
- **Privacy screen** blurs numbers on private tabs until hovered or tapped (shortcut `P`).

## 7. What is public on purpose
- Journal entries the owner chooses to commit (the Daily Log keeps the "grateful" answer private).
- Default goal list, profile, projects, notebook chapters — reviewed before every commit.
- `AI_HANDOFF.md` — deliberately free of phone, address, date of birth and medical information.

## 8. Backups
Full backup exports every local key into one JSON file; the vault stays **encrypted** inside it, photos included. The basecamp export is unencrypted and the site says so. The gear icon shows a reminder dot when private data exists and the last backup is 7+ days old.

## 9. Known limits
- **Lost passcode + lost recovery key + no fingerprint = data is gone.** No one can reset it — not the owner, not a developer, not an AI. This is the price of real encryption.
- Data does not sync between devices automatically; it moves only through backup files.
- A browser extension with page access could read decrypted data while the vault is open.
