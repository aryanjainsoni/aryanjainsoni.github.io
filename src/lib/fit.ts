// FITNESS ENGINE — pure maths, no personal data in here.
// All personal numbers (scans, goal, daily logs) live ONLY in the browser's localStorage (keys "fit:*").
//
// Formulas (also shown on the page under "How it's calculated"):
//   BMR (Katch-McArdle)   = 370 + 21.6 × fat-free mass (kg)
//   Steps (NEAT)          ≈ 0.5 kcal × kg × km walked   (stride ≈ 0.75 m)
//   Incline walk (ACSM)   VO2 = 0.1·S + 1.8·S·G + 3.5  (S = m/min, G = grade) ; kcal/min = VO2 × kg / 1000 × 5
//   Strength training     ≈ 3.5 MET above rest × kg × hours
//   TDEE                  = (BMR × 1.1 + activity) / 0.9      (the /0.9 adds ~10% thermic effect of food)
//   1 kg body fat         ≈ 7,700 kcal ; 1 kg lean tissue ≈ 1,800 kcal

export type Scan = {
  date: string; weight: number; fatPct: number; fatMass?: number; smm: number; lean?: number;
  water?: number; visceral?: number; bmi?: number; bone?: number; bmr?: number; bodyAge?: number;
};
export type GoalType = 'recomp' | 'cut' | 'bulk';
export type Goal = {
  type: GoalType; start: string; days: number;
  targetWeight: number; targetFatPct: number; targetSmm: number;
  stepGoal: number; workoutMin: number; cardioMin: number; cardioKmh: number; cardioGrade: number;
};
export type DayLog = {
  date: string;
  meals?: string[];                       // diet slot ids ticked as eaten ("breakfast")
  extraKcal?: number; extraP?: number; extraC?: number; extraF?: number;
  steps?: number; cardioMin?: number; workoutMin?: number; water?: number; sleep?: number; weight?: number;
};
export type Macros = { kcal: number; p: number; c: number; f: number; fib: number };

export const KCAL_FAT = 7700, KCAL_LEAN = 1800, STEP_KM = 0.00075, BASE = 1.1, TEF = 0.1, LIFT_MET = 3.5;
export const HEIGHT_M = 1.70;

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
export const round = (v: number, d = 0) => { const k = 10 ** d; return Math.round(v * k) / k; };

