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

// Jitna zyada likha, utna gehra green (1–4)
function level(entry: Entry) {
  const words = (entry.body ?? '').split(/\s+/).filter(Boolean).length;
  if (words < 80) return 1;
  if (words < 160) return 2;
  if (words < 300) return 3;
  return 4;
}

export function getStats(entries: Entry[], today = todayIST()) {
  const byDay = new Map<string, number>();
  for (const e of entries) {
    const k = dayKey(e.data.date);
    byDay.set(k, Math.max(byDay.get(k) ?? 0, level(e)));
  }

  const days = [...byDay.keys()].sort();
  let longest = 0;
  let run = 0;
  let prev: Date | null = null;
  for (const k of days) {
    const d = new Date(k);
    run = prev && d.getTime() - prev.getTime() === 86_400_000 ? run + 1 : 1;
    longest = Math.max(longest, run);
    prev = d;
  }

  // Current streak: aaj (ya kal, agar aaj ki entry abhi nahi likhi) se peeche ginti
  const todayKey = dayKey(today);
  const cursor = new Date(todayKey);
  if (!byDay.has(todayKey)) cursor.setUTCDate(cursor.getUTCDate() - 1);
  let current = 0;
  while (byDay.has(dayKey(cursor))) {
    current++;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }

  const dsa = entries.reduce((sum, e) => sum + e.data.dsaSolved, 0);
  return { byDay, total: byDay.size, current, longest, dsa };
}
