// VAULT — encrypts the private fitness data in the browser with the owner's passcode.
// PBKDF2-SHA256 (310k iterations, random salt) -> AES-256-GCM. Uses the browser's built-in Web Crypto.
// Only the encrypted blob is stored (localStorage "fit:vault"); the passcode and key are never saved.
// No passcode = no data: there is no recovery, so keep an exported backup.

export type Vault = { v: 1; it: number; salt: string; iv: string; ct: string };
export const ITER = 310_000;

const te = new TextEncoder(), td = new TextDecoder();
const b64 = (u: Uint8Array) => { let s = ''; for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode(...u.subarray(i, i + 0x8000)); return btoa(s); };
const unb64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

export const newSalt = () => crypto.getRandomValues(new Uint8Array(16));

export async function deriveKey(pass: string, salt: Uint8Array, it = ITER) {
  const base = await crypto.subtle.importKey('raw', te.encode(pass), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: it, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}

export async function seal(key: CryptoKey, salt: Uint8Array, text: string, it = ITER): Promise<Vault> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, te.encode(text)));
  return { v: 1, it, salt: b64(salt), iv: b64(iv), ct: b64(ct) };
}

// Throws if the passcode is wrong (AES-GCM authentication fails).
export async function unseal(pass: string, vault: Vault) {
  const salt = unb64(vault.salt);
  const key = await deriveKey(pass, salt, vault.it);
  const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(vault.iv) }, key, unb64(vault.ct));
  return { key, salt, it: vault.it, text: td.decode(pt) };
}
