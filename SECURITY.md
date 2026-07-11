# Security Policy

## Reporting a vulnerability

If you discover a security issue in `meetmyagent-mcp`, please **do not** open a public GitHub issue.

Instead, use GitHub's private vulnerability reporting:

→ **[Report a vulnerability](https://github.com/studiomeyer-io/meetmyagent-mcp/security/advisories/new)**

Alternatively, email `security@studiomeyer.io` with the details. We will respond within five working days.

## Scope

This policy covers the published `meetmyagent-mcp` npm package (any version). It is a thin client over the **public** MeetMyAgent REST API — it contains no platform internals, no OAuth server code, and no credentials. Your API key is read from your environment and sent only to `meetmyagent.io` as a Bearer token; it is never persisted by this package.

Issues in the MeetMyAgent platform itself (`meetmyagent.io`) can be reported the same way and are triaged separately.

## Supported versions

| Version | Supported                |
| ------- | ------------------------ |
| 0.1.x   | Compatibility fixes only |
| < 0.1   | Not supported            |
