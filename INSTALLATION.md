# Installation and judge instructions

## 1. Install the app

1. Open the installation link: `INSTALL_LINK_PLACEHOLDER`
2. Sign in to an Atlassian site where you are an administrator.
3. Review the requested scopes (`read:jira-work`, `storage:app`) and approve the installation.
4. Choose **Jira** as the product if prompted.

The app is installed at the site level. No external service, API key, or database is required for the normal demo.

## 2. Open the panel on a work item

1. Open any Jira issue you can edit.
2. In the issue toolbar, click the **Apps** quick-add menu (or the app icon if already pinned).
3. Choose **Verification Graph**.
4. The panel opens with a `MISSING` gate and an empty evidence timeline.

## 3. Demonstrate the main flow

In the panel:

1. Click **Load demo evidence**. The gate becomes `READY` and the timeline shows a PR, an initial failed test run, a passing re-run, a deployment, and a human approval.
2. Click **Simulate failed test**. The gate becomes `CONFLICT` because the newest test evidence is a failure.
3. Click **Approve release** to record a human approval from the signed-in account.
4. Click **Reset** to clear the issue's evidence.

All state is stored per Jira issue in Forge KVS. The demo buttons use the same normalization and merge pipeline as the signed webhook path.

## 4. Send signed webhook evidence (optional)

The web trigger URL is created from the deployed app and is not published in this repository, because anyone with the URL could call the trigger. To reproduce it, run:

```bash
forge webtrigger create \
  --functionKey delivery-evidence-webhook \
  --environment production \
  --product Jira \
  --site your-site.atlassian.net
```

Set a `WEBHOOK_SECRET` Forge variable before deploying:

```bash
forge variables set -e production WEBHOOK_SECRET "<random-secret>"
forge deploy -e production
```

Then send a signed event:

```bash
export WEBTRIGGER_URL="https://.../public/..."
export WEBHOOK_SECRET="<the same secret>"
node scripts/send-webhook.mjs MOBL-57 deploy_success PASS
```

The sender adds `x-vg-timestamp` and `x-vg-signature` headers. The app rejects stale timestamps, invalid signatures, and requests without an `issueKey`.

## 5. Rovo and MCP

The production app declares:

- four `action` modules (`get-verification-chain`, `find-missing-evidence`, `explain-release-gate`, `approve-release`);
- a `rovo:skill` called `release-gate-audit`;
- a `rovo:agent` called **Release Evidence Analyst**;
- a `rovo:mcp` module exposing the three read-only tools.

In Rovo Chat, ask: **“Why can this release ship?”** with the Jira issue in context. The agent should report the gate status and cite evidence IDs.

External MCP clients that want the Forge tools must be enabled by an Atlassian organization administrator. The read-only tools are intended for Atlassian MCP and Rovo Studio.

## Troubleshooting

- **Panel does not appear**: make sure you have edit permission on the issue and select Verification Graph from the Apps quick-add menu.
- **No evidence after reload**: evidence is keyed by issue key and site; open the same issue and use Load demo evidence again.
- **Webhook returns 401**: confirm `WEBHOOK_SECRET` is set in the same environment as the web trigger URL and that the sender uses the timestamped HMAC format.
- **Rovo does not see evidence**: confirm the agent has the Jira issue in context and that the app is installed in Jira on that site.
