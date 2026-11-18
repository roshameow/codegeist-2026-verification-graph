#!/usr/bin/env node
import { createHmac } from 'node:crypto';

const url = process.env.WEBTRIGGER_URL;
const secret = process.env.WEBHOOK_SECRET;
const issueKey = process.argv[2] || 'MOBL-57';
const eventType = process.argv[3] || 'deploy_success';
const status = process.argv[4] || 'PASS';

if (!url || !secret) {
  console.error('Set WEBTRIGGER_URL and WEBHOOK_SECRET in your environment.');
  process.exit(1);
}

const body = JSON.stringify({
  issueKey,
  eventType,
  status,
  sourceSystem: 'ci',
  externalId: `${eventType}-${Date.now()}`,
  actor: 'demo-ci-bot',
  occurredAt: new Date().toISOString(),
  details: `Signed webhook delivery: ${eventType} (${status})`
});
const timestamp = String(Date.now());
const signature = `sha256=${createHmac('sha256', secret).update(`${timestamp}.${body}`).digest('hex')}`;

const response = await fetch(url, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-vg-timestamp': timestamp,
    'x-vg-signature': signature
  },
  body
});
console.log(response.status, await response.text());
