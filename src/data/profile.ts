// Aryan ke baare mein saari jaankari — ek hi jagah.
// Home, About aur Index teeno yahin se padhte hain. Kuch naya add karna ho to yahan karo.
//
// DATES (timeline ke liye): har item par
//   date:    '2015' | '2015-06' | '2015-06-21'   (jitna pata ho)
//   dateEnd: '2016' ya 'now'                      (agar ek time-period hai)
//   approx:  true                                  (agar date lagbhag hai → "c. 2015" dikhega)
// Date na ho to item "Undated" mein jaata hai.

export type When = { date?: string; dateEnd?: string; approx?: boolean };

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const one = (d: string) => {
  const [y, m, day] = d.split('-');
  if (day) return `${Number(day)} ${MONTHS[Number(m) - 1]} ${y}`;
  if (m) return `${MONTHS[Number(m) - 1]} ${y}`;
  return y;
};
// "2014–2016", "Feb 2025", "2024–now", "c. 2015"
export const formatWhen = (w: When) => {
  if (!w.date) return '';
  const end = w.dateEnd ? `–${w.dateEnd === 'now' ? 'now' : one(w.dateEnd)}` : '';
  return `${w.approx ? 'c. ' : ''}${one(w.date)}${end}`;
};
// Sorting key: '2015' -> '2015-00-00' (saal ki shuruaat)
export const sortKey = (w: When) => {
  if (!w.date) return '';
  const [y, m = '00', d = '00'] = w.date.split('-');
  return `${y}-${m}-${d}`;
};

export const education = [
  { title: 'B.Tech, Computer Science & IT', meta: 'Ajeenkya DY Patil University · 2024–2028', date: '2024', dateEnd: '2028' },
  { title: 'Class XII', meta: 'St. Joseph Convent School · 2023', date: '2023' },
  { title: 'Class X', meta: 'St. Joseph Convent School · 2021', date: '2021' },
];

export const experience: ({ title: string; meta: string } & When)[] = [
  { title: 'Aletheia AI', meta: 'Contributed at an early-stage startup' }, // TODO: date poochni hai
  { title: 'Internships', meta: 'Journey starting — documented here from day one.' },
];

export const skills: Record<string, string[]> = {
  Languages: ['C++', 'Python', 'Java', 'SQL'],
  'Web & Tools': ['HTML/CSS', 'Git & GitHub', 'Streamlit', 'Canva'],
  'AI / ML': ['scikit-learn', 'pandas', 'CNN', 'Machine Learning'],
  'CS Core': ['DSA', 'OOP', 'DBMS', 'MySQL'],
};

export const certificates = [
  { name: 'Java Concepts', by: 'Infosys Springboard', when: 'Feb 2025', date: '2025-02' },
  { name: 'Java Essentials', by: 'Infosys Springboard', when: 'Feb 2025', date: '2025-02' },
];

// approx dates class se nikali hain (Class X = 2021): class 4–5 ≈ 2014–16, class 7–9 ≈ 2017–20
export const beyond: ({ icon: string; title: string; text: string } & When)[] = [
  { icon: '🧮', title: 'Abacus', text: 'Learned in class 4–5, certified.', date: '2014', dateEnd: '2016', approx: true },
  { icon: '🥇', title: 'School sports', text: 'Consistently first in school sports, with many certificates.' }, // TODO: date
  { icon: '⚽', title: 'Football', text: 'Played in class 7–9; our team won tournaments and was featured in the newspaper.', date: '2017', dateEnd: '2020', approx: true },
  { icon: '🎨', title: 'Drawing', text: 'Drawing since childhood; my drawings were published in newspapers.' }, // TODO: date
  { icon: '🏊', title: 'Swimming', text: 'Recently learned to swim.', date: '2026', approx: true },
  { icon: '🏋️', title: 'Gym', text: 'Training consistently since last year.', date: '2025', dateEnd: 'now', approx: true },
];

export const campus: ({ title: string; meta: string } & When)[] = [
  { title: '2nd place, carrom tournament', meta: 'Impetus 2024, ADYPU', date: '2024' },
  { title: "Organised the 'Treasure Hunt' competition", meta: '#Tech2025, ADYPU', date: '2025' },
  { title: '3D printing workshop', meta: 'ADYPU' }, // TODO: date
  { title: 'Volunteer at #Tech', meta: 'ADYPU' }, // TODO: date
];

// Home par "Chapters" — zindagi ke hisse
export const chapters: ({ n: string; title: string; line: string } & When)[] = [
  { n: '01', title: 'Abacus', line: 'Class 4–5. Where numbers first clicked — and a certificate to prove it.', date: '2014', dateEnd: '2016', approx: true },
  { n: '02', title: 'Sport', line: 'First on sports day, again and again. A drawer full of certificates.' }, // TODO: date
  { n: '03', title: 'Football', line: 'Class 7–9. Tournament winners — our photo made the newspaper.', date: '2017', dateEnd: '2020', approx: true },
  { n: '04', title: 'Art', line: 'Drawing since I can remember. Published in print.' }, // TODO: date
  { n: '05', title: 'Code', line: 'B.Tech CSE at ADYPU. C++, Python, Java — and DSA, daily.', date: '2024', dateEnd: 'now' },
  { n: '06', title: 'AI', line: 'Vedantu AI course, ML projects, a model that hits 96.5%.', date: '2026', dateEnd: 'now', approx: true },
  { n: '07', title: 'Body', line: 'Gym since last year. Swimming, just learned. Discipline travels.', date: '2025', dateEnd: 'now', approx: true },
];

