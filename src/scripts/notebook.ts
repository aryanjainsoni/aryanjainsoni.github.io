// GYM NOTEBOOK ("Altitude") — turns the chapter source in Notebook.astro into a real spiral notebook.
//  • paginate(): cuts every chapter into ruled pages that fit THIS screen (page numbers + index follow)
//  • leaves: desktop = two-page spread (sheet front = right page, back = left page); phone = one page at a time
//  • go(): page-turn animation (3D CSS), arrows, ← →, swipe, page corners, index rows, search results
//  • closed green cover every time you come to the tab (unless a deep link #guide/p-5 or #nb-<chapter>)
//  • remembers the last page (localStorage "nb:last"), soft paper sound only when Gym sound is on
const root = document.querySelector<HTMLElement>('[data-nbk]');
if (root) init(root);

function init(root: HTMLElement) {
  const $ = <T extends Element = HTMLElement>(s: string) => root.querySelector<T>(s)!;
  const panel = (root.closest('.panel') as HTMLElement) ?? document.body;
  const src = $('[data-src]'), stage = $('[data-stage]'), book = $('[data-book]');
  const prevB = $<HTMLButtonElement>('[data-prev]'), nextB = $<HTMLButtonElement>('[data-next]');
  const ind = $('[data-ind]'), contB = $<HTMLButtonElement>('[data-continue]');
  const note = $('[data-search]'), q = $<HTMLInputElement>('[data-q]'), res = $('[data-res]'), sBtn = $('[data-search-open]');
  const zoom = $<HTMLDialogElement>('[data-zoom]');
  const chapters = [...src.querySelectorAll<HTMLElement>('[data-ch]')];
  const STARTED = root.dataset.started!, LATEST = root.dataset.latest!;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const calm = () => document.documentElement.classList.contains('calm');

  let mode: 'spread' | 'single' = 'spread';
  let r = 24, pages: HTMLElement[] = [], leaves: HTMLElement[] = [], cur = 0, built = false, sizeKey = '';
  const chStart = new Map<string, number>();
  const tpl = (n: string) => (src.querySelector<HTMLTemplateElement>(`template[data-tpl="${n}"]`)!.content.firstElementChild!.cloneNode(true) as HTMLElement);
  const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));

  // ---------------- sizes ----------------
  function measure() {
    const w = root.clientWidth || panel.clientWidth, vh = innerHeight;
    mode = w >= 720 ? 'spread' : 'single';
    let W: number, H: number;
    if (mode === 'spread') {
      H = Math.max(380, Math.min(860, vh - 200));
      W = Math.min(H * 0.74, (w - 150) / 2);
      H = Math.min(H, W / 0.66);
    } else {
      W = Math.min(w - 30, 520);
      H = Math.max(440, Math.min(W * 1.55, vh - 210));
    }
    r = Math.round(Math.max(20, Math.min(30, H / 21)));
    H = Math.floor(H / r) * r; W = Math.round(W);
    root.style.setProperty('--W', W + 'px'); root.style.setProperty('--H', H + 'px'); root.style.setProperty('--r', r + 'px');
    root.classList.toggle('single', mode === 'single');
    return `${mode}:${W}:${H}:${r}`;
  }

  // ---------------- pages ----------------
  function page(kind: string, date: string, run = '') {
    const p = document.createElement('section');
    p.className = `pg pg-${kind}`;
    p.innerHTML = `<div class="pg-top"><span class="pg-run">${esc(run)}</span><span class="pg-date">Date <b>${date}</b></span></div><div class="pg-body"></div><div class="pg-no"></div><button class="pg-corner" type="button" tabindex="-1" aria-hidden="true"></button>`;
    return p;
  }
  const bodyOf = (p: HTMLElement) => p.querySelector<HTMLElement>('.pg-body')!;

  // a chapter → list of blocks (each list item is its own block, so pages can break between them)
  function blocks(ch: HTMLElement) {
    const out: HTMLElement[] = [];
    for (const el of [...ch.children] as HTMLElement[]) {
      if (el.matches('.b-body, .b-src')) {
        for (const k of [...el.children] as HTMLElement[]) {
          if (k.matches('ul, ol')) {
            for (const li of [...k.children]) {
              const u = document.createElement(k.tagName.toLowerCase());
              u.className = 'b b-li' + (el.matches('.b-src') ? ' src' : '');
              u.append(li.cloneNode(true)); out.push(u);
            }
          } else { const x = k.cloneNode(true) as HTMLElement; x.classList.add('b'); out.push(x); }
        }
      } else out.push(el.cloneNode(true) as HTMLElement);
    }
    return out;
  }
  // keep everything sitting on the ruled lines: round each block up to whole lines
  function snap(b: HTMLElement) {
    b.style.height = '';
    const h = b.getBoundingClientRect().height;
    const k = Math.max(1, Math.ceil((h - 0.5) / r));
    if (Math.abs(k * r - h) > 0.5) b.style.height = k * r + 'px';
  }
  const over = (body: HTMLElement) => body.scrollHeight > body.clientHeight + 1;

  function paginate() {
    const meas = document.createElement('div'); meas.className = 'nbk-meas'; root.append(meas);
    const out: HTMLElement[] = [];
    const mount = (p: HTMLElement) => { p.classList.add('right'); meas.replaceChildren(p); return bodyOf(p); };

    const p1 = page('name', STARTED); bodyOf(p1).append(tpl('name')); out.push(p1);
    const pIx = page('index', LATEST); bodyOf(pIx).append(tpl('index')); out.push(pIx);
    chStart.clear();
    for (const ch of chapters) {
      const n = String(ch.dataset.n).padStart(2, '0'), title = ch.dataset.title!, date = ch.dataset.date!;
      let p = page('ch', date, `Ch. ${n}`); p.dataset.ch = ch.dataset.ch; out.push(p); chStart.set(ch.dataset.ch!, out.length);
      let body = mount(p);
      for (const b of blocks(ch)) {
        body.append(b); snap(b);
        if (!over(body)) continue;
        if (body.children.length === 1) { fitInto(b, body); continue; }
        // a chart that almost fits: shrink it into the space left instead of leaving half a page empty
        if (b.matches('.b-vis') && body.clientHeight - b.offsetTop >= r * 6) { fitInto(b, body, body.clientHeight - b.offsetTop); if (!over(body)) continue; }
        b.remove(); b.classList.remove('fit'); b.style.height = '';
        const carry: HTMLElement[] = [];
        const last = body.lastElementChild as HTMLElement | null;
        if (last?.classList.contains('kwn') && body.children.length > 1) { last.remove(); carry.push(last); } // headings stay with their text
        p = page('ch', date, `Ch. ${n} · ${title} (contd…)`); p.dataset.ch = ch.dataset.ch; out.push(p);
        body = mount(p);
        for (const c of [...carry, b]) { body.append(c); snap(c); if (over(body) && body.children.length === 1) fitInto(c, body); }
      }
    }
    const pn = page('notes', LATEST); bodyOf(pn).append(tpl('notes')); out.push(pn);
    meas.remove();

    out.forEach((p, i) => { p.dataset.page = String(i + 1); p.querySelector('.pg-no')!.textContent = String(i + 1); p.classList.remove('right'); });
    // index rows (page numbers depend on this screen size)
    const rows = pIx.querySelector('[data-rows]')!;
    rows.innerHTML = chapters.map((ch, i) => {
      const pg = chStart.get(ch.dataset.ch!)!;
      return `<button type="button" class="ix-row" data-goto="${pg}"><span>${i + 1}.</span><span>${esc(ch.dataset.icon || '')} ${esc(ch.dataset.title!)}</span><span>${pg}</span><span>${ch.dataset.date}</span></button>`;
    }).join('') + `<button type="button" class="ix-row" data-goto="${out.length}"><span>${chapters.length + 1}.</span><span>✎ Notes · to learn next</span><span>${out.length}</span><span>${LATEST}</span></button>`;
    return out;
  }
  // a chart taller than the page: shrink it to the page
  function fitInto(b: HTMLElement, body: HTMLElement, room = body.clientHeight) {
    if (!b.matches('.b-vis')) return;
    b.classList.add('fit'); b.style.height = Math.floor(room / r) * r - 8 + 'px';
  }

  // ---------------- leaves (sheets) ----------------
  const blankPage = (back = false) => { const p = page('blank', ''); p.classList.add('blank', 'no-corner'); if (back) p.classList.add('backside'); return p; };
  function face(side: 'front' | 'back', content: HTMLElement) {
    const f = document.createElement('div'); f.className = 'face ' + side; f.append(content); return f;
  }
  function addLeaf(front: HTMLElement, back: HTMLElement, cls = '') {
    const l = document.createElement('div'); l.className = 'leaf ' + cls;
    l.append(face('front', front), face('back', back)); book.append(l); leaves.push(l);
  }
  function buildLeaves() {
    book.replaceChildren(); leaves = [];
    const side = (p: HTMLElement, s: 'left' | 'right') => { p.classList.remove('left', 'right'); p.classList.add(s); return p; };
    addLeaf(tpl('cover'), tpl('inside'), 'cover-leaf');
    if (mode === 'spread') {
      const ps = [...pages]; if (ps.length % 2) ps.push(blankPage());
      for (let i = 0; i < ps.length; i += 2) addLeaf(side(ps[i], 'right'), side(ps[i + 1], 'left'));
      addLeaf(tpl('insideback'), tpl('back'), 'cover-leaf');
    } else {
      pages.forEach((p) => addLeaf(side(p, 'right'), side(blankPage(true), 'left')));
    }
    const spiral = document.createElement('div'); spiral.className = 'nbk-spiral'; spiral.setAttribute('aria-hidden', 'true');
    const eR = document.createElement('div'); eR.className = 'nbk-edge r';
    const eL = document.createElement('div'); eL.className = 'nbk-edge l';
    book.append(spiral);
    if (mode === 'spread') book.prepend(eR, eL);
  }
  const maxCur = () => leaves.length - 1;

  function restack() {
    const n = leaves.length;
    leaves.forEach((l, i) => {
      const f = i < cur;
      l.classList.toggle('flipped', f);
      l.style.zIndex = String(f ? i + 1 : n * 2 - i);
      const show = i === cur || i === cur - 1;
      l.classList.toggle('far', !(i >= cur - 2 && i <= cur + 1));
      const [fr, bk] = l.children as unknown as HTMLElement[];
      fr.inert = !(show && !f); bk.inert = !(show && f);
      l.setAttribute('aria-hidden', String(!show));
    });
    // page-edge thickness
    const eR = book.querySelector<HTMLElement>('.nbk-edge.r'), eL = book.querySelector<HTMLElement>('.nbk-edge.l');
    const left = Math.max(0, cur - 1), right = Math.max(0, n - 1 - cur);
    eR?.style.setProperty('--t', Math.min(7, 1 + right * 0.35) + 'px');
    eL?.style.setProperty('--t', left ? Math.min(7, 1 + left * 0.35) + 'px' : '0px');
  }

  // page ↔ leaf position
  const firstPage = () => (cur === 0 ? 0 : mode === 'spread' ? (cur === 1 ? 1 : 2 * cur - 2) : cur);
  const curFor = (p: number) => (mode === 'spread' ? (p % 2 ? (p + 1) / 2 : p / 2 + 1) : p);

  // ---------------- turning ----------------
  let audio: AudioContext | undefined;
  function rustle(soft = false) {
    if (localStorage.getItem('gym:sound') !== 'on') return;
    try {
      audio ||= new AudioContext();
      const t = audio.currentTime, d = 0.34, len = Math.floor(audio.sampleRate * d);
      const buf = audio.createBuffer(1, len, audio.sampleRate), ch = buf.getChannelData(0);
      for (let i = 0; i < len; i++) { const x = i / len; ch[i] = (Math.random() * 2 - 1) * Math.pow(1 - x, 1.6) * (x < 0.1 ? x / 0.1 : 1); }
      const s = audio.createBufferSource(); s.buffer = buf;
      const f = audio.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 0.7;
      f.frequency.setValueAtTime(3400, t); f.frequency.exponentialRampToValueAtTime(800, t + d);
      const g = audio.createGain(); g.gain.value = soft ? 0.05 : 0.11;
      s.connect(f).connect(g).connect(audio.destination); s.start();
    } catch { /* no audio, no problem */ }
  }

  function go(target: number, o: { instant?: boolean } = {}) {
    target = Math.max(0, Math.min(maxCur(), target));
    if (target === cur && !o.instant) return;
    const from = cur; cur = target;
    if (o.instant || calm() || reduce.matches || from === target) {
      restack(); after();
      if (!o.instant && reduce.matches && !calm()) book.animate([{ opacity: 0.25 }, { opacity: 1 }], { duration: 260, easing: 'ease-out' });
      return;
    }
    const fwd = target > from;
    const idx: number[] = [];
    if (fwd) for (let i = from; i < target; i++) idx.push(i); else for (let i = from - 1; i >= target; i--) idx.push(i);
    // make every sheet in the way visible for the riffle
    leaves.forEach((l, i) => { if (i >= Math.min(from, target) - 1 && i <= Math.max(from, target) + 1) l.classList.remove('far'); });
    const step = idx.length > 1 ? Math.min(110, 760 / idx.length) : 0;
    idx.forEach((i, k) => setTimeout(() => {
      const l = leaves[i];
      l.classList.add('turning'); l.style.zIndex = String(5000 - (fwd ? idx.length - k : idx.length - k));
      l.classList.toggle('flipped', fwd);
      if (k === 0 || k === idx.length - 1) rustle(k > 0);
      const done = (e: TransitionEvent) => {
        if (e.target !== l || e.propertyName !== 'transform') return;
        l.removeEventListener('transitionend', done); l.classList.remove('turning');
        if (!book.querySelector('.leaf.turning')) restack();
      };
      l.addEventListener('transitionend', done);
      setTimeout(() => { if (l.classList.contains('turning')) { l.classList.remove('turning'); if (!book.querySelector('.leaf.turning')) restack(); } }, 1400); // safety net
    }, k * step));
    after();
  }

  function after() {
    const closed = cur === 0, total = pages.length, p = firstPage();
    book.classList.toggle('closed', closed); root.classList.toggle('is-closed', closed);
    prevB.disabled = closed; nextB.disabled = cur >= maxCur();
    if (closed) ind.textContent = 'Tap the cover to open';
    else if (mode === 'spread' && cur > 1 && p + 1 <= total) ind.textContent = `Pages ${p}–${p + 1} / ${total}`;
    else ind.textContent = `Page ${Math.min(p, total)} / ${total}`;
    const last = +(localStorage.getItem('nb:last') || 0);
    if (!closed) localStorage.setItem('nb:last', String(p));
    contB.hidden = !(closed && last > 2);
    if (closed && last > 2) contB.textContent = `Continue · p. ${last}`;
    if (!panel.hidden) {
      const h = closed ? '#guide' : `#guide/p-${p}`;
      if (location.hash !== h) history.replaceState(null, '', h);
    }
  }

  // ---------------- build / rebuild ----------------
  async function build() {
    try { await Promise.race([Promise.all([document.fonts.load("700 20px 'Caveat'"), document.fonts.load("600 20px 'Caveat'"), document.fonts.ready]), new Promise((r) => setTimeout(r, 2500))]); } catch {}
    stage.hidden = false;
    sizeKey = measure();
    pages = paginate();
    buildLeaves();
    root.classList.add('ready'); root.classList.toggle('reduce', reduce.matches);
    built = true;
  }
  async function rebuild() {
    const k = measure(); if (k === sizeKey) return;
    const p = firstPage(); sizeKey = k;
    pages = paginate(); buildLeaves();
    cur = 0; go(p ? curFor(Math.min(p, pages.length)) : 0, { instant: true });
  }

  // deep link → page number (or null)
  function hashPage(): number | null {
    const h = decodeURIComponent(location.hash.slice(1));
    const m = h.match(/^guide\/p-(\d+)$/); if (m) return Math.max(1, Math.min(pages.length, +m[1]));
    if (h.startsWith('nb-')) return chStart.get(h.slice(3)) ?? null;
    return null;
  }
  async function onShow() {
    if (!built) await build();
    else await rebuild();
    const p = hashPage();
    cur = 0; go(p ? curFor(p) : 0, { instant: true });
    if (p) stage.scrollIntoView({ block: 'start' });
  }

  // ---------------- events ----------------
  function openBook(toPage = 1) {
    go(curFor(toPage));
    const top = stage.getBoundingClientRect().top;
    if (top < 60 || top > innerHeight * 0.35) stage.scrollIntoView({ behavior: calm() || reduce.matches ? 'auto' : 'smooth', block: 'start' });
  }
  const next = () => (cur === 0 ? openBook() : go(cur + 1));
  const prev = () => go(cur - 1);
  nextB.addEventListener('click', next); prevB.addEventListener('click', prev);
  $('[data-close]').addEventListener('click', () => { closeSearch(); go(0); });
  contB.addEventListener('click', () => openBook(+(localStorage.getItem('nb:last') || 1)));
  $('[data-index]').addEventListener('click', () => go(curFor(2)));

  book.addEventListener('click', (e) => {
    const t = e.target as HTMLElement;
    if (t.closest('[data-open]')) return openBook();
    const g = t.closest<HTMLElement>('[data-goto]'); if (g) return go(curFor(+g.dataset.goto!));
    const c = t.closest('.pg-corner'); if (c) return c.closest('.pg')!.classList.contains('left') ? prev() : next();
    const v = t.closest<HTMLElement>('.b-vis'); if (v) return openZoom(v);
  });
  book.addEventListener('keydown', (e) => {
    const v = (e.target as HTMLElement).closest?.('.b-vis') as HTMLElement | null;
    if (v && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); openZoom(v); }
  });
  // swipe (phone) / drag
  let sx = 0, sy = 0, st = 0;
  book.addEventListener('pointerdown', (e) => { sx = e.clientX; sy = e.clientY; st = Date.now(); });
  book.addEventListener('pointerup', (e) => {
    const dx = e.clientX - sx, dy = e.clientY - sy;
    if (Date.now() - st < 700 && Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.4) { dx < 0 ? next() : prev(); }
  });
  addEventListener('keydown', (e) => {
    if (panel.hidden || !built || e.altKey || e.ctrlKey || e.metaKey) return;
    const t = e.target as HTMLElement;
    if (t.matches('input, textarea, select, [contenteditable="true"]') || zoom.open) return;
    if (document.documentElement.classList.contains('sd-open')) return;
    if (e.key === 'ArrowRight') { e.preventDefault(); next(); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); }
  });

  // chart zoom
  function openZoom(v: HTMLElement) {
    const body = zoom.querySelector('[data-zoom-body]')!;
    const c = v.cloneNode(true) as HTMLElement; c.classList.remove('fit'); c.style.height = ''; c.removeAttribute('tabindex');
    body.replaceChildren(c); zoom.showModal();
  }
  zoom.addEventListener('click', () => zoom.close());

  // ---------------- search ----------------
  function closeSearch() { note.hidden = true; sBtn.setAttribute('aria-expanded', 'false'); }
  sBtn.addEventListener('click', () => {
    const open = note.hidden; note.hidden = !open; sBtn.setAttribute('aria-expanded', String(open));
    if (open) { q.focus(); q.select(); }
  });
  q.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { closeSearch(); (sBtn as HTMLElement).focus(); }
    if (e.key === 'Enter') { (res.querySelector('button') as HTMLButtonElement | null)?.click(); }
  });
  document.addEventListener('pointerdown', (e) => { if (!note.hidden && !(e.target as HTMLElement).closest('[data-search], [data-search-open]')) closeSearch(); });
  const textOf = (p: HTMLElement) => [...bodyOf(p).querySelectorAll('.b, .np-f, .np-about, .nt-l, h3')].map((b) => b.textContent).join(' ').replace(/\s+/g, ' ').trim();
  q.addEventListener('input', () => {
    const terms = q.value.toLowerCase().split(/\s+/).filter((t) => t.length > 1);
    if (!terms.length) { res.innerHTML = ''; return; }
    const hits = pages.filter((p) => !p.classList.contains('pg-index')).map((p) => ({ p, t: textOf(p) }))
      .filter(({ t }) => terms.every((x) => t.toLowerCase().includes(x))).slice(0, 8);
    res.innerHTML = hits.length ? hits.map(({ p, t }) => {
      const i = t.toLowerCase().indexOf(terms[0]), a = Math.max(0, i - 34);
      const snip = (a ? '…' : '') + t.slice(a, i + terms[0].length + 46) + '…';
      const marked = esc(snip).replace(new RegExp(terms[0].replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'ig'), (m) => `<mark>${m}</mark>`);
      return `<li><button type="button" data-hit="${p.dataset.page}"><b>p. ${p.dataset.page}</b>${marked}</button></li>`;
    }).join('') : `<li class="none">Nothing on these pages yet.</li>`;
  });
  res.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLElement>('[data-hit]'); if (!b) return;
    const pn = +b.dataset.hit!, term = q.value.trim().split(/\s+/)[0];
    closeSearch();
    const target = curFor(pn), needs = target !== cur;
    if (cur === 0) openBook(pn); else go(target);
    setTimeout(() => highlight(pages[pn - 1], term), needs && !calm() && !reduce.matches ? 800 : 50);
  });
  function highlight(p: HTMLElement, term: string) {
    root.querySelectorAll('mark.nbk-hl').forEach((m) => m.replaceWith(document.createTextNode(m.textContent || '')));
    if (!term) return;
    const walk = document.createTreeWalker(bodyOf(p), NodeFilter.SHOW_TEXT);
    const low = term.toLowerCase();
    for (let n = walk.nextNode() as Text | null; n; n = walk.nextNode() as Text | null) {
      const i = n.data.toLowerCase().indexOf(low); if (i < 0) continue;
      const hit = n.splitText(i); hit.splitText(term.length);
      const m = document.createElement('mark'); m.className = 'nbk-hl'; hit.replaceWith(m); m.append(hit);
      break;
    }
  }

  // ---------------- tab visibility, hash, resize ----------------
  new MutationObserver(() => { if (!panel.hidden) onShow(); else closeSearch(); }).observe(panel, { attributes: true, attributeFilter: ['hidden'] });
  if (!panel.hidden) onShow();
  addEventListener('hashchange', () => { if (panel.hidden || !built) return; const p = hashPage(); if (p) go(curFor(p)); });
  let rt = 0;
  addEventListener('resize', () => { clearTimeout(rt); rt = window.setTimeout(() => { if (built && !panel.hidden) rebuild(); }, 220); });
  reduce.addEventListener('change', () => root.classList.toggle('reduce', reduce.matches));
}
