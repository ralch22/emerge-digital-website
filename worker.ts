/**
 * Cloudflare Worker entry point.
 *
 * Handles API routes then falls through to static assets for everything else.
 *
 * Required environment variables (Cloudflare Dashboard → Workers & Pages →
 * emerge-digital-website → Settings → Variables and Secrets):
 *   RESEND_API_KEY      — re_xxxx (key from resend.com)
 *   TO_EMAIL            — rami@emergedigital.com
 *   FROM_EMAIL          — noreply@site.emergedigital.com
 *   RESEND_AUDIENCE_ID  — Resend audience UUID for newsletter subscribers
 *   CAL_WEBHOOK_SECRET  — Cal.com webhook signing secret (verifies X-Cal-Signature-256)
 *   SF_CLIENT_ID        — Salesforce connected-app consumer key (client-credentials flow)
 *   SF_CLIENT_SECRET    — Salesforce connected-app consumer secret
 *   SF_LOGIN_URL        — Salesforce token host, e.g. https://your-domain.my.salesforce.com
 *   SF_API_VERSION      — optional, defaults to v60.0
 */
import { REDIRECTS, GONE_PREFIXES, GONE_RE } from './src/lib/redirects';
import {
  type CalWebhookBody,
  type MilestoneUpsertBody,
  buildUpsertBody,
  engagementIdFromMetadata,
  firstAttendeeEmail,
  isSupportedTrigger,
  soqlEscape,
  statusForTrigger,
  verifyCalSignature,
} from './src/lib/cal-webhook';

interface Env {
  ASSETS: Fetcher;
  RESEND_API_KEY: string;
  TO_EMAIL: string;
  FROM_EMAIL: string;
  RESEND_AUDIENCE_ID: string;
  CAL_WEBHOOK_SECRET: string;
  SF_CLIENT_ID: string;
  SF_CLIENT_SECRET: string;
  SF_LOGIN_URL: string;
  SF_API_VERSION?: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const { pathname } = url;

    // ── Host canonicalization: www → apex (dormant until emergedigital.com is routed) ──
    if (url.host === 'www.emergedigital.com') {
      url.host = 'emergedigital.com';
      return Response.redirect(url.toString(), 301);
    }

    // ── vision.emergedigital.ae → 301 → emergedigital.com (post-cutover finalize, Decision 3) ──
    // The .ae alias permanently consolidates onto the canonical .com domain; path preserved.
    if (url.host === 'vision.emergedigital.ae') {
      url.host = 'emergedigital.com';
      return Response.redirect(url.toString(), 301);
    }

    // ── Legacy WordPress → new Astro (same-domain platform swap) ──
    // 410 Gone: WooCommerce / WP system / feeds / oauth / legacy assets.
    if (GONE_PREFIXES.some((p) => pathname.startsWith(p)) || GONE_RE.test(pathname)) {
      return new Response('410 Gone', { status: 410 });
    }
    // 301: exact legacy path (matches both trailing-slash forms).
    const redirKey = pathname !== '/' && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
    const redirTo = REDIRECTS[redirKey];
    if (redirTo) {
      return Response.redirect(new URL(redirTo, url.origin).toString(), 301);
    }

    // ── API routes ─────────────────────────────────────────
    if (url.pathname === '/api/contact') {
      if (request.method === 'OPTIONS') return corsPreflightResponse(request);
      if (request.method === 'POST')    return handleContact(request, env);
      return new Response('Method Not Allowed', { status: 405 });
    }

    if (url.pathname === '/api/investor-request') {
      if (request.method === 'OPTIONS') return corsPreflightResponse(request);
      if (request.method === 'POST')    return handleInvestorRequest(request, env);
      return new Response('Method Not Allowed', { status: 405 });
    }

    if (url.pathname === '/api/subscribe') {
      if (request.method === 'OPTIONS') return corsPreflightResponse(request);
      if (request.method === 'POST')    return handleSubscribe(request, env);
      return new Response('Method Not Allowed', { status: 405 });
    }

    // Cal.com → Salesforce Milestone__c upsert (blueprint §9.3.1). Server-to-server
    // webhook: no CORS/preflight; authenticity is established by the HMAC signature.
    if (url.pathname === '/api/cal-webhook') {
      if (request.method === 'POST') return handleCalWebhook(request, env);
      return new Response('Method Not Allowed', { status: 405 });
    }

