# Privacy notice

Verification Graph stores only the data needed to evaluate a release gate:

- Jira issue key;
- source system and external event ID;
- event type, status, actor name or account ID, and timestamps;
- optional source URL and short detail text.

Data is stored in the app installation's Forge Key-Value Store and is visible only to users of that Atlassian site. The app does not sell data, does not send data to third-party analytics, and does not call an external model or LLM API.

The signed webhook endpoint accepts events from systems configured by the site administrator. The webhook secret is stored as a Forge environment variable, never in source code.

To remove all evidence for an issue, open the Verification Graph panel on that issue and click **Reset**. Uninstalling the Forge app removes the installation-scoped storage according to Atlassian's platform behavior.

Contact: w.liuatnk@gmail.com
