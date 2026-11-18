import { createHmac, timingSafeEqual } from 'node:crypto';

function headerValue(headers = {}, name) {
  const value = headers[name] || headers[name.toLowerCase()] || headers[name.toUpperCase()];
  return Array.isArray(value) ? value[0] : value;
}

export function signBody(body, secret) {
  return `sha256=${createHmac('sha256', secret).update(body).digest('hex')}`;
}

export function verifySignedRequest({ body = '', headers = {} }, secret, nowMs = Date.now()) {
  if (!secret) return { ok: false, reason: 'WEBHOOK_SECRET is not configured' };

  const signature = String(headerValue(headers, 'x-vg-signature') || '');
  const timestamp = String(headerValue(headers, 'x-vg-timestamp') || '');
  if (!signature || !timestamp) return { ok: false, reason: 'missing signature headers' };

  const timestampMs = Number(timestamp);
  if (!Number.isFinite(timestampMs)) return { ok: false, reason: 'invalid timestamp' };
  if (Math.abs(nowMs - timestampMs) > 5 * 60 * 1000) {
    return { ok: false, reason: 'stale timestamp' };
  }

  const expected = signBody(`${timestamp}.${body}`, secret);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return { ok: false, reason: 'invalid signature' };
  }
  return { ok: true };
}
