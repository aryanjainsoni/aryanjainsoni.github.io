// SETTINGS drawer — opened from the gear icon (top-left). Preferences live in this browser:
//   theme (light/dark, or removed = follow the system) · pref:motion · pref:glow · smart:off · gym:sound
// Pages react through window events: 'ascent:music' (Gym music), 'ascent:motion' (Gym live icons),
// 'ascent:prefs' (targets, units, privacy, calm, text size — see src/lib/prefs.ts).
import { prefs, setPrefs, fmtTime, daysSinceBackup, applyRoot, type Prefs } from '../lib/prefs';
import { goals as GOAL_DEFAULTS } from '../data/profile';
import { allPhotos, putAllPhotos, type PhotoRec } from '../lib/photos';
const $ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => r.querySelector<T>(s);
const drawer = $('#settings')!, scrim = $('.sd-scrim')!, opener = $('#settings-open')!;
let lastFocus: HTMLElement | null = null;

// Gym vault (lock, backups, security): on the Gym page it's already running; elsewhere load it the first time Settings opens
let vaultLoaded = !!document.querySelector('[data-fit="today"]');
function loadVault() { if (vaultLoaded) return; vaultLoaded = true; import('./fit-app'); }

function open() {
  lastFocus = document.activeElement as HTMLElement;
  sync(); loadVault();
  drawer.hidden = false; scrim.hidden = false;
  requestAnimationFrame(() => { drawer.classList.add('in'); scrim.classList.add('in'); });
  document.documentElement.classList.add('sd-open');
  ($('.sd-x', drawer) as HTMLElement).focus();
}
function close() {
  drawer.classList.remove('in'); scrim.classList.remove('in');
  document.documentElement.classList.remove('sd-open');
  setTimeout(() => { drawer.hidden = true; scrim.hidden = true; }, 260);
  lastFocus?.focus();
}
opener.addEventListener('click', open);
addEventListener('ascent:open-settings', open);
document.addEventListener('click', (e) => { const t = e.target as HTMLElement; if (t.closest('[data-sd-close]')) close(); if (t.closest('[data-open-settings]')) open(); });
addEventListener('keydown', (e) => {
  if (drawer.hidden) return;
  if (e.key === 'Escape') { e.preventDefault(); close(); }
  if (e.key === 'Tab') { // keep focus inside the drawer
    const f = [...drawer.querySelectorAll<HTMLElement>('button, a, input, select, textarea, summary')].filter((x) => !x.hasAttribute('disabled') && x.offsetParent);
    if (!f.length) return;
    if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
    else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
  }
});

// ---- preferences ----
const isOn = (k: string) => ({
  music: localStorage.getItem('gym:sound') === 'on',
  motion: localStorage.getItem('pref:motion') !== 'off',
  glow: localStorage.getItem('pref:glow') !== 'off',
  typing: localStorage.getItem('smart:off') !== '1',
}[k] ?? false);
function setPref(k: string, on: boolean) {
  if (k === 'music') { localStorage.setItem('gym:sound', on ? 'on' : 'off'); dispatchEvent(new CustomEvent('ascent:music', { detail: on })); }
  if (k === 'motion') { localStorage.setItem('pref:motion', on ? 'on' : 'off'); dispatchEvent(new CustomEvent('ascent:motion', { detail: on })); }
  if (k === 'glow') { localStorage.setItem('pref:glow', on ? 'on' : 'off'); if (!on) document.documentElement.classList.remove('glow-on'); }
  if (k === 'typing') { on ? localStorage.removeItem('smart:off') : localStorage.setItem('smart:off', '1'); }
  sync();
}
drawer.querySelectorAll<HTMLElement>('[data-pref]').forEach((b) => b.addEventListener('click', () => setPref(b.dataset.pref!, !isOn(b.dataset.pref!))));

drawer.querySelectorAll<HTMLElement>('[data-theme-set]').forEach((b) => b.addEventListener('click', () => {
  const v = b.dataset.themeSet!;
  if (v === 'system') { localStorage.removeItem('theme'); document.documentElement.dataset.theme = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'; }
  else { localStorage.setItem('theme', v); document.documentElement.dataset.theme = v; }
  sync();
}));
$('[data-clear-words]', drawer)?.addEventListener('click', () => {
  if (!confirm('Forget the words smart typing has learned in this browser?')) return;
  localStorage.removeItem('smart:vocab'); dispatchEvent(new Event('ascent:words-cleared')); sync();
});

function sync() {
  drawer.querySelectorAll<HTMLElement>('[data-pref]').forEach((b) => b.setAttribute('aria-checked', String(isOn(b.dataset.pref!))));
  const t = localStorage.getItem('theme') || 'system';
  drawer.querySelectorAll<HTMLElement>('[data-theme-set]').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.themeSet === t)));
  let n = 0; try { n = Object.values(JSON.parse(localStorage.getItem('smart:vocab') || '{}') as Record<string, number>).filter((c) => c >= 2).length; } catch {}
  const l = $('[data-learned]', drawer); if (l) l.textContent = n ? `${n} word${n > 1 ? 's' : ''} learned in this browser.` : 'Nothing learned yet in this browser.';
  syncPrefs(); renderReminders(); backupStatus();
}
addEventListener('ascent:theme', sync);
addEventListener('ascent:prefs', sync);
addEventListener('ascent:music-state', sync); // Gym page's note icon changed it

