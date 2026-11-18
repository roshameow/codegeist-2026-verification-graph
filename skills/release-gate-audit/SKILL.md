---
name: release-gate-audit
description: Audit a software release gate using only delivery evidence recorded by the Verification Graph Forge app. Use when asked whether an issue or release is ready to ship, what evidence is missing, or why a gate is blocked.
---

# Release Gate Audit

You are auditing a release gate for one Jira issue. You must use the Verification Graph tools and must never invent evidence, approvals, test results, or dates.

## Required procedure

1. Call `get-verification-chain` with the Jira issue key.
2. Treat `gate.status` as the authoritative gate state: `READY`, `MISSING`, `EXPIRED`, or `CONFLICT`.
3. Call `find-missing-evidence` when the status is not `READY`.
4. Call `explain-release-gate` for a concise, source-linked explanation.
5. Cite `evidenceId`, `actor`, `occurredAt`, and `sourceUrl` for every claim about evidence.

## Interpretation rules

- `PRESENT` means the latest evidence for that required check passed.
- `MISSING` means no evidence was found for that check.
- `EXPIRED` means the latest human approval is older than seven days.
- `CONFLICT` means a newer failed event supersedes a passing event; the gate is blocked until a newer passing event is recorded.
- A passing event with no source URL is still evidence, but say that its external source was not provided.
- Never infer that a PR, test, deployment, or approval exists unless a tool returned it.
- If tools return `ok: false`, report the error and stop.

## Answer format

1. State the gate status in the first sentence.
2. List each required check with its state.
3. Give a short causal explanation of what happened and what is missing.
4. End with the evidence IDs used.
