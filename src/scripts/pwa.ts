// INSTALL + OFFLINE — registers /sw.js (public/sw.js) and drives Settings → App.
const $ = (s: string) => document.querySelector(s) as HTMLElement | null;
const toast = (m: string) => (window as any).ascentToast?.(m);
const standalone = () => matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone === true;
const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
let deferred: any = null;

if ('serviceWorker' in navigator && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
  addEventListener('load', () => navigator.serviceWorker.register('/sw.js').then(() => ui()).catch(() => ui()));
  navigator.serviceWorker.addEventListener?.('controllerchange', () => ui());
}
addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferred = e; ui(); });
addEventListener('appinstalled', () => { deferred = null; toast('Ascent installed ✓'); ui(); });
addEventListener('offline', () => toast('You’re offline — saved pages still work'));
addEventListener('online', () => toast('Back online ✓'));

function ui() {
  const btn = $('[data-install]'), note = $('[data-install-note]'), pill = $('[data-offline-pill]'), onote = $('[data-offline-note]');
  if (btn && note) {
    if (standalone()) { btn.hidden = true; note.textContent = 'Installed ✓ — you’re using the app.'; }
    else { btn.hidden = false; btn.textContent = deferred ? 'Install' : 'How?'; }
  }
  if (pill) {
    const ready = !!navigator.serviceWorker?.controller;
    const local = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
    pill.textContent = local ? 'Live site only' : ready ? 'Ready ✓' : 'Setting up…';
    pill.classList.toggle('ok', ready);
    if (onote) onote.textContent = ready ? 'Pages you’ve opened work without internet.' : 'Turns on after this page loads once.';
  }
}
document.addEventListener('click', async (e) => {
  if (!(e.target as HTMLElement).closest('[data-install]')) return;
  if (deferred) { deferred.prompt(); const r = await deferred.userChoice.catch(() => null); deferred = null; if (r?.outcome !== 'accepted') toast('Install cancelled'); ui(); return; }
  alert(ios
    ? 'On iPhone / iPad (Safari):\n\n1. Tap the Share button (square with ↑)\n2. Tap “Add to Home Screen”\n3. Tap Add'
    : 'In Chrome / Edge:\n\nOpen the browser menu (⋮) → “Install Ascent” (or “Add to Home screen” on Android).\n\nIf it’s not there, the app may already be installed.');
});
addEventListener('ascent:prefs', ui);
ui();