// ---------- dates (IST) ----------
export const todayKey = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
export const addDays = (k: string, n: number) => { const d = new Date(k + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
export const diffDays = (a: string, b: string) => Math.round((Date.parse(b) - Date.parse(a)) / 864e5);
export const weekdayIdx = (k: string) => (new Date(k + 'T00:00:00Z').getUTCDay() + 6) % 7; // Mon = 0

// ---------- body ----------
export const fatMassOf = (s: Scan) => s.fatMass ?? (s.weight * s.fatPct) / 100;
export const ffmOf = (s: Scan) => s.weight - fatMassOf(s);
export const bmrOf = (s: Scan) => 370 + 21.6 * ffmOf(s);
export const bmiOf = (kg: number) => kg / HEIGHT_M ** 2;

// ---------- burn ----------
export function incline(kg: number, kmh: number, gradePct: number) {
  const S = (kmh * 1000) / 60, G = gradePct / 100;
  const vo2 = 0.1 * S + 1.8 * S * G + 3.5;
  return { vo2, mets: vo2 / 3.5, gross: (vo2 * kg) / 200, net: ((vo2 - 3.5) * kg) / 200 }; // kcal/min
}
export const stepsKcal = (steps: number, kg: number) => steps * STEP_KM * 0.5 * kg;
export const treadmillSteps = (min: number, kmh: number) => (min * kmh) / 60 / STEP_KM;
export const liftKcal = (min: number, kg: number) => (LIFT_MET * kg * min) / 60;

export type Activity = { steps: number; cardioMin: number; workoutMin: number; kmh: number; grade: number };
export function burn(a: Activity, kg: number) {
  // phone counts treadmill steps too -> don't count them twice
  const walk = Math.min(a.steps, treadmillSteps(a.cardioMin, a.kmh));
  const steps = stepsKcal(a.steps - walk, kg);
  const cardio = incline(kg, a.kmh, a.grade).net * a.cardioMin;
  const workout = liftKcal(a.workoutMin, kg);
  return { steps, cardio, workout, total: steps + cardio + workout };
}
export const tdeeOf = (bmr: number, activityKcal: number, adj = 0) => (bmr * BASE + activityKcal) / (1 - TEF) + adj;

// ---------- goals ----------
const RATES: Record<GoalType, { fat: number; smm: number }> = {
  // per 30 days (natural, intermediate lifter)
  recomp: { fat: -0.8, smm: 0.3 },
  cut: { fat: -1.3, smm: 0 },
  bulk: { fat: 0.4, smm: 0.5 },
};
export const LEAN_PER_SMM = 1.5; // fat-free mass rises ~1.5× SMM (water, organs, glycogen)

export function suggestGoal(s: Scan, type: GoalType, start: string, days = 90): Goal {
  const m = days / 30, r = RATES[type];
  const fat = Math.max(fatMassOf(s) + r.fat * m, s.weight * 0.08);
  const smm = s.smm + r.smm * m;
  const weight = ffmOf(s) + r.smm * m * LEAN_PER_SMM + fat;
  return {
    type, start, days,
    targetWeight: round(weight, 1), targetFatPct: round((fat / weight) * 100, 1), targetSmm: round(smm, 1),
    stepGoal: 10000, workoutMin: 60, cardioMin: type === 'bulk' ? 15 : 30, cardioKmh: 4, cardioGrade: type === 'bulk' ? 10 : 15,
  };
}

// Implied change + daily energy balance of a goal
export function goalMath(g: Goal, s: Scan) {
  const fatT = (g.targetWeight * g.targetFatPct) / 100;
  const dFat = fatT - fatMassOf(s);
  const dLean = g.targetWeight - fatT - ffmOf(s);
  const dSmm = g.targetSmm - s.smm;
  const balance = (dFat * KCAL_FAT + Math.max(0, dLean) * KCAL_LEAN + Math.min(0, dLean) * KCAL_LEAN) / g.days;
  return { fatT, dFat, dLean, dSmm, dWeight: g.targetWeight - s.weight, balance };
}

export type Issue = { level: 'error' | 'warn' | 'ok'; msg: string };
export function validateGoal(g: Goal, s: Scan): Issue[] {
  const m = goalMath(g, s), months = g.days / 30, weeks = g.days / 7;
  const out: Issue[] = [];
  const fatLossWk = -m.dFat / weeks;
  if (fatLossWk > s.weight * 0.01) out.push({ level: 'error', msg: `Fat loss of ${round(fatLossWk, 2)} kg/week is too fast — the safe limit is ~1% of bodyweight (${round(s.weight * 0.01, 2)} kg/week).` });
  else if (fatLossWk > s.weight * 0.0075) out.push({ level: 'warn', msg: `Fat loss of ${round(fatLossWk, 2)} kg/week is aggressive — muscle is at risk. 0.5–0.75%/week is kinder.` });
  const smmMo = m.dSmm / months;
  if (smmMo > 0.75) out.push({ level: 'error', msg: `+${round(smmMo, 2)} kg muscle/month isn't realistic naturally. Aim for 0.25–0.5 kg/month.` });
  else if (smmMo > 0.5) out.push({ level: 'warn', msg: `+${round(smmMo, 2)} kg muscle/month is optimistic. 0.25–0.5 kg/month is realistic.` });
  const leanMo = m.dLean / months;
  if (leanMo > 1.2) out.push({ level: 'error', msg: `Weight ${m.dWeight >= 0 ? '+' : ''}${round(m.dWeight, 1)} kg with fat ${round(m.dFat, 1)} kg means +${round(m.dLean, 1)} kg lean mass — not possible in ${g.days} days. Change one of them.` });
  if (m.dFat < 0 && m.dSmm > 0.4 * months) out.push({ level: 'warn', msg: 'Losing fat and gaining muscle fast at the same time rarely happens — recomposition is slow and steady.' });
  if (m.balance < -500) out.push({ level: 'error', msg: `That needs a ${Math.round(-m.balance)} kcal/day deficit. Max safe deficit here is 500 kcal/day.` });
  if (m.balance > 300) out.push({ level: 'error', msg: `That needs a ${Math.round(m.balance)} kcal/day surplus. Above ~300 kcal/day mostly adds fat.` });
  if (g.targetFatPct < 10) out.push({ level: 'error', msg: 'Below 10% body fat is hard to sustain and not needed for an aesthetic look.' });
  const bmi = bmiOf(g.targetWeight);
  if (bmi < 18.5 || bmi > 25) out.push({ level: 'warn', msg: `Target BMI would be ${round(bmi, 1)} (healthy range 18.5–25).` });
  if (g.cardioGrade > 15 || g.cardioKmh > 6.5) out.push({ level: 'warn', msg: 'Above 15% incline / 6.5 km/h, walking turns into a joint-heavy grind — keep it steady.' });
  if (!out.length) out.push({ level: 'ok', msg: 'Realistic and safe. Consistency will do the rest.' });
  return out;
}

// ---------- daily targets ----------
export type Targets = Macros & { bmr: number; tdee: number; burn: number; balance: number; steps: number; cardioMin: number; workoutMin: number; water: number };
export function baseTargets(g: Goal, s: Scan, kg: number, tdeeAdj = 0): Targets {
  const bmr = bmrOf({ ...s, weight: kg, fatMass: undefined, fatPct: s.fatPct });
  const act = burn({ steps: g.stepGoal, cardioMin: g.cardioMin, workoutMin: g.workoutMin, kmh: g.cardioKmh, grade: g.cardioGrade }, kg);
  const tdee = tdeeOf(bmr, act.total, tdeeAdj);
  const { balance } = goalMath(g, s);
  const kcal = Math.max(bmr, tdee + clamp(balance, -500, 300));
  return { ...macrosFor(kcal, kg, g.type), bmr, tdee, burn: act.total, balance, steps: g.stepGoal, cardioMin: g.cardioMin, workoutMin: g.workoutMin, water: round((35 * kg + (500 * (g.workoutMin + g.cardioMin)) / 60) / 1000, 1) };
}
export function macrosFor(kcal: number, kg: number, type: GoalType): Macros {
  const p = (type === 'cut' ? 2.2 : type === 'recomp' ? 2.0 : 1.8) * kg;
  const f = Math.max(0.8 * kg, (0.25 * kcal) / 9);
  const c = Math.max(0, (kcal - p * 4 - f * 9) / 4);
  return { kcal, p, c, f, fib: clamp((14 * kcal) / 1000, 30, 38) };
}

// ---------- adaptive ledger ----------
// Compare what was actually done (last 7 days) with the BASE plan. The outstanding balance is spread over
// the next 3–7 days within caps. Because it always compares with the base plan, a day that followed the
// adjusted plan automatically "pays back" — nothing is counted twice. Older than 7 days = forgiven.
export const CAPS = { kcal: 200, steps: 2000, cardio: 10, protein: 20 };
export type LedgerDay = { date: string; intake?: number; dIntake: number; dBurn: number; dProtein: number; net: number };
export type Ledger = {
  days: LedgerDay[]; net: number; protein: number; spread: number; forgiven: number;
  adj: { kcal: number; steps: number; cardio: number; protein: number; burnKcal: number };
};

export function eaten(log: DayLog | undefined, mealMacros: (slot: string) => Macros | undefined): Macros | undefined {
  if (!log) return undefined;
  const m = (log.meals ?? []).map(mealMacros).filter(Boolean) as Macros[];
  const has = m.length || log.extraKcal || log.extraP;
  if (!has) return undefined;
  const sum = m.reduce((a, b) => ({ kcal: a.kcal + b.kcal, p: a.p + b.p, c: a.c + b.c, f: a.f + b.f, fib: a.fib + b.fib }), { kcal: 0, p: 0, c: 0, f: 0, fib: 0 });
  return { kcal: sum.kcal + (log.extraKcal || 0), p: sum.p + (log.extraP || 0), c: sum.c + (log.extraC || 0), f: sum.f + (log.extraF || 0), fib: sum.fib };
}

export function ledger(opts: {
  today: string; goal: Goal; kg: number; base: Targets;
  logFor: (date: string) => DayLog | undefined; stepsFor: (date: string) => number | undefined;
  eatenFor: (date: string) => Macros | undefined;
}): Ledger {
  const { today, goal: g, kg, base } = opts;
  const days: LedgerDay[] = [];
  const startOk = (k: string) => k >= g.start;
  for (let i = 7; i >= 1; i--) {
    const k = addDays(today, -i);
    if (!startOk(k)) continue;
    const log = opts.logFor(k), food = opts.eatenFor(k), steps = opts.stepsFor(k) ?? log?.steps;
    if (!log && steps == null) continue; // not logged -> unknown, no guessing
    const actual = burn({ steps: steps ?? g.stepGoal, cardioMin: log?.cardioMin ?? g.cardioMin, workoutMin: log?.workoutMin ?? g.workoutMin, kmh: g.cardioKmh, grade: g.cardioGrade }, kg);
    const dIntake = food ? food.kcal - base.kcal : 0;
    const dBurn = actual.total - base.burn;
    const dProtein = food ? food.p - base.p : 0;
    days.push({ date: k, intake: food?.kcal, dIntake, dBurn, dProtein, net: dIntake - dBurn });
  }
  const net = days.reduce((s, d) => s + d.net, 0);
  const protein = Math.min(0, days.reduce((s, d) => s + d.dProtein, 0));
  const cardioPerMin = incline(kg, g.cardioKmh, g.cardioGrade).net, stepPer = stepsKcal(1, kg);

  let adj = { kcal: 0, steps: 0, cardio: 0, protein: 0, burnKcal: 0 }, spread = 3, forgiven = 0;
  if (net > 50) {
    // surplus vs plan -> burn a bit more + eat a bit less
    for (spread = 3; spread <= 7; spread++) {
      let need = net / spread;
      const cardio = Math.min(CAPS.cardio, Math.ceil((need * 0.4) / cardioPerMin));
      need -= cardio * cardioPerMin;
      const steps = Math.min(CAPS.steps, Math.ceil(Math.max(0, need * 0.3) / stepPer / 100) * 100);
      need -= steps * stepPer;
      const kcal = Math.min(CAPS.kcal, Math.max(0, need));
      need -= kcal;
      adj = { kcal: -Math.round(kcal), steps, cardio, protein: 0, burnKcal: Math.round(cardio * cardioPerMin + steps * stepPer) };
      if (need <= 1 || spread === 7) { forgiven = Math.max(0, Math.round(need * spread)); break; }
    }
  } else if (net < -50) {
    // deficit beyond plan -> eat it back gently (protects muscle). Activity is never reduced.
    spread = 3;
    const per = Math.min(CAPS.kcal, -net / spread);
    adj = { kcal: Math.round(per), steps: 0, cardio: 0, protein: 0, burnKcal: 0 };
    forgiven = Math.max(0, Math.round(-net - per * spread));
  }
  if (protein < -10) adj.protein = Math.round(Math.min(CAPS.protein, -protein / 3));
  return { days, net: Math.round(net), protein: Math.round(protein), spread, forgiven, adj };
}

// ---------- adaptive TDEE (weekly recalibration from real weight trend) ----------
// Needs ~2 weeks of data inside the last 21 days: morning weigh-ins + logged food.
export const CALIB = { weighIns: 12, foodDays: 12, window: 21 };
export function adaptiveTdee(points: { date: string; weight?: number; balance?: number }[]) {
  const w = points.filter((p) => p.weight != null) as { date: string; weight: number }[];
  const b = points.filter((p) => p.balance != null) as { date: string; balance: number }[];
  if (w.length < CALIB.weighIns || b.length < CALIB.foodDays || diffDays(w[0].date, w[w.length - 1].date) < 13) return { adj: 0, ready: false, slope: 0 };
  const xs = w.map((p) => diffDays(w[0].date, p.date)), ys = w.map((p) => p.weight);
  const mx = xs.reduce((a, c) => a + c, 0) / xs.length, my = ys.reduce((a, c) => a + c, 0) / ys.length;
  const slope = xs.reduce((a, x, i) => a + (x - mx) * (ys[i] - my), 0) / xs.reduce((a, x) => a + (x - mx) ** 2, 0); // kg/day
  const estBalance = b.reduce((a, p) => a + p.balance, 0) / b.length;
  // real expenditure = estimated + x  ->  estBalance - x = slope × 7700
  const x = estBalance - slope * KCAL_FAT;
  return { adj: Math.round(clamp(x * 0.5, -300, 300)), ready: true, slope };
}

// ---------- diet: pick one option per slot to hit targets ----------
export type Option = Macros & { id: string; name: string; portion: string; tags?: string[] };
export type Slot = { id: string; name: string; time: string; options: Option[] };

const score = (t: Macros, m: Macros) =>
  3 * ((m.kcal - t.kcal) / t.kcal) ** 2 + 5 * (Math.min(0, m.p - t.p) / t.p) ** 2 + ((m.p - t.p) / t.p) ** 2 +
  ((m.f - t.f) / t.f) ** 2 + ((m.c - t.c) / Math.max(t.c, 1)) ** 2 + (Math.max(0, t.fib - m.fib) / t.fib) ** 2;

export const sumMacros = (opts: Macros[]) => opts.reduce((a, b) => ({ kcal: a.kcal + b.kcal, p: a.p + b.p, c: a.c + b.c, f: a.f + b.f, fib: a.fib + b.fib }), { kcal: 0, p: 0, c: 0, f: 0, fib: 0 });

export function buildDay(slots: Slot[], t: Macros, seed: number, avoid: Record<string, string> = {}) {
  let r = seed % 2147483646 || 1; const rnd = () => ((r = (r * 16807) % 2147483647) / 2147483647);
  const total = (pick: Record<string, string>) => sumMacros(slots.map((s) => s.options.find((o) => o.id === pick[s.id])!));
  const cost = (pick: Record<string, string>) => score(t, total(pick)) + slots.reduce((a, s) => a + (avoid[s.id] === pick[s.id] ? 0.02 : 0), 0);
  let best: Record<string, string> = {}, bestCost = Infinity;
  for (let restart = 0; restart < 12; restart++) {
    // random start, then improve one slot at a time until nothing gets better
    const pick: Record<string, string> = {};
    slots.forEach((s) => (pick[s.id] = s.options[Math.floor(rnd() * s.options.length)].id));
    for (let pass = 0; pass < 8; pass++) {
      let improved = false;
      for (const s of [...slots].sort(() => rnd() - 0.5)) {
        let keep = pick[s.id], kc = cost(pick);
        for (const o of s.options) { pick[s.id] = o.id; const c = cost(pick); if (c < kc - 1e-9) { keep = o.id; kc = c; improved = true; } }
        pick[s.id] = keep;
      }
      if (!improved) break;
    }
    const c = cost(pick) + rnd() * 0.004; // tiny noise -> variety between equally good days
    if (c < bestCost) { best = { ...pick }; bestCost = c; }
  }
  return best;
}
