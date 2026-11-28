// SETTINGS drawer — opened from the gear icon (top-left). Preferences live in this browser:
//   theme (light/dark, or removed = follow the system) · pref:motion · pref:glow · smart:off · gym:sound
// Pages react through window events: 'ascent:music' (Gym music), 'ascent:motion' (Gym live icons).
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
}
addEventListener('ascent:theme', sync);
addEventListener('ascent:music-state', sync); // Gym page's note icon changed it
sync();
