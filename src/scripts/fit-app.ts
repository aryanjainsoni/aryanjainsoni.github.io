// /gym/ — Today · Plan · Diet · Body tabs. Everything personal stays in THIS browser, ENCRYPTED with the
// owner's passcode (src/lib/vault.ts -> localStorage "fit:vault"). Decrypted data lives only in memory (`mem`).
import * as F from '../lib/fit';
import type { Scan, Goal, DayLog, GoalType, Macros, Targets } from '../lib/fit';
import { meals, micros } from '../data/meals';
import { seal, unseal, deriveKey, newSalt, ITER, type Vault } from '../lib/vault';

// ---------------- store ----------------
const K = { scans: 'fit:scans', goal: 'fit:goal', week: 'fit:dietweek', log: (d: string) => `fit:log:${d}` };
const VAULT = 'fit:vault';
let mem: Record<string, unknown> | null = null;          // null = locked
let vkey: { key: CryptoKey; salt: Uint8Array; it: number } | null = null;
let chain: Promise<void> = Promise.resolve();
const vault = (): Vault | null => { try { return JSON.parse(localStorage.getItem(VAULT) || 'null'); } catch { return null; } };
const persist = () => {
  if (!mem || !vkey) return;
  const text = JSON.stringify(mem), k = vkey;
  chain = chain.then(async () => localStorage.setItem(VAULT, JSON.stringify(await seal(k.key, k.salt, text, k.it)))).catch(() => {});
};
const load = <T,>(k: string, d: T): T => ((mem?.[k] as T) ?? d);
const set = (k: string, v: unknown) => { if (!mem) return; if (v === undefined) delete mem[k]; else mem[k] = v; persist(); };
const put = (k: string, v: unknown) => { set(k, v); render(); };
// plaintext fit:* keys from before the lock existed -> moved into the vault on setup
const plainKeys = () => Object.keys(localStorage).filter((k) => k.startsWith('fit:') && k !== VAULT);

const scans = (): Scan[] => load<Scan[]>(K.scans, []).filter((s) => s && s.date && s.weight).sort((a, b) => a.date.localeCompare(b.date));
const goal = (): Goal | null => load<Goal | null>(K.goal, null);
const logOf = (d: string): DayLog | undefined => load<DayLog | undefined>(K.log(d), undefined);
const saveLog = (d: string, patch: Partial<DayLog>) => {
  const cur = { ...(logOf(d) ?? { date: d }), ...patch };
  for (const k of Object.keys(cur) as (keyof DayLog)[]) if (cur[k] === undefined || (typeof cur[k] === 'number' && Number.isNaN(cur[k]))) delete cur[k];
  put(K.log(d), cur);
};
type Week = Record<string, Record<string, string>>; // '0'..'6' (Mon..Sun) -> slot -> option id
const week = (): Week => load<Week>(K.week, {});

const journalSteps = new Map<string, number>(
  (() => { try { return JSON.parse(document.getElementById('steps-data')!.textContent || '{}').days.map((x: { d: string; n: number }) => [x.d, x.n]); } catch { return []; } })(),
);

