// BUCKET LIST ("Rahasya — The Sealed Pages") — the cove scene + the old burgundy book.
// Privacy: wishes live ONLY inside the encrypted Gym vault (key "fit:bucket"). fit-app.ts shows the lock
// and, once unlocked, hands us a tiny get/set bridge via the 'ascent:vault' event (null again on lock).
// Nothing here ever sends data anywhere; the page HTML contains no wishes.
import { BOOK, CATS } from '../data/bucket';
import { createCove } from './cove-gl';

type Step = { t: string; ok?: boolean };
type Wish = { id: string; title: string; cat: string; month?: string; date?: string; why?: string; notes?: string; steps: Step[]; done?: string; created: string };
type Store = { v: 1; wishes: Wish[] };
type Api = { get<T>(k: string, d: T): T; set(k: string, v: unknown): void; lock(): void };
const KEY = 'fit:bucket';

const root = document.querySelector<HTMLElement>('[data-bq]');
if (root) init(root);

function init(root: HTMLElement) {
  const $ = <T extends Element = HTMLElement>(s: string) => root.querySelector<T>(s)!;
  const cove = $('[data-cove]'), canvas = $<HTMLCanvasElement>('[data-gl]');
  const sbook = $('[data-sbook]'), hint = $('[data-hint]'), lockWrap = $('[data-lockwrap]');
  const stage = $('[data-stage]'), book = $('[data-book]'), ind = $('[data-ind]'), say = $('[data-say]');
  const prevB = $<HTMLButtonElement>('[data-prev]'), nextB = $<HTMLButtonElement>('[data-next]');
  const findBox = $('[data-findbox]'), findBtn = $('[data-find]'), q = $<HTMLInputElement>('[data-q]'), res = $('[data-res]');
  const editor = $<HTMLDialogElement>('[data-editor]'), form = $<HTMLFormElement>('[data-form-wish]');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const calm = () => document.documentElement.classList.contains('calm') || reduce.matches;
  const esc = (s: unknown) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
  const pad = (n: number) => String(n).padStart(2, '0');
  const todayKey = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
  root.classList.toggle('reduce', reduce.matches);

  // ---------------- vault bridge ----------------
  let api: Api | null = (window as unknown as { __ascentVault?: Api | null }).__ascentVault ?? null;
  const store = (): Store => { const s = api?.get<Store | null>(KEY, null); return s && Array.isArray(s.wishes) ? s : { v: 1, wishes: [] }; };
  const wishes = () => store().wishes;
  const save = (list: Wish[]) => api?.set(KEY, { v: 1, wishes: list } satisfies Store);
  function setApi(a: Api | null) {
    if (a && root.dataset.state === 'locked') setTimeout(clink, 250); // chains slide off
    api = a;
    root.dataset.state = a ? 'open' : 'locked';
    hint.textContent = a ? 'Touch the book to open it' : 'The book is sealed.';
    if (!a) { closeBook(true); return; }
    const deep = location.hash.match(/^#p-(\d+)$/);
    if (deep) openBook(+deep[1], true);
  }
  addEventListener('ascent:vault', (e) => setApi((e as CustomEvent<Api | null>).detail));
  setApi(api);

  // ---------------- dates ----------------
  const sortKey = (w: Wish) => w.date || (w.month ? w.month + '-31' : '9999-12-31');
  const fmtDay = (k: string) => new Date(k + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  const fmtMonth = (m: string) => new Date(m + '-01T00:00:00').toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
  const when = (w: Wish) => (w.date ? fmtDay(w.date) : w.month ? fmtMonth(w.month) : 'Someday');
  const yearOf = (w: Wish) => (w.date || w.month || '').slice(0, 4);
  const roman = (k: string) => { const [y, m, d] = k.split('-').map(Number); return `${d}·${['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'][m - 1]}·${y}`; };
  const catOf = (id: string) => CATS.find((c) => c.id === id) ?? CATS[CATS.length - 1];
  const icon = (id: string) => `<svg viewBox="0 0 24 24" aria-hidden="true">${catOf(id).icon}</svg>`;

  // ================= THE COVE (photo + WebGL cinemagraph, see cove-gl.ts) =================
  // place the book hotspot exactly over the book in the photo
  const placeBook = (sc: { book: { x: number; y: number; w: number; h: number; rot: number } }, map: (x: number, y: number) => [number, number]) => {
    const [x1, y1] = map(sc.book.x, sc.book.y), [x2, y2] = map(sc.book.x + sc.book.w, sc.book.y + sc.book.h);
    Object.assign(sbook.style, { left: `${x1}px`, top: `${y1}px`, width: `${x2 - x1}px`, height: `${y2 - y1}px`, transform: `rotate(${sc.book.rot}deg)` });
    Object.assign(hint.style, { left: `${(x1 + x2) / 2}px`, top: `${Math.max(12, y1 - 46)}px`, bottom: 'auto' });
  };
  const gl = calm() ? null : createCove(canvas, { onLayout: placeBook });
  if (!gl) {
    // no WebGL (or calm mode): the still photo, hotspot mapped with the same cover maths
    const AS = { wide: { a: 1376 / 768, book: { x: 0.5, y: 0.765, w: 0.205, h: 0.2, rot: -6 } }, tall: { a: 768 / 1376, book: { x: 0.445, y: 0.775, w: 0.42, h: 0.165, rot: -4 } } };
    const still = () => {
      const W = cove.clientWidth, H = cove.clientHeight, sa = W / H, sc = sa < 1 ? AS.tall : AS.wide;
      const c = sa > sc.a ? { sx: 1, sy: sc.a / sa } : { sx: sa / sc.a, sy: 1 };
      placeBook(sc, (x, y) => [((x - 0.5) / c.sx + 0.5) * W, ((y - 0.5) / c.sy + 0.5) * H]);
    };
    still(); addEventListener('resize', still);
  }
  cove.addEventListener('pointermove', (e) => {
    if (!gl || calm()) return;
    const r = cove.getBoundingClientRect();
    gl.point(((e.clientX - r.left) / r.width - 0.5) * 2, ((e.clientY - r.top) / r.height - 0.5) * 2);
  });
  cove.addEventListener('pointerleave', () => gl?.point(0, 0));
  // only animate while the cove is on screen, the tab is visible and the book is closed
  let onScreen = true;
  new IntersectionObserver(([e]) => { onScreen = e.isIntersecting; dust(true); }).observe(cove);
  const dust = (on: boolean) => gl?.run(on && onScreen && !calm() && !document.hidden && stage.hidden);
  dust(true);
  document.addEventListener('visibilitychange', () => dust(true));

  // ambient sound (water + soft wind), only if Gym sound is on — starts on the first tap
  let actx: AudioContext | undefined, amb: GainNode | undefined;
  const soundOn = () => localStorage.getItem('gym:sound') === 'on';
  function ambient() {
    if (!soundOn() || amb) return;
    try {
      actx ||= new AudioContext();
      const len = actx.sampleRate * 4, buf = actx.createBuffer(1, len, actx.sampleRate), ch = buf.getChannelData(0);
      let last = 0; for (let i = 0; i < len; i++) { last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02; ch[i] = last * 3.2; } // brown noise
      const src = actx.createBufferSource(); src.buffer = buf; src.loop = true;
      const lp = actx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 520;
      amb = actx.createGain(); amb.gain.value = 0;
      const lfo = actx.createOscillator(), lg = actx.createGain(); lfo.frequency.value = 0.09; lg.gain.value = 0.012; lfo.connect(lg).connect(amb.gain);
      src.connect(lp).connect(amb).connect(actx.destination); src.start(); lfo.start();
      amb.gain.setTargetAtTime(0.03, actx.currentTime, 1.5);
    } catch { /* no audio */ }
  }
  cove.addEventListener('pointerdown', ambient, { once: false });
  document.addEventListener('visibilitychange', () => { if (!actx) return; if (document.hidden) actx.suspend(); else if (soundOn()) actx.resume(); });
  function rustle(soft = false) {
    if (!soundOn()) return;
    try {
      actx ||= new AudioContext();
      const t = actx.currentTime, d = 0.4, len = Math.floor(actx.sampleRate * d), b = actx.createBuffer(1, len, actx.sampleRate), c = b.getChannelData(0);
      for (let i = 0; i < len; i++) { const x = i / len; c[i] = (Math.random() * 2 - 1) * Math.pow(1 - x, 1.4) * (x < 0.12 ? x / 0.12 : 1); }
      const s = actx.createBufferSource(); s.buffer = b;
      const f = actx.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 0.6; f.frequency.setValueAtTime(2400, t); f.frequency.exponentialRampToValueAtTime(600, t + d);
      const g = actx.createGain(); g.gain.value = soft ? 0.05 : 0.1; s.connect(f).connect(g).connect(actx.destination); s.start();
    } catch {}
  }
  function clink() {
    if (!soundOn()) return;
    try {
      actx ||= new AudioContext(); const t = actx.currentTime;
      [[2730, 0.05], [3810, 0.035], [5120, 0.02], [1460, 0.03]].forEach(([fr, g0], i) => {
        const o = actx!.createOscillator(), g = actx!.createGain(); o.type = 'sine'; o.frequency.value = fr * (1 + i * 0.003);
        g.gain.setValueAtTime(g0, t + i * 0.09); g.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.09 + 0.45);
        o.connect(g).connect(actx!.destination); o.start(t + i * 0.09); o.stop(t + i * 0.09 + 0.5);
      });
    } catch {}
  }
  function chime() {
    if (!soundOn()) return;
    try {
      actx ||= new AudioContext(); const t = actx.currentTime;
      [880, 1318.5, 1760].forEach((fr, i) => { const o = actx!.createOscillator(), g = actx!.createGain(); o.type = 'sine'; o.frequency.value = fr; g.gain.setValueAtTime(0, t + i * 0.06); g.gain.linearRampToValueAtTime(0.06 / (i + 1), t + i * 0.06 + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.06 + 1.6); o.connect(g).connect(actx!.destination); o.start(t + i * 0.06); o.stop(t + 2); });
    } catch {}
  }

  // the book in the sand
  const knock = () => {
    const card = lockWrap.querySelector<HTMLElement>('.card'); lockWrap.querySelector<HTMLInputElement>('input[type="password"], input')?.focus();
    if (card && !calm()) card.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-8px)' }, { transform: 'translateX(7px)' }, { transform: 'translateX(-4px)' }, { transform: 'translateX(0)' }], { duration: 380 });
  };
  sbook.addEventListener('click', () => (api ? openBook() : knock()));
  sbook.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); api ? openBook() : knock(); } });

  // ================= THE BOOK =================
  let mode: 'spread' | 'single' = 'spread', r = 24, W = 380, H = 540;
  let pages: HTMLElement[] = [], leaves: HTMLElement[] = [], cur = 0, sizeKey = '';
  const wishPage = new Map<string, number>();

  function measure() {
    const w = innerWidth - 20, vh = innerHeight;
    mode = w >= 760 ? 'spread' : 'single';
    if (mode === 'spread') { H = Math.max(400, Math.min(820, vh - 170)); W = Math.min(H * 0.7, (w - 150) / 2); H = Math.min(H, W / 0.66); }
    else { W = Math.min(w - 24, 480); H = Math.max(420, Math.min(W * 1.5, vh - 190)); }
    r = Math.round(Math.max(18, Math.min(30, H / 22))); W = Math.round(W); H = Math.round(H);
    book.style.setProperty('--W', W + 'px'); book.style.setProperty('--H', H + 'px'); book.style.setProperty('--r', r + 'px');
    root.classList.toggle('single', mode === 'single');
    return `${mode}:${W}:${H}`;
  }

  // ---- old paper: torn outer edge + foxing (seeded per page, so it never "jumps") ----
  function rng(s: number) { return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646; }
  function torn(i: number, side: 'left' | 'right') {
    const R = rng(1000 + i * 97), j = (a: number) => R() * a;
    const pts: [number, number][] = [[0, 0]];
    for (let x = 4; x < 100; x += 3 + j(4)) pts.push([x, j(0.9)]);
    pts.push([100 - j(1.2), j(1.2)]);
    const notches = new Set([Math.floor(10 + j(100)), Math.floor(60 + j(70))]);
    for (let y = 3; y < 140; y += 2.5 + j(3)) {
      const yi = Math.floor(y);
      if ([...notches].some((n) => Math.abs(n - yi) < 2)) { pts.push([100 - 0.5, y - 1.5]); pts.push([100 - 2.5 - j(2.5), y]); pts.push([100 - 0.5, y + 1.8]); y += 2; }
      else pts.push([100 - j(1.1), y]);
    }
    pts.push([100 - j(1.4), 140 - j(1.2)]);
    for (let x = 96; x > 0; x -= 3 + j(4)) pts.push([x, 140 - j(0.9)]);
    pts.push([0, 140]);
    const P = pts.map(([x, y]) => [side === 'left' ? 100 - x : x, y].map((v) => v.toFixed(2)).join(' ')).join(' L');
    return `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 140' preserveAspectRatio='none'><path d='M${P} Z' fill='black'/></svg>`)}")`;
  }
  function fox(i: number) {
    const R = rng(77 + i * 131), n = 3 + Math.floor(R() * 4), out: string[] = [];
    for (let k = 0; k < n; k++) out.push(`radial-gradient(circle at ${(R() * 100).toFixed(0)}% ${(R() * 100).toFixed(0)}%, rgba(110,58,12,${(0.12 + R() * 0.16).toFixed(2)}) 0, rgba(110,58,12,0) ${(4 + R() * 12).toFixed(0)}px)`);
    if (R() > 0.55) { const x = (R() * 80 + 10).toFixed(0), y = (R() * 80 + 10).toFixed(0), s = 24 + R() * 30; out.push(`radial-gradient(circle at ${x}% ${y}%, transparent ${s.toFixed(0)}px, rgba(95,52,10,.16) ${(s + 2).toFixed(0)}px, transparent ${(s + 6).toFixed(0)}px)`); }
    return out.join(', ');
  }
  function page(kind: string, run = '', runR = '') {
    const p = document.createElement('section');
    p.className = `pp pp-${kind}`;
    p.innerHTML = `<div class="pp-run"><span>${esc(run)}</span><span>${esc(runR)}</span></div><div class="pp-body"></div><div class="pp-no"></div><button class="pp-corner" type="button" tabindex="-1" aria-hidden="true"></button>`;
    return p;
  }
  const bodyOf = (p: HTMLElement) => p.querySelector<HTMLElement>('.pp-body')!;

  const seal = (id: string, date: string) => `<div class="seal" data-seal="${esc(id)}" aria-hidden="true"><svg viewBox="0 0 120 120">
    <defs><radialGradient id="wx${esc(id)}" cx="40%" cy="35%" r="70%"><stop offset="0" stop-color="#c2363a"/><stop offset=".6" stop-color="#8e1b22"/><stop offset="1" stop-color="#5a0c12"/></radialGradient>
    <path id="sp${esc(id)}" d="M60 60 m-38 0 a38 38 0 1 1 76 0 a38 38 0 1 1 -76 0"/></defs>
    <path d="M60 4 C74 6 82 2 92 12 C104 18 112 28 113 42 C118 54 116 66 112 76 C110 92 98 104 84 110 C72 118 58 116 46 114 C32 112 18 104 12 92 C4 80 6 66 5 54 C4 40 10 26 20 18 C32 6 46 3 60 4 Z" fill="url(#wx${esc(id)})"/>
    <circle cx="60" cy="60" r="44" fill="none" stroke="#5a0c12" stroke-width="2" opacity=".7"/><circle cx="60" cy="60" r="30" fill="none" stroke="#e57a72" stroke-width="1" opacity=".45"/>
    <text font-family="IM Fell English SC, serif" font-size="10.5" letter-spacing="2.2" fill="#f4b3a8" opacity=".9"><textPath href="#sp${esc(id)}" textLength="232">ACCOMPLISHED · ACCOMPLISHED ·</textPath></text>
    <text x="60" y="58" text-anchor="middle" font-family="IM Fell English, serif" font-size="13" fill="#ffd9cf">✦</text>
    <text x="60" y="74" text-anchor="middle" font-family="IM Fell English, serif" font-style="italic" font-size="10.5" fill="#ffd9cf">${roman(date)}</text></svg></div>`;
  const BOX = '<path d="M3.5 4.5 C8 3.4 15 3.8 20.6 3.3 C21.2 9 20.4 15.5 21 20.8 C15 21.5 9.2 20.6 3.8 21.2 C3.2 15.2 4.1 9.4 3.5 4.5 Z"/>';
  const TICK = '<path class="tk" d="M6.5 12.5 L10.5 17.5 L23 1.5"/>';

  function wishHtml(w: Wish) {
    const steps = w.steps.filter((s) => s.t.trim()), shown = steps.slice(0, 6), ok = steps.filter((s) => s.ok).length;
    return `<article class="wi ${w.done ? 'done' : ''}" data-wish="${esc(w.id)}">
      <div class="wi-top">${icon(w.cat)}<span>${esc(catOf(w.cat).label)}</span><span class="when">${w.done ? 'fulfilled ' + esc(fmtDay(w.done)) : 'by ' + esc(when(w))}</span></div>
      <div class="wi-title"><button type="button" class="wi-check" data-done="${esc(w.id)}" aria-pressed="${!!w.done}" aria-label="${w.done ? 'Fulfilled' : 'Mark as fulfilled'}: ${esc(w.title)}"><svg viewBox="0 0 24 24" aria-hidden="true">${BOX}${TICK}</svg></button><h3>${esc(w.title)}</h3></div>
      ${w.why ? `<p class="wi-why">${esc(w.why)}</p>` : ''}
      ${w.notes ? `<p class="wi-notes">${esc(w.notes)}</p>` : ''}
      ${steps.length ? `<ul class="wi-steps">${shown.map((s, i) => `<li class="${s.ok ? 'ok' : ''}"><button type="button" data-step="${esc(w.id)}:${w.steps.indexOf(s)}" aria-pressed="${!!s.ok}">${esc(s.t)}</button></li>`).join('')}${steps.length > shown.length ? `<li class="more">+ ${steps.length - shown.length} more steps (edit to see)</li>` : ''}</ul>
        <div class="wi-prog" role="progressbar" aria-label="Steps done" aria-valuemin="0" aria-valuemax="${steps.length}" aria-valuenow="${ok}"><i style="width:${Math.round((ok / steps.length) * 100)}%"></i></div>` : ''}
      ${w.done ? seal(w.id, w.done) : ''}
      <span class="wi-made">written ${esc(fmtDay(w.created))}</span>
      <button type="button" class="wi-edit" data-edit="${esc(w.id)}">✎ amend</button>
    </article>`;
  }

  function paginate() {
    const meas = document.createElement('div');
    meas.style.cssText = `position:absolute;left:-9999px;top:0;width:${W}px;height:${H}px;visibility:hidden;--r:${r}px`;
    root.append(meas);
    const mount = (p: HTMLElement) => { p.classList.add('right'); meas.replaceChildren(p); return bodyOf(p); };
    const over = (b: HTMLElement) => b.scrollHeight > b.clientHeight + 1;
    const list = [...wishes()].sort((a, b) => sortKey(a).localeCompare(sortKey(b)) || a.created.localeCompare(b.created));
    const done = list.filter((w) => w.done).sort((a, b) => b.done!.localeCompare(a.done!));
    const out: HTMLElement[] = [];

    // 1 — ownership
    const p1 = page('own', BOOK.title, '');
    bodyOf(p1).innerHTML = `<div class="ow"><p class="ow-small">This book belongs to</p><p class="ow-name">${esc(BOOK.author)}</p><span class="ow-rule"></span>
      <p class="ow-oath">${esc(BOOK.oath)}</p><p class="ow-dev">${esc(BOOK.dev)}</p>
      <p class="ow-count">${list.length ? `${done.length} of ${list.length} fulfilled` : 'The pages are still empty'}</p></div>`;
    out.push(p1);

    // 2.. — contents (as many pages as needed)
    const years = new Map<string, [number, number]>();
    list.forEach((w) => { const y = yearOf(w) || 'Someday', v = years.get(y) ?? [0, 0]; v[1]++; if (w.done) v[0]++; years.set(y, v); });
    const summary = list.length ? `<p class="toc-sum"><b>${done.length}</b> of ${list.length} fulfilled · ${[...years].map(([y, [a, b]]) => `${esc(y)}: ${a}/${b}`).join(' · ')}</p>` : '';
    const tocPages: HTMLElement[] = [];
    let tp = page('toc', 'Contents', ''); let body = mount(tp); tocPages.push(tp);
    body.innerHTML = `<h2 class="toc-h">Contents</h2>${summary}`;
    if (!list.length) body.insertAdjacentHTML('beforeend', `<p class="toc-empty">No wish is written yet.<br>Every great list starts with one line.</p>`);
    for (const w of list) {
      body.insertAdjacentHTML('beforeend', `<button type="button" class="toc-row ${w.done ? 'done' : ''}" data-goto-wish="${esc(w.id)}"><span class="ok">${w.done ? '✓' : '·'}</span><span class="t">${esc(w.title)}</span><span class="d">${esc(when(w))}</span><span class="n">0</span></button>`);
      if (over(body)) { const row = body.lastElementChild!; row.remove(); tp = page('toc', 'Contents', 'continued'); body = mount(tp); tocPages.push(tp); body.append(row); }
    }
    body.insertAdjacentHTML('beforeend', `<button type="button" class="bk-ink toc-new" data-newwish>✒ Write a new wish</button>`);
    if (over(body)) { const b = body.lastElementChild!; b.remove(); tp = page('toc', 'Contents', 'continued'); body = mount(tp); tocPages.push(tp); body.append(b); }
    out.push(...tocPages);

    // wishes — one page each
    wishPage.clear();
    for (const w of list) {
      const p = page('wish', BOOK.title, catOf(w.cat).label); bodyOf(p).innerHTML = wishHtml(w);
      out.push(p); wishPage.set(w.id, out.length);
    }

    // completed gallery
    let cp = page('done', 'Fulfilled', ''); body = mount(cp); out.push(cp);
    body.innerHTML = `<h2 class="cg-h">Fulfilled</h2>` + (done.length ? '' : `<p class="cg-empty">Nothing sealed yet.<br>The first wax seal is waiting.</p>`);
    for (const w of done) {
      body.insertAdjacentHTML('beforeend', `<button type="button" class="cg-row" data-goto-wish="${esc(w.id)}"><span>${icon(w.cat)}</span><span class="t">${esc(w.title)}</span><span class="d">${esc(fmtDay(w.done!))}</span></button>`);
      if (over(body)) { const row = body.lastElementChild!; row.remove(); cp = page('done', 'Fulfilled', 'continued'); body = mount(cp); out.push(cp); body.append(row); }
    }
    meas.remove();

    out.forEach((p, i) => {
      p.dataset.page = String(i + 1); p.querySelector('.pp-no')!.textContent = String(i + 1); p.classList.remove('right');
      p.style.setProperty('--fox', fox(i)); { const R = rng(500 + i * 37); p.style.setProperty('--ppos', `${(R() * 100).toFixed(0)}% ${(R() * 100).toFixed(0)}%`); }
    });
    out.forEach((p) => p.querySelectorAll<HTMLElement>('.toc-row').forEach((row) => { row.querySelector('.n')!.textContent = String(wishPage.get(row.dataset.gotoWish!) ?? ''); }));
    return out;
  }

  // ---------------- leaves ----------------
  const blank = (back = false) => { const p = page('blank'); p.classList.add('blank'); if (back) p.classList.add('backside'); return p; };
  const coverHtml = () => `<div class="bk-cover"><p class="bkc-series">Ascent · Vol. II</p><p class="bkc-dev">${esc(BOOK.dev)}</p><p class="bkc-title">${esc(BOOK.title)}</p><span class="bkc-rule"></span><p class="bkc-sub">${esc(BOOK.subtitle)}</p>
    <div class="bkc-mark">${MARK}</div><p class="bkc-author">${esc(BOOK.author)}</p><span class="bkc-clasp"></span><span class="bkc-ribbon"></span>
    <button type="button" class="bkc-open" data-opencover aria-label="Open the book"></button></div>`;
  const MARK = `<svg viewBox="0 0 100 100" aria-hidden="true" fill="none" stroke="#2a0810" stroke-linecap="round" stroke-linejoin="round"><circle cx="50" cy="56" r="34" stroke-width="5" stroke-dasharray="70 18 140"/><path d="M22 76 L50 10 L78 76" stroke-width="8"/><path d="M32 62 L42 55 L50 59 L62 48" stroke-width="4"/></svg>`;
  function el(html: string) { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild as HTMLElement; }
  function addLeaf(front: HTMLElement, back: HTMLElement, cls = '') {
    const l = document.createElement('div'); l.className = 'bk-leaf ' + cls;
    const f = document.createElement('div'); f.className = 'bk-face front'; f.append(front);
    const b = document.createElement('div'); b.className = 'bk-face back'; b.append(back);
    l.append(f, b); book.append(l); leaves.push(l);
  }
  function buildLeaves() {
    book.replaceChildren(); leaves = [];
    const side = (p: HTMLElement, s: 'left' | 'right', i: number) => { p.classList.remove('left', 'right'); p.classList.add(s); p.style.setProperty('--torn', torn(i, s)); return p; };
    const boardR = el('<div class="bk-board r" aria-hidden="true"></div>'), boardL = el('<div class="bk-board l" aria-hidden="true"></div>');
    book.append(boardL, boardR);
    addLeaf(el(coverHtml()), el(`<div class="bk-inside"><p>“Not all treasure is silver and gold.”<br><br>— sealed by ${esc(BOOK.author)}</p></div>`), 'cover');
    if (mode === 'spread') {
      const ps = [...pages]; if (ps.length % 2) ps.push(blank());
      for (let i = 0; i < ps.length; i += 2) addLeaf(side(ps[i], 'right', i), side(ps[i + 1], 'left', i + 1));
      addLeaf(el('<div class="bk-inside r"><p>✦</p></div>'), el(coverHtml().replace('bk-cover', 'bk-cover back')), 'cover');
    } else {
      pages.forEach((p, i) => addLeaf(side(p, 'right', i), side(blank(true), 'left', i + 500)));
    }
    book.append(el('<div class="bk-spine" aria-hidden="true"></div>'));
    if (mode === 'spread') book.prepend(el('<div class="bk-edge r"></div>'), el('<div class="bk-edge l"></div>'));
    // back cover can't be opened
    book.querySelectorAll('.bk-cover.back .bkc-open').forEach((b) => b.remove());
  }
  const maxCur = () => (mode === 'spread' ? leaves.length - 1 : leaves.length - 1);
  function restack() {
    const n = leaves.length;
    leaves.forEach((l, i) => {
      const f = i < cur; l.classList.toggle('flipped', f);
      l.style.zIndex = String(f ? i + 1 : n * 2 - i);
      l.classList.toggle('far', !(i >= cur - 2 && i <= cur + 1));
      const show = i === cur || i === cur - 1;
      const [fr, bk] = l.children as unknown as HTMLElement[];
      fr.inert = !(show && !f); bk.inert = !(show && f); l.setAttribute('aria-hidden', String(!show));
    });
    const eR = book.querySelector<HTMLElement>('.bk-edge.r'), eL = book.querySelector<HTMLElement>('.bk-edge.l');
    eR?.style.setProperty('--t', Math.min(8, 1 + (n - 1 - cur) * 0.4) + 'px');
    eL?.style.setProperty('--t', cur > 1 ? Math.min(8, 1 + (cur - 1) * 0.4) + 'px' : '0px');
  }
  const firstPage = () => (cur === 0 ? 0 : mode === 'spread' ? (cur === 1 ? 1 : 2 * cur - 2) : cur);
  const curFor = (p: number) => (mode === 'spread' ? (p % 2 ? (p + 1) / 2 : p / 2 + 1) : p);

  function go(target: number, o: { instant?: boolean } = {}) {
    target = Math.max(0, Math.min(maxCur(), target));
    if (target === cur && !o.instant) return;
    const from = cur; cur = target;
    if (o.instant || calm() || from === target) { restack(); after(); return; }
    const fwd = target > from, idx: number[] = [];
    if (fwd) for (let i = from; i < target; i++) idx.push(i); else for (let i = from - 1; i >= target; i--) idx.push(i);
    leaves.forEach((l, i) => { if (i >= Math.min(from, target) - 1 && i <= Math.max(from, target) + 1) l.classList.remove('far'); });
    const step = idx.length > 1 ? Math.min(110, 800 / idx.length) : 0;
    idx.forEach((i, k) => setTimeout(() => {
      const l = leaves[i]; l.classList.add('turning'); l.style.zIndex = String(5000 - (idx.length - k));
      l.classList.toggle('flipped', fwd);
      if (k === 0 || k === idx.length - 1) rustle(k > 0);
      const finish = () => { l.classList.remove('turning'); if (!book.querySelector('.bk-leaf.turning')) restack(); };
      const done = (e: TransitionEvent) => { if (e.target !== l || e.propertyName !== 'transform') return; l.removeEventListener('transitionend', done); finish(); };
      l.addEventListener('transitionend', done);
      setTimeout(() => { if (l.classList.contains('turning')) finish(); }, 1500);
    }, k * step));
    after();
  }
  function after() {
    const closed = cur === 0, total = pages.length, p = firstPage();
    book.classList.toggle('closed', closed); root.classList.toggle('is-closed', closed);
    prevB.disabled = closed; nextB.disabled = cur >= maxCur();
    ind.textContent = closed ? 'Touch the cover' : mode === 'spread' && cur > 1 && p + 1 <= total ? `Pages ${p} – ${p + 1} of ${total}` : `Page ${Math.min(p, total)} of ${total}`;
    say.textContent = closed ? 'The book is closed.' : ind.textContent;
    if (!stage.hidden) {
      if (!closed) localStorage.setItem('bq:last', String(p));
      const h = closed ? '' : `#p-${p}`;
      if (location.hash !== h) history.replaceState(null, '', closed ? location.pathname : h);
    }
  }

  function build(keepPage = 0) {
    sizeKey = measure(); pages = paginate(); buildLeaves(); cur = 0;
    go(keepPage ? curFor(Math.min(keepPage, pages.length)) : 0, { instant: true });
  }

  // ---------------- open / close ----------------
  function openBook(toPage = 1, instant = false) {
    if (!api) return knock();
    if (!stage.hidden && cur > 0) return go(curFor(toPage));
    stage.hidden = false; cove.inert = true; document.documentElement.style.overflow = 'hidden'; document.documentElement.classList.add('bq-open'); dust(false);
    build();
    if (instant || calm()) { go(curFor(toPage), { instant: true }); return; }
    // the book rises out of the sand toward you
    const from = sbook.getBoundingClientRect(), to = book.getBoundingClientRect();
    const cx = to.left + to.width * (mode === 'spread' ? 0.75 : 0.5), cy = to.top + to.height / 2;
    const s = Math.max(0.12, from.width / (mode === 'spread' ? to.width / 2 : to.width));
    book.parentElement!.animate([
      { transform: `translate(${from.left + from.width / 2 - cx}px, ${from.top + from.height / 2 - cy}px) scale(${s}) rotate(-8deg)`, opacity: 0.4 },
      { transform: 'translate(0,0) scale(1) rotate(0)', opacity: 1 },
    ], { duration: 850, easing: 'cubic-bezier(.2,.8,.2,1)' });
    setTimeout(() => go(curFor(toPage)), 900);
  }
  function closeBook(instant = false) {
    if (stage.hidden) return;
    closeFind(); if (editor.open) editor.close();
    const end = () => { stage.hidden = true; cove.inert = false; document.documentElement.style.overflow = ''; document.documentElement.classList.remove('bq-open'); book.replaceChildren(); leaves = []; pages = []; cur = 0; history.replaceState(null, '', location.pathname); dust(true); (sbook as unknown as SVGElement).focus?.(); };
    if (instant || calm() || cur === 0) return end();
    go(0); setTimeout(end, 1150);
  }

  // ---------------- interactions ----------------
  const next = () => go(cur + 1), prev = () => go(cur - 1);
  nextB.addEventListener('click', next); prevB.addEventListener('click', prev);
  $('[data-back]').addEventListener('click', () => closeBook());
  $('[data-lockbtn]').addEventListener('click', () => api?.lock());
  $('[data-contents]').addEventListener('click', () => go(curFor(2)));
  $('[data-new]').addEventListener('click', () => openEditor());

  book.addEventListener('click', (e) => {
    const t = e.target as HTMLElement;
    if (t.closest('[data-opencover]')) return go(1);
    const gw = t.closest<HTMLElement>('[data-goto-wish]'); if (gw) return go(curFor(wishPage.get(gw.dataset.gotoWish!) ?? 1));
    if (t.closest('[data-newwish]')) return openEditor();
    const ed = t.closest<HTMLElement>('[data-edit]'); if (ed) return openEditor(ed.dataset.edit);
    const dn = t.closest<HTMLElement>('[data-done]'); if (dn) return toggleDone(dn.dataset.done!, dn);
    const st = t.closest<HTMLElement>('[data-step]'); if (st) return toggleStep(st.dataset.step!);
    const c = t.closest('.pp-corner'); if (c) return c.closest('.pp')!.classList.contains('left') ? prev() : next();
  });
  let sx = 0, sy = 0, st0 = 0;
  book.addEventListener('pointerdown', (e) => { sx = e.clientX; sy = e.clientY; st0 = Date.now(); });
  book.addEventListener('pointerup', (e) => { const dx = e.clientX - sx, dy = e.clientY - sy; if (Date.now() - st0 < 700 && Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.4) (dx < 0 ? next : prev)(); });
  addEventListener('keydown', (e) => {
    if (stage.hidden || editor.open || e.altKey || e.ctrlKey || e.metaKey) return;
    const t = e.target as HTMLElement;
    if (e.key === 'Escape') { if (!findBox.hidden) { closeFind(); findBtn.focus(); } else closeBook(); return; }
    if (t.matches?.('input, textarea, select')) return;
    if (document.documentElement.classList.contains('sd-open')) return;
    if (e.key === 'ArrowRight') { e.preventDefault(); next(); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); }
  });
  let rt = 0;
  addEventListener('resize', () => { clearTimeout(rt); rt = window.setTimeout(() => { if (stage.hidden) return; const k = measure(); if (k !== sizeKey) build(firstPage()); }, 220); });

  // ---------------- wishes: tick, steps, editor ----------------
  function mutate(fn: (list: Wish[]) => void) { const list = wishes().map((w) => ({ ...w, steps: w.steps.map((s) => ({ ...s })) })); fn(list); save(list); }
  function toggleDone(id: string, btn: HTMLElement) {
    const w = wishes().find((x) => x.id === id); if (!w) return;
    if (w.done && !confirm(`Break the seal on “${w.title}” and mark it as not done?`)) return;
    const stamping = !w.done, at = btn.getBoundingClientRect();
    mutate((l) => { const x = l.find((y) => y.id === id)!; x.done = x.done ? undefined : todayKey(); });
    const keep = firstPage(); build(keep);
    if (stamping) {
      const s = book.querySelector<HTMLElement>(`[data-seal="${CSS.escape(id)}"]`);
      if (s && !calm()) { s.classList.add('stamp'); burst(at); }
      chime(); say.textContent = `Fulfilled: ${w.title}. Sealed.`;
    } else say.textContent = `${w.title} is open again.`;
  }
  function burst(at: DOMRect) {
    for (let i = 0; i < 26; i++) {
      const d = document.createElement('span'); d.className = 'dust';
      const a = Math.random() * Math.PI * 2, dist = 30 + Math.random() * 90;
      d.style.cssText = `position:fixed;left:${at.left + at.width / 2}px;top:${at.top + at.height / 2}px;--dx:${Math.cos(a) * dist}px;--dy:${Math.sin(a) * dist - 20}px;z-index:400;animation-delay:${Math.random() * 120}ms`;
      document.body.append(d); setTimeout(() => d.remove(), 1200);
    }
  }
  function toggleStep(ref: string) {
    const [id, i] = ref.split(':'); const keep = firstPage();
    mutate((l) => { const s = l.find((w) => w.id === id)?.steps[+i]; if (s) s.ok = !s.ok; });
    build(keep);
  }

  const catSel = form.querySelector<HTMLSelectElement>('[data-cats]')!;
  catSel.innerHTML = CATS.map((c) => `<option value="${c.id}">${esc(c.label)}</option>`).join('');
  const stepsOl = form.querySelector<HTMLOListElement>('[data-steps]')!;
  const stepRow = (s: Step = { t: '' }) => `<li><input type="checkbox" ${s.ok ? 'checked' : ''} aria-label="Step done"><input type="text" value="${esc(s.t)}" placeholder="A step on the way" maxlength="140"><button type="button" class="bk-mini x" data-rmstep aria-label="Remove step">×</button></li>`;
  let editing: string | null = null;
  function openEditor(id?: string) {
    if (!api) return;
    const w = id ? wishes().find((x) => x.id === id) : undefined; editing = w?.id ?? null;
    form.reset();
    $('#bk-edit-h').textContent = w ? 'Amend this wish' : 'A new wish';
    (form.elements.namedItem('title') as HTMLInputElement).value = w?.title ?? '';
    catSel.value = w?.cat ?? 'travel';
    (form.elements.namedItem('month') as HTMLInputElement).value = w?.month ?? '';
    (form.elements.namedItem('date') as HTMLInputElement).value = w?.date ?? '';
    (form.elements.namedItem('why') as HTMLTextAreaElement).value = w?.why ?? '';
    (form.elements.namedItem('notes') as HTMLTextAreaElement).value = w?.notes ?? '';
    stepsOl.innerHTML = (w?.steps ?? []).map(stepRow).join('');
    form.querySelector<HTMLElement>('[data-del]')!.hidden = !w;
    editor.showModal();
    (form.elements.namedItem('title') as HTMLInputElement).focus();
  }
  form.querySelector('[data-addstep]')!.addEventListener('click', () => { stepsOl.insertAdjacentHTML('beforeend', stepRow()); stepsOl.querySelector<HTMLInputElement>('li:last-child input[type="text"]')?.focus(); });
  stepsOl.addEventListener('click', (e) => { const b = (e.target as HTMLElement).closest('[data-rmstep]'); if (b) b.closest('li')!.remove(); });
  form.querySelector('[data-cancel]')!.addEventListener('click', () => editor.close());
  form.querySelector('[data-del]')!.addEventListener('click', () => {
    const w = wishes().find((x) => x.id === editing); if (!w) return;
    if (!confirm(`Tear out the page “${w.title}”? This cannot be undone.`)) return;
    mutate((l) => l.splice(l.findIndex((x) => x.id === w.id), 1));
    editor.close(); build(2); say.textContent = `Removed: ${w.title}`;
  });
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const v = (n: string) => ((form.elements.namedItem(n) as HTMLInputElement).value || '').trim();
    const title = v('title'); if (!title) return;
    const steps: Step[] = [...stepsOl.querySelectorAll('li')].map((li) => ({ t: (li.querySelector('input[type="text"]') as HTMLInputElement).value.trim(), ok: (li.querySelector('input[type="checkbox"]') as HTMLInputElement).checked || undefined })).filter((s) => s.t);
    const data = { title, cat: catSel.value, month: v('month') || undefined, date: v('date') || undefined, why: v('why') || undefined, notes: v('notes') || undefined, steps };
    let id = editing;
    mutate((l) => {
      if (id) Object.assign(l.find((x) => x.id === id)!, data);
      else { id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6); l.push({ id, created: todayKey(), ...data }); }
    });
    editor.close();
    build(); go(curFor(wishPage.get(id!) ?? 2), { instant: true });
    say.textContent = editing ? `Amended: ${title}` : `Written: ${title}`;
  });

  // ---------------- search + filters ----------------
  function closeFind() { findBox.hidden = true; findBtn.setAttribute('aria-expanded', 'false'); }
  findBtn.addEventListener('click', () => {
    const open = findBox.hidden; findBox.hidden = !open; findBtn.setAttribute('aria-expanded', String(open));
    if (open) { fillFilters(); runFind(); q.focus(); }
  });
  const fsel = (k: string) => $<HTMLSelectElement>(`[data-f="${k}"]`);
  function fillFilters() {
    const ys = [...new Set(wishes().flatMap((w) => [yearOf(w), (w.done || '').slice(0, 4)]).filter(Boolean))].sort();
    const yv = fsel('year').value, cv = fsel('cat').value;
    fsel('year').innerHTML = `<option value="">Every year</option>` + ys.map((y) => `<option>${y}</option>`).join('');
    fsel('cat').innerHTML = `<option value="">Every kind</option>` + CATS.map((c) => `<option value="${c.id}">${esc(c.label)}</option>`).join('');
    fsel('year').value = yv; fsel('cat').value = cv;
  }
  function runFind() {
    const terms = q.value.toLowerCase().split(/\s+/).filter(Boolean);
    const y = fsel('year').value, c = fsel('cat').value, s = fsel('status').value;
    const hits = [...wishes()].sort((a, b) => sortKey(a).localeCompare(sortKey(b))).filter((w) => {
      if (c && w.cat !== c) return false;
      if (s === 'done' && !w.done) return false; if (s === 'open' && w.done) return false;
      if (y && yearOf(w) !== y && (w.done || '').slice(0, 4) !== y) return false;
      const hay = [w.title, w.why, w.notes, ...w.steps.map((x) => x.t), catOf(w.cat).label, when(w)].join(' ').toLowerCase();
      return terms.every((t) => hay.includes(t));
    });
    res.innerHTML = hits.length ? hits.slice(0, 30).map((w) => `<li><button type="button" data-hit="${esc(w.id)}"><b>p. ${wishPage.get(w.id) ?? '–'}</b><span>${w.done ? '✓ ' : ''}${esc(w.title)} · <i>${esc(when(w))}</i></span></button></li>`).join('')
      : `<li class="none">${wishes().length ? 'No page answers to that.' : 'The book is still empty.'}</li>`;
  }
  q.addEventListener('input', runFind);
  findBox.querySelectorAll('select').forEach((s) => s.addEventListener('change', runFind));
  res.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLElement>('[data-hit]'); if (!b) return;
    const pn = wishPage.get(b.dataset.hit!); if (!pn) return;
    const term = q.value.trim().split(/\s+/)[0] || ''; closeFind();
    const moving = curFor(pn) !== cur; go(curFor(pn));
    setTimeout(() => highlight(pages[pn - 1], term), moving && !calm() ? 850 : 30);
  });
  function highlight(p: HTMLElement, term: string) {
    root.querySelectorAll('mark.bk-hl').forEach((m) => m.replaceWith(document.createTextNode(m.textContent || '')));
    if (!term) return;
    const walk = document.createTreeWalker(bodyOf(p), NodeFilter.SHOW_TEXT), low = term.toLowerCase();
    for (let n = walk.nextNode() as Text | null; n; n = walk.nextNode() as Text | null) {
      const i = n.data.toLowerCase().indexOf(low); if (i < 0) continue;
      const hit = n.splitText(i); hit.splitText(term.length);
      const m = document.createElement('mark'); m.className = 'bk-hl'; hit.replaceWith(m); m.append(hit); break;
    }
  }
  document.addEventListener('pointerdown', (e) => { if (!findBox.hidden && !(e.target as HTMLElement).closest('[data-findbox], [data-find]')) closeFind(); });
  reduce.addEventListener('change', () => root.classList.toggle('reduce', reduce.matches));
}
