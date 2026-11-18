import { kvs } from '@forge/kvs';

const PREFIX = 'verification-graph:evidence';

export function tenantFromContext(context = {}) {
  return String(
    context.cloudId ||
    context.workspaceId ||
    context.installation?.contexts?.[0]?.cloudId ||
    context.installation?.ari ||
    'local'
  );
}

function keyFor(tenant, issueKey) {
  return `${PREFIX}:${tenant}:${String(issueKey).toUpperCase()}`;
}

export async function readEvidence(tenant, issueKey) {
  const value = await kvs.get(keyFor(tenant, issueKey));
  return Array.isArray(value) ? value : [];
}

export async function writeEvidence(tenant, issueKey, evidence) {
  const key = keyFor(tenant, issueKey);
  const current = await readEvidence(tenant, issueKey);
  await kvs.set(key, evidence);
  return { key, count: evidence.length, previousCount: current.length };
}

export async function deleteEvidence(tenant, issueKey) {
  await kvs.delete(keyFor(tenant, issueKey));
  return { deleted: true };
}