    // ── Static assets ──────────────────────────────────────
    // run_worker_first (wrangler.jsonc) means the Worker sees EVERY request,
    // including assets. Anything that isn't a redirect/410/301 or an API route
    // falls through to the ASSETS binding here, which serves the file and still
    // applies the /_astro/* cache headers from `public/_headers`.
    return env.ASSETS.fetch(request);
  },
};

// ── CORS ────────────────────────────────────────────────────

function corsHeaders(request: Request) {
  return {
    'Access-Control-Allow-Origin':  request.headers.get('origin') ?? '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

function corsPreflightResponse(request: Request): Response {
  return new Response(null, { status: 204, headers: corsHeaders(request) });
}

function json(data: unknown, status = 200, request?: Request): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...(request ? corsHeaders(request) : {}),
    },
  });
}

// ── Contact handler ─────────────────────────────────────────

async function handleContact(request: Request, env: Env): Promise<Response> {
  // Parse body (supports both JSON and multipart/form-data)
  let fields: Record<string, string | string[]>;
  try {
    const ct = request.headers.get('content-type') ?? '';
    if (ct.includes('application/json')) {
      fields = await request.json() as Record<string, string>;
    } else {
      const fd = await request.formData();
      fields = Object.fromEntries(fd.entries()) as Record<string, string>;
      const reasons = fd.getAll('reason') as string[];
      if (reasons.length > 1) fields['reason'] = reasons;
    }
  } catch {
    return json({ error: 'Invalid request body' }, 400, request);
  }

  // Honeypot
  if (fields['_gotcha']) return json({ ok: true }, 200, request);

  // Required field validation
  const required = ['full-name', 'company', 'email', 'role', 'country', 'industry'];
  for (const f of required) {
    if (!fields[f]?.toString().trim()) {
      return json({ error: `Missing field: ${f}` }, 422, request);
    }
  }
  if (!isValidEmail(fields['email'] as string)) {
    return json({ error: 'Invalid email address' }, 422, request);
  }

  // Env check
  if (!env.RESEND_API_KEY || !env.TO_EMAIL || !env.FROM_EMAIL) {
    console.error('Missing env vars: RESEND_API_KEY, TO_EMAIL, FROM_EMAIL');
    return json({ error: 'Server configuration error' }, 500, request);
  }

  const name     = fields['full-name'] as string;
  const company  = fields['company'] as string;
  const email    = fields['email'] as string;
  const role     = fields['role'] as string;
  const country  = fields['country'] as string;
  const industry = fields['industry'] as string;
  const reasons  = Array.isArray(fields['reason'])
    ? (fields['reason'] as string[]).join(', ')
    : (fields['reason'] as string | undefined) ?? 'Not specified';
  const brief    = (fields['brief'] as string | undefined)?.trim() ?? '';
  const followup = (fields['followup'] as string | undefined) ?? 'Not specified';

  // ── Build email ──────────────────────────────────────────
  const subject = `Briefing Request: ${name} · ${company} (${country})`;

  const htmlRows = [
    ['Name',      name],
    ['Company',   company],
    ['Email',     `<a href="mailto:${email}" style="color:#00C2C7">${email}</a>`],
    ['Role',      role],
    ['Country',   country],
    ['Industry',  industry],
    ['Situation', reasons],
    ['Follow-up', followup],
    ...(brief ? [['Brief', brief.replace(/\n/g, '<br/>')]] : []),
  ].map(([label, value]) => `
    <tr>
      <td style="padding:8px 16px 8px 0;vertical-align:top;color:#6B7A90;font-size:13px;white-space:nowrap;width:100px">${label}</td>
      <td style="padding:8px 0;font-size:14px;color:#E8EEF5;border-bottom:1px solid rgba(255,255,255,0.07)">${value}</td>
    </tr>`).join('');

  const html = `<!DOCTYPE html>
<html>
<body style="margin:0;padding:24px;background:#0A1F3D;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <div style="max-width:560px;margin:0 auto;background:#06122A;border-radius:12px;overflow:hidden;border:1px solid rgba(255,255,255,0.08)">
    <div style="padding:24px 28px;border-bottom:1px solid rgba(255,255,255,0.08)">
      <p style="margin:0;font-size:11px;font-weight:600;letter-spacing:0.14em;text-transform:uppercase;color:#6B7A90">Emerge Digital</p>
      <h1 style="margin:6px 0 0;font-size:18px;font-weight:600;color:#fff">New Briefing Request</h1>
      <p style="margin:4px 0 0;font-size:12px;color:#6B7A90">emergedigital.com/contact</p>
    </div>
    <div style="padding:24px 28px">
      <table style="width:100%;border-collapse:collapse">${htmlRows}</table>
    </div>
    <div style="padding:20px 28px;border-top:1px solid rgba(255,255,255,0.08)">
      <a href="mailto:${email}?subject=Re: Vision 2030 Readiness Briefing"
         style="display:inline-block;background:linear-gradient(90deg,#00C2C7,#3DDCE3);color:#06122A;font-weight:600;font-size:13px;padding:10px 20px;border-radius:9999px;text-decoration:none">
        Reply to ${name} →
      </a>
    </div>
    <div style="padding:16px 28px;background:rgba(255,255,255,0.02);border-top:1px solid rgba(255,255,255,0.06)">
      <p style="margin:0;font-size:11px;color:#6B7A90">Emerge Digital · Dubai Mainland · ESR &amp; UBO Compliant</p>
    </div>
  </div>
</body>
</html>`;

  const text = [
    'New Vision 2030 Readiness Briefing request',
    `From: ${name} <${email}>`,
    '---',
    `Company:   ${company}`,
    `Role:      ${role}`,
    `Country:   ${country}`,
    `Industry:  ${industry}`,
    `Situation: ${reasons}`,
    `Follow-up: ${followup}`,
    brief ? `\nBrief:\n${brief}` : '',
  ].filter(Boolean).join('\n');

  // ── Send via Resend ──────────────────────────────────────
  let resendRes: Response;
  try {
    resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `Emerge Digital <${env.FROM_EMAIL}>`,
        to: [env.TO_EMAIL],
        reply_to: email,
        subject,
        html,
        text,
      }),
    });
  } catch (err) {
    console.error('Resend fetch error:', err);
    return json({ error: 'Failed to reach email service' }, 502, request);
  }

  if (!resendRes.ok) {
    const body = await resendRes.text().catch(() => '');
    console.error('Resend API error:', resendRes.status, body);
    return json({ error: 'Email delivery failed' }, 502, request);
  }

  return json({ ok: true }, 200, request);
}

