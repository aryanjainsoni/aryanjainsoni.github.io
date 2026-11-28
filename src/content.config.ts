// Yahan batate hain ki har content (jaise Journal entry) mein kaun-kaun si cheezein hongi.
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const journal = defineCollection({
  // src/content/journal/ ki har .md file ek entry hai. File ka naam = date (2026-11-27.md)
  loader: glob({ pattern: '**/*.md', base: './src/content/journal' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    tags: z.array(z.string()).default([]),
    dsaSolved: z.number().int().min(0).default(0),
    steps: z.number().int().min(0).optional(), // Daily Log -> Gym page steps chart
  }),
});

// GYM NOTEBOOK — har chapter ek file: src/content/guide/NN-naam.md (naya chapter = nayi file).
// visual: src/components/GuideVisual.astro mein jo chart/diagram ka naam hai (optional)
const guide = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/guide' }),
  schema: z.object({
    n: z.number(),                       // chapter number (order)
    title: z.string(),
    icon: z.string(),                    // emoji
    summary: z.string(),                 // one-line takeaway
    updated: z.coerce.date(),            // last time this chapter changed
    visual: z.string().optional(),
    caption: z.string().optional(),
    sources: z.array(z.object({ title: z.string(), url: z.string() })).default([]),
  }),
});

export const collections = { journal, guide };
