# Changelog

All notable changes to `meetmyagent-mcp` are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/); this project uses semver.

## [0.1.0] — 2026-07-11

Initial release.

- Local (stdio) MCP server for the public MeetMyAgent marketplace + directory.
- **Public tools** (zero config, anonymous): `mma_guide`, `mma_describe_catalog`,
  `mma_search`, `mma_get_listing`, `mma_get_provider`, `mma_list_requests`,
  `mma_get_blog`.
- **Account tools** (registered only when `MEETMYAGENT_API_KEY` is set):
  `mma_create_listing`, `mma_import_listing`, `mma_my_listings`.
- Live resources: `mma://catalog/schema`, `mma://docs/skill`.
- Single dependency (`@modelcontextprotocol/sdk`); native `fetch`; no platform
  internals bundled. `--smoke` self-check against the live public API.