// ================= Settings v2 =================
const toast = (msg: string) => {
  let t = document.querySelector('.toast') as HTMLElement | null;
  if (!t) { t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); document.body.append(t); }
  t.textContent = msg; t.classList.add('in'); clearTimeout((t as any)._h); (t as any)._h = setTimeout(() => t!.classList.remove('in'), 2600);
};
(window as any).ascentToast = toast;

// ---- targets, units, calm, privacy, text size, auto-lock: every [data-p] control ----
function syncPrefs() {
  const p = prefs();
  drawer.querySelectorAll<HTMLElement>('[data-p]').forEach((el) => {
    const k = el.dataset.p as keyof Prefs, v = p[k];
    if (el.classList.contains('sw')) el.setAttribute('aria-checked', String(!!v));
    else if (el.dataset.v != null) el.setAttribute('aria-checked', String(String(v) === el.dataset.v));
    else if (el instanceof HTMLInputElement || el instanceof HTMLSelectElement) { if (document.activeElement !== el) el.value = String(v); }
  });
}
drawer.querySelectorAll<HTMLElement>('[data-p]').forEach((el) => {
  const k = el.dataset.p as keyof Prefs;
  if (el.classList.contains('sw')) el.addEventListener('click', () => setPrefs({ [k]: !prefs()[k] }));
  else if (el.dataset.v != null) el.addEventListener('click', () => setPrefs({ [k]: el.dataset.v }));
  else el.addEventListener('change', () => {
    const raw = (el as HTMLInputElement).value;
    if (k === 'weighTime') return raw && setPrefs({ weighTime: raw });
    const x = parseFloat(raw), inp = el as HTMLInputElement;
    if (!Number.isFinite(x)) return syncPrefs();
    const lo = inp.min ? +inp.min : -Infinity, hi = inp.max ? +inp.max : Infinity;
    setPrefs({ [k]: Math.min(hi, Math.max(lo, x)) });
    toast('Saved ✓');
  });
});

// ---- Reminders -> calendar file (.ics) ----
type Rem = { id: string; name: string; time: string; days?: string[] };
const BYDAY: Record<string, string> = { mon: 'MO', tue: 'TU', wed: 'WE', thu: 'TH', fri: 'FR', sat: 'SA', sun: 'SU' };
const REM_KEY = 'pref:reminders';
const DEFAULT_ON = ['d-morning-weigh-in', 'd-gym', 'd-vedantu-lecture', 'd-journal-entry'];
function reminderList(): Rem[] {
  let cfg: any = GOAL_DEFAULTS;
  try { const c = JSON.parse(localStorage.getItem('goals:config') || 'null'); if (c && Array.isArray(c.daily) && Array.isArray(c.weekly)) cfg = c; } catch {}
  const out: Rem[] = [];
  for (const g of cfg.daily) if (g.time || g.id === 'd-morning-weigh-in') out.push({ id: g.id, name: g.name, time: g.id === 'd-morning-weigh-in' ? prefs().weighTime : g.time });
  for (const g of cfg.weekly) if (g.time && g.days?.length) out.push({ id: g.id, name: g.name, time: g.time, days: g.days });
  if (!out.some((r) => r.id === 'd-morning-weigh-in')) out.unshift({ id: 'd-morning-weigh-in', name: 'Morning weigh-in', time: prefs().weighTime });
  return out.sort((a, b) => a.time.localeCompare(b.time));
}
const chosen = (): string[] => { try { return JSON.parse(localStorage.getItem(REM_KEY) || 'null') ?? DEFAULT_ON; } catch { return DEFAULT_ON; } };
const escH = (x: string) => x.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));
function renderReminders() {
  const box = $('[data-reminders]', drawer); if (!box) return;
  const on = chosen();
  box.innerHTML = reminderList().map((r) => `<label><input type="checkbox" value="${escH(r.id)}" ${on.includes(r.id) ? 'checked' : ''}> ${escH(r.name)}<span class="t">${fmtTime(r.time)}${r.days ? ' · ' + r.days.map((d) => d[0].toUpperCase() + d.slice(1, 3)).join(' ') : ''}</span></label>`).join('');
}
$('[data-reminders]', drawer)?.addEventListener('change', () => {
  localStorage.setItem(REM_KEY, JSON.stringify([...drawer.querySelectorAll<HTMLInputElement>('[data-reminders] input:checked')].map((i) => i.value)));
});
const icsText = (s: string) => s.replace(/[\;,]/g, (c) => '\\' + c).replace(/\n/g, '\\n');
function buildIcs(list: Rem[]) {
  const ist = new Date(Date.now() + 5.5 * 3600e3), day = ist.toISOString().slice(0, 10).replace(/-/g, '');
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
  const L = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Ascent//Reminders//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', 'X-WR-CALNAME:Ascent reminders', 'X-WR-TIMEZONE:Asia/Kolkata',
    'BEGIN:VTIMEZONE', 'TZID:Asia/Kolkata', 'BEGIN:STANDARD', 'DTSTART:19700101T000000', 'TZOFFSETFROM:+0530', 'TZOFFSETTO:+0530', 'TZNAME:IST', 'END:STANDARD', 'END:VTIMEZONE'];
  for (const r of list) {
    const [h, m] = r.time.split(':');
    L.push('BEGIN:VEVENT', `UID:ascent-${r.id}@aryanjainsoni.github.io`, `DTSTAMP:${stamp}`, `DTSTART;TZID=Asia/Kolkata:${day}T${h}${m}00`, 'DURATION:PT15M',
      r.days ? `RRULE:FREQ=WEEKLY;BYDAY=${r.days.map((d) => BYDAY[d]).join(',')}` : 'RRULE:FREQ=DAILY',
      `SUMMARY:${icsText(r.name)}`, `DESCRIPTION:${icsText('Ascent — tick it off at https://aryanjainsoni.github.io/goals/')}`, 'TRANSP:TRANSPARENT',
      'BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${icsText(r.name)}`, 'TRIGGER:PT0M', 'END:VALARM', 'END:VEVENT');
  }
  L.push('END:VCALENDAR');
  return L.join('\r\n') + '\r\n';
}
const download = (name: string, text: string, type: string) => {
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type })); a.download = name;
  document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
};
$('[data-ics]', drawer)?.addEventListener('click', () => {
  const on = chosen(), list = reminderList().filter((r) => on.includes(r.id));
  if (!list.length) return toast('Tick at least one reminder');
  download('ascent-reminders.ics', buildIcs(list), 'text/calendar');
  toast(`${list.length} reminder${list.length > 1 ? 's' : ''} ready — open the file to add them`);
});

