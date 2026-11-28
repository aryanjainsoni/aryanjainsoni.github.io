// SMART TYPING — works in every text box on the site (Daily Log, post generator, goals, gym notes…).
//  • word suggestions while you type (tap a chip, or Tab on a laptop)
//  • autocorrect for common typos when you finish a word (Backspace right after = undo)
//  • spelling suggestion chip for unknown words ("cousion → cousin")
//  • learns YOUR words (Hinglish, names, tech terms) — stored only in this browser ("smart:vocab")
// Skipped: passwords, numbers, dates, the recovery-key box, the food search (it has its own suggestions),
// and anything marked data-nosmart.
import { WORDS, TYPOS, PROPER } from '../data/words';

const LKEY = 'smart:vocab';
const rank = new Map(WORDS.map((w, i) => [w, i]));
let learned: Record<string, number> = (() => { try { return JSON.parse(localStorage.getItem(LKEY) || '{}'); } catch { return {}; } })();
const known = (w: string) => rank.has(w) || (learned[w] ?? 0) >= 2;

type Field = HTMLInputElement | HTMLTextAreaElement;
const eligible = (el: EventTarget | null): el is Field => {
  if (!(el instanceof HTMLTextAreaElement || el instanceof HTMLInputElement)) return false;
  if (el instanceof HTMLInputElement && !['text', ''].includes(el.type)) return false;
  return !el.readOnly && !el.disabled && !el.closest('.f-pw, [data-nosmart]') && !el.matches('[data-food], .f-codein, [name^="nf-"]');
};

// ---------- spelling distance (Damerau, with early stop) ----------
function dist(a: string, b: string, max: number) {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  const d: number[][] = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    let rowMin = Infinity;
    for (let j = 1; j <= b.length; j++) {
      const c = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + c);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
      rowMin = Math.min(rowMin, d[i][j]);
    }
    if (rowMin > max) return max + 1;
  }
  return d[a.length][b.length];
}
function correction(word: string): string | null {
  const w = word.toLowerCase();
  if (w.length < 3 || known(w) || !/^[a-z]+$/.test(w)) return null;
  if (TYPOS[w]) return TYPOS[w];
  const max = w.length >= 7 ? 2 : 1;
  let best: string | null = null, bestScore = Infinity;
  for (const c of [...rank.keys(), ...Object.keys(learned).filter((k) => learned[k] >= 2)]) {
    if (c[0] !== w[0] && max === 1) continue;
    const dd = dist(w, c, max); if (dd > max) continue;
    const score = dd * 1000 + (rank.get(c) ?? 500) - (learned[c] ?? 0) * 5;
    if (score < bestScore) { best = c; bestScore = score; }
  }
  return best;
}
function completions(frag: string): string[] {
  const f = frag.toLowerCase(); if (f.length < 2) return [];
  const mine = Object.entries(learned).filter(([w, n]) => n >= 2 && w.startsWith(f) && w !== f).sort((a, b) => b[1] - a[1]).map(([w]) => w);
  const base = [...rank.keys()].filter((w) => w.startsWith(f) && w !== f && w.length > f.length);
  return [...new Set([...mine, ...base])].slice(0, 3);
}
const matchCase = (src: string, out: string) => PROPER[out.toLowerCase()] ?? (src[0] && src[0] === src[0].toUpperCase() && src[0] !== src[0].toLowerCase() ? out[0].toUpperCase() + out.slice(1) : out);

// ---------- editing helpers ----------
const WORD = /[A-Za-z']+$/;
function wordBefore(el: Field, pos = el.selectionStart ?? 0) {
  const m = el.value.slice(0, pos).match(WORD);
  return m ? { word: m[0], start: pos - m[0].length, end: pos } : { word: '', start: pos, end: pos };
}
let internal = false;
function replace(el: Field, start: number, end: number, text: string, caret?: number) {
  el.focus(); el.setRangeText(text, start, end, 'end');
  if (caret != null) el.setSelectionRange(caret, caret);
  internal = true; el.dispatchEvent(new Event('input', { bubbles: true })); internal = false; // let page forms save
}

// ---------- suggestion bar ----------
const bar = document.createElement('div');
bar.className = 'smart-bar'; bar.setAttribute('role', 'toolbar'); bar.setAttribute('aria-label', 'Typing suggestions'); bar.hidden = true;
document.body.append(bar);
let active: Field | null = null, lastFix: { start: number; end: number; orig: string; sep: string } | null = null;
type Chip = { kind: 'undo' | 'fix' | 'done'; label: string; run: () => void };
let chips: Chip[] = [];

function place() {
  if (!active || bar.hidden) return;
  const r = active.getBoundingClientRect();
  bar.style.top = `${r.bottom + window.scrollY + 6}px`;
  bar.style.left = `${r.left + window.scrollX}px`;
  bar.style.maxWidth = `${Math.max(220, r.width)}px`;
}
function show() {
  if (!chips.length || !active) { bar.hidden = true; return; }
  bar.innerHTML = chips.map((c, i) => `<button type="button" class="${c.kind}" data-i="${i}">${c.label}</button>`).join('') + (chips.some((c) => c.kind === 'done') ? '<span class="hint">Tab ↹</span>' : '');
  bar.hidden = false; place();
}
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));

