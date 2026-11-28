// VAULT — encrypts the private fitness data in the browser. Uses only the browser's built-in Web Crypto + WebAuthn.
//
// Envelope encryption (like password managers):
//   data  --AES-256-GCM-->  encrypted with a random 256-bit DATA KEY
//   DATA KEY is then "wrapped" (encrypted) separately by each way of unlocking:
//     • passcode      PBKDF2-SHA256 (310k iterations, random salt) -> key -> wraps DATA KEY
//     • recovery key  random 160-bit code shown once at setup        -> key -> wraps DATA KEY
//     • fingerprint   passkey (Touch ID / phone fingerprint) PRF output -> HKDF -> key -> wraps DATA KEY
// Any one of them opens the vault. Changing the passcode only re-wraps the key; data isn't touched.
// Nothing secret is stored: no passcode, no recovery code, no fingerprint. Only encrypted blobs ("fit:vault").

export type Wrapped = { iv: string; wk: string };
export type PassSlot = Wrapped & { salt: string; it: number };
export type KeySlot = Wrapped & { id: string; salt: string; label: string; added: string };
export type VaultV2 = { v: 2; data: { iv: string; ct: string }; pass: PassSlot; rec?: PassSlot; keys?: KeySlot[] };
export type VaultV1 = { v: 1; it: number; salt: string; iv: string; ct: string };
export type AnyVault = VaultV1 | VaultV2;

export const ITER = 310_000;
const REC_ITER = 100_000; // recovery code already has 160 bits of randomness

const te = new TextEncoder(), td = new TextDecoder();
export const b64 = (u: Uint8Array) => { let s = ''; for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode(...u.subarray(i, i + 0x8000)); return btoa(s); };
export const unb64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
const b64url = (u: Uint8Array) => b64(u).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const rand = (n: number) => crypto.getRandomValues(new Uint8Array(n));

// ---------- primitives ----------
const aes = (raw: Uint8Array) => crypto.subtle.importKey('raw', raw, 'AES-GCM', false, ['encrypt', 'decrypt']);
async function pbkdf2(secret: string, salt: Uint8Array, it: number) {
  const base = await crypto.subtle.importKey('raw', te.encode(secret), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: it, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}
async function hkdf(secret: ArrayBuffer | Uint8Array) {
  const base = await crypto.subtle.importKey('raw', secret, 'HKDF', false, ['deriveKey']);
  return crypto.subtle.deriveKey({ name: 'HKDF', hash: 'SHA-256', salt: new Uint8Array(32), info: te.encode('ascent-fit-vault-v2') }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}
async function wrap(kek: CryptoKey, raw: Uint8Array): Promise<Wrapped> {
  const iv = rand(12);
  return { iv: b64(iv), wk: b64(new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, kek, raw))) };
}
const unwrap = async (kek: CryptoKey, w: Wrapped) => new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(w.iv) }, kek, unb64(w.wk)));

// ---------- data key + data ----------
export const newDataKey = () => rand(32);
export async function sealData(dk: Uint8Array, text: string) {
  const iv = rand(12);
  return { iv: b64(iv), ct: b64(new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await aes(dk), te.encode(text)))) };
}
export const openData = async (dk: Uint8Array, d: { iv: string; ct: string }) =>
  td.decode(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(d.iv) }, await aes(dk), unb64(d.ct)));

// ---------- passcode / recovery slots ----------
export async function makeSecretSlot(secret: string, dk: Uint8Array, it = ITER): Promise<PassSlot> {
  const salt = rand(16);
  return { salt: b64(salt), it, ...(await wrap(await pbkdf2(secret, salt, it), dk)) };
}
export const openSecretSlot = async (secret: string, s: PassSlot) => unwrap(await pbkdf2(secret, unb64(s.salt), s.it), s); // throws if wrong