// ---- Full backup / restore (one JSON file) — also carries the encrypted bucket photos from IndexedDB ----
const BACKUP_KEYS = (k: string) => k.startsWith('goals:') || k.startsWith('log:draft:') || k.startsWith('pref:') || ['smart:vocab', 'smart:off', 'theme', 'gym:sound', 'fit:vault', 'fit:plain'].includes(k);
const hasData = () => Object.keys(localStorage).some((k) => k.startsWith('goals:') || k.startsWith('log:draft:') || k === 'fit:vault' || k === 'fit:plain');
$('[data-backup]', drawer)?.addEventListener('click', async () => {
  const data: Record<string, string> = {};
  for (const k of Object.keys(localStorage)) if (BACKUP_KEYS(k)) data[k] = localStorage.getItem(k)!;
  try { const ph = await allPhotos(); if (ph.length) data['idb:bucket-photos'] = JSON.stringify(ph); } catch { /* no IndexedDB */ } // bucket memories (still encrypted)
  const when = new Date();
  download(`ascent-backup-${when.toISOString().slice(0, 10)}.json`, JSON.stringify({ app: 'ascent', kind: 'full-backup', v: 1, at: when.toISOString(), data }, null, 1), 'application/json');
  setPrefs({ lastBackup: when.toISOString() });
  toast(`Backup saved — ${Object.keys(data).length} items`);
});
$('[data-restore]', drawer)?.addEventListener('change', async (e) => {
  const inp = e.target as HTMLInputElement, f = inp.files?.[0]; inp.value = '';
  if (!f) return;
  try {
    const j = JSON.parse(await f.text());
    if (j?.app !== 'ascent' || j.kind !== 'full-backup' || typeof j.data !== 'object') throw 0;
    const keys = Object.keys(j.data).filter(BACKUP_KEYS);
    if (!confirm(`Restore ${keys.length} items from ${new Date(j.at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}?\n\nThis replaces the same items in this browser. The Gym data stays encrypted with its original passcode.`)) return;
    for (const k of keys) if (typeof j.data[k] === 'string') localStorage.setItem(k, j.data[k]);
    if (typeof j.data['idb:bucket-photos'] === 'string') { try { await putAllPhotos(JSON.parse(j.data['idb:bucket-photos']) as PhotoRec[]); } catch {} }
    toast('Restored ✓ — reloading'); setTimeout(() => location.reload(), 900);
  } catch { toast('That file isn’t an Ascent full backup'); }
});
function backupStatus() {
  const d = daysSinceBackup(), el = $('[data-backup-status]', drawer), due = hasData() && d >= 7;
  if (el) { el.textContent = d === Infinity ? 'No backup yet — save one file with everything.' : d === 0 ? 'Last backup: today ✓' : `Last backup: ${d} day${d > 1 ? 's' : ''} ago${d >= 7 ? ' — time for a new one' : ''}`; el.classList.toggle('warn', due); }
  const dot = $('.gear-dot'); if (dot) dot.hidden = !due;
  opener.setAttribute('aria-label', due ? 'Settings — backup due' : 'Settings');
}
applyRoot();
sync();
