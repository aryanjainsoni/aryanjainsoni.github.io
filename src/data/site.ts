// Poori site ki common jaankari ek jagah. Yahan badlo, har page par update ho jayega.

export const site = {
  name: 'Aryan Jain',
  tagline: 'Learning out loud — one day at a time.',
  role: 'B.Tech CSE @ ADYPU · AI/ML · C++ · Python',
  location: 'Pune, India',
  leetcode: 'aryanjainsoni',
  // Apni Habit Tracker Google Sheet ka link yahan paste karo (Share → Copy link). Khaali ho to button nahi dikhega.
  trackerUrl: 'https://docs.google.com/spreadsheets/d/1Q5VmpzsFNSOjB5v1Y_DjRDtLoPALP2hmfaOsLEB1GLg/edit?gid=1146949084#gid=1146949084',
  // Journey shuru hone ki date — isse "Day X" count hota hai
  startDate: '2026-11-27',
};

export const links = [
  { label: 'GitHub', href: 'https://github.com/aryanjainsoni' },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/aryan-jain27' },
  { label: 'LeetCode', href: 'https://leetcode.com/u/aryanjainsoni/' },
  { label: 'Instagram', href: 'https://www.instagram.com/aryanjainsoni/' },
  { label: 'X', href: 'https://x.com/Aryanjainsoni' },
  // ALTA student hub dashboard — login-only: logged-in user ko dashboard, baaki sabko login page
  { label: 'ALTA School of Technology', href: 'https://hub.altaschool.tech/#/dashboard' },
];

// Home par dikhne wale visual cards.
// - ready: false  -> "soon" dikhega (page abhi bana nahi)
// - photo: apni photo daalni ho to public/images/covers/<slug>.jpg rakh do — apne aap lag jayegi
// - art: jab tak photo nahi, ye gradient + emoji wala design dikhega
export const topics = [
  { slug: 'journal', title: 'Journal', line: 'Every day, written down.', href: '/journal/', ready: true, emoji: '📓', art: ['#ff7a45', '#ff3d7f'], size: 'wide' },
  { slug: 'dsa', title: 'DSA', line: 'LeetCode + Apex DSA, daily.', href: 'https://leetcode.com/u/aryanjainsoni/', ready: true, external: true, emoji: '🧩', art: ['#ffb347', '#ff6a3d'] },
  { slug: 'ai', title: 'AI Course', line: 'Vedantu AI — daily notes.', href: '/ai/', ready: false, emoji: '🤖', art: ['#8f5cff', '#ff4d8d'] },
  { slug: 'notes', title: 'Notes', line: 'Handwritten. Scanned. Shared.', href: '/notes/', ready: false, emoji: '📚', art: ['#ff9a8b', '#ff6a88'] },
  { slug: 'projects', title: 'Projects', line: "Things I've built.", href: '/projects/', ready: false, emoji: '🛠️', art: ['#f9844a', '#d64161'], size: 'wide' },
  { slug: 'achievements', title: 'Achievements', line: 'Certificates & wins.', href: '/achievements/', ready: false, emoji: '🏆', art: ['#ffd166', '#f78c35'] },
  { slug: 'football', title: 'Football', line: 'Tournament winners — in the newspaper.', href: '/football/', ready: false, emoji: '⚽', art: ['#43aa8b', '#f9c74f'] },
  { slug: 'art', title: 'Art', line: 'Drawings, published in print.', href: '/art/', ready: false, emoji: '🎨', art: ['#f15bb5', '#fee440'] },
  { slug: 'abacus', title: 'Abacus', line: 'Where numbers first clicked.', href: '/abacus/', ready: false, emoji: '🧮', art: ['#ff8fa3', '#c9184a'] },
  { slug: 'swimming', title: 'Swimming', line: 'New skill. Deep end.', href: '/swimming/', ready: false, emoji: '🏊', art: ['#4cc9f0', '#f72585'] },
  { slug: 'gym', title: 'Gym', line: 'Showing up since last year.', href: '/gym/', ready: false, emoji: '🏋️', art: ['#ff6b35', '#1a1a2e'] },
  { slug: 'internship', title: 'Internship', line: 'From zero — documented.', href: '/internship/', ready: false, emoji: '🧭', art: ['#f4a261', '#e76f51'], size: 'wide' },
  { slug: 'progress', title: 'Goals', line: 'Daily & weekly goals, ticked off.', href: '/goals/', ready: true, emoji: '🎯', art: ['#ff9e00', '#ff0054'] },
];

export const nav = [
  { label: 'Home', href: '/' },
  ...topics.filter((t) => t.ready && !t.external).map((t) => ({ label: t.title, href: t.href })),
  { label: 'Index', href: '/explore/' },
  { label: 'About', href: '/about/' },
];
