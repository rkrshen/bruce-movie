/**
 * Optional Cloudflare Pages Function for server-side contact email delivery.
 *
 * IMPORTANT:
 * Web3Forms Free plan explicitly rejects server-side / Cloudflare Workers
 * requests with HTTP 403 ("Use our API in client side or contact support with
 * server IP address (Pro plan is required)").
 *
 * Therefore, by default the frontend submits directly from the browser to
 * Web3Forms (which works on both GitHub Pages and Cloudflare Pages).
 *
 * To route submissions through this server-side endpoint with Cloudflare
 * Turnstile protection instead, configure:
 *   - PUBLIC_CONTACT_ENDPOINT=/api/contact
 *   - RESEND_API_KEY (Cloudflare Pages Encrypted Secret)
 *   - CONTACT_FROM_EMAIL (e.g. "Bruce Movie <noreply@brucemovie.com>")
 *   - CONTACT_TO_EMAIL (default: "brucemovie@gmail.com")
 *   - Optional: PUBLIC_TURNSTILE_SITE_KEY + TURNSTILE_SECRET_KEY
 */

interface Env {
  RESEND_API_KEY?: string;
  CONTACT_FROM_EMAIL?: string;
  CONTACT_TO_EMAIL?: string;
  TURNSTILE_SECRET_KEY?: string;
}

interface ContactPayload {
  name?: unknown;
  email?: unknown;
  message?: unknown;
  botcheck?: unknown;
  turnstileToken?: unknown;
  locale?: unknown;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MAX_NAME_LENGTH = 100;
const MAX_EMAIL_LENGTH = 254;
const MAX_MESSAGE_LENGTH = 3000;

const ALLOWED_ORIGINS = new Set([
  'https://brucemovie.com',
  'https://www.brucemovie.com',
]);

function isAllowedOrigin(origin: string | null, requestUrl: URL): boolean {
  if (!origin) return false;
  if (ALLOWED_ORIGINS.has(origin)) return true;
  if (origin === requestUrl.origin) return true;
  if (/^https:\/\/[a-z0-9-]+\.pages\.dev$/i.test(origin)) return true;
  return false;
}

function sanitizeText(input: unknown): string {
  if (typeof input !== 'string') return '';
  return input.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim();
}

function jsonResponse(body: Record<string, unknown>, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const requestUrl = new URL(request.url);
  const origin = request.headers.get('Origin');

  if (!isAllowedOrigin(origin, requestUrl)) {
    return jsonResponse({ success: false, code: 'FORBIDDEN_ORIGIN' }, 403);
  }

  const contentType = request.headers.get('Content-Type') ?? '';
  if (!contentType.includes('application/json')) {
    return jsonResponse({ success: false, code: 'INVALID_CONTENT_TYPE' }, 415);
  }

  let payload: ContactPayload;
  try {
    payload = (await request.json()) as ContactPayload;
  } catch {
    return jsonResponse({ success: false, code: 'INVALID_JSON' }, 400);
  }

  // Honeypot trap: silently pretend success to confuse automated spam bots
  if (
    payload.botcheck === true ||
    (typeof payload.botcheck === 'string' && payload.botcheck.length > 0)
  ) {
    return jsonResponse({ success: true }, 200);
  }

  const name = sanitizeText(payload.name);
  const email = sanitizeText(payload.email);
  const message = sanitizeText(payload.message);
  const locale = payload.locale === 'en' ? 'en' : 'zh-TW';

  if (!name || name.length > MAX_NAME_LENGTH) {
    return jsonResponse({ success: false, code: 'INVALID_NAME' }, 400);
  }
  if (!email || email.length > MAX_EMAIL_LENGTH || !EMAIL_PATTERN.test(email)) {
    return jsonResponse({ success: false, code: 'INVALID_EMAIL' }, 400);
  }
  if (!message || message.length > MAX_MESSAGE_LENGTH) {
    return jsonResponse({ success: false, code: 'INVALID_MESSAGE' }, 400);
  }

  // Verify Cloudflare Turnstile token whenever TURNSTILE_SECRET_KEY is configured
  if (env.TURNSTILE_SECRET_KEY) {
    const turnstileToken = sanitizeText(payload.turnstileToken);
    if (!turnstileToken) {
      return jsonResponse({ success: false, code: 'TURNSTILE_REQUIRED' }, 400);
    }

    const remoteIp = request.headers.get('CF-Connecting-IP') ?? '';
    const verifyBody = new URLSearchParams({
      secret: env.TURNSTILE_SECRET_KEY,
      response: turnstileToken,
    });
    if (remoteIp) {
      verifyBody.set('remoteip', remoteIp);
    }

    const verifyRes = await fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: verifyBody.toString(),
      },
    );

    if (!verifyRes.ok) {
      return jsonResponse({ success: false, code: 'TURNSTILE_ERROR' }, 502);
    }

    const verifyJson = (await verifyRes.json()) as { success?: boolean };
    if (!verifyJson.success) {
      return jsonResponse({ success: false, code: 'TURNSTILE_FAILED' }, 403);
    }
  }

  if (!env.RESEND_API_KEY) {
    return jsonResponse({ success: false, code: 'SERVICE_UNAVAILABLE' }, 503);
  }

  const toEmail = env.CONTACT_TO_EMAIL || 'brucemovie@gmail.com';
  const fromEmail = env.CONTACT_FROM_EMAIL || 'Bruce Movie Website <noreply@brucemovie.com>';
  const subject =
    locale === 'en'
      ? `[Bruce Movie] New inquiry from ${name}`
      : `[澤影映像官網] 來自 ${name} 的合作詢問`;

  const textBody = [
    locale === 'en' ? 'New website contact inquiry' : '官網聯絡表單新來信',
    '----------------------------------------',
    `${locale === 'en' ? 'Name' : '稱呼'}: ${name}`,
    `Email: ${email}`,
    '',
    locale === 'en' ? 'Message:' : '訊息內容：',
    message,
  ].join('\n');

  const upstreamRes = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [toEmail],
      reply_to: email,
      subject,
      text: textBody,
    }),
  });

  if (!upstreamRes.ok) {
    return jsonResponse({ success: false, code: 'UPSTREAM_ERROR' }, 502);
  }

  return jsonResponse({ success: true }, 200);
};
