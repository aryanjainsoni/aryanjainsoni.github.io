// BUCKET LIST book — the name on the cover lives HERE only (change it in one place).
// The wishes themselves are private: they are never in this repo, only encrypted in the browser.
export const BOOK = {
  dev: 'रहस्य',            // Devanagari title on the cover
  title: 'Rahasya',        // English title
  subtitle: 'The Sealed Pages',
  author: 'Aryan Jain',
  oath: 'Things I will do before I am done.',
};

// kinds of wishes + a small hand-drawn icon (24×24 stroke paths)
export const CATS: { id: string; label: string; icon: string }[] = [
  { id: 'travel', label: 'Travel', icon: '<circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2"/>' },
  { id: 'adventure', label: 'Adventure', icon: '<path d="M3 19l6-10 4 6 3-4 5 8z"/><path d="M9 9l1.5-2.5L12 9"/>' },
  { id: 'skills', label: 'Skills', icon: '<path d="M19 4c-6 1-11 6-12 13l-2 3"/><path d="M19 4c-1 5-4 9-9 11"/><path d="M8 13h5"/>' },
  { id: 'career', label: 'Career', icon: '<rect x="3.5" y="7.5" width="17" height="11" rx="1.5"/><path d="M9 7.5V5.5h6v2M3.5 12.5h17"/>' },
  { id: 'fitness', label: 'Fitness', icon: '<path d="M6.5 8v8M17.5 8v8M4 10v4M20 10v4M6.5 12h11"/>' },
  { id: 'people', label: 'People', icon: '<circle cx="9" cy="9" r="3"/><circle cx="16.5" cy="10" r="2.5"/><path d="M3.5 19c.6-3.2 3-5 5.5-5s4.9 1.8 5.5 5M14 15c2.6-.6 5.6.6 6.5 4"/>' },
  { id: 'money', label: 'Money', icon: '<ellipse cx="12" cy="7" rx="7" ry="3"/><path d="M5 7v5c0 1.7 3.1 3 7 3s7-1.3 7-3V7M5 12v5c0 1.7 3.1 3 7 3s7-1.3 7-3v-5"/>' },
  { id: 'experiences', label: 'Experiences', icon: '<path d="M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.5 6.7 19.4l1.2-6L3.4 9.3l6-.7z"/>' },
  { id: 'other', label: 'Other', icon: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="2"/>' },
];
