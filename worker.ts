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
 */

interface Env {
  ASSETS: Fetcher;
  RESEND_API_KEY: string;
  TO_EMAIL: string;
  FROM_EMAIL: string;
  RESEND_AUDIENCE_ID: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // ── API routes ─────────────────────────────────────────
    if (url.pathname === '/api/contact') {
      if (request.method === 'OPTIONS') return corsPreflightResponse(request);
      if (request.method === 'POST')    return handleContact(request, env);
      return new Response('Method Not Allowed', { status: 405 });
    }

    if (url.pathname === '/api/subscribe') {
      if (request.method === 'OPTIONS') return corsPreflightResponse(request);
      if (request.method === 'POST')    return handleSubscribe(request, env);
      return new Response('Method Not Allowed', { status: 405 });
    }

    // ── Static assets ──────────────────────────────────────
    // Asset responses (incl. /_astro/* cache headers) are served directly by the
    // ASSETS binding before the Worker runs, so caching is configured in
    // `public/_headers`, not here. The Worker only sees non-asset paths.
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

// ── Helpers ──────────────────────────────────────────────────

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
}