// ── Investor brief request handler ──────────────────────────

async function handleInvestorRequest(request: Request, env: Env): Promise<Response> {
  // Parse body (supports both JSON and multipart/form-data)
  let fields: Record<string, string>;
  try {
    const ct = request.headers.get('content-type') ?? '';
    if (ct.includes('application/json')) {
      fields = await request.json() as Record<string, string>;
    } else {
      const fd = await request.formData();
      fields = Object.fromEntries(fd.entries()) as Record<string, string>;
    }
  } catch {
    return json({ error: 'Invalid request body' }, 400, request);
  }

  // Honeypot — pretend success, drop silently
  if (fields['_gotcha']) return json({ ok: true }, 200, request);

  // Required field validation
  const required = ['full-name', 'firm', 'email', 'role', 'country'];
  for (const f of required) {
    if (!fields[f]?.toString().trim()) {
      return json({ error: `Missing field: ${f}` }, 422, request);
    }
  }
  if (!isValidEmail(fields['email'])) {
    return json({ error: 'Invalid email address' }, 422, request);
  }
  // Both attestations must be confirmed
  if (!fields['investor-attestation'] || !fields['nda-ack']) {
    return json({ error: 'Both attestations are required' }, 422, request);
  }

  // Env check
  if (!env.RESEND_API_KEY || !env.TO_EMAIL || !env.FROM_EMAIL) {
    console.error('Missing env vars: RESEND_API_KEY, TO_EMAIL, FROM_EMAIL');
    return json({ error: 'Server configuration error' }, 500, request);
  }

  const name    = fields['full-name'];
  const firm    = fields['firm'];
  const email   = fields['email'];
  const role    = fields['role'];
  const country = fields['country'];
  const note    = (fields['note'] ?? '').toString().trim();

  // ── Build email ──────────────────────────────────────────
  const subject = `Investor brief request: ${name} · ${firm}`;

  const htmlRows = [
    ['Name',                 name],
    ['Firm / Fund',          firm],
    ['Email',                `<a href="mailto:${email}" style="color:#00C2C7">${email}</a>`],
    ['Role',                 role],
    ['Country',              country],
    ['Qualified investor',   'Yes — attested'],
    ['Confidentiality/NDA',  'Yes — acknowledged'],
    ...(note ? [['Note', note.replace(/\n/g, '<br/>')]] : []),
  ].map(([label, value]) => `
    <tr>
      <td style="padding:8px 16px 8px 0;vertical-align:top;color:#6B7A90;font-size:13px;white-space:nowrap;width:130px">${label}</td>
      <td style="padding:8px 0;font-size:14px;color:#E8EEF5;border-bottom:1px solid rgba(255,255,255,0.07)">${value}</td>
    </tr>`).join('');

  const html = `<!DOCTYPE html>
<html>
<body style="margin:0;padding:24px;background:#0A1F3D;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <div style="max-width:560px;margin:0 auto;background:#06122A;border-radius:12px;overflow:hidden;border:1px solid rgba(255,255,255,0.08)">
    <div style="padding:24px 28px;border-bottom:1px solid rgba(255,255,255,0.08)">
      <p style="margin:0;font-size:11px;font-weight:600;letter-spacing:0.14em;text-transform:uppercase;color:#6B7A90">Emerge Digital</p>
      <h1 style="margin:6px 0 0;font-size:18px;font-weight:600;color:#fff">New Investor Brief Request</h1>
      <p style="margin:4px 0 0;font-size:12px;color:#6B7A90">emergedigital.com/investors · send the deck under NDA</p>
    </div>
    <div style="padding:24px 28px">
      <table style="width:100%;border-collapse:collapse">${htmlRows}</table>
    </div>
    <div style="padding:20px 28px;border-top:1px solid rgba(255,255,255,0.08)">
      <a href="mailto:${email}?subject=Re: Emerge Digital — Investor Brief"
         style="display:inline-block;background:linear-gradient(90deg,#00C2C7,#3DDCE3);color:#06122A;font-weight:600;font-size:13px;padding:10px 20px;border-radius:9999px;text-decoration:none">
        Reply to ${name} →
      </a>
    </div>
    <div style="padding:16px 28px;background:rgba(255,255,255,0.02);border-top:1px solid rgba(255,255,255,0.06)">
      <p style="margin:0;font-size:11px;color:#6B7A90">Emerge Digital · Dubai Mainland · ESR &amp; UBO Compliant</p>
    </div>
  </div>
</body>
</html>`;

  const text = [
    'New investor brief request',
    `From: ${name} <${email}>`,
    '---',
    `Firm/Fund: ${firm}`,
    `Role:      ${role}`,
    `Country:   ${country}`,
    `Qualified investor: Yes — attested`,
    `Confidentiality/NDA: Yes — acknowledged`,
    note ? `\nNote:\n${note}` : '',
    '\nSend the full deck under NDA.',
  ].filter(Boolean).join('\n');

  // ── Send via Resend ──────────────────────────────────────
  let resendRes: Response;
  try {
    resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `Emerge Digital <${env.FROM_EMAIL}>`,
        to: [env.TO_EMAIL],
        reply_to: email,
        subject,
        html,
        text,
      }),
    });
  } catch (err) {
    console.error('Resend fetch error:', err);
    return json({ error: 'Failed to reach email service' }, 502, request);
  }

  if (!resendRes.ok) {
    const body = await resendRes.text().catch(() => '');
    console.error('Resend API error:', resendRes.status, body);
    return json({ error: 'Email delivery failed' }, 502, request);
  }

  return json({ ok: true }, 200, request);
}

