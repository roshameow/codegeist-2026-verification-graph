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
- Installation link: https://developer.atlassian.com/console/install/1f836625-9fc1-401a-8057-170d6d9d94e0?signature=AYABeOwePOK0qXUPnNKtMJydflAAAAADAAdhd3Mta21zAEthcm46YXdzOmttczp1cy13ZXN0LTI6NzA5NTg3ODM1MjQzOmtleS83MDVlZDY3MC1mNTdjLTQxYjUtOWY5Yi1lM2YyZGNjMTQ2ZTcAuAECAQB4CxqLTo9l4lqXuFjNim1xJM%2Bp%2F3TVP9xHS2BrU5DRRucBYe%2Btp%2FjUkw3QlkRu4swWxgAAAH4wfAYJKoZIhvcNAQcGoG8wbQIBADBoBgkqhkiG9w0BBwEwHgYJYIZIAWUDBAEuMBEEDCtNJE7IYzSjFCGZkgIBEIA7Jv0PuFQnTCHAN3JmhQ2bwAv2zxGs9pshUKlx3RVBhyck09dCh%2F1IpGzI2aqIdZE7ejUkOITQIGWIyVgAB2F3cy1rbXMAS2Fybjphd3M6a21zOmV1LXdlc3QtMTo3MDk1ODc4MzUyNDM6a2V5LzQ2MzBjZTZiLTAwYzMtNGRlMi04NzdiLTYyN2UyMDYwZTVjYwC4AQICAHi9bVMAkme4qVQX1fQHo6ePw3H40A7cGfz7yrmSfBWMXgE%2Fnql0DG4%2FVD3tjkYzDtu1AAAAfjB8BgkqhkiG9w0BBwagbzBtAgEAMGgGCSqGSIb3DQEHATAeBglghkgBZQMEAS4wEQQMWu4MyfYReuO2iQZcAgEQgDu%2BHGxcMaFw%2BGPz7ds1cHN33BLzJmQLA9x1wAgeOeE6Oco5AkhBboV7YoO91sfQFroQLnE8hr1wTz%2BWpgAHYXdzLWttcwBLYXJuOmF3czprbXM6dXMtZWFzdC0xOjcwOTU4NzgzNTI0MzprZXkvNmMxMjBiYTAtNGNkNS00OTg1LWI4MmUtNDBhMDQ5NTJjYzU3ALgBAgIAeDYASx0XCjkny4iLV6vz%2BKtEGSGT6kdt0QRpkn6D%2FlVEATt565bajj6TB9E0%2FdP22%2BoAAAB%2BMHwGCSqGSIb3DQEHBqBvMG0CAQAwaAYJKoZIhvcNAQcBMB4GCWCGSAFlAwQBLjARBAzxlYXaaALOdie2uVsCARCAO4LSg8PCM0zkwGdPSE6bdmJIKBAMf4G0vjLbWYHfX%2BJcE6ROIPbd8DdrQPXixoP2u0eDs1LyddFRh1s1AgAAAAAMAAAQAAAAAAAAAAAAAAAAAHE6kae1Ar%2F6Q%2B9IPhQSsqX%2F%2F%2F%2F%2FAAAAAQAAAAAAAAAAAAAAAQAAADIWgwRPjQVd9PA9a%2BmYZ0X1Sq0iABnQrtxCzRTXaxoqOdFEH9BHvd8vO%2BpADFT1pHW%2FJ9%2BRn2RSjuSk8ZZ%2F%2F4ER1iI%3D&product=jira
- Demo video: https://youtu.be/xPjgDwJXjEI
- Installation guide: https://github.com/roshameow/codegeist-2026-verification-graph/blob/main/INSTALLATION.md

## Notes for judges

Open any Jira issue, choose **Apps → Verification Graph**, and click **Load demo evidence**. The full chain appears immediately. Use **Simulate failed test** to see CONFLICT handling and **Approve release** to see a human approval written from the current user context.