// ---------------- helpers ----------------
const $ = (s: string, r: ParentNode = document) => r.querySelector(s) as HTMLElement | null;
const esc = (s: unknown) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
const n0 = (v: number) => Math.round(v).toLocaleString('en-IN');
const n1 = (v: number) => (Math.round(v * 10) / 10).toLocaleString('en-IN', { maximumFractionDigits: 1 });
const num = (v: FormDataEntryValue | null | undefined) => { const x = parseFloat(String(v ?? '')); return Number.isFinite(x) ? x : undefined; };
const fmtD = (k: string, o: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' }) => new Date(k + 'T00:00:00Z').toLocaleDateString('en-IN', { timeZone: 'UTC', ...o });
const WD = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const TODAY = F.todayKey();
let view = TODAY;      // Today tab date
let dietDay = String(F.weekdayIdx(TODAY));
let editingGoal = false;

const scanOn = (d: string) => { const all = scans(); return [...all].reverse().find((s) => s.date <= d) ?? all[0]; };
const kgOn = (d: string) => {
  for (let i = 0; i <= 7; i++) { const w = logOf(F.addDays(d, -i))?.weight; if (w) return w; }
  return scanOn(d)?.weight ?? 65;
};
const optionOf = (ref: string) => { const [slot, id] = ref.split(':'); return meals.find((s) => s.id === slot)?.options.find((o) => o.id === id); };
const eatenOn = (d: string) => F.eaten(logOf(d), (ref) => optionOf(ref));
const stepsOn = (d: string) => logOf(d)?.steps ?? journalSteps.get(d);

function tdeeAdj(d: string) {
  const g = goal(); if (!g) return 0;
  const pts = [];
  for (let i = 21; i >= 1; i--) {
    const k = F.addDays(d, -i), log = logOf(k), food = eatenOn(k), s = scanOn(k); if (!s) continue;
    const kg = kgOn(k), act = F.burn({ steps: stepsOn(k) ?? g.stepGoal, cardioMin: log?.cardioMin ?? g.cardioMin, workoutMin: log?.workoutMin ?? g.workoutMin, kmh: g.cardioKmh, grade: g.cardioGrade }, kg);
    pts.push({ date: k, weight: log?.weight, balance: food ? food.kcal - F.tdeeOf(F.bmrOf({ ...s, weight: kg, fatMass: undefined }), act.total) : undefined });
  }
  return F.adaptiveTdee(pts).adj;
}

function plan(d: string) {
  const g = goal(), s = scanOn(d); if (!g || !s) return null;
  const kg = kgOn(d), adjT = tdeeAdj(d), base = F.baseTargets(g, s, kg, adjT);
  const L = F.ledger({ today: d, goal: g, kg, base, logFor: logOf, stepsFor: (k) => journalSteps.get(k), eatenFor: eatenOn });
  const kcal = Math.max(base.bmr, base.kcal + L.adj.kcal);
  const m = F.macrosFor(kcal, kg, g.type); m.p += L.adj.protein; m.c = Math.max(0, (kcal - m.p * 4 - m.f * 9) / 4);
  const t: Targets = { ...base, ...m, kcal, steps: base.steps + L.adj.steps, cardioMin: base.cardioMin + L.adj.cardio, burn: base.burn + L.adj.burnKcal };
  return { g, s, kg, base, t, L, adjT };
}

// ---------------- tiny UI pieces ----------------
const ring = (v: number | undefined, target: number, label: string, unit = '') => {
  const p = v ? Math.min(v / target, 1) : 0, R = 34, C = 2 * Math.PI * R, over = v != null && v > target * 1.05;
  return `<div class="f-ring"><div class="rv"><svg viewBox="0 0 80 80" aria-hidden="true"><circle cx="40" cy="40" r="${R}" class="t"/><circle cx="40" cy="40" r="${R}" class="b${over ? ' over' : ''}" stroke-dasharray="${C}" stroke-dashoffset="${C * (1 - p)}"/></svg>
    <div class="in"><b>${v != null ? n0(v) : '—'}</b><span>/ ${n0(target)}${unit}</span></div></div><p>${label}</p>
    <em>${v == null ? 'not logged' : v >= target * 0.98 ? (over ? `${n0(v - target)}${unit} over` : 'done ✓') : `${n0(target - v)}${unit} left`}</em></div>`;
};
const bar = (label: string, v: number, t: number, unit = 'g', more = false) =>
  `<div class="f-bar"><div class="h"><span>${label}</span><span><b>${n0(v)}</b> / ${n0(t)}${unit}</span></div><div class="tr"><span class="${v > t * 1.08 && !more ? 'over' : v >= t * 0.92 ? 'ok' : ''}" style="width:${Math.min(100, (v / Math.max(t, 1)) * 100)}%"></span></div></div>`;
const locked = (title: string, line: string, cta = true) => `<div class="card f-lock"><span class="f-lk" aria-hidden="true">✦</span><p class="label">Start here</p><h2>${title}</h2><p class="lead">${line}</p>
  ${cta ? `<div class="f-row"><button class="btn primary" data-act="go-body">Add first scan</button><label class="btn ghost f-file">Import backup<input type="file" accept="application/json" data-act="import" hidden></label></div>` : ''}
  <p class="fine">Encrypted on this device — it isn't on the public site.</p></div>`;
const NOTE = `<p class="f-note">Estimates from published formulas, not medical advice. Check with a doctor or dietitian before big changes.</p>`;

// mini line chart (no text inside the SVG, so it scales cleanly)
function spark(pts: { x: string; y: number }[], planPts: { x: string; y: number }[] = [], unit = '', label = '') {
  const all = [...pts, ...planPts]; if (!all.length) return '';
  const xs = all.map((p) => Date.parse(p.x)), ys = all.map((p) => p.y);
  let x0 = Math.min(...xs), x1 = Math.max(...xs); if (x1 === x0) x1 = x0 + 864e5;
  let y0 = Math.min(...ys), y1 = Math.max(...ys); const pad = (y1 - y0) * 0.15 || 1; y0 -= pad; y1 += pad;
  const W = 600, H = 170, X = (x: string) => ((Date.parse(x) - x0) / (x1 - x0)) * (W - 20) + 10, Y = (y: number) => H - 10 - ((y - y0) / (y1 - y0)) * (H - 20);
  const path = (p: typeof pts) => p.map((q, i) => `${i ? 'L' : 'M'}${X(q.x).toFixed(1)},${Y(q.y).toFixed(1)}`).join('');
  const last = pts[pts.length - 1];
  return `<div class="f-spark"><div class="h"><span class="label">${label}</span>${last ? `<b>${n1(last.y)}${unit}</b>` : ''}</div>
    <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true">
      ${planPts.length ? `<path d="${path(planPts)}" class="pl"/>` : ''}
      ${pts.length > 1 ? `<path d="${path(pts)}" class="ln"/>` : ''}
    </svg>
    <div class="dots">${pts.map((p) => `<i style="left:${(X(p.x) / W) * 100}%;top:${(Y(p.y) / H) * 100}%" title="${fmtD(p.x)} · ${n1(p.y)}${unit}"></i>`).join('')}</div>
    <div class="ax"><span>${fmtD(new Date(x0).toISOString().slice(0, 10), { month: 'short', year: '2-digit' })}</span>${planPts.length ? '<span class="lg"><i class="a"></i>actual <i class="p"></i>plan</span>' : ''}<span>${fmtD(new Date(x1).toISOString().slice(0, 10), { month: 'short', year: '2-digit' })}</span></div></div>`;
}

// ---------------- TODAY ----------------
function renderToday(root: HTMLElement) {
  if (!scans().length) return (root.innerHTML = locked('Today’s targets', 'Add a body scan and set a goal — then this page tells you exactly what to eat, walk and burn today, and rebalances when a day goes off-plan.'));
  const P = plan(view);
  if (!P) return (root.innerHTML = `<div class="card f-lock"><p class="label">One step left</p><h2>Set your goal first.</h2><p class="lead">Targets come from your goal. It takes a minute.</p><button class="btn primary" data-act="go-plan">Set goal →</button></div>`);
  const { g, t, L, base } = P, log = logOf(view) ?? { date: view }, food = eatenOn(view), steps = stepsOn(view);
  const actBurn = F.burn({ steps: steps ?? 0, cardioMin: log.cardioMin ?? 0, workoutMin: log.workoutMin ?? 0, kmh: g.cardioKmh, grade: g.cardioGrade }, P.kg).total;
  const dayN = F.diffDays(g.start, view) + 1, phase = Math.min(Math.ceil(dayN / 30), Math.ceil(g.days / 30));
  const wdPlan = week()[String(F.weekdayIdx(view))] ?? {};
  const fromJournal = log.steps == null && journalSteps.has(view);
  const status = Math.abs(L.net) <= 50 ? `<b>On track.</b> The last 7 days match the plan.` :
    L.net > 0 ? `<b>${n0(L.net)} kcal over plan</b> in the last 7 days → spread over the next ${L.spread} days.` :
    `<b>${n0(-L.net)} kcal under plan</b> → eat a little more for ${L.spread} days to protect muscle.`;
  const chips = [
    L.adj.cardio && `+${L.adj.cardio} min incline`, L.adj.steps && `+${n0(L.adj.steps)} steps`,
    L.adj.kcal && `${L.adj.kcal > 0 ? '+' : '−'}${n0(Math.abs(L.adj.kcal))} kcal food`, L.adj.protein && `+${L.adj.protein} g protein`,
  ].filter(Boolean);

  root.innerHTML = `
  <div class="f-dayhead">
    <div><p class="label">${view === TODAY ? 'Today' : fmtD(view, { weekday: 'long' })} · ${dayN >= 1 && dayN <= g.days ? `day ${dayN} of ${g.days} · phase ${phase}` : dayN < 1 ? 'goal starts ' + fmtD(g.start) : 'goal finished'}</p>
      <h2>${fmtD(view, { weekday: 'short', day: 'numeric', month: 'long' })}</h2></div>
    <div class="f-row"><button class="f-nav" data-act="day" data-d="-1" aria-label="Previous day">‹</button><input type="date" class="f-date" data-act="pick" value="${view}" max="${TODAY}"><button class="f-nav" data-act="day" data-d="1" aria-label="Next day" ${view >= TODAY ? 'disabled' : ''}>›</button></div>
  </div>
  ${view === TODAY ? weighCard(log.weight) : ''}
  <div class="f-rings">
    ${ring(food?.kcal, t.kcal, 'Calories eaten', '')}${ring(food?.p, t.p, 'Protein', ' g')}${ring(steps, t.steps, 'Steps')}${ring(actBurn || undefined, t.burn, 'Activity burn', '')}
  </div>
  <div class="f-two">
    <div class="card f-ledger">
      <p class="label">Adaptive balance</p>
      <p class="f-status">${status}</p>
      ${chips.length ? `<div class="f-chips">${chips.map((c) => `<span>${c}</span>`).join('')}</div><p class="fine">Already included in today’s targets.${L.forgiven ? ` ${n0(L.forgiven)} kcal forgiven — no guilt spiral.` : ''}</p>` : `<p class="fine">Nothing to make up. Keep going.</p>`}
      ${L.days.length ? `<details class="f-why"><summary>Last 7 days vs plan</summary><table><thead><tr><th>Day</th><th>Food</th><th>Burn</th><th>Net</th></tr></thead><tbody>
        ${L.days.map((d) => `<tr><td>${fmtD(d.date, { weekday: 'short', day: 'numeric' })}</td><td>${d.intake == null ? '—' : sign(d.dIntake)}</td><td>${sign(d.dBurn)}</td><td class="${d.net > 50 ? 'up' : d.net < -50 ? 'dn' : ''}">${sign(d.net)}</td></tr>`).join('')}
      </tbody></table><p class="fine">Net = extra food − extra burn vs the base plan. Unlogged days aren’t guessed.</p></details>` : ''}
    </div>
    <div class="card f-targets">
      <p class="label">Today’s plan</p>
      <ul>
        <li><span>Eat</span><b>${n0(t.kcal)} kcal</b></li>
        <li><span>Protein · Carbs · Fat</span><b>${n0(t.p)} · ${n0(t.c)} · ${n0(t.f)} g</b></li>
        <li><span>Fibre · Water</span><b>${n0(t.fib)} g · ${t.water} L</b></li>
        <li><span>Steps</span><b>${n0(t.steps)}</b></li>
        <li><span>Strength</span><b>${g.workoutMin} min</b></li>
        <li><span>Incline walk</span><b>${t.cardioMin} min · ${g.cardioKmh} km/h · ${g.cardioGrade}%</b></li>
      </ul>
      <p class="fine">Maintenance ≈ ${n0(base.tdee)} kcal · goal balance ${base.balance > 0 ? '+' : ''}${n0(base.balance)} kcal/day${P.adjT ? ` · auto-calibrated ${P.adjT > 0 ? '+' : ''}${P.adjT}` : ''}</p>
    </div>
  </div>
  <form class="card f-log" data-form="log">
    <div class="f-loghead"><div><p class="label">Check-in</p><h3>What actually happened</h3></div><span class="fine">Saves as you type</span></div>
    <p class="f-sub">Meals from ${WD[F.weekdayIdx(view)]}’s diet plan</p>
    <div class="f-meals">${meals.map((s) => { const o = s.options.find((x) => x.id === wdPlan[s.id]) ?? s.options[0]; const ref = `${s.id}:${o.id}`; const on = (log.meals ?? []).some((m) => m.startsWith(s.id + ':'));
      const used = on ? optionOf((log.meals ?? []).find((m) => m.startsWith(s.id + ':'))!) ?? o : o;
      return `<label class="f-meal${on ? ' on' : ''}"><input type="checkbox" name="meal" value="${on ? esc((log.meals ?? []).find((m) => m.startsWith(s.id + ':'))) : ref}" ${on ? 'checked' : ''}><span class="ck" aria-hidden="true"></span><span class="mn"><i>${s.name}</i>${esc(used.name)}</span><span class="mk">${n0(used.kcal)} kcal · ${n0(used.p)} g P</span></label>`; }).join('')}</div>
    <p class="f-sub">Anything else you ate</p>
    <div class="f-grid4">${inp('extraKcal', 'kcal', log.extraKcal)}${inp('extraP', 'protein g', log.extraP)}${inp('extraC', 'carbs g', log.extraC)}${inp('extraF', 'fat g', log.extraF)}</div>
    <p class="f-sub">Movement & recovery</p>
    <div class="f-grid4">
      ${inp('steps', fromJournal ? 'steps · from journal' : 'steps', log.steps ?? journalSteps.get(view), '1')}
      ${inp('cardioMin', 'incline walk min', log.cardioMin)}${inp('workoutMin', 'strength min', log.workoutMin)}
      ${inp('water', 'water L', log.water, '0.25')}${inp('sleep', 'sleep h', log.sleep, '0.5')}${inp('weight', 'morning weight kg', log.weight, '0.05')}
    </div>
    <p class="fine">Tip: weigh yourself most mornings (after the loo, before food). After ~2 weeks the system learns your real maintenance calories.</p>
  </form>${NOTE}`;
}

// Morning weigh-in: the reminder lives here, plus progress toward calibrating real maintenance calories
function weighCard(w?: number) {
  let wi = 0, fd = 0; const dots: string[] = [];
  for (let i = F.CALIB.window - 1; i >= 0; i--) { const k = F.addDays(TODAY, -i); if (logOf(k)?.weight) wi++; if (eatenOn(k)) fd++; }
  for (let i = 6; i >= 0; i--) { const k = F.addDays(TODAY, -i); dots.push(`<i class="${logOf(k)?.weight ? 'on' : ''}" title="${fmtD(k, { weekday: 'short', day: 'numeric' })}"></i>`); }
  const adj = tdeeAdj(TODAY), ready = wi >= F.CALIB.weighIns && fd >= F.CALIB.foodDays;
  const prev = [1, 2, 3, 4, 5, 6, 7].map((i) => logOf(F.addDays(TODAY, -i))?.weight).filter(Boolean) as number[];
  const avg = prev.length ? prev.reduce((a, b) => a + b, 0) / prev.length : 0;
  const calib = ready ? `<p class="f-cal ok">✓ Calibrated from your real weight trend${adj ? ` · maintenance ${adj > 0 ? '+' : ''}${adj} kcal vs formula` : ' · formula matches you'}</p>`
    : `<div class="f-cal"><div class="h"><span>Learning your real maintenance</span><span>${Math.min(wi, F.CALIB.weighIns)}/${F.CALIB.weighIns} weigh-ins · ${Math.min(fd, F.CALIB.foodDays)}/${F.CALIB.foodDays} food days</span></div>
       <div class="tr"><span style="width:${(Math.min(wi / F.CALIB.weighIns, fd / F.CALIB.foodDays, 1)) * 100}%"></span></div></div>`;
  return `<form class="card f-weigh${w ? ' done' : ''}" data-form="weigh" autocomplete="off">
    <div class="wl">
      <p class="label">Morning weigh-in</p>
      ${w ? `<h3>Weighed <em>✓</em> ${n1(w)} kg</h3><p class="fine">${avg ? `${w - avg >= 0 ? '+' : '−'}${n1(Math.abs(w - avg))} kg vs your 7-day average — daily swings of ±1 kg are just water.` : 'Same time tomorrow.'}</p>`
        : `<h3>Step on the scale <em>before breakfast.</em></h3><p class="fine">After the loo, before food or water — same time every day.</p>`}
      <div class="f-dots" aria-label="Weigh-ins in the last 7 days">${dots.join('')}<span>last 7 days</span></div>
    </div>
    <div class="wr">${w ? '' : `<label class="f-in"><input type="number" inputmode="decimal" step="0.05" min="20" max="250" name="weight" placeholder="kg"><span>today’s weight</span></label><button class="btn primary sm" type="submit">Save</button>`}</div>
    ${calib}
  </form>`;
}
const sign = (v: number) => `${v > 0 ? '+' : v < 0 ? '−' : ''}${n0(Math.abs(v))}`;
const inp = (name: string, label: string, v?: number, step = '1') => `<label class="f-in"><input type="number" inputmode="decimal" min="0" step="${step}" name="${name}" value="${v ?? ''}" placeholder="—"><span>${label}</span></label>`;

// ---------------- PLAN ----------------
function renderPlan(root: HTMLElement) {
  const all = scans();
  if (!all.length) return (root.innerHTML = locked('Your 90-day plan', 'Goals are built from your latest body scan — realistic, safe, and split into 30-day phases.'));
  const s = all[all.length - 1], g = goal();
  if (!g || editingGoal) return renderGoalForm(root, s, g);
  const m = F.goalMath(g, s0(g)), issues = F.validateGoal(g, s0(g)), end = F.addDays(g.start, g.days);
  const first = s0(g), phases = Math.ceil(g.days / 30);
  const lerp = (a: number, b: number, f: number) => a + (b - a) * f;
  const checkins = Array.from({ length: Math.floor(g.days / 14) }, (_, i) => F.addDays(g.start, (i + 1) * 14));
  const planPts = (fn: (f: number) => number) => [0, 1].map((f) => ({ x: F.addDays(g.start, f * g.days), y: fn(f) }));
  const weightActual = [...all.filter((x) => x.date >= F.addDays(g.start, -45)).map((x) => ({ x: x.date, y: x.weight }))];
  const P = plan(TODAY), ex = P ? F.incline(P.kg, g.cardioKmh, g.cardioGrade) : null;
  root.innerHTML = `
  <div class="card f-goal">
    <div class="f-loghead"><div><p class="label">${({ recomp: 'Recomposition', cut: 'Fat loss', bulk: 'Lean bulk' } as Record<GoalType, string>)[g.type]} · ${g.days} days</p>
      <h2>${fmtD(g.start, { day: 'numeric', month: 'short' })} → ${fmtD(end, { day: 'numeric', month: 'short', year: 'numeric' })}</h2></div>
      <button class="btn ghost sm" data-act="edit-goal">Edit goal</button></div>
    <div class="f-delta">
      ${delta('Weight', first.weight, g.targetWeight, ' kg')}${delta('Body fat', first.fatPct, g.targetFatPct, '%')}${delta('Fat mass', F.fatMassOf(first), m.fatT, ' kg')}${delta('Muscle (SMM)', first.smm, g.targetSmm, ' kg')}
    </div>
    <ul class="f-issues">${issues.map((i) => `<li class="${i.level}">${esc(i.msg)}</li>`).join('')}</ul>
  </div>
  <div class="f-phases">${Array.from({ length: phases }, (_, i) => { const a = i * 30, b = Math.min(g.days, (i + 1) * 30), f = b / g.days, now = F.diffDays(g.start, TODAY);
    return `<div class="card f-phase${now >= a && now < b ? ' cur' : ''}"><p class="label">Phase ${i + 1}${now >= a && now < b ? ' · now' : ''}</p><h3>${fmtD(F.addDays(g.start, a))} – ${fmtD(F.addDays(g.start, b - 1))}</h3>
      <ul><li><span>Weight</span><b>${n1(lerp(first.weight, g.targetWeight, f))} kg</b></li><li><span>Body fat</span><b>${n1(lerp(first.fatPct, g.targetFatPct, f))}%</b></li><li><span>SMM</span><b>${n1(lerp(first.smm, g.targetSmm, f))} kg</b></li></ul></div>`; }).join('')}</div>
  <div class="f-two">
    <div class="card">${spark(weightActual, planPts((f) => lerp(first.weight, g.targetWeight, f)), ' kg', 'Weight · plan vs actual')}</div>
    <div class="card">${spark(all.filter((x) => x.date >= F.addDays(g.start, -45)).map((x) => ({ x: x.date, y: x.fatPct })), planPts((f) => lerp(first.fatPct, g.targetFatPct, f)), '%', 'Body fat · plan vs actual')}</div>
  </div>
  <div class="card f-check"><p class="label">Scan check-ins · every 2 weeks</p><div class="f-chips">${checkins.map((d) => { const done = all.some((x) => Math.abs(F.diffDays(x.date, d)) <= 3); return `<span class="${done ? 'done' : d < TODAY ? 'miss' : ''}">${done ? '✓ ' : ''}${fmtD(d)}</span>`; }).join('')}</div>
    <p class="fine">Same scale, same time (morning, empty stomach) — so the numbers are comparable.</p></div>
  ${P && ex ? `<details class="card f-how"><summary><span class="label">How it’s calculated</span><span>Your numbers, step by step</span></summary>
    <ol>
      <li><b>Fat-free mass</b> = ${n1(P.kg)} − ${n1((P.kg * P.s.fatPct) / 100)} fat = <b>${n1(P.kg * (1 - P.s.fatPct / 100))} kg</b></li>
      <li><b>BMR</b> (Katch-McArdle) = 370 + 21.6 × FFM = <b>${n0(P.base.bmr)} kcal</b>${P.s.bmr ? ` · scale says ${n0(P.s.bmr)}` : ''}</li>
      <li><b>Steps</b> ≈ 0.5 kcal × ${n1(P.kg)} kg × km (0.75 m stride, treadmill steps not double-counted)</li>
      <li><b>Incline walk</b> (ACSM): VO₂ = 0.1·S + 1.8·S·G + 3.5 = ${n1(ex.vo2)} ml/kg/min → ${n1(ex.net)} kcal/min above rest (${n1(ex.mets)} METs) → ${g.cardioMin} min ≈ <b>${n0(ex.net * g.cardioMin)} kcal</b></li>
      <li><b>Strength</b> ≈ 3.5 MET × ${n1(P.kg)} kg × ${g.workoutMin} min ≈ <b>${n0(F.liftKcal(g.workoutMin, P.kg))} kcal</b></li>
      <li><b>Maintenance</b> = (BMR × 1.1 + activity ${n0(P.base.burn)}) ÷ 0.9 (food digestion ~10%) = <b>${n0(P.base.tdee)} kcal</b>${P.adjT ? ` (includes ${P.adjT > 0 ? '+' : ''}${P.adjT} from your real weight trend)` : ''}</li>
      <li><b>Goal balance</b> = (fat change × 7,700 + lean change × 1,800) ÷ ${g.days} days = <b>${n0(P.base.balance)} kcal/day</b></li>
      <li><b>Macros</b>: protein ${g.type === 'cut' ? 2.2 : g.type === 'recomp' ? 2.0 : 1.8} g/kg · fat ≥ 0.8 g/kg (≥25% kcal) · carbs = the rest · fibre 14 g per 1,000 kcal</li>
      <li><b>Rebalancing</b>: last 7 days vs plan, spread over 3–7 days, capped at ±200 kcal food, +2,000 steps, +10 min walk per day. Older misses are forgiven.</li>
    </ol>
    <p class="fine">Why incline walking: low impact, easy to recover from (doesn’t steal from leg day) and doable daily. Fat loss itself comes from the weekly calorie balance — the walk just makes that balance easier.</p></details>` : ''}
  ${NOTE}`;
}
const s0 = (g: Goal) => { const all = scans(); return [...all].reverse().find((x) => x.date <= g.start) ?? all[all.length - 1]; };
const delta = (label: string, a: number, b: number, unit: string) => `<div><p class="label">${label}</p><p class="f-ab"><span>${n1(a)}</span><i>→</i><b>${n1(b)}${unit}</b></p><p class="fine">${b - a >= 0 ? '+' : '−'}${n1(Math.abs(b - a))}${unit}</p></div>`;

function renderGoalForm(root: HTMLElement, s: Scan, g: Goal | null) {
  const type = (g?.type ?? 'recomp') as GoalType;
  const cur = g ?? F.suggestGoal(s, type, F.addDays(TODAY, 1));
  root.innerHTML = `<form class="card f-goalform" data-form="goal">
    <p class="label">${g ? 'Edit goal' : 'Set your goal'}</p><h2>What are the next ${cur.days} days for?</h2>
    <div class="f-types">${([['recomp', 'Recomposition', 'Lose fat, build muscle, weight ~same. Best for an aesthetic V-shape at your level.'], ['cut', 'Fat loss', 'Lean out faster; muscle kept, not built.'], ['bulk', 'Lean bulk', 'Small surplus, more muscle, a little fat.']] as const)
      .map(([v, t, d]) => `<label class="f-type"><input type="radio" name="type" value="${v}" ${cur.type === v ? 'checked' : ''}><span><b>${t}${v === 'recomp' ? ' <em>recommended</em>' : ''}</b><i>${d}</i></span></label>`).join('')}</div>
    <div class="f-grid4">
      <label class="f-in"><input type="date" name="start" value="${cur.start}"><span>start</span></label>
      <label class="f-in"><select name="days">${[30, 60, 90].map((d) => `<option ${cur.days === d ? 'selected' : ''}>${d}</option>`).join('')}</select><span>days</span></label>
      <span></span><button type="button" class="btn ghost sm" data-act="suggest">✦ Suggest realistic targets</button>
    </div>
    <p class="f-sub">Targets — from ${n1(s.weight)} kg · ${n1(s.fatPct)}% · SMM ${n1(s.smm)} kg (scan ${fmtD(s.date)})</p>
    <div class="f-grid4">${inp('targetWeight', 'target weight kg', cur.targetWeight, '0.1')}${inp('targetFatPct', 'target body fat %', cur.targetFatPct, '0.1')}${inp('targetSmm', 'target SMM kg', cur.targetSmm, '0.1')}</div>
    <p class="f-sub">Daily training</p>
    <div class="f-grid4">${inp('stepGoal', 'steps / day', cur.stepGoal, '500')}${inp('workoutMin', 'strength min', cur.workoutMin, '5')}${inp('cardioMin', 'incline walk min', cur.cardioMin, '5')}${inp('cardioKmh', 'speed km/h', cur.cardioKmh, '0.1')}${inp('cardioGrade', 'incline %', cur.cardioGrade, '0.5')}</div>
    <ul class="f-issues" data-issues></ul>
    <div class="f-row"><button class="btn primary" data-act="save-goal">Save goal</button>${g ? '<button type="button" class="btn ghost" data-act="cancel-goal">Cancel</button>' : ''}</div>
  </form>${NOTE}`;
  checkGoal(root);
}
function readGoal(form: HTMLFormElement): Goal {
  const f = new FormData(form);
  return {
    type: (f.get('type') as GoalType) || 'recomp', start: String(f.get('start') || TODAY), days: Number(f.get('days')) || 90,
    targetWeight: num(f.get('targetWeight')) ?? 0, targetFatPct: num(f.get('targetFatPct')) ?? 0, targetSmm: num(f.get('targetSmm')) ?? 0,
    stepGoal: num(f.get('stepGoal')) ?? 10000, workoutMin: num(f.get('workoutMin')) ?? 60, cardioMin: num(f.get('cardioMin')) ?? 30,
    cardioKmh: num(f.get('cardioKmh')) ?? 4, cardioGrade: num(f.get('cardioGrade')) ?? 15,
  };
}
function checkGoal(root: HTMLElement) {
  const form = $('form[data-form="goal"]', root) as HTMLFormElement | null; if (!form) return;
  const g = readGoal(form), s = scans().at(-1)!, ul = $('[data-issues]', form)!;
  const issues = g.targetWeight && g.targetFatPct ? F.validateGoal(g, s) : [];
  const m = g.targetWeight ? F.goalMath(g, s) : null;
  ul.innerHTML = issues.map((i) => `<li class="${i.level}">${esc(i.msg)}</li>`).join('') + (m ? `<li class="info">Implies fat ${m.dFat >= 0 ? '+' : ''}${n1(m.dFat)} kg · lean ${m.dLean >= 0 ? '+' : ''}${n1(m.dLean)} kg · ${m.balance >= 0 ? '+' : ''}${n0(m.balance)} kcal/day vs maintenance</li>` : '');
  ($('[data-act="save-goal"]', form) as HTMLButtonElement).disabled = issues.some((i) => i.level === 'error');
}

// ---------------- DIET ----------------
const SAMPLE: Macros = { kcal: 2300, p: 120, c: 300, f: 65, fib: 32 };
function dietTargets(dayIdx: string) {
  const isToday = dayIdx === String(F.weekdayIdx(TODAY));
  const P = plan(TODAY);
  if (!P) return { t: SAMPLE, sample: true, adjusted: false };
  return { t: isToday ? P.t : P.base, sample: false, adjusted: isToday && (P.L.adj.kcal !== 0 || P.L.adj.protein !== 0) };
}
function ensureWeek() {
  const w = week();
  if (Object.keys(w).length === 7) return w;
  const out: Week = {}; let prev: Record<string, string> = {};
  for (let i = 0; i < 7; i++) { const { t } = dietTargets(String(i)); out[i] = w[i] ?? F.buildDay(meals, t, 7919 * (i + 3), prev); prev = out[i]; }
  set(K.week, out);
  return out;
}
function renderDiet(root: HTMLElement) {
  const w = ensureWeek(), day = w[dietDay], { t, sample, adjusted } = dietTargets(dietDay);
  const chosen = meals.map((s) => s.options.find((o) => o.id === day[s.id]) ?? s.options[0]);
  const tot = F.sumMacros(chosen), tags = new Map<string, number>();
  chosen.forEach((o) => (o.tags ?? []).forEach((x) => tags.set(x, (tags.get(x) ?? 0) + 1)));
  const todayIdx = String(F.weekdayIdx(TODAY));
  root.innerHTML = `
  <div class="f-dayhead"><div><p class="label">Pure veg · dairy · Indian</p><h2>Fuel, <em>planned.</em></h2></div>
    <div class="f-row"><button class="btn ghost sm" data-act="build-day">✦ Build my day</button><button class="btn ghost sm" data-act="build-week">Rebuild week</button></div></div>
  <div class="f-wd" role="tablist" aria-label="Day of week">${WD.map((d, i) => `<button role="tab" aria-selected="${String(i) === dietDay}" data-act="wd" data-i="${i}">${d}${String(i) === todayIdx ? '<i></i>' : ''}</button>`).join('')}</div>
  <div class="card f-totals">
    <div class="f-loghead"><p class="label">${sample ? 'Sample targets — your own appear once your goal is set' : dietDay === todayIdx ? `Today’s targets${adjusted ? ' · rebalanced' : ''}` : 'Base targets'}</p><span class="fine">${n0(tot.kcal)} / ${n0(t.kcal)} kcal</span></div>
    <div class="f-bars">${bar('Calories', tot.kcal, t.kcal, '')}${bar('Protein', tot.p, t.p)}${bar('Carbs', tot.c, t.c)}${bar('Fat', tot.f, t.f)}${bar('Fibre', tot.fib, t.fib, 'g', true)}</div>
    ${tot.p < t.p * 0.95 ? `<p class="fine">Short ${n0(t.p - tot.p)} g protein — add a glass of milk (8 g), 100 g hung curd (10 g) or 50 g paneer (9 g).</p>` : ''}
  </div>
  <div class="f-slots">${meals.map((s) => { const o = s.options.find((x) => x.id === day[s.id]) ?? s.options[0];
    return `<div class="card f-slot"><div class="st"><span class="tm">${s.time}</span><span class="sn">${s.name}</span></div>
      <label class="f-pick"><select data-act="swap" data-slot="${s.id}" aria-label="${s.name} option">${s.options.map((x) => `<option value="${x.id}" ${x.id === o.id ? 'selected' : ''}>${esc(x.name)}</option>`).join('')}</select></label>
      <p class="pt">${esc(o.portion)}</p>
      <p class="mc"><b>${n0(o.kcal)}</b> kcal <span>P ${n1(o.p)}</span><span>C ${n1(o.c)}</span><span>F ${n1(o.f)}</span><span>Fib ${n1(o.fib)}</span></p>
      ${o.tags?.length ? `<p class="tg">${o.tags.map((x) => `<i>${micros.find((m) => m.tag === x)?.name.replace('Vitamin ', 'Vit ') ?? x}</i>`).join('')}</p>` : ''}</div>`; }).join('')}</div>
  <div class="f-two">
    <div class="card f-micro"><p class="label">Vitamins & minerals · ${WD[+dietDay]}</p><ul>${micros.map((m) => { const c = tags.get(m.tag) ?? 0;
      return `<li class="${c >= 2 ? 'ok' : c === 1 ? 'mid' : 'low'}"><span class="dot"></span><div><b>${m.name}</b> <em>${c ? `${c} source${c > 1 ? 's' : ''}` : 'not covered'}</em><p>${esc(c ? m.note : m.food + '. ' + m.note)}</p></div></li>`; }).join('')}</ul></div>
    <div class="card f-supp"><p class="label">Supplements</p>
      <ul>
        <li><b>Whey protein</b><span>Post-workout, already in the plan. Food first; whey just fills the gap.</span></li>
        <li><b>Creatine monohydrate</b><span>3–5 g daily, any time, no loading needed. Drink enough water.</span></li>
        <li><b>B12 · Vitamin D · Omega-3 (algae)</b><span>Only if a blood test shows you’re low — common for vegetarians. Ask a doctor.</span></li>
      </ul>
      <p class="fine">Tick what you actually ate in <button class="f-link" data-act="go-today">Today’s check-in</button> — it feeds the rebalancing.</p></div>
  </div>${NOTE}`;
}

// ---------------- BODY ----------------
const FIELDS: [keyof Scan, string, string, boolean | null][] = [
  // key, label, unit, lowerIsBetter (null = neutral)
  ['weight', 'Weight', 'kg', null], ['bmi', 'BMI', '', false], ['fatPct', 'Body fat', '%', true], ['fatMass', 'Fat mass', 'kg', true],
  ['smm', 'Skeletal muscle', 'kg', false], ['lean', 'Lean mass', 'kg', false], ['visceral', 'Visceral fat', 'lv', true], ['water', 'Body water', '%', false],
  ['bmr', 'BMR', 'kcal', false], ['bodyAge', 'Body age', 'y', true], ['bone', 'Bone mass', 'kg', false],
];
function renderBody(root: HTMLElement) {
  const all = scans(), last = all.at(-1), first = all[0];
  const form = `<details class="card f-add" ${all.length ? '' : 'open'}><summary><span class="label">Add a scan</span><span>Copy the numbers from your smart-scale app</span></summary>
    <form data-form="scan" class="f-grid4">
      <label class="f-in"><input type="date" name="date" value="${TODAY}" max="${TODAY}" required><span>date</span></label>
      ${FIELDS.map(([k, l, u]) => `<label class="f-in"><input type="number" inputmode="decimal" step="0.01" min="0" name="${k}" ${['weight', 'fatPct', 'smm'].includes(k) ? 'required' : ''} placeholder="—"><span>${l.toLowerCase()}${u ? ' ' + u : ''}</span></label>`).join('')}
      <button class="btn primary" data-act="add-scan">Save scan</button>
    </form></details>`;
  const data = `<div class="card f-data"><div><p class="label">Your data</p><p class="fine">Lives only in this browser. Export a backup now and then, and import it on your phone.</p></div>
    <div class="f-row"><button class="btn ghost sm" data-act="export">Export backup</button><label class="btn ghost sm f-file">Import<input type="file" accept="application/json" data-act="import" hidden></label></div>
    <details class="f-chg"><summary>Change passcode</summary><form data-form="pass" class="f-grid4" autocomplete="off">
      <label class="f-in"><input type="password" name="cur" required autocomplete="current-password"><span>current</span></label>
      <label class="f-in"><input type="password" name="n1" minlength="6" required autocomplete="new-password"><span>new · 6+</span></label>
      <label class="f-in"><input type="password" name="n2" minlength="6" required autocomplete="new-password"><span>repeat new</span></label>
      <button class="btn primary sm" type="submit">Change</button><p class="f-err" role="alert"></p></form></details></div>`;
  if (!last) return (root.innerHTML = locked('Body reports', 'Scan history, trends and progress since your first measurement.', false) + form + data);
  const dAgo = F.diffDays(last.date, TODAY);
  root.innerHTML = `
  <div class="f-dayhead"><div><p class="label">Latest scan · ${fmtD(last.date, { day: 'numeric', month: 'long', year: 'numeric' })}${dAgo > 14 ? ` · ${dAgo} days ago — time for a new one` : ''}</p><h2>Body, <em>measured.</em></h2></div></div>
  <div class="f-stats">${FIELDS.filter(([k]) => last[k] != null).map(([k, l, u, low]) => { const val = (x: Scan) => (k === 'fatMass' ? F.fatMassOf(x) : (x[k] as number | undefined)); const a = val(first), b = val(last)!; const d = a != null && first !== last ? b - a : 0; const good = d === 0 || low === null ? '' : (d < 0) === low ? 'good' : 'bad';
    return `<div class="f-stat"><p class="label">${l}</p><b>${n1(b)}<small>${u}</small></b>${d ? `<span class="${good}">${d > 0 ? '↑' : '↓'} ${n1(Math.abs(d))} since ${fmtD(first.date, { month: 'short', year: '2-digit' })}</span>` : '<span>&nbsp;</span>'}</div>`; }).join('')}</div>
  <div class="f-sparks">
    <div class="card">${spark(all.map((x) => ({ x: x.date, y: x.weight })), [], ' kg', 'Weight')}</div>
    <div class="card">${spark(all.map((x) => ({ x: x.date, y: x.fatPct })), [], '%', 'Body fat')}</div>
    <div class="card">${spark(all.map((x) => ({ x: x.date, y: x.smm })), [], ' kg', 'Skeletal muscle')}</div>
    <div class="card">${spark(all.map((x) => ({ x: x.date, y: F.fatMassOf(x) })), [], ' kg', 'Fat mass')}</div>
  </div>
  <div class="card f-hist"><p class="label">History</p><div class="f-tbl"><table><thead><tr><th>Date</th><th>Weight</th><th>Fat %</th><th>Fat kg</th><th>SMM</th><th>Water</th><th></th></tr></thead><tbody>
    ${[...all].reverse().map((x) => `<tr><td>${fmtD(x.date, { day: 'numeric', month: 'short', year: '2-digit' })}</td><td>${n1(x.weight)}</td><td>${n1(x.fatPct)}</td><td>${n1(F.fatMassOf(x))}</td><td>${n1(x.smm)}</td><td>${x.water != null ? n1(x.water) : '—'}</td><td><button class="f-x" data-act="del-scan" data-d="${x.date}" aria-label="Delete scan ${x.date}">×</button></td></tr>`).join('')}
  </tbody></table></div></div>
  ${form}${data}`;
}

// ---------------- events ----------------
const roots = { today: $('[data-fit="today"]'), plan: $('[data-fit="plan"]'), diet: $('[data-fit="diet"]'), body: $('[data-fit="body"]') };
function render() {
  if (!mem) {
    Object.values(roots).forEach((r) => r && (r.innerHTML = lockCard()));
    return;
  }
  const keep = document.activeElement as HTMLInputElement | null, name = keep?.name, form = keep?.closest('form')?.dataset.form;
  if (roots.today) renderToday(roots.today);
  if (roots.plan) renderPlan(roots.plan);
  if (roots.diet) renderDiet(roots.diet);
  if (roots.body) renderBody(roots.body);
  Object.values(roots).forEach((r) => r?.insertAdjacentHTML('afterbegin', lockBar()));
  if (name && form) { const el = document.querySelector(`form[data-form="${form}"] [name="${name}"]`) as HTMLInputElement | null; if (el && el.type !== 'checkbox') { el.focus(); try { const v = el.value; el.value = ''; el.value = v; } catch {} } }
}
const goTab = (t: string) => (document.querySelector(`[data-tab="${t}"]`) as HTMLElement | null)?.click();

function exportData() {
  if (!mem) return;
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify({ app: 'ascent-fit', v: 1, exported: TODAY, data: mem }, null, 2)], { type: 'application/json' }));
  a.download = `ascent-fit-${TODAY}.json`; a.click(); URL.revokeObjectURL(a.href);
}
async function readBackup(file: File): Promise<Record<string, unknown>> {
  const j = JSON.parse(await file.text()), data = j?.data ?? j;
  const out: Record<string, unknown> = {};
  Object.keys(data).filter((k) => k.startsWith('fit:') && k !== VAULT).forEach((k) => (out[k] = data[k]));
  if (!Object.keys(out).length) throw new Error('no fit data');
  return out;
}
async function importData(file: File) {
  if (!mem) return;
  try {
    const data = await readBackup(file);
    if (!confirm(`Import ${Object.keys(data).length} items? Matching items will be replaced.`)) return;
    Object.assign(mem, data); persist(); render();
  } catch { alert('That file doesn’t look like an Ascent fitness backup.'); }
}

