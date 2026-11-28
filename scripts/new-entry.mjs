// "npm run new" chalao -> aaj ki date ki nayi Journal file template ke saath ban jayegi.
import { existsSync, writeFileSync } from 'node:fs';

const d = new Date();
const pad = (n) => String(n).padStart(2, '0');
const date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const file = `src/content/journal/${date}.md`;

if (existsSync(file)) {
  console.log(`Aaj ki entry pehle se hai: ${file}`);
  process.exit(0);
}

writeFileSync(
  file,
  `---
title: "Aaj ka main topic yahan likho"
date: ${date}
tags: [dsa, ai]
---

## What I did today

- 

## What I learned

- 

## Tomorrow

- 
`
);
console.log(`Nayi entry ban gayi: ${file}`);