// ── Subscribe handler ───────────────────────────────────────

async function handleSubscribe(request: Request, env: Env): Promise<Response> {
  // Parse body (supports both JSON and multipart/form-data)
  let fields: Record<string, string>;
  try {
    const ct = request.headers.get('content-type') ?? '';
    if (ct.includes('application/json')) {
      fields = await request.json() as Record<string, string>;
    } else {
      const fd = await request.formData();
      fields = Object.fromEntries(fd.entries()) as Record<string, string>;
    }
  } catch {
    return json({ error: 'Invalid request body' }, 400, request);
  }

  // Honeypot — pretend success, drop silently
  if (fields['_gotcha']) return json({ ok: true }, 200, request);

  const email = (fields['email'] ?? '').toString().trim();
  if (!email) {
    return json({ error: 'Missing field: email' }, 422, request);
  }
  if (!isValidEmail(email)) {
    return json({ error: 'Invalid email address' }, 422, request);
  }

  // Env check
  if (!env.RESEND_API_KEY || !env.RESEND_AUDIENCE_ID) {
    console.error('Missing env vars: RESEND_API_KEY, RESEND_AUDIENCE_ID');
    return json({ error: 'Server configuration error' }, 500, request);
  }

  // Optional name → split into first / last for the Resend contact record
  const name = (fields['name'] ?? '').toString().trim();
  const [firstName, ...restName] = name.split(/\s+/).filter(Boolean);
  const lastName = restName.join(' ');

  // ── Add to Resend audience ───────────────────────────────
  let resendRes: Response;
  try {
    resendRes = await fetch(
      `https://api.resend.com/audiences/${env.RESEND_AUDIENCE_ID}/contacts`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          first_name: firstName ?? '',
          last_name: lastName,
          unsubscribed: false,
        }),
      },
    );
  } catch (err) {
    console.error('Resend fetch error:', err);
    return json({ error: 'Failed to reach email service' }, 502, request);
  }

  if (!resendRes.ok) {
    const body = await resendRes.text().catch(() => '');
    console.error('Resend API error:', resendRes.status, body);
    return json({ error: 'Subscription failed' }, 502, request);
  }

  return json({ ok: true }, 200, request);
}

