import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  // Migration target: the site becomes the canonical emergedigital.com (replacing WordPress).
  // Drives the sitemap absolute URLs + the self-referencing canonical base. DO NOT deploy
  // until the .com cutover — on the live .ae site this would emit cross-domain canonicals.
  site: 'https://emergedigital.com',
  output: 'static',
  integrations: [
    tailwind({
      // We provide our own base styles in src/styles/global.css
      applyBaseStyles: false,
    }),
    mdx(),
    sitemap({
      // /styleguide is an internal component gallery — keep it out of the sitemap.
      filter: (page) => !page.includes('/styleguide'),
    }),
  ],
  build: {
    inlineStylesheets: 'auto',
  },
  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'viewport',
  },
});
