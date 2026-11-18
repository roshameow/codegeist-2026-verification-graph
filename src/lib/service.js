import {
  evaluateGate,
  mergeEvidence,
  normalizeEvidence,
  summarizeForAgent
} from '../domain/evidence.js';
import {
  deleteEvidence,
  readEvidence,
  tenantFromContext,
  writeEvidence
} from '../adapters/storage.js';

const APPROVAL_TTL_HOURS = 168; // 7 days

export function issueKeyFrom(payload = {}, context = {}) {
  return String(
    payload.issueKey ||
    payload.context?.jira?.issueKey ||
    payload.context?.issueKey ||
    context.extension?.issue?.key ||
    context.extension?.issueKey ||
    context.issueKey ||
    ''
  ).toUpperCase();
}

export function actorFrom(context = {}) {
  return String(
    context.principal?.accountId ||
    context.accountId ||
    'unknown-user'
  );
}

export async function getChain(payload = {}, context = {}) {
  const issueKey = issueKeyFrom(payload, context);
  if (!issueKey) {
    return { ok: false, error: 'issueKey is required', evidence: [], gate: null };
  }
  const tenant = tenantFromContext(context);
  const primary = await readEvidence(tenant, issueKey);
  // Web triggers do not carry an Atlassian user context. Events accepted through
  // a web trigger are written under a stable 'webtrigger' tenant; merge that
  // read-only view so Jira users can see signed CI/Bitbucket evidence.
  const fromWebTrigger = tenant === 'webtrigger' ? [] : await readEvidence('webtrigger', issueKey);
  const evidence = mergeEvidence(primary, fromWebTrigger);
  const gate = evaluateGate(evidence, new Date(), APPROVAL_TTL_HOURS);
  return {
    ok: true,
    issueKey,
    tenant,
    evidence,
    gate,
    agentSummary: summarizeForAgent({ issueKey, evidence, gate })
  };
}

export async function ingestEvents(events = [], context = {}, defaults = {}) {
  const issueKey = String(defaults.issueKey || '').toUpperCase();
  if (!issueKey) throw new Error('issueKey is required for ingest');

  const normalized = events
    .map((event) => normalizeEvidence(event, {
      issueKey,
      sourceSystem: defaults.sourceSystem || 'external',
      actor: defaults.actor || 'webhook'
    }))
    .filter(Boolean)
    .filter((event) => event.issueKey);

  if (normalized.length === 0) return { accepted: 0, evidence: [] };

  const tenant = tenantFromContext(context);
  const current = await readEvidence(tenant, issueKey);
  const merged = mergeEvidence(current, normalized);
  await writeEvidence(tenant, issueKey, merged);
  return { accepted: normalized.length, evidence: merged };
}

export async function seedDemo(payload = {}, context = {}) {
  const issueKey = issueKeyFrom(payload, context);
  if (!issueKey) throw new Error('issueKey is required');
  const now = Date.now();
  const at = (hoursAgo) => new Date(now - hoursAgo * 3600 * 1000).toISOString();
  const events = [
    {
      issueKey,
      sourceSystem: 'bitbucket',
      externalId: `pr-${issueKey}`,
      eventType: 'pull_request_merged',
      actor: 'Maya Chen',
      occurredAt: at(30),
      status: 'PASS',
      sourceUrl: 'https://bitbucket.org/example/payments/pull-requests/482',
      details: 'PR #482 “Add idempotency keys to release webhook” merged after 2 approvals.'
    },
    {
      issueKey,
      sourceSystem: 'ci',
      externalId: `test-run-${issueKey}-1`,
      eventType: 'tests_passed',
      actor: 'CircleCI pipeline #9182',
      occurredAt: at(27),
      status: 'FAIL',
      details: 'Initial run failed: flaky integration test checkout.timeout.'
    },
    {
      issueKey,
      sourceSystem: 'ci',
      externalId: `test-run-${issueKey}-2`,
      eventType: 'tests_passed',
      actor: 'CircleCI pipeline #9183',
      occurredAt: at(25),
      status: 'PASS',
      sourceUrl: 'https://circleci.com/gh/example/payments/9183',
      details: 'Re-run passed: 412 tests, 0 failures, coverage 87%.'
    },
    {
      issueKey,
      sourceSystem: 'deploy',
      externalId: `deploy-${issueKey}`,
      eventType: 'deploy_success',
      actor: 'deploy-bot',
      occurredAt: at(18),
      status: 'PASS',
      sourceUrl: 'https://dashboard.example.com/deploys/rel-2026-11-18',
      details: 'Version 2026.11.18-rc2 deployed to staging; health checks green for 15 minutes.'
    },
    {
      issueKey,
      sourceSystem: 'jira',
      externalId: `approval-${issueKey}`,
      eventType: 'human_approval',
      actor: actorFrom(context),
      occurredAt: at(6),
      status: 'PASS',
      details: 'Release manager approved staging evidence for production rollout.'
    }
  ];

  const result = await ingestEvents(events, context, { issueKey, sourceSystem: 'demo' });
  return getChain({ issueKey }, context).then((chain) => ({
    ok: true,
    ...result,
    chain
  }));
}