export const projects = [
  {
    n: '01', kind: 'ML · Team of 3', name: 'Breast Cancer Prediction', year: '2026', date: '2026',
    line: 'Classifies tumours as benign or malignant. I owned the repo, the fixes and the deployment.',
    tags: ['Python', 'scikit-learn', 'pandas', 'Plotly', 'Streamlit', 'PCA', 'SHAP', 'Machine Learning'],
    stats: [['96.5%', 'accuracy'], ['100%', 'precision'], ['95.1%', 'F1-score'], ['569', 'records']],
    links: [['Live demo', 'https://breastcancer-gk.streamlit.app/'], ['Code', 'https://github.com/aryanjainsoni/Breast_cancer_Prediction_model']],
    art: ['#ff8a3d', '#ff2e7e'],
  },
  {
    n: '02', kind: 'Product design · SRS', name: 'MentorLoop', year: '2025', date: '2025',
    line: 'An AI-enabled smart campus: QR attendance, timetables, notes, real-time chat and push alerts.',
    tags: ['SRS', 'DFD', 'ER diagram', 'Use-case', 'System design', 'AI'],
    stats: [['QR', 'attendance'], ['Live', 'chat'], ['SRS', 'DFD · ER · Use-case'], ['2025', 'year']],
    links: [],
    art: ['#962fbf', '#ff4d8d'],
  },
  {
    n: '03', kind: 'System concept · SRS', name: 'Thermal Security System', year: '2025', date: '2025',
    line: 'Thermal imaging + neural networks to catch suspicious activity and hazards, with instant alerts.',
    tags: ['ANN', 'Anomaly detection', 'Image processing', 'SRS', 'System design'],
    stats: [['ANN', 'detection'], ['SMS', 'email alerts'], ['SRS', 'architecture'], ['2025', 'year']],
    links: [],
    art: ['#f9844a', '#7a2fbf'],
  },
];

// Daily / weekly goals — Habit Tracker (Google Sheet) se.
// Privacy: medicine aur supplements ki detail jaan-boojh kar public site par nahi.
// DEFAULT goals — public. Page par "Edit goals" se aap ise apne browser mein badal sakte ho
// (naam, time, din, naye goals). Wo personal list sirf aapke browser mein rehti hai — public nahi.
// time: 24-hour "HH:MM" (Reminders sheet se). days: weekly ke liye ['mon'..'sun'], khaali = any day.
export const goals = {
  daily: [
    { id: 'd-study-session', name: 'Study session', cat: 'Study' },
    { id: 'd-vedantu-lecture', name: 'Vedantu lecture', cat: 'Study', time: '19:30' },
    { id: 'd-1-leetcode-question', name: '1 LeetCode question', cat: 'Study' },
    { id: 'd-github-commit', name: 'GitHub commit', cat: 'Study' },
    { id: 'd-internship-learning', name: 'Internship learning', cat: 'Study' },
    { id: 'd-linkedin-activity', name: 'LinkedIn activity', cat: 'Study' },
    { id: 'd-gym', name: 'Gym', cat: 'Health', time: '17:30' },
    { id: 'd-diet-plan-followed', name: 'Diet plan followed', cat: 'Health' },
    { id: 'd-protein-creatine', name: 'Protein & creatine', cat: 'Health', time: '18:30' },
    { id: 'd-supplements', name: 'Supplements', cat: 'Health', time: '09:15' },
    { id: 'd-skin-care', name: 'Skin care', cat: 'Health', time: '22:00' },
    { id: 'd-108-jain-mala', name: '108 Jain mala', cat: 'Mind', time: '06:30' },
    { id: 'd-journal-entry', name: 'Journal entry (Daily Log)', cat: 'Mind', time: '22:15' },
    { id: 'd-fun-time', name: 'Fun time', cat: 'Mind' },
  ],
  weekly: [
    { id: 'w-wash-clothes', name: 'Wash clothes', days: [], target: 1 },
    { id: 'w-change-pillow-cover', name: 'Change pillow cover', days: [], target: 1 },
    { id: 'w-hair-oiling', name: 'Hair oiling', days: ['wed', 'sun'], target: 2, time: '20:00' },
    { id: 'w-call-friends-relatives', name: 'Call friends / relatives', days: ['sun'], target: 1, time: '18:00' },
    { id: 'w-face-neck-pack', name: 'Face + neck pack', days: [], target: 1 },
  ],
};