// ── Cal.com webhook → Salesforce Milestone__c (blueprint §9.3.1) ──

async function handleCalWebhook(request: Request, env: Env): Promise<Response> {
  // Env check
  if (!env.CAL_WEBHOOK_SECRET || !env.SF_CLIENT_ID || !env.SF_CLIENT_SECRET || !env.SF_LOGIN_URL) {
    console.error('Missing env vars: CAL_WEBHOOK_SECRET, SF_CLIENT_ID, SF_CLIENT_SECRET, SF_LOGIN_URL');
    return json({ error: 'Server configuration error' }, 500);
  }

  // Read the RAW body — the HMAC is computed over the exact bytes Cal.com signed,
  // so we must verify before parsing as JSON.
  const raw = await request.text();
  const signature = request.headers.get('X-Cal-Signature-256');
  const valid = await verifyCalSignature(raw, signature, env.CAL_WEBHOOK_SECRET);
  if (!valid) {
    console.warn('Cal.com webhook rejected: signature mismatch');
    return json({ error: 'Invalid signature' }, 401);
  }

  let body: CalWebhookBody;
  try {
    body = JSON.parse(raw) as CalWebhookBody;
  } catch {
    return json({ error: 'Invalid request body' }, 400);
  }

  const trigger = body.triggerEvent;
  if (!isSupportedTrigger(trigger)) {
    // Acknowledge so Cal.com doesn't retry, but there's nothing to map.
    return json({ ok: true, ignored: trigger ?? null }, 200);
  }

  const payload = body.payload ?? {};
  const uid = payload.uid?.trim();
  if (!uid) return json({ error: 'Missing booking uid' }, 422);

  const status = statusForTrigger(trigger);

  // ── Salesforce auth (OAuth client-credentials) ──
  let sf: SfSession;
  try {
    sf = await sfAuth(env);
  } catch (err) {
    console.error('Salesforce auth error:', err);
    return json({ error: 'Salesforce auth failed' }, 502);
  }

  // ── Resolve Engagement__c: booking metadata wins, else attendee email → Contact → Engagement ──
  let engagementId = engagementIdFromMetadata(payload);
  if (!engagementId) {
    const email = firstAttendeeEmail(payload);
    if (email) {
      try {
        engagementId = await resolveEngagementByEmail(sf, email, env);
      } catch (err) {
        console.error('Engagement resolution error:', err);
      }
    }
  }
  if (!engagementId) {
    // Non-fatal: still upsert the Milestone so the booking is captured and stays
    // idempotent on reschedule; the link can be backfilled in Salesforce.
    console.warn(`No Engagement__c resolved for Cal booking ${uid}; upserting without link`);
  }

  // ── Upsert Milestone__c on the Cal_Booking_UID__c external id ──
  const upsertBody = buildUpsertBody({ payload, status, engagementId });
  let res: Response;
  try {
    res = await sfUpsertMilestone(sf, uid, upsertBody, env);
  } catch (err) {
    console.error('Salesforce upsert fetch error:', err);
    return json({ error: 'Failed to reach Salesforce' }, 502);
  }
  if (!res.ok) {
    const errBody = await res.text().catch(() => '');
    console.error('Salesforce upsert error:', res.status, errBody);
    return json({ error: 'Milestone upsert failed' }, 502);
  }

  return json({ ok: true, uid, status, engagement: engagementId ?? null }, 200);
}

