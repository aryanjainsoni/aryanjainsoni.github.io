// Journal entries se streak, totals aur heatmap ka data nikalta hai.
import { getCollection, type CollectionEntry } from 'astro:content';

export type Entry = CollectionEntry<'journal'>;

// Date ko "2026-11-27" jaisa string banao (UTC mein, taaki timezone se din na badle)
export const dayKey = (d: Date) => d.toISOString().slice(0, 10);

// "Aaj" India ke time se (GitHub ka server UTC mein chalta hai)
export const todayIST = () =>
  new Date(new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }));

export async function getEntries(): Promise<Entry[]> {
  const all = await getCollection('journal');
  return all.sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

// Kisi bhi "active days" list se current aur longest streak
export function streaks(activeDays: Iterable<string>, today = todayIST()) {
  const set = new Set(activeDays);
  const days = [...set].sort();
  let longest = 0;
  let run = 0;
  let prev = 0;
  for (const k of days) {
    const t = new Date(k).getTime();
    run = prev && t - prev === 86_400_000 ? run + 1 : 1;
    longest = Math.max(longest, run);
    prev = t;
  }
  // Aaj se peeche ginti (aaj abhi kuch nahi kiya to kal se — streak tab tak zinda hai)
  const cursor = new Date(dayKey(today));
  if (!set.has(dayKey(cursor))) cursor.setUTCDate(cursor.getUTCDate() - 1);
  let current = 0;
  while (set.has(dayKey(cursor))) {
    current++;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return { current, longest };
}

// Jitna zyada likha, utna gehra rang (1–4)
function level(entry: Entry) {
  const words = (entry.body ?? '').split(/\s+/).filter(Boolean).length;
  if (words < 80) return 1;
  if (words < 160) return 2;
  if (words < 300) return 3;
  return 4;
}

export function getStats(entries: Entry[]) {
  const byDay = new Map<string, number>();
  for (const e of entries) {
    const k = dayKey(e.data.date);
    byDay.set(k, Math.max(byDay.get(k) ?? 0, level(e)));
  }
  const dsa = entries.reduce((sum, e) => sum + e.data.dsaSolved, 0);
  return { byDay, total: byDay.size, dsa, ...streaks(byDay.keys()) };
}
