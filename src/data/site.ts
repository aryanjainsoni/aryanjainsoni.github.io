// Poori site ki common jaankari ek jagah. Yahan badlo, har page par update ho jayega.

export const site = {
  name: 'Aryan Jain',
  tagline: 'My journey, built in public — day by day.',
  role: 'B.Tech CSE @ ADYPU · AI/ML · C++ · Python',
  location: 'Pune, India',
};

export const links = [
  { label: 'GitHub', href: 'https://github.com/aryanjainsoni' },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/aryan-jain-a39137321' },
  { label: 'X', href: 'https://x.com/Aryanjainsoni' },
];

// ready: false wale sections abhi bane nahi hain — menu mein nahi dikhenge,
// Home par "coming soon" dikhenge. Jaise-jaise banenge, true kar denge.
export const sections = [
  { title: 'Journal', href: '/journal/', icon: '📓', desc: 'Daily log — what I learned, solved and practised today.', ready: true },
  { title: 'Notes', href: '/notes/', icon: '📚', desc: 'My handwritten notes as PDFs — college, AI course, languages.', ready: false },
  { title: 'Projects', href: '/projects/', icon: '🛠️', desc: 'Things I have built, with what I learned from each.', ready: false },
  { title: 'Achievements', href: '/achievements/', icon: '🏆', desc: 'Certificates — academics, sports, abacus, football, art.', ready: false },
  { title: 'Life Lab', href: '/life/', icon: '🏊', desc: 'Swimming, gym and diet — skills beyond the screen.', ready: false },
  { title: 'Internship Journey', href: '/internship/', icon: '🧭', desc: 'From zero: where I applied, what I did, what I learned.', ready: false },
  { title: 'Progress Report', href: '/progress/', icon: '📈', desc: 'Habit tracker charts — consistency, in numbers.', ready: false },
];

export const nav = [
  { label: 'Home', href: '/' },
  ...sections.filter((s) => s.ready).map((s) => ({ label: s.title, href: s.href })),
  { label: 'About', href: '/about/' },
];