export async function recordApproval(payload = {}, context = {}) {
  const issueKey = issueKeyFrom(payload, context);
  if (!issueKey) throw new Error('issueKey is required');
  const note = String(payload.note || '').slice(0, 500);
  const actor = actorFrom(context);
  const event = normalizeEvidence({
    issueKey,
    sourceSystem: 'jira',
    externalId: `approval-${issueKey}-${Date.now()}`,
    eventType: 'human_approval',
    actor,
    occurredAt: new Date().toISOString(),
    status: 'PASS',
    details: note || 'Approved via Verification Graph issue panel.'
  });
  const tenant = tenantFromContext(context);
  const current = await readEvidence(tenant, issueKey);
  await writeEvidence(tenant, issueKey, mergeEvidence(current, [event]));
  return getChain({ issueKey }, context);
}

export async function simulateFailure(payload = {}, context = {}) {
  const issueKey = issueKeyFrom(payload, context);
  if (!issueKey) throw new Error('issueKey is required');
  const event = normalizeEvidence({
    issueKey,
    sourceSystem: 'ci',
    externalId: `test-run-${issueKey}-${Date.now()}`,
    eventType: 'tests_passed',
    actor: 'CircleCI pipeline #9184',
    occurredAt: new Date().toISOString(),
    status: 'FAIL',
    details: 'Regression suite failed after deployment; release gate blocked.'
  });
  const tenant = tenantFromContext(context);
  const current = await readEvidence(tenant, issueKey);
  await writeEvidence(tenant, issueKey, mergeEvidence(current, [event]));
  return getChain({ issueKey }, context);
}

export async function resetDemo(payload = {}, context = {}) {
  const issueKey = issueKeyFrom(payload, context);
  if (!issueKey) throw new Error('issueKey is required');
  const tenant = tenantFromContext(context);
  await deleteEvidence(tenant, issueKey);
  return getChain({ issueKey }, context);
}

export async function findMissingEvidence(payload = {}, context = {}) {
  const chain = await getChain(payload, context);
  if (!chain.ok) return chain;
  return {
    ok: true,
    issueKey: chain.issueKey,
    status: chain.gate.status,
    missing: chain.gate.missing,
    summary: chain.gate.summary
  };
}

export async function explainReleaseGate(payload = {}, context = {}) {
  const chain = await getChain(payload, context);
  if (!chain.ok) return chain;
  const lines = chain.gate.checks.map((check) => {
    const marker = check.state === 'PRESENT' ? 'PASS' : check.state;
    return `- ${check.label}: ${marker}${check.actor ? ` (${check.actor})` : ''}`;
  });
  return {
    ok: true,
    issueKey: chain.issueKey,
    status: chain.gate.status,
    explanation: `${chain.gate.summary}\n${lines.join('\n')}`,
    evidenceIds: chain.evidence.map((item) => item.id),
    evaluatedAt: chain.gate.evaluatedAt
  };
}