// ---------------- lock ----------------
let tries = 0, waitUntil = 0, lockMsg = '';
function lockCard() {
  const v = vault(), wait = Math.max(0, Math.ceil((waitUntil - Date.now()) / 1000));
  if (!v) return `<form class="card f-lock f-vault" data-form="setup" autocomplete="off">
    <span class="f-lk" aria-hidden="true">🔐</span><p class="label">Private space</p><h2>Set a <em>passcode.</em></h2>
    <p class="lead">Body scans, goals and daily logs are encrypted on this device with your passcode (AES-256). Without it, nobody can open them — not even with developer tools.</p>
    <div class="f-pass">
      <label class="f-in"><input type="password" name="p1" minlength="6" required autocomplete="new-password" placeholder="••••••"><span>passcode · 6+ characters</span></label>
      <label class="f-in"><input type="password" name="p2" minlength="6" required autocomplete="new-password" placeholder="••••••"><span>repeat passcode</span></label>
    </div>
    <label class="f-in f-backup"><input type="file" name="backup" accept="application/json"><span>start from a backup file (optional)</span></label>
    ${lockMsg ? `<p class="f-err" role="alert">${esc(lockMsg)}</p>` : ''}
    <div class="f-row"><button class="btn primary" type="submit">Create & unlock</button></div>
    <p class="fine">There’s no “forgot passcode”. If you lose it, the data can’t be recovered — export a backup now and then.</p></form>`;
  return `<form class="card f-lock f-vault" data-form="unlock" autocomplete="off">
    <span class="f-lk" aria-hidden="true">🔒</span><p class="label">Private</p><h2>Locked.</h2>
    <p class="lead">Enter your passcode to open Today, Plan, Diet and Body.</p>
    <div class="f-pass one"><label class="f-in"><input type="password" name="p" required autocomplete="current-password" placeholder="••••••" ${wait ? 'disabled' : ''}><span>passcode</span></label>
      <button class="btn primary" type="submit" ${wait ? 'disabled' : ''}>${wait ? `Wait ${wait}s` : 'Unlock'}</button></div>
    ${lockMsg ? `<p class="f-err" role="alert">${esc(lockMsg)}</p>` : ''}
    <p class="fine">Encrypted on this device. <button type="button" class="f-link" data-act="reset-vault">Forgot it? Erase & start over</button></p></form>`;
}
const lockBar = () => `<div class="f-lockbar"><span>🔓 Unlocked · encrypted on this device</span><button type="button" class="f-link" data-act="lock">Lock</button></div>`;
function lockNow() { mem = null; vkey = null; editingGoal = false; lockMsg = ''; render(); }
async function unlock(form: HTMLFormElement) {
  if (Date.now() < waitUntil) return;
  const v = vault(); if (!v) return;
  const p = String(new FormData(form).get('p') || '');
  const btn = form.querySelector('button[type=submit]') as HTMLButtonElement; btn.disabled = true; btn.textContent = 'Unlocking…';
  try {
    const r = await unseal(p, v);
    mem = JSON.parse(r.text); vkey = { key: r.key, salt: r.salt, it: r.it }; tries = 0; lockMsg = ''; render();
  } catch {
    tries++; lockMsg = tries >= 5 ? 'Too many tries — wait 30 seconds.' : `Wrong passcode${tries >= 3 ? ` (${5 - tries} tries left before a pause)` : ''}.`;
    if (tries >= 5) { waitUntil = Date.now() + 30_000; tries = 0; setTimeout(() => { lockMsg = ''; render(); }, 30_500); }
    render(); (document.querySelector('.panel:not([hidden]) form[data-form="unlock"] input') as HTMLInputElement | null)?.focus();
  }
}
async function setup(form: HTMLFormElement) {
  const f = new FormData(form), p1 = String(f.get('p1') || ''), p2 = String(f.get('p2') || '');
  if (p1.length < 6) { lockMsg = 'Use at least 6 characters.'; return render(); }
  if (p1 !== p2) { lockMsg = 'The two passcodes don’t match.'; return render(); }
  let data: Record<string, unknown> = {};
  plainKeys().forEach((k) => { try { data[k] = JSON.parse(localStorage.getItem(k)!); } catch {} });
  const file = (form.elements.namedItem('backup') as HTMLInputElement).files?.[0];
  if (file) { try { data = { ...data, ...(await readBackup(file)) }; } catch { lockMsg = 'That backup file couldn’t be read.'; return render(); } }
  const salt = newSalt(), key = await deriveKey(p1, salt);
  vkey = { key, salt, it: ITER }; mem = data; lockMsg = '';
  localStorage.setItem(VAULT, JSON.stringify(await seal(key, salt, JSON.stringify(mem))));
  plainKeys().forEach((k) => localStorage.removeItem(k)); // no plaintext left behind
  render();
}
async function changePass(form: HTMLFormElement) {
  const f = new FormData(form), v = vault(), cur = String(f.get('cur') || ''), p1 = String(f.get('n1') || ''), p2 = String(f.get('n2') || '');
  const out = form.querySelector('.f-err') as HTMLElement;
  try { if (v) await unseal(cur, v); } catch { out.textContent = 'Current passcode is wrong.'; return; }
  if (p1.length < 6 || p1 !== p2) { out.textContent = p1.length < 6 ? 'Use at least 6 characters.' : 'New passcodes don’t match.'; return; }
  const salt = newSalt(); vkey = { key: await deriveKey(p1, salt), salt, it: ITER }; persist(); await chain;
  out.textContent = ''; alert('Passcode changed.'); render();
}
// auto-lock after 5 minutes in the background
let hiddenAt = 0;
document.addEventListener('visibilitychange', () => { if (document.hidden) hiddenAt = Date.now(); else if (mem && hiddenAt && Date.now() - hiddenAt > 5 * 60_000) lockNow(); });
document.addEventListener('submit', (e) => {
  const form = e.target as HTMLFormElement; if (!form.closest('[data-fit]')) return;
  const t = form.dataset.form;
  if (t === 'unlock' || t === 'setup' || t === 'pass') { e.preventDefault(); if (t === 'unlock') unlock(form); else if (t === 'setup') setup(form); else changePass(form); }
  else if (t === 'weigh') { e.preventDefault(); const w = num(new FormData(form).get('weight')); if (w && w > 20 && w < 250) saveLog(TODAY, { weight: w }); }
  else e.preventDefault();
});