// ── Salesforce REST helpers ──────────────────────────────────

interface SfSession {
  accessToken: string;
  instanceUrl: string;
}

function sfApiVersion(env: Env): string {
  return env.SF_API_VERSION || 'v60.0';
}

/** OAuth 2.0 client-credentials grant against the org's token endpoint. */
async function sfAuth(env: Env): Promise<SfSession> {
  const tokenUrl = `${env.SF_LOGIN_URL.replace(/\/$/, '')}/services/oauth2/token`;
  const res = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: env.SF_CLIENT_ID,
      client_secret: env.SF_CLIENT_SECRET,
    }),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => '');
    throw new Error(`token endpoint ${res.status}: ${t}`);
  }
  const data = (await res.json()) as { access_token?: string; instance_url?: string };
  if (!data.access_token || !data.instance_url) {
    throw new Error('token response missing access_token / instance_url');
  }
  return { accessToken: data.access_token, instanceUrl: data.instance_url };
}

interface SoqlResult<T> {
  records?: T[];
}

async function sfQuery<T>(sf: SfSession, soql: string, env: Env): Promise<SoqlResult<T>> {
  const url = `${sf.instanceUrl}/services/data/${sfApiVersion(env)}/query/?q=${encodeURIComponent(soql)}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${sf.accessToken}` } });
  if (!res.ok) {
    const t = await res.text().catch(() => '');
    throw new Error(`SOQL query ${res.status}: ${t}`);
  }
  return (await res.json()) as SoqlResult<T>;
}

/** attendee email → Contact → Account → most recently modified Engagement__c. */
async function resolveEngagementByEmail(
  sf: SfSession,
  email: string,
  env: Env,
): Promise<string | undefined> {
  const contacts = await sfQuery<{ Id: string; AccountId: string | null }>(
    sf,
    `SELECT Id, AccountId FROM Contact WHERE Email = '${soqlEscape(email)}' LIMIT 1`,
    env,
  );
  const accountId = contacts.records?.[0]?.AccountId;
  if (!accountId) return undefined;

  const engagements = await sfQuery<{ Id: string }>(
    sf,
    `SELECT Id FROM Engagement__c WHERE Account__c = '${soqlEscape(accountId)}' ORDER BY LastModifiedDate DESC LIMIT 1`,
    env,
  );
  return engagements.records?.[0]?.Id;
}

/** PATCH upsert keyed by the Cal_Booking_UID__c external id (idempotent on reschedule). */
async function sfUpsertMilestone(
  sf: SfSession,
  uid: string,
  fields: MilestoneUpsertBody,
  env: Env,
): Promise<Response> {
  const url = `${sf.instanceUrl}/services/data/${sfApiVersion(env)}/sobjects/Milestone__c/Cal_Booking_UID__c/${encodeURIComponent(uid)}`;
  return fetch(url, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${sf.accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(fields),
  });
}

// ── Helpers ──────────────────────────────────────────────────

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
}
