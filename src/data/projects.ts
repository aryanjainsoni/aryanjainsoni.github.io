// PROJECTS page (/projects/) — har project ek "folder".
// Folder ke andar ke documents: src/content/projects/<slug>/*.md (har file ek padhne layak page).
// Naya project = yahan ek entry + src/content/projects/<slug>/ folder.
// status: 'live' (chal raha hai) · 'building' (kaam chal raha hai) · 'archived'
// tone: folder ka rang — [cover colour, tab/edge colour]

export type ProjectFolder = {
  slug: string;
  name: string;
  line: string;          // one-line description on the folder
  kind: string;          // small label: "Web app", "Deep learning"…
  status: 'live' | 'building' | 'archived';
  since?: string;        // 'YYYY-MM-DD' — only when Aryan has confirmed the date
  tags: string[];
  links?: [string, string][];
  tone: [string, string];
};

export const folders: ProjectFolder[] = [
  {
    slug: 'ascent',
    name: 'Ascent',
    line: 'This website — a lifelong, offline-first record of learning, training and building. Specs, design and tests.',
    kind: 'Web app · Astro',
    status: 'live',
    since: '2026-11-27', // first commit of the repo
    tags: ['Astro 7', 'TypeScript', 'React islands', 'Web Crypto', 'PWA', 'GitHub Pages'],
    links: [['Live site', 'https://aryanjainsoni.github.io'], ['Code', 'https://github.com/aryanjainsoni/aryanjainsoni.github.io']],
    tone: ['#3b2a22', '#c2552f'],
  },
  {
    slug: 'parkinsons',
    name: "Parkinson's Disease Detection",
    line: 'Spots signs of Parkinson’s in hand-drawn spirals and waves — a scratch CNN vs VGG16 vs ResNet50, explained with Grad-CAM.',
    kind: 'Deep learning · Vision',
    status: 'building',
    tags: ['Python', 'TensorFlow / Keras', 'CNN', 'VGG16', 'ResNet50', 'Grad-CAM', 'Gradio'],
    tone: ['#1f3330', '#5fa39a'],
  },
];
