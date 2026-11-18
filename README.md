# Verification Graph

Verification Graph is a Jira Forge app for software teams that turns delivery signals into an auditable release-evidence chain. It answers a simple question: **“Why can this release ship, and what proof is missing?”**

It links a Jira issue to pull-request, test, deployment, and human-approval evidence; evaluates a release gate from that evidence; and exposes the same chain to Rovo through actions, a skill, an agent, and an MCP tool set.

Built for **Codegeist 2026 — Apps for Software Teams**.

## What it does

- Shows a **Verification Graph** panel on any Jira issue.
- Normalizes delivery events into one evidence schema with source, actor, timestamp, status, and source URL.
- Computes a deterministic gate state: `READY`, `MISSING`, `EXPIRED`, or `CONFLICT`.
- Distinguishes a missing check, a stale approval, and a newer failing event instead of treating every gap as the same problem.
- Accepts signed webhooks from CI/Bitbucket-style systems with HMAC verification and replay protection.
- Records human approvals from the Jira UI with the invoking account ID.
- Exposes read-only Rovo actions and MCP tools, plus a `rovo:skill` and `rovo:agent`, so an assistant can explain the gate with traceable evidence IDs.

## Evidence model

Each evidence record contains:

```json
{
  "id": "ev-...",
  "issueKey": "MOBL-57",
  "sourceSystem": "bitbucket",
  "externalId": "pr-482",
  "eventType": "pull_request_merged",
  "actor": "Maya Chen",
  "occurredAt": "2026-11-18T00:00:00.000Z",
  "receivedAt": "2026-11-18T00:01:00.000Z",
  "status": "PASS",
  "sourceUrl": "https://bitbucket.org/.../pull-requests/482",
  "details": "Merged after two approvals",
  "payloadRef": "",
  "signatureValid": true
}
```

The required checks are:

1. `pull_request_merged`
2. `tests_passed`
3. `deploy_success`
4. `human_approval`

Ingestion is idempotent by `issueKey + sourceSystem + externalId + eventType`. A newer failing event supersedes an older passing event and produces a `CONFLICT`. A human approval older than seven days is `EXPIRED`.

## Architecture

```text
Bitbucket / CI ──signed webhook──> Forge web trigger ──> normalize ──> Forge KVS
                                                             │
Jira issue panel / UI Kit <── resolver / gate evaluation <──┘
          │
          ├── rovo:action + rovo:skill ──> rovo:agent
          └── rovo:mcp ──> read-only MCP tools
```

The domain logic in `src/domain/` contains no Forge imports. Atlassian-specific code lives in `src/adapters/` and `src/index.js`, so the evidence model and gate rules can be tested and exported independently.

## Repository layout

- `src/domain/evidence.js` — pure evidence model, normalization, merge, and gate evaluation.
- `src/adapters/storage.js` — Forge KVS adapter.
- `src/adapters/signature.js` — HMAC signature and replay-window verification.
- `src/lib/service.js` — application service used by resolvers and Rovo actions.
- `src/frontend/index.jsx` — UI Kit issue panel.
- `src/index.js` — resolver, web trigger, and Rovo action entry points.
- `skills/release-gate-audit/SKILL.md` — Rovo skill instructions.
- `scripts/send-webhook.mjs` — signed webhook example sender.
- `tests/evidence.test.js` — unit tests for the domain and signature logic.
- `INSTALLATION.md` — judge setup instructions.
- `SUBMISSION.md` — Codegeist submission summary.
- `PRIVACY.md` and `TERMS.md` — distribution notices.

## Local checks

Use Node.js 22.23.4+ or 24.x.

```bash
npm install
npm test
npx forge lint
```

## License

MIT. See `LICENSE`.
