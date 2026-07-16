/**
 * The named ecosystem properties, each with its own funnel link.
 * URLs and copy per docs/ecosystem-north-star.md — do NOT claim "runs on VaultOS", no pricing.
 * Consumed by EcosystemFilm.astro (landing grid) and the styleguide.
 */
const utm = '?utm_source=vision&utm_medium=cta&utm_campaign=ecosystem';

export interface EcosystemProperty {
  title: string;
  badge: string;
  body: string;
  proof?: string;
  href: string;
}

export const ecosystemProperties: EcosystemProperty[] = [
  {
    title: 'Agentforce practice',
    badge: 'Practice',
    body: 'Human-led, governed Agentforce delivery for Gulf Government and BFSI — Agentforce that earns its keep.',
    href: `https://future.emergedigital.com${utm}`,
  },
  {
    title: 'Vela OS',
    badge: 'Live',
    body: 'The live ROAI command center — governance cadence, named KPIs, and run-state operations in one view.',
    href: `https://roai.emergedigital.ae${utm}`,
  },
  {
    title: 'VaultOS',
    badge: 'Product',
    body: 'Knowledge your agents can run on — OKF-compliant, governed, agent-ready.',
    proof: 'Emerge runs its own operations on it: 327+ documents across 6 businesses.',
    href: `https://vault.emergedigital.com${utm}`,
  },
  {
    title: 'Emerge Dev Pods',
    badge: 'Service',
    body: 'An agent dev-team your seniors sign off on — every PR reviewed, every merge earned.',
    proof: 'Emerge runs its own delivery on it: 11 repositories under one governed orchestration daemon.',
    href: `https://pods.emergedigital.com${utm}`,
  },
];
