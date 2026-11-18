import Resolver from '@forge/resolver';

import { verifySignedRequest } from './adapters/signature.js';
import { tenantFromContext } from './adapters/storage.js';
import {
  explainReleaseGate,
  findMissingEvidence,
  getChain,
  ingestEvents,
  recordApproval,
  resetDemo,
  seedDemo,
  simulateFailure
} from './lib/service.js';

const resolver = new Resolver();

resolver.define('getChain', ({ payload, context }) => getChain(payload, context));
resolver.define('seedDemo', ({ payload, context }) => seedDemo(payload, context));
resolver.define('recordApproval', ({ payload, context }) => recordApproval(payload, context));
resolver.define('simulateFailure', ({ payload, context }) => simulateFailure(payload, context));
resolver.define('resetDemo', ({ payload, context }) => resetDemo(payload, context));

export const handler = resolver.getDefinitions();

/** UI Kit resolver used by the issue panel. */
export const issuePanelResolver = resolver.getDefinitions();

/**
 * Forge resolver endpoint for a signed webhook from Bitbucket/CI.
 * The web trigger URL itself is public; authentication is performed here.
 */
export async function evidenceWebTrigger(event = {}) {
  const jsonResponse = (statusCode, body) => ({
    statusCode,
    headers: { 'Content-Type': ['application/json'] },
    body: JSON.stringify(body)
  });

  if (String(event.method || 'POST').toUpperCase() !== 'POST') {
    return jsonResponse(405, { ok: false, error: 'POST required' });
  }

  const rawBody = typeof event.body === 'string' ? event.body : JSON.stringify(event.body || {});
  const verification = verifySignedRequest(
    { body: rawBody, headers: event.headers || {} },
    process.env.WEBHOOK_SECRET
  );
  if (!verification.ok) {
    return jsonResponse(401, { ok: false, error: verification.reason });
  }

  let payload;
  try {
    payload = JSON.parse(rawBody);
  } catch (error) {
    return jsonResponse(400, { ok: false, error: 'invalid JSON body' });
  }

  try {
    const issueKey = String(payload.issueKey || payload.context?.issueKey || '').toUpperCase();
    if (!issueKey) {
      return jsonResponse(400, { ok: false, error: 'issueKey is required' });
    }
    const context = event.context || { cloudId: 'webtrigger' };
    const result = await ingestEvents([payload], context, {
      issueKey,
      sourceSystem: payload.sourceSystem || 'webhook'
    });
    return jsonResponse(200, { ok: true, accepted: result.accepted, issueKey });
  } catch (error) {
    return jsonResponse(500, { ok: false, error: error.message || 'ingestion failed' });
  }
}

/* ------------------------------------------------------------------------- *
 * Rovo actions. Forge invokes functions with (payload, context).
 * ------------------------------------------------------------------------- */

export async function getVerificationChain(payload = {}, context = {}) {
  return getChain(payload, context);
}

export async function findMissingEvidenceAction(payload = {}, context = {}) {
  return findMissingEvidence(payload, context);
}

export async function explainReleaseGateAction(payload = {}, context = {}) {
  return explainReleaseGate(payload, context);
}

export async function approveReleaseAction(payload = {}, context = {}) {
  return recordApproval(payload, context);
}