// Recovery code: 32 Crockford base32 chars in 8 groups, e.g. K7QX-M2PA-9WTE-...
const B32 = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
export function newRecoveryCode() {
  const bytes = rand(20); let bits = '', out = '';
  bytes.forEach((b) => (bits += b.toString(2).padStart(8, '0')));
  for (let i = 0; i < 160; i += 5) out += B32[parseInt(bits.slice(i, i + 5), 2)];
  return out.match(/.{4}/g)!.join('-');
}
export const normCode = (s: string) => s.toUpperCase().replace(/[^0-9A-Z]/g, '').replace(/O/g, '0').replace(/[IL]/g, '1').replace(/U/g, 'V');
export const makeRecoverySlot = (code: string, dk: Uint8Array) => makeSecretSlot(normCode(code), dk, REC_ITER);
export const openRecoverySlot = (code: string, s: PassSlot) => openSecretSlot(normCode(code), s);

// ---------- old v1 vault (passcode-only) ----------
export async function openV1(pass: string, v: VaultV1) {
  const key = await pbkdf2(pass, unb64(v.salt), v.it);
  return td.decode(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(v.iv) }, key, unb64(v.ct)));
}

// ---------- fingerprint (passkey + PRF extension) ----------
export async function fingerprintAvailable() {
  try { return !!window.PublicKeyCredential && (await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()); } catch { return false; }
}
type PrfResults = { prf?: { enabled?: boolean; results?: { first?: ArrayBuffer } } };

// Registers this device's fingerprint / Touch ID and wraps the data key with its PRF secret.
// Throws Error('no-prf') when the browser can't derive a secret from the passkey (older browsers).
export async function addFingerprint(dk: Uint8Array, label: string): Promise<KeySlot> {
  const salt = rand(32);
  const cred = (await navigator.credentials.create({
    publicKey: {
      rp: { name: 'Ascent', id: location.hostname },
      user: { id: rand(16), name: 'Ascent · private fitness', displayName: 'Ascent' },
      challenge: rand(32),
      pubKeyCredParams: [{ type: 'public-key', alg: -7 }, { type: 'public-key', alg: -257 }],
      authenticatorSelection: { authenticatorAttachment: 'platform', userVerification: 'required', residentKey: 'preferred' },
      timeout: 60_000,
      extensions: { prf: { eval: { first: salt } } } as AuthenticationExtensionsClientInputs,
    },
  })) as PublicKeyCredential | null;
  if (!cred) throw new Error('cancelled');
  const ext = cred.getClientExtensionResults() as PrfResults;
  if (!ext.prf?.enabled && !ext.prf?.results?.first) throw new Error('no-prf');
  let secret = ext.prf?.results?.first;
  const id = new Uint8Array(cred.rawId);
  if (!secret) secret = await prfGet([{ id, salt }]).then((r) => r.secret); // some platforms only return PRF on sign-in
  return { id: b64url(id), salt: b64(salt), label, added: new Date().toISOString().slice(0, 10), ...(await wrap(await hkdf(secret), dk)) };
}

async function prfGet(list: { id: Uint8Array; salt: Uint8Array }[]) {
  const evalByCredential: Record<string, { first: Uint8Array }> = {};
  list.forEach((x) => (evalByCredential[b64url(x.id)] = { first: x.salt }));
  const a = (await navigator.credentials.get({
    publicKey: {
      challenge: rand(32), rpId: location.hostname, userVerification: 'required', timeout: 60_000,
      allowCredentials: list.map((x) => ({ type: 'public-key' as const, id: x.id })),
      extensions: { prf: { evalByCredential } } as AuthenticationExtensionsClientInputs,
    },
  })) as PublicKeyCredential | null;
  if (!a) throw new Error('cancelled');
  const secret = (a.getClientExtensionResults() as PrfResults).prf?.results?.first;
  if (!secret) throw new Error('no-prf');
  return { secret, id: b64url(new Uint8Array(a.rawId)) };
}

const fromUrl = (s: string) => unb64(s.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (s.length % 4)) % 4));
export async function openFingerprint(slots: KeySlot[]) {
  const { secret, id } = await prfGet(slots.map((s) => ({ id: fromUrl(s.id), salt: unb64(s.salt) })));
  const slot = slots.find((s) => s.id === id);
  if (!slot) throw new Error('unknown-key');
  return unwrap(await hkdf(secret), slot);
}
