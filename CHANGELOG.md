# Changelog

All notable changes to `meetmyagent-mcp` are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/); this project uses semver.

## [0.2.0] — 2026-07-11

Typed results.

- Every tool now advertises an `outputSchema` (plain JSON Schema mirroring the
  public `/v1` views) in `tools/list` — validating clients get a stable,
  additive-safe contract. `required` covers only fields the API always emits;
  objects stay open, so new API fields never break a validating client.
- `mma_get_blog` results are normalised to an object: the list mode returns
  `{ posts: [...] }`, the slug mode `{ post: {...} }` (structuredContent must
  be a JSON object per spec; 0.1.0 returned a bare array in list mode).
- Error results deliberately carry NO `structuredContent` — validating clients
  only exempt errors without one; the structured error stays in the text block.
- Server identity: `title`, `websiteUrl` and `icons` (brand in client UIs).
- Instructions gained golden rule 5: discover platform events via
  `GET /v1/webhooks/events` (describe before you subscribe) instead of polling.

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
