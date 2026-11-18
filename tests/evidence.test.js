import test from 'node:test';
import assert from 'node:assert/strict';

import {
  evaluateGate,
  mergeEvidence,
  normalizeEvidence,
  summarizeForAgent
} from '../src/domain/evidence.js';
import { signBody, verifySignedRequest } from '../src/adapters/signature.js';

const baseEvents = [
  { issueKey: 'ENG-1', sourceSystem: 'bitbucket', externalId: 'pr-1', eventType: 'pull_request_merged', occurredAt: '2026-11-18T00:00:00Z', status: 'PASS' },
  { issueKey: 'ENG-1', sourceSystem: 'ci', externalId: 'test-1', eventType: 'tests_passed', occurredAt: '2026-11-18T01:00:00Z', status: 'PASS' },
  { issueKey: 'ENG-1', sourceSystem: 'deploy', externalId: 'deploy-1', eventType: 'deploy_success', occurredAt: '2026-11-18T02:00:00Z', status: 'PASS' },
  { issueKey: 'ENG-1', sourceSystem: 'jira', externalId: 'approval-1', eventType: 'human_approval', occurredAt: '2026-11-18T03:00:00Z', status: 'PASS' }
];

test('complete evidence chain is READY', () => {
  const events = baseEvents.map((event) => normalizeEvidence(event));
  const gate = evaluateGate(events, new Date('2026-11-18T04:00:00Z'));
  assert.equal(gate.status, 'READY');
  assert.equal(gate.missing.length, 0);
});

test('missing evidence is reported explicitly', () => {
  const events = baseEvents.slice(0, 2).map((event) => normalizeEvidence(event));
  const gate = evaluateGate(events, new Date('2026-11-18T04:00:00Z'));
  assert.equal(gate.status, 'MISSING');
  assert.equal(gate.missing.length, 2);
});

test('expired approval is not treated as passing', () => {
  const events = baseEvents.map((event) => normalizeEvidence(event));
  const gate = evaluateGate(events, new Date('2026-11-26T04:00:00Z'));
  assert.equal(gate.status, 'EXPIRED');
  assert.equal(gate.checks.find((check) => check.type === 'human_approval').state, 'EXPIRED');
});

test('newer failure creates a conflict', () => {
  const failed = normalizeEvidence({
    issueKey: 'ENG-1',
    sourceSystem: 'ci',
    externalId: 'test-2',
    eventType: 'tests_passed',
    occurredAt: '2026-11-18T05:00:00Z',
    status: 'FAIL'
  });
  const gate = evaluateGate([...baseEvents.map(normalizeEvidence), failed], new Date('2026-11-18T06:00:00Z'));
  assert.equal(gate.status, 'CONFLICT');
});

test('ingestion is idempotent by source and external id', () => {
  const first = normalizeEvidence(baseEvents[0]);
  const duplicate = normalizeEvidence({ ...baseEvents[0], details: 'updated copy', receivedAt: '2026-11-18T12:00:00Z' });
  const merged = mergeEvidence([first], [duplicate]);
  assert.equal(merged.length, 1);
  assert.equal(merged[0].details, 'updated copy');
});

test('agent summary contains traceable evidence ids', () => {
  const events = baseEvents.map(normalizeEvidence);
  const gate = evaluateGate(events, new Date('2026-11-18T04:00:00Z'));
  const summary = summarizeForAgent({ issueKey: 'ENG-1', evidence: events, gate });
  assert.equal(summary.evidenceIds.length, 4);
  assert.equal(summary.status, 'READY');
});

test('signed requests verify and reject tampering', () => {
  const secret = 'test-secret';
  const body = JSON.stringify({ issueKey: 'ENG-1', eventType: 'deploy_success' });
  const timestamp = String(Date.now());
  const signature = signBody(`${timestamp}.${body}`, secret);
  const headers = { 'x-vg-signature': signature, 'x-vg-timestamp': timestamp };
  assert.deepEqual(verifySignedRequest({ body, headers }, secret), { ok: true });
  assert.equal(verifySignedRequest({ body: body + 'x', headers }, secret).ok, false);
});
