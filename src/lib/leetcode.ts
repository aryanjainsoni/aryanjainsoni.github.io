// Site build hote waqt LeetCode se aapka public data laata hai.
// Note: ye LeetCode ka unofficial endpoint hai. Fail ho jaye to null milega
// aur site bina LeetCode section ke bhi theek se banegi.
import { site } from '../data/site';

export type LeetCode = {
  solved: { all: number; easy: number; medium: number; hard: number };
  activeDays: number;
  byDay: Map<string, number>; // "2026-11-27" -> us din ke submissions
};

const QUERY = `query($u: String!, $y: Int) {
  matchedUser(username: $u) {
    submitStatsGlobal { acSubmissionNum { difficulty count } }
    userCalendar(year: $y) { submissionCalendar }
  }
}`;

async function ask(year: number) {
  const res = await fetch('https://leetcode.com/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Referer: 'https://leetcode.com' },
    body: JSON.stringify({ query: QUERY, variables: { u: site.leetcode, y: year } }),
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`LeetCode HTTP ${res.status}`);
  const json = await res.json();
  if (!json?.data?.matchedUser) throw new Error('LeetCode user not found');
  return json.data.matchedUser;
}

let cached: Promise<LeetCode | null> | undefined;

export function getLeetCode() {
  cached ??= (async () => {
    try {
      const year = new Date().getUTCFullYear();
      const [now, last] = await Promise.all([ask(year), ask(year - 1)]);
      const byDay = new Map<string, number>();
      for (const user of [last, now]) {
        const cal = JSON.parse(user.userCalendar?.submissionCalendar ?? '{}') as Record<string, number>;
        for (const [ts, n] of Object.entries(cal)) {
          byDay.set(new Date(Number(ts) * 1000).toISOString().slice(0, 10), n);
        }
      }
      const count = (d: string) =>
        now.submitStatsGlobal.acSubmissionNum.find((x: any) => x.difficulty === d)?.count ?? 0;
      return {
        solved: { all: count('All'), easy: count('Easy'), medium: count('Medium'), hard: count('Hard') },
        activeDays: byDay.size,
        byDay,
      };
    } catch (err) {
      console.warn('[leetcode] skipped:', (err as Error).message);
      return null;
    }
  })();
  return cached;
}

// Submissions ki ginti -> rang ki gehraai (1–4)
export const leetLevel = (n: number) => (n >= 6 ? 4 : n >= 4 ? 3 : n >= 2 ? 2 : n > 0 ? 1 : 0);