document.addEventListener('click', (e) => {
  const el = (e.target as HTMLElement).closest('[data-act]') as HTMLElement | null; if (!el || !el.closest('[data-fit]')) return;
  const a = el.dataset.act;
  if (a === 'day') { view = F.addDays(view, +el.dataset.d!); if (view > TODAY) view = TODAY; render(); }
  else if (a === 'go-body') goTab('body');
  else if (a === 'go-plan') goTab('plan');
  else if (a === 'go-today') goTab('today');
  else if (a === 'edit-goal') { editingGoal = true; render(); }
  else if (a === 'cancel-goal') { editingGoal = false; render(); }
  else if (a === 'suggest') {
    e.preventDefault(); const form = el.closest('form') as HTMLFormElement, cur = readGoal(form), s = scans().at(-1)!;
    const sg = F.suggestGoal(s, cur.type, cur.start, cur.days);
    (['targetWeight', 'targetFatPct', 'targetSmm', 'cardioMin', 'cardioGrade'] as const).forEach((k) => ((form.elements.namedItem(k) as HTMLInputElement).value = String(sg[k])));
    checkGoal(roots.plan!);
  } else if (a === 'save-goal') {
    e.preventDefault(); const g = readGoal(el.closest('form') as HTMLFormElement);
    if (F.validateGoal(g, scans().at(-1)!).some((i) => i.level === 'error')) return;
    editingGoal = false; set(K.week, undefined); put(K.goal, g);
  } else if (a === 'add-scan') {
    e.preventDefault(); const form = el.closest('form') as HTMLFormElement; if (!form.reportValidity()) return;
    const f = new FormData(form), s: Scan = { date: String(f.get('date')), weight: 0, fatPct: 0, smm: 0 };
    FIELDS.forEach(([k]) => { const v = num(f.get(k as string)); if (v != null) (s as Record<string, unknown>)[k] = v; });
    put(K.scans, [...scans().filter((x) => x.date !== s.date), s]);
  } else if (a === 'del-scan') { if (confirm(`Delete the scan from ${el.dataset.d}?`)) put(K.scans, scans().filter((x) => x.date !== el.dataset.d)); }
  else if (a === 'export') exportData();
  else if (a === 'lock') lockNow();
  else if (a === 'reset-vault') {
    if (confirm('Erase ALL private fitness data on this device and start over? This cannot be undone.') && confirm('Really erase? Make sure you have a backup file.')) { localStorage.removeItem(VAULT); plainKeys().forEach((k) => localStorage.removeItem(k)); lockMsg = ''; render(); }
  }
  else if (a === 'wd') { dietDay = el.dataset.i!; render(); }
  else if (a === 'build-day') { const w = ensureWeek(); w[dietDay] = F.buildDay(meals, dietTargets(dietDay).t, Date.now() % 2147483646, w[dietDay]); put(K.week, w); }
  else if (a === 'build-week') { put(K.week, undefined); }
});
document.addEventListener('change', (e) => {
  const el = e.target as HTMLInputElement; if (!el.closest('[data-fit]')) return;
  if (el.dataset.act === 'import' && el.files?.[0]) return void importData(el.files[0]);
  if (el.dataset.act === 'pick' && el.value) { view = el.value > TODAY ? TODAY : el.value; return render(); }
  if (el.dataset.act === 'swap') { const w = ensureWeek(); w[dietDay] = { ...w[dietDay], [el.dataset.slot!]: el.value }; return put(K.week, w); }
  const form = el.closest('form') as HTMLFormElement | null;
  if (form?.dataset.form === 'log') {
    if (el.name === 'meal') {
      const cur = (logOf(view)?.meals ?? []).filter((m) => !m.startsWith(el.value.split(':')[0] + ':'));
      return saveLog(view, { meals: el.checked ? [...cur, el.value] : cur });
    }
    return saveLog(view, { [el.name]: num(el.value) } as Partial<DayLog>);
  }
  if (form?.dataset.form === 'goal') checkGoal(roots.plan!);
});
document.addEventListener('input', (e) => { const el = e.target as HTMLElement; if (el.closest('form[data-form="goal"]')) checkGoal(roots.plan!); });

render();
