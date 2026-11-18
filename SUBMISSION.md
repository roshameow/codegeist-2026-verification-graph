# Codegeist 2026 submission materials

## Title

Verification Graph — Auditable release evidence for software teams

## Category

Apps for Software Teams

## Short description

Verification Graph turns scattered Jira, Bitbucket/CI, deployment, and approval signals into one auditable release-evidence chain. It shows exactly why a release gate is ready or blocked, and lets Rovo explain the decision with source-linked evidence.

## How it meets the main technology requirement

The project is an Atlassian Forge app with a `manifest.yml`, UI Kit `jira:issuePanel`, Forge functions, Forge KVS storage, and a signed Forge web trigger. It integrates Jira (primary installation surface) and accepts Bitbucket/CI-style delivery events through the web trigger.

## Bonus prizes

- **Best Agents — Rovo/Assignable agents**: `rovo:agent`, reusable `rovo:skill` with `SKILL.md`, and four `action` modules.
- **Best app with Atlassian MCP**: `rovo:mcp` module exposing three read-only tools.

## Key features

- Normalized evidence schema with deduplication and replay protection.
- Deterministic gate states: READY, MISSING, EXPIRED, CONFLICT.
- Timeline view with source links and timestamps.
- Human approval recorded from the invoking user's context.
- Rovo agent and MCP tools that cite evidence IDs instead of inventing facts.

## Links

- Source code: https://github.com/roshameow/codegeist-2026-verification-graph
- Installation link: INSTALL_LINK_PLACEHOLDER
- Demo video: VIDEO_URL_PLACEHOLDER
- Installation guide: https://github.com/roshameow/codegeist-2026-verification-graph/blob/main/INSTALLATION.md

## Notes for judges

Open any Jira issue, choose **Apps → Verification Graph**, and click **Load demo evidence**. The full chain appears immediately. Use **Simulate failed test** to see CONFLICT handling and **Approve release** to see a human approval written from the current user context.
