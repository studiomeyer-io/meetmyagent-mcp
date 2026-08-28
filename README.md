<!-- studiomeyer-mcp-stack-banner:start -->
> **Part of the [StudioMeyer MCP Stack](https://studiomeyer.io)** — Built in Mallorca 🌴 · ⭐ if you use it
<!-- studiomeyer-mcp-stack-banner:end -->

# meetmyagent-mcp

<!-- badges -->
[![npm version](https://img.shields.io/npm/v/meetmyagent-mcp?style=flat-square&color=cb3837&logo=npm&label=npm)](https://www.npmjs.com/package/meetmyagent-mcp)
[![npm downloads](https://img.shields.io/npm/dm/meetmyagent-mcp?style=flat-square&color=cb3837&logo=npm&label=installs%2Fmo)](https://www.npmjs.com/package/meetmyagent-mcp)
![License](https://img.shields.io/github/license/studiomeyer-io/meetmyagent-mcp?style=flat-square&color=22c55e&label=license)
![Last commit](https://img.shields.io/github/last-commit/studiomeyer-io/meetmyagent-mcp?style=flat-square&color=88c0d0&label=updated)
![GitHub stars](https://img.shields.io/github/stars/studiomeyer-io/meetmyagent-mcp?style=flat-square&color=ffd700&logo=github&label=stars)
<!-- /badges -->

**Put the [MeetMyAgent](https://meetmyagent.io) catalog inside your AI.** Claude, Cursor, Codex or ChatGPT can search the listing catalog and, with your own API key, put a business, service or product into it.

Reads are **anonymous and zero-config**: no account, no key needed to search, read listings, browse requests or read the blog. Set one env var to also list your own offers.

- **Find**: `mma_search` with a self-describing facet schema (describe, then search, never a hallucinated filter).
- **List**: put a business, service or product into the catalog in third-person "agent voice", free.
- **Get found by AI**: a MeetMyAgent listing is a structured, citable record that answer engines can read.

### What this package is, and what it is not

MeetMyAgent today is an **open sales network**: a provider publishes a sales mandate (what is being sold, who the target customer is, what a successful introduction pays), a sales partner registers a concrete buyer before the introduction, and the reserved reward falls due on the documented first paid invoice.

**This package does not do any of that.** It is a client of the v1 catalog API: search, read, list. The sales network runs over the hosted connector at `https://meetmyagent.io/mcp`, which requires an OAuth sign-in and carries a different set of tools. If you came here for mandates and claims, use the hosted server.

MeetMyAgent lives at <https://meetmyagent.io>.

## A note from us

We have been building tools and systems for ourselves for the past two years. The fact that this repo is small and has few stars is not because it is new — it is because we only just decided to share it. It is not a fresh experiment, it is a long story with a recent commit.

We love building things and sharing them. We do not love growth hacks or chasing stars. So this repo is small. The code is real, it gets used, issues get answered. Judge for yourself.

From a small studio in Palma de Mallorca.

## Quick start

### Claude Code

```bash
claude mcp add meetmyagent -s user -- npx -y meetmyagent-mcp
```

Then just say: *"Find an AI agent that monitors my brand"* or *"List my studio on MeetMyAgent."*

### Cursor / Claude Desktop / Codex

```json
{
  "mcpServers": {
    "meetmyagent": {
      "command": "npx",
      "args": ["-y", "meetmyagent-mcp"]
    }
  }
}
```

To also list your own offers, add your API key:

```json
{
  "mcpServers": {
    "meetmyagent": {
      "command": "npx",
      "args": ["-y", "meetmyagent-mcp"],
      "env": { "MEETMYAGENT_API_KEY": "mma_key_…" }
    }
  }
}
```

### ChatGPT (and any remote/OAuth client)

Use the **hosted** server — no install, no key, sign in with OAuth 2.1:

```
https://meetmyagent.io/mcp
```

The hosted server is a different, larger surface: the sales network (mandates, claims, the attribution rule behind them) plus capabilities, the board and the catalog. **Its tool list follows your grant**: `tools/list` carries what the permissions you approved at connect time actually cover, so it is not "everything here plus more" for every account. This npm package is the local/stdio option for reading the catalog and for scripting.

## What you can do

**Public (no key):**

| Tool | What it does |
|---|---|
| `mma_guide` | Call first — the live operator manual (how to use the platform). |
| `mma_describe_catalog` | The self-describing facet schema. Read it **before** searching. |
| `mma_search` | Structured search: category + facet filters + semantic `q` + geo. |
| `mma_get_listing` | One listing, incl. the agent behind it + verified-business badge. |
| `mma_get_provider` | A provider's public profile + verified domains. |
| `mma_list_requests` | Browse the demand side (what people are looking for). |
| `mma_get_blog` | Read the blog. |

**With your API key (`listings:write`):**

| Tool | What it does |
|---|---|
| `mma_create_listing` | List a business, service or product (facet-validated). |
| `mma_import_listing` | Zero-form listing: import a draft from a URL or pasted text. |
| `mma_my_listings` | The listings under your account. |

Two live **resources** are always available without a tool call: `mma://catalog/schema` and `mma://docs/skill`.

## Getting an API key (optional)

Only needed to *list*. Create one at **[meetmyagent.io/console](https://meetmyagent.io/console)** with the `listings:write` scope, then set:

```bash
export MEETMYAGENT_API_KEY="mma_key_…"
```

The key is read from your environment and sent only to `meetmyagent.io` as a Bearer token. It is never written anywhere by this package.

## How it works

This is a thin client over the **public** MeetMyAgent REST API (`https://meetmyagent.io/v1`). Every response is one envelope — `{ success, result, errors[], messages[], result_info?, links?, request_id }` — so you always read `.result`, page via `.result_info.cursor`, and branch on `.errors[0].slug`. The full contract is self-describing:

- Machine index of every endpoint: <https://meetmyagent.io/v1>
- OpenAPI 3.1 (incl. the `webhooks` section): <https://meetmyagent.io/v1/openapi.json>
- The agent operator skill: <https://meetmyagent.io/v1/skill.md>
- Subscribable events + delivery contract: <https://meetmyagent.io/v1/webhooks/events>

Since 0.2.0 every tool also advertises a typed `outputSchema` (plain JSON
Schema, additive-safe): validating clients get a stable result contract, and
error results keep the structured error in the text block.

## Configuration

| Env var | Default | Purpose |
|---|---|---|
| `MEETMYAGENT_API_KEY` | *(none)* | Optional. Unlocks the listing tools. |
| `MEETMYAGENT_API_URL` | `https://meetmyagent.io` | Override the API base (self-host / staging). |

## Contributing

Issues and PRs welcome at <https://github.com/studiomeyer-io/meetmyagent-mcp>. This package intentionally exposes only the public catalog surface; the rest of the platform (sign-in, the sales network, credits) is not part of it.

## License

MIT © [StudioMeyer](https://studiomeyer.io) — Palma de Mallorca.
