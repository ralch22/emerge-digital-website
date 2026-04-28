/**
 * Content collection schemas.
 *
 * Case studies and insights live as MDX in `src/content/case-studies` and
 * `src/content/insights`. Tags are constrained to keep the filter UI stable.
 */
import { defineCollection, z } from 'astro:content';

const industries = ['Government', 'BFSI', 'Retail', 'Telco', 'Healthcare', 'Energy', 'Other'] as const;
const regions = ['UAE', 'KSA', 'Egypt', 'GCC', 'MEA', 'Global'] as const;
const capabilities = [
  'CX Strategy & Design',
  'MarTech & Customer Data Orchestration',
  'Commerce & Platform Development',
  'Digital Analytics & Data Science',
  'Data & Tag Governance',
  'Media & AdTech Excellence',
  'Enterprise GenAI',
  'AI for CX & Personalization',
  'AI Governance & Trust',
  'Application Modernization',
  'Cloud & Platform Engineering',
  'Managed Services & Run',
] as const;

const caseStudies = defineCollection({
  type: 'content',
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      summary: z.string(),
      // Top-line outcome shown on the card and as the H2 lede
      outcome: z.string(),
      industry: z.enum(industries),
      region: z.enum(regions),
      capabilities: z.array(z.enum(capabilities)),
      year: z.number().int().min(2018).max(2030),
      anonymized: z.boolean().default(true),
      client: z.string().optional(), // omit if anonymized
      hero: image().optional(),
      published: z.boolean().default(true),
    }),
});

const insightCategories = ['Vision 2030 Brief', 'Capability POV', 'Report'] as const;

const insights = defineCollection({
  type: 'content',
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      summary: z.string(),
      author: z.string().default('Rami — Founder, Emerge Digital'),
      publishDate: z.coerce.date(),
      category: z.enum(insightCategories),
      tags: z.array(z.string()).default([]),
      hero: image().optional(),
      gated: z.boolean().default(false),
      readingMinutes: z.number().int().optional(),
      published: z.boolean().default(true),
    }),
});

export const collections = {
  'case-studies': caseStudies,
  insights,
};
