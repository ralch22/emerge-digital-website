/**
 * outbound.ts — funnel-link helpers for the Vision corporate hub.
 *
 * The Vision site is the top of a three-property funnel. Outbound links that
 * push a reader onward to a sibling property must carry `utm_*` parameters so
 * the destination's analytics can attribute the visit back to Vision.
 *
 * Any component that links to `roai` or `future` (see issues #9 and #10) should
 * build its href with `funnelUrl()` rather than hardcoding a bare URL, so every
 * outbound funnel link is tagged consistently.
 *
 * NOTE: the destination origins below are PLACEHOLDERS pending the final
 * production URLs for the roai demo and the future property. Override them at
 * build time with the matching `PUBLIC_*` env vars when those are confirmed.
 */

/** Canonical sibling properties the Vision hub funnels traffic to. */
export const FUNNEL_DESTINATIONS = {
  /** roai — the live platform demo (issue #9: "See the platform live"). */
  roai:
    import.meta.env.PUBLIC_ROAI_URL ??
    'https://roai.emergedigital.ae', // PLACEHOLDER — confirm roai demo URL
  /** future — the Agentforce practice property (issue #10). */
  future:
    import.meta.env.PUBLIC_FUTURE_URL ??
    'https://future.emergedigital.ae', // PLACEHOLDER — confirm future URL
} as const;

export type FunnelTarget = keyof typeof FUNNEL_DESTINATIONS;

export interface UtmParams {
  /** utm_source — which property the click originated from. Default: `vision`. */
  source?: string;
  /** utm_medium — the channel. Default: `referral`. */
  medium?: string;
  /** utm_campaign — the campaign grouping. Default: `vision-hub`. */
  campaign?: string;
  /** utm_content — distinguishes links to the same destination (e.g. `hero-cta`). */
  content?: string;
  /** utm_term — optional keyword/term slot. */
  term?: string;
}

const DEFAULT_UTM: Required<Pick<UtmParams, 'source' | 'medium' | 'campaign'>> = {
  source: 'vision',
  medium: 'referral',
  campaign: 'vision-hub',
};

/**
 * Append `utm_*` parameters to an absolute URL, preserving any existing query
 * string. Existing utm params on the base URL are overwritten by the supplied
 * values so callers always get a predictable result.
 */
export function withUtm(base: string, params: UtmParams = {}): string {
  const url = new URL(base);
  url.searchParams.set('utm_source', params.source ?? DEFAULT_UTM.source);
  url.searchParams.set('utm_medium', params.medium ?? DEFAULT_UTM.medium);
  url.searchParams.set('utm_campaign', params.campaign ?? DEFAULT_UTM.campaign);
  if (params.content) url.searchParams.set('utm_content', params.content);
  if (params.term) url.searchParams.set('utm_term', params.term);
  return url.toString();
}

/**
 * Build a UTM-tagged URL to a named funnel destination.
 *
 * @example
 * funnelUrl('roai', { content: 'hero-cta' })
 * // → https://roai.emergedigital.ae/?utm_source=vision&utm_medium=referral&utm_campaign=vision-hub&utm_content=hero-cta
 */
export function funnelUrl(target: FunnelTarget, params: UtmParams = {}): string {
  return withUtm(FUNNEL_DESTINATIONS[target], params);
}
