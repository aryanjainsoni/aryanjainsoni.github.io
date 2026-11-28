// Steps: Daily Log ka "Steps today" -> journal frontmatter `steps:` -> yahan se Gym page ke stats.
import { dayKey, streaks, todayIST, type Entry } from './journal';

export const KM_PER_STEP = 0.00075; // ~75 cm stride
export const KCAL_PER_STEP = 0.04;  // rough average

export function stepStats(entries: Entry[], goal: number) {
  const byDay = new Map<string, number>();
  for (const e of entries) if (typeof e.data.steps === 'number') byDay.set(dayKey(e.data.date), e.data.steps);
  const days = [...byDay].sort(([a], [b]) => a.localeCompare(b)).map(([d, n]) => ({ d, n }));

  const today = dayKey(todayIST());
  const last = days.at(-1);
  const total = days.reduce((s, x) => s + x.n, 0);
  const best = days.reduce<{ d: string; n: number } | null>((b, x) => (!b || x.n > b.n ? x : b), null);
  const hit = days.filter((x) => x.n >= goal);

  // last 7 calendar days (aaj samet) ka average — sirf logged din
  const since = new Date(today); since.setUTCDate(since.getUTCDate() - 6);
  const week = days.filter((x) => x.d >= dayKey(since));
  const avg7 = week.length ? Math.round(week.reduce((s, x) => s + x.n, 0) / week.length) : 0;

  // Mon..Sun average
  const wd = Array.from({ length: 7 }, () => ({ sum: 0, n: 0 }));
  for (const x of days) { const i = (new Date(x.d).getUTCDay() + 6) % 7; wd[i].sum += x.n; wd[i].n++; }
  const weekday = wd.map((w) => (w.n ? Math.round(w.sum / w.n) : 0));

  // Heatmap: 4 tiers
  const levels = new Map(days.map((x) => [x.d, x.n >= goal ? 4 : x.n >= goal * 0.75 ? 3 : x.n >= goal * 0.5 ? 2 : x.n > 0 ? 1 : 0]));
  const labels = new Map(days.map((x) => [x.d, `${x.n.toLocaleString('en-IN')} steps`]));

  return {
    days, today, last, total, best, avg7, weekday, levels, labels,
    goalDays: hit.length,
    goalStreak: streaks(hit.map((x) => x.d)),
    logStreak: streaks(days.map((x) => x.d)),
    km: total * KM_PER_STEP,
  };
}

// Lifetime distance milestones (km)
export const milestones = [
  { km: 5, name: 'A 5K run' },
  { km: 21.1, name: 'Half marathon' },
  { km: 42.2, name: 'Full marathon' },
  { km: 150, name: 'Pune → Mumbai' },
  { km: 590, name: 'Mumbai → Goa' },
  { km: 1420, name: 'Mumbai → Delhi' },
  { km: 3214, name: 'Kashmir → Kanyakumari' },
];