function refresh(el: Field) {
  chips = [];
  if (lastFix) { const f = lastFix; chips.push({ kind: 'undo', label: `↺ ${esc(f.orig)}`, run: () => undo(el) }); }
  const cur = wordBefore(el);
  // spelling help for the word you just finished
  const before = el.value.slice(0, cur.start).match(/([A-Za-z']+)[^A-Za-z']+$/);
  if (!cur.word && before && !lastFix) {
    const w = before[1], fix = correction(w);
    if (fix && fix.toLowerCase() !== w.toLowerCase()) {
      const s = cur.start - before[0].length, e = s + w.length;
      chips.push({ kind: 'fix', label: `${esc(w)} → <b>${esc(matchCase(w, fix))}</b>`, run: () => replace(el, s, e, matchCase(w, fix), (el.selectionStart ?? 0) + fix.length - w.length) });
    }
  }
  // word completions for what you're typing now
  for (const c of completions(cur.word)) chips.push({ kind: 'done', label: esc(matchCase(cur.word, c)), run: () => replace(el, cur.start, cur.end, matchCase(cur.word, c) + ' ') });
  if (cur.word.length >= 4 && !chips.some((c) => c.kind === 'done')) {
    const fix = correction(cur.word);
    if (fix) chips.push({ kind: 'fix', label: `${esc(cur.word)} → <b>${esc(matchCase(cur.word, fix))}</b>`, run: () => replace(el, cur.start, cur.end, matchCase(cur.word, fix)) });
  }
  show();
}
function undo(el: Field) {
  if (!lastFix) return;
  const f = lastFix; lastFix = null;
  replace(el, f.start, f.end + f.sep.length, f.orig + f.sep);
  learned[f.orig.toLowerCase()] = Math.max(2, (learned[f.orig.toLowerCase()] ?? 0) + 1); save(); // you meant it -> never fix it again
  refresh(el);
}
const save = () => { const e = Object.entries(learned); if (e.length > 2500) learned = Object.fromEntries(e.sort((a, b) => b[1] - a[1]).slice(0, 2000)); localStorage.setItem(LKEY, JSON.stringify(learned)); };

// ---------- events ----------
document.addEventListener('focusin', (e) => {
  if (!eligible(e.target)) return;
  const el = e.target; active = el; lastFix = null;
  el.spellcheck = true; el.setAttribute('autocorrect', 'on');
  if (el instanceof HTMLTextAreaElement && !el.hasAttribute('autocapitalize')) el.setAttribute('autocapitalize', 'sentences');
});
document.addEventListener('focusout', (e) => {
  if (!eligible(e.target)) return;
  const el = e.target;
  (el.value.match(/[A-Za-z][A-Za-z']{2,}/g) ?? []).forEach((w) => { const k = w.toLowerCase(); if (!TYPOS[k]) learned[k] = (learned[k] ?? 0) + 1; });
  save();
  setTimeout(() => { if (document.activeElement !== el) { bar.hidden = true; active = null; } }, 120);
});
document.addEventListener('input', (e) => {
  if (internal || !eligible(e.target)) return;
  const el = e.target, ie = e as InputEvent; active = el;
  const typed = ie.data ?? '';
  if (ie.inputType === 'insertText' && /^[\s.,!?;:)]$/.test(typed)) {
    // autocorrect the word that just ended
    const pos = (el.selectionStart ?? 0) - 1, w = wordBefore(el, pos), k = w.word.toLowerCase();
    const fix = TYPOS[k];
    if (w.word && fix && !((learned[k] ?? 0) >= 2 && !rank.has(k))) {
      const out = k === 'i' ? 'I' : matchCase(w.word, fix);
      if (out !== w.word) { replace(el, w.start, w.end, out, w.start + out.length + 1); lastFix = { start: w.start, end: w.start + out.length, orig: w.word, sep: typed }; return refresh(el); }
    }
  } else if (ie.inputType !== 'deleteContentBackward') lastFix = null;
  refresh(el);
});
document.addEventListener('keydown', (e) => {
  if (!eligible(e.target)) return;
  const el = e.target;
  if (e.key === 'Backspace' && lastFix && el.selectionStart === lastFix.end + lastFix.sep.length && el.selectionStart === el.selectionEnd) { e.preventDefault(); undo(el); return; }
  if (e.key === 'Tab' && !e.shiftKey && !bar.hidden) { const c = chips.find((x) => x.kind === 'done'); if (c) { e.preventDefault(); c.run(); refresh(el); } }
  if (e.key === 'Escape') bar.hidden = true;
});
bar.addEventListener('pointerdown', (e) => e.preventDefault()); // keep the keyboard open
bar.addEventListener('click', (e) => {
  const b = (e.target as HTMLElement).closest('button[data-i]') as HTMLElement | null; if (!b || !active) return;
  chips[+b.dataset.i!]?.run(); refresh(active);
});
addEventListener('resize', place); addEventListener('scroll', place, { passive: true });
