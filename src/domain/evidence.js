/**
 * Pure domain model for delivery evidence.
 *
 * This module deliberately has no Forge SDK imports. It can be unit-tested and
 * reused outside Atlassian Forge.
 */

export const REQUIRED_CHECKS = Object.freeze([
  'pull_request_merged',
  'tests_passed',
  'deploy_success',
  'human_approval'
]);

export const CHECK_LABELS = Object.freeze({
  pull_request_merged: 'Pull request merged',
  tests_passed: 'Automated tests passed',
  deploy_success: 'Deployment succeeded',
  human_approval: 'Human approval'
});

const EVENT_ALIASES = Object.freeze({
  pr_merged: 'pull_request_merged',
  pull_request_merged: 'pull_request_merged',
  merge: 'pull_request_merged',
  tests_passed: 'tests_passed',
  test_passed: 'tests_passed',
  ci_passed: 'tests_passed',
  tests_failed: 'tests_passed',
  test_failed: 'tests_passed',
  deploy_success: 'deploy_success',
  deployment_success: 'deploy_success',
  deployed: 'deploy_success',
  deploy_failed: 'deploy_success',
  human_approval: 'human_approval',
  approval: 'human_approval',
  approved: 'human_approval'
});

const PASSING_EVENTS = new Set([
  'pull_request_merged',
  'tests_passed',
  'deploy_success',
  'human_approval'
]);

export function normalizeEventType(raw) {
  const key = String(raw || '').trim().toLowerCase().replace(/[\s-]+/g, '_');
  return EVENT_ALIASES[key] || key || 'unknown';
}

export function isPassingEvidence(evidence) {
  return Boolean(evidence) && evidence.status === 'PASS';
}

export function isFailingEvidence(evidence) {
  return Boolean(evidence) && evidence.status === 'FAIL';
}

export function makeIdempotencyKey(evidence) {
  const parts = [
    evidence.issueKey || '',
    evidence.sourceSystem || '',
    evidence.externalId || '',
    evidence.eventType || ''
  ];
  return parts.join(':');
}

/**
 * Normalize an external or UI-originated event into the canonical Evidence shape.
 * Returns null when the event cannot be mapped to the domain.
 */
export function normalizeEvidence(input = {}, defaults = {}) {
  const eventType = normalizeEventType(input.eventType || input.event || input.type);
  if (eventType === 'unknown') return null;

  const rawStatus = String(input.status || '').toUpperCase();
  let status = rawStatus === 'PASS' || rawStatus === 'SUCCESS' || rawStatus === 'MERGED'
    ? 'PASS'
    : rawStatus === 'FAIL' || rawStatus === 'FAILED' || rawStatus === 'ERROR'
      ? 'FAIL'
      : PASSING_EVENTS.has(eventType) ? 'PASS' : 'INFO';

  // Explicit failed-event names win over a vague or missing status.
  if (/fail|error|revert|block/i.test(String(input.eventType || input.event || input.type || ''))) {
    status = 'FAIL';
  }

  const occurredAt = input.occurredAt || input.timestamp || new Date().toISOString();
  const receivedAt = input.receivedAt || new Date().toISOString();

  return {
    id: input.id || defaults.id || makeCanonicalId(input),
    issueKey: String(input.issueKey || defaults.issueKey || '').toUpperCase(),
    sourceSystem: String(input.sourceSystem || defaults.sourceSystem || 'external'),
    externalId: String(input.externalId || input.id || makeCanonicalId(input)),
    eventType,
    actor: String(input.actor || defaults.actor || 'unknown'),
    occurredAt: new Date(occurredAt).toISOString(),
    receivedAt: new Date(receivedAt).toISOString(),
    status,
    sourceUrl: input.sourceUrl || '',
    details: typeof input.details === 'string' ? input.details : String(input.details?.message || ''),
    payloadRef: input.payloadRef || '',
    signatureValid: input.signatureValid === undefined ? true : Boolean(input.signatureValid)
  };
}

function makeCanonicalId(input) {
  const seed = [
    input.issueKey || '',
    input.sourceSystem || '',
    input.externalId || input.id || '',
    input.eventType || input.event || input.type || '',
    input.occurredAt || input.timestamp || ''
  ].join('|');
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return `ev-${(hash >>> 0).toString(16).padStart(8, '0')}`;
}

/** Idempotent merge: newer evidence for the same source/external id replaces older copies. */
export function mergeEvidence(existing = [], incoming = []) {
  const byKey = new Map();
  for (const item of [...existing, ...incoming]) {
    if (!item?.issueKey) continue;
    const key = makeIdempotencyKey(item);
    const previous = byKey.get(key);
    if (!previous || new Date(item.receivedAt) >= new Date(previous.receivedAt)) {
      byKey.set(key, item);
    }
  }
  return Array.from(byKey.values()).sort((a, b) => new Date(a.occurredAt) - new Date(b.occurredAt));
}

export function latestByType(evidence, type) {
  return evidence
    .filter((item) => item.eventType === type)
    .sort((a, b) => new Date(b.occurredAt) - new Date(a.occurredAt))[0] || null;
}

export function approvalIsExpired(approval, now = new Date(), ttlHours = 168) {
  if (!approval) return false;
  const ageMs = now.getTime() - new Date(approval.occurredAt).getTime();
  return ageMs > ttlHours * 60 * 60 * 1000;
}

/**
 * Evaluate a gate from evidence only. Returns a deterministic, explainable result.
 */
export function evaluateGate(evidence = [], now = new Date(), approvalTtlHours = 168) {
  const checks = REQUIRED_CHECKS.map((type) => {
    const latest = latestByType(evidence, type);
    let state = 'MISSING';
    if (latest) {
      if (isFailingEvidence(latest)) state = 'CONFLICT';
      else if (type === 'human_approval' && approvalIsExpired(latest, now, approvalTtlHours)) state = 'EXPIRED';
      else if (isPassingEvidence(latest)) state = 'PRESENT';
      else state = 'UNKNOWN';
    }
    return {
      type,
      label: CHECK_LABELS[type],
      state,
      evidenceId: latest?.id || null,
      occurredAt: latest?.occurredAt || null,
      actor: latest?.actor || null,
      sourceUrl: latest?.sourceUrl || null
    };
  });

  const failing = checks.filter((check) => check.state !== 'PRESENT');
  const status = failing.length === 0
    ? 'READY'
    : failing.some((check) => check.state === 'CONFLICT')
      ? 'CONFLICT'
      : failing.some((check) => check.state === 'EXPIRED')
        ? 'EXPIRED'
        : 'MISSING';

  return {
    status,
    checks,
    missing: failing,
    evidenceCount: evidence.length,
    evaluatedAt: now.toISOString(),
    summary: buildSummary(status, failing)
  };
}

function buildSummary(status, failing) {
  if (status === 'READY') {
    return 'All required delivery evidence is present and current. This release gate is ready.';
  }
  const labels = failing.map((check) => `${check.label} (${check.state.toLowerCase()})`).join(', ');
  return `Release gate is ${status.toLowerCase()}. Outstanding: ${labels}.`;
}

export function summarizeForAgent(chain) {
  return {
    issueKey: chain.issueKey,
    status: chain.gate.status,
    summary: chain.gate.summary,
    evidenceIds: chain.evidence.map((item) => item.id),
    checks: chain.gate.checks.map(({ type, label, state, evidenceId, sourceUrl }) => ({
      type, label, state, evidenceId, sourceUrl
    })),
    evaluatedAt: chain.gate.evaluatedAt
  };
}
