// DAILY LOG — the questions the /log/ form asks every day.
// Form ko badalna ho to bas yahan sawaal jodo / hatao / badlo — page apne aap update ho jayega.
//
// type:   'text' (one line) | 'long' (paragraph) | 'list' (one item per line) | 'rate' (1–5) |
//         'choice' (pick one) | 'number'
// out:    entry ke kis section mein jaayega: 'meta' (top line) | 'learned' | 'did' | 'reflect' | 'tomorrow'
// prefix: bullet ke aage kya likha jaaye, e.g. "Vedantu AI: ..."
// tag:    answer diya to ye tag entry mein jud jaata hai
// private: true -> sirf aapke browser mein save, journal entry (public) mein NAHI jaata

export type Q = {
  id: string; label: string; hint?: string; type: 'text' | 'long' | 'list' | 'rate' | 'choice' | 'number';
  options?: string[]; out: 'meta' | 'learned' | 'did' | 'reflect' | 'tomorrow' | 'none';
  prefix?: string; tag?: string; required?: boolean; private?: boolean; unit?: string;
};
export type Section = { id: string; title: string; intro: string; questions: Q[] };

export const dailyLog: Section[] = [
  {
    id: 'snapshot', title: 'Today in one line', intro: 'Start with the headline — it becomes the entry title.',
    questions: [
      { id: 'headline', label: 'Aaj ka headline', hint: 'e.g. "Binary search clicked + first push day"', type: 'text', out: 'meta', required: true },
      { id: 'mood', label: 'Mood', type: 'rate', out: 'meta' },
      { id: 'energy', label: 'Energy', type: 'rate', out: 'meta' },
      { id: 'sleep', label: 'Sleep last night', type: 'number', unit: 'hours', out: 'meta' },
    ],
  },
  {
    id: 'learn', title: 'Learn', intro: 'What went into your head today.',
    questions: [
      { id: 'vedantu', label: 'Vedantu AI — topic & key takeaway', hint: 'e.g. "Gradient descent — learning rate too high = overshoot"', type: 'long', out: 'learned', prefix: 'Vedantu AI', tag: 'ai' },
      { id: 'dsa', label: 'DSA / LeetCode — problems solved', hint: 'One per line: problem — pattern / idea', type: 'list', out: 'learned', prefix: 'DSA', tag: 'dsa' },
      { id: 'study', label: 'College / self-study', hint: 'Subject + what you covered', type: 'long', out: 'learned', prefix: 'Study', tag: 'study' },
      { id: 'internship', label: 'Internship / career learning', hint: 'Applications, a skill for a role, a mentor tip…', type: 'long', out: 'learned', prefix: 'Career', tag: 'internship' },
      { id: 'til', label: 'One thing I learned today', hint: 'The one line you want future-you to remember', type: 'long', out: 'learned', prefix: 'TIL', required: true },
    ],
  },
  {
    id: 'build', title: 'Build & share', intro: 'What you made or put out into the world.',
    questions: [
      { id: 'github', label: 'GitHub — what did you commit / build?', type: 'long', out: 'did', prefix: 'Built', tag: 'github' },
      { id: 'linkedin', label: 'LinkedIn', type: 'choice', options: ['Posted', 'Commented', 'Connected', 'Just read', 'Skipped'], out: 'did', prefix: 'LinkedIn', tag: 'linkedin' },
      { id: 'linkedinNote', label: 'LinkedIn — what about? (optional)', type: 'text', out: 'did', prefix: 'LinkedIn note' },
    ],
  },
  {
    id: 'body', title: 'Body', intro: 'Discipline beyond the screen.',
    questions: [
      { id: 'gym', label: 'Gym', type: 'choice', options: ['Push', 'Pull', 'Legs', 'Full body', 'Cardio', 'Rest day', 'Skipped'], out: 'did', prefix: 'Gym', tag: 'gym' },
      { id: 'gymNote', label: 'Workout highlight / PR (optional)', hint: 'e.g. "Bench 60kg × 8 — new PR"', type: 'text', out: 'did', prefix: 'Workout' },
      { id: 'swim', label: 'Swimming', type: 'choice', options: ['Swam', 'Not today'], out: 'did', prefix: 'Swimming', tag: 'swimming' },
      { id: 'diet', label: 'Diet plan', type: 'choice', options: ['On track', 'Mostly', 'Off track'], out: 'did', prefix: 'Diet' },
    ],
  },
  {
    id: 'reflect', title: 'Reflect', intro: 'Two minutes of honesty — this is what makes the journal yours.',
    questions: [
      { id: 'win', label: 'Biggest win today', type: 'long', out: 'reflect', prefix: 'Win' },
      { id: 'hard', label: 'What was hard / where I got stuck', type: 'long', out: 'reflect', prefix: 'Hard' },
      { id: 'grateful', label: 'Grateful for (private)', hint: 'Stays in this browser only — never published', type: 'text', out: 'none', private: true },
      { id: 'tomorrow', label: 'Tomorrow — top 3', hint: 'One per line', type: 'list', out: 'tomorrow' },
    ],
  },
];

export const repo = { owner: 'aryanjainsoni', name: 'aryanjainsoni.github.io', branch: 'main', dir: 'src/content/journal' };
