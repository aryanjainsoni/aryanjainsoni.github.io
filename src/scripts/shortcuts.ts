// KEYBOARD SHORTCUTS — work on every page, never while you're typing in a box.
//   /  search        G then J  Journal     G then G  Gym      G then O  Goals
//   G then H  Home   G then I  Index       G then A  About    L  Daily Log
//   ,  Settings      P  privacy screen      1–6  Gym tabs      ?  this cheat sheet
// ("/" and ⌘K are handled in Base.astro.)
import { prefs, setPrefs } from '../lib/prefs';

const GO: Record<string, [string, string]> = {
  h: ['/', 'Home'], j: ['/journal/', 'Journal'], g: ['/basecamp/', 'Basecamp'], o: ['/basecamp/#today', 'Goals (Basecamp → Today)'],
  i: ['/explore/', 'Index (search)'], a: ['/about/', 'About'],
};
const typing = () => {
  const a = document.activeElement as HTMLElement | null;
  return !!a && (/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName) || a.isContentEditable);
};
const toast = (m: string) => (window as any).ascentToast?.(m);

let dlg: HTMLDialogElement | null = null;
function sheet() {
  if (!dlg) {
    dlg = document.createElement('dialog');
    dlg.className = 'kb'; dlg.setAttribute('aria-labelledby', 'kb-title');
    const k = (...keys: string[]) => `<dt>${keys.map((x) => (x === '…' ? '<span>…</span>' : `<kbd>${x}</kbd>`)).join(' ')}</dt>`;
    dlg.innerHTML = `<button type="button" class="sd-x kb-x" aria-label="Close">×</button>
      <h2 id="kb-title">Keyboard shortcuts</h2><p>Anywhere on the site, when you’re not typing in a box.</p>
      <dl>
        <h3>Go to</h3>
        ${Object.entries(GO).map(([key, [, name]]) => `${k('G', key.toUpperCase())}<dd>${name}</dd>`).join('')}
        ${k('L')}<dd>Daily Log</dd>
        <h3>Do</h3>
        ${k('/')}<dd>Search the site</dd>
        ${k(',')}<dd>Open Settings</dd>
        ${k('P')}<dd>Privacy screen on / off</dd>
        ${k('1', '…', '6')}<dd>Gym tabs (on the Gym page)</dd>
        ${k('?')}<dd>This list</dd>
        ${k('Esc')}<dd>Close</dd>
      </dl>`;
    document.body.append(dlg);
    dlg.querySelector('.kb-x')!.addEventListener('click', () => dlg!.close());
    dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg!.close(); }); // click outside
  }
  dlg.open ? dlg.close() : dlg.showModal();
}
document.addEventListener('click', (e) => { if ((e.target as HTMLElement).closest('[data-shortcuts]')) sheet(); });

let pending = 0; // time "G" was pressed
addEventListener('keydown', (e) => {
  if (e.metaKey || e.ctrlKey || e.altKey || e.defaultPrevented || typing()) return;
  if (document.documentElement.classList.contains('sd-open') && e.key !== '?') return; // Settings drawer owns the keys
  const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
  if (pending && Date.now() - pending < 1200) {
    pending = 0;
    const to = GO[key]; if (!to) return;
    e.preventDefault(); toast(`→ ${to[1]}`); location.href = to[0]; return;
  }
  pending = 0;
  if (key === 'g') { pending = Date.now(); return; }
  if (key === '?' || (key === '/' && e.shiftKey)) { e.preventDefault(); return sheet(); }
  if (key === 'l') { e.preventDefault(); location.href = '/log/'; return; }
  if (key === ',') { e.preventDefault(); dispatchEvent(new Event('ascent:open-settings')); return; }
  if (key === 'p') { e.preventDefault(); const on = !prefs().privacy; setPrefs({ privacy: on }); toast(on ? 'Privacy screen on — numbers blurred' : 'Privacy screen off'); return; }
  if (/^[1-6]$/.test(key)) {
    const tabs = [...document.querySelectorAll<HTMLElement>('.orbs [data-tab]')];
    const t = tabs[+key - 1]; if (t) { e.preventDefault(); t.click(); t.focus(); }
  }
});
