/**
 * Cloudflare Pages Function — POST /api/contact
 *
 * Receives the briefing-request form submission and forwards it to the
 * configured inbox via Resend (https://resend.com — free tier: 3k/month).
 *
 * Required environment variables (set in Cloudflare Pages → Settings → Variables):
 *   RESEND_API_KEY   — your Resend API key (re_xxxxxxxxxxxx)
 *   TO_EMAIL         — destination inbox, e.g. rami@emergedigital.com
 *   FROM_EMAIL       — verified sender, e.g. site@emergedigital.com
 *                      (must be a domain you have verified in Resend)
 *
 * Optional:
 *   ALLOWED_ORIGIN   — CORS origin, defaults to * in development
 */

interface Env {
  RESEND_API_KEY: string;
  TO_EMAIL: string;
  FROM_EMAIL: string;
  ALLOWED_ORIGIN?: string;
}

interface FormData {
  'full-name': string;
  company: string;
  email: string;
  role: string;
  country: string;
  industry: string;
  reason?: string | string[];
  brief?: string;
  followup?: string;
  _gotcha?: string;
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const origin = request.headers.get('origin') ?? '*';
  const corsHeaders = {
    'Access-Control-Allow-Origin': env.ALLOWED_ORIGIN ?? origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  // Parse form body
  let data: FormData;
  try {
    const ct = request.headers.get('content-type') ?? '';
    if (ct.includes('application/json')) {
      data = await request.json() as FormData;
    } else {
      const fd = await request.formData();
      data = Object.fromEntries(fd.entries()) as unknown as FormData;
      // Collect multiple checkbox values for "reason"
      const reasons = fd.getAll('reason');
      if (reasons.length) data.reason = reasons as string[];
    }
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid request body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  // Honeypot
  if (data._gotcha) {
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  // Basic field validation
  const required: (keyof FormData)[] = ['full-name', 'company', 'email', 'role', 'country', 'industry'];
  for (const field of required) {
    if (!data[field]?.toString().trim()) {
      return new Response(JSON.stringify({ error: `Missing required field: ${field}` }), {
        status: 422,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }
  }
  if (!isValidEmail(data.email)) {
    return new Response(JSON.stringify({ error: 'Invalid email address' }), {
      status: 422,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  // Validate env
  if (!env.RESEND_API_KEY || !env.TO_EMAIL || !env.FROM_EMAIL) {
    console.error('Missing required environment variables: RESEND_API_KEY, TO_EMAIL, FROM_EMAIL');
    return new Response(JSON.stringify({ error: 'Server configuration error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  // Build email
  const reasons = Array.isArray(data.reason)
    ? data.reason.join(', ')
    : data.reason ?? 'Not specified';

  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#06122A;color:#E8EEF5;border-radius:12px">
      <div style="margin-bottom:24px;padding-bottom:16px;border-bottom:1px solid rgba(255,255,255,0.1)">
        <img src="https://emerge-digital-website.emerge-digital.workers.dev/og-default.png" alt="Emerge Digital" width="120" style="opacity:0.7"/>
      </div>
      <h1 style="font-size:20px;font-weight:600;color:#fff;margin:0 0 4px">New Briefing Request</h1>
      <p style="color:#6B7A90;font-size:13px;margin:0 0 24px">Submitted via emergedigital.com/contact</p>

      <table style="width:100%;border-collapse:collapse">
        ${row('Name',     data['full-name'])}
        ${row('Company',  data.company)}
        ${row('Email',    `<a href="mailto:${data.email}" style="color:#00C2C7">${data.email}</a>`)}
        ${row('Role',     data.role)}
        ${row('Country',  data.country)}
        ${row('Industry', data.industry)}
        ${row('Situation', reasons)}
        ${row('Follow-up', data.followup ?? 'Not specified')}
        ${data.brief ? row('Brief', data.brief.replace(/\n/g, '<br/>')) : ''}
      </table>

      <div style="margin-top:24px;padding:16px;background:rgba(0,194,199,0.08);border:1px solid rgba(0,194,199,0.2);border-radius:8px">
        <a href="mailto:${data.email}?subject=Re: Vision 2030 Readiness Briefing — Emerge Digital"
           style="display:inline-block;background:linear-gradient(90deg,#00C2C7,#3DDCE3);color:#06122A;font-weight:600;padding:10px 20px;border-radius:9999px;text-decoration:none;font-size:14px">
          Reply to ${data['full-name']} →
        </a>
      </div>

      <p style="margin-top:24px;font-size:11px;color:#6B7A90">
        Emerge Digital · Dubai Mainland · ESR &amp; UBO Compliant
      </p>
    </div>
  `;

  function row(label: string, value: string) {
    return `
      <tr>
        <td style="padding:8px 12px 8px 0;vertical-align:top;color:#6B7A90;font-size:13px;white-space:nowrap;width:110px">${label}</td>
        <td style="padding:8px 0;font-size:14px;color:#E8EEF5;border-bottom:1px solid rgba(255,255,255,0.06)">${value}</td>
      </tr>`;
  }

  const text = [
    'New Vision 2030 Readiness Briefing request',
    '---',
    `Name:     ${data['full-name']}`,
    `Company:  ${data.company}`,
    `Email:    ${data.email}`,
    `Role:     ${data.role}`,
    `Country:  ${data.country}`,
    `Industry: ${data.industry}`,
    `Situation: ${reasons}`,
    `Follow-up: ${data.followup ?? 'Not specified'}`,
    data.brief ? `\nBrief:\n${data.brief}` : '',
  ].filter(Boolean).join('\n');

  // Send via Resend
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `Emerge Digital Site <${env.FROM_EMAIL}>`,
        to: [env.TO_EMAIL],
        reply_to: data.email,
        subject: `Briefing Request: ${data['full-name']} · ${data.company} (${data.country})`,
        html,
        text,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error('Resend error:', res.status, body);
      return new Response(JSON.stringify({ error: 'Failed to send email' }), {
        status: 502,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }
  } catch (err) {
    console.error('Fetch error sending via Resend:', err);
    return new Response(JSON.stringify({ error: 'Network error sending email' }), {
      status: 502,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });
};

export const onRequestOptions: PagesFunction = async ({ request }) => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': request.headers.get('origin') ?? '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
};

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}
