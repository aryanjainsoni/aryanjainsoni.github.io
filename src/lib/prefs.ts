// SHARED PREFERENCES — one JSON object in this browser ("pref:settings"), edited from the Settings drawer.
// Every page reads it from here (or, in inline scripts, straight from localStorage) and listens for
// the 'ascent:prefs' event to update live. Nothing here leaves the browser.
export type Prefs = {
  steps: number;            // daily step target
  sleep: number;            // hours
  water: number;            // litres
  protein: number;          // g per kg body weight · 0 = automatic (from the goal type)
  weighTime: string;        // "HH:MM" morning weigh-in
  privacy: boolean;         // blur numbers in the private Gym tabs
  autolock: number;         // minutes in the background before the Gym vault locks · 0 = never
  weight: 'kg' | 'lb';
  dist: 'km' | 'mi';
  clock: '12' | '24';
  weekStart: 'mon' | 'sun';
  calm: boolean;            // all animation off
  text: 's' | 'm' | 'l';    // text size
  lastBackup: string;       // ISO time of the last full backup ('' = never)
};
export const DEFAULTS: Prefs = {
  steps: 10000, sleep: 7.5, water: 4, protein: 0, weighTime: '07:00',
  privacy: false, autolock: 5,
  weight: 'kg', dist: 'km', clock: '12', weekStart: 'mon',
  calm: false, text: 'm', lastBackup: '',
};
export const KEY = 'pref:settings';

export function prefs(): Prefs {
  try { return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) || '{}') }; } catch { return { ...DEFAULTS }; }
}
export function setPrefs(patch: Partial<Prefs>) {
  const next = { ...prefs(), ...patch };
  // store only what differs from the defaults (keeps backups tidy)
  const diff = Object.fromEntries(Object.entries(next).filter(([k, v]) => DEFAULTS[k as keyof Prefs] !== v));
  localStorage.setItem(KEY, JSON.stringify(diff));
  applyRoot(next);
  dispatchEvent(new CustomEvent('ascent:prefs', { detail: next }));
  return next;
}
/** html classes that must exist before paint (also done inline in Base.astro's <head>) */
export function applyRoot(p = prefs()) {
  const r = document.documentElement;
  r.classList.toggle('calm', p.calm);
  r.classList.toggle('privacy', p.privacy);
  r.dataset.text = p.text;
}

// ---------- formatting helpers ----------
const LB = 2.20462;
export const wUnit = () => prefs().weight;
/** kg -> number in the chosen unit */
export const wOut = (kg: number) => (prefs().weight === 'lb' ? kg * LB : kg);
/** number typed in the chosen unit -> kg */
export const wIn = (v: number) => (prefs().weight === 'lb' ? v / LB : v);
export const dUnit = () => prefs().dist;
export const dOut = (km: number) => (prefs().dist === 'mi' ? km * 0.621371 : km);
export function fmtTime(hhmm: string, clock = prefs().clock) {
  if (!hhmm) return '';
  const [h, m] = hhmm.split(':').map(Number);
  return clock === '24' ? `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}` : `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
}
/** Mon-first weekday indexes (0=Mon … 6=Sun) in display order */
export const weekOrder = () => (prefs().weekStart === 'sun' ? [6, 0, 1, 2, 3, 4, 5] : [0, 1, 2, 3, 4, 5, 6]);
export const daysSinceBackup = () => { const t = prefs().lastBackup; return t ? Math.floor((Date.now() - Date.parse(t)) / 86_400_000) : Infinity; };
