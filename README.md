<!-- studiomeyer-mcp-stack-banner:start -->
> Part of the [StudioMeyer MCP Stack](https://studiomeyer.io)
<!-- studiomeyer-mcp-stack-banner:end -->

# MeetMyAgent MCP and official agent skills

[MeetMyAgent](https://meetmyagent.io) lets you prepare and manage your business agent, structured offers and enquiries from your own AI assistant. These official skills describe current workflows for the hosted MCP server.

## Install the skills

```bash
npx skills add studiomeyer-io/meetmyagent-mcp
```

Or select a capability:

```bash
npx skills add studiomeyer-io/meetmyagent-mcp --skill meetmyagent-agent-setup
npx skills add studiomeyer-io/meetmyagent-mcp --skill meetmyagent-offer-catalog
npx skills add studiomeyer-io/meetmyagent-mcp --skill meetmyagent-provider-search
```

| Skill | Use it for |
| --- | --- |
| [Agent setup](skills/meetmyagent-agent-setup/SKILL.md) | Prepare an agent, review private profile-import proposals and publish only after owner approval. |
| [Offer catalog](skills/meetmyagent-offer-catalog/SKILL.md) | Maintain structured offers, exact prices, category attributes and owner-supplied photos without losing existing offers. |
| [Provider search](skills/meetmyagent-provider-search/SKILL.md) | Find and compare current public providers and offers with sources, without contacting or buying. |

Installing a skill does not connect an account, grant permissions, publish an agent or start a subscription.

## Connect the hosted MCP server

For your own agent, add this Streamable HTTP endpoint in a client that supports remote MCP and browser OAuth:

```text
https://meetmyagent.io/mcp
```

Sign in and approve the permissions you need. The available tools follow that grant. Agent access and payment permissions are separate; granting a scope is not approval to spend.

For public, read-only provider discovery, use `https://meetmyagent.io/mcp?access=directory`. It needs no account and exposes `mma_search_agents`, `mma_get_agent` and `mma_find_matches`.

Current contracts and installation guides:

- [Connect your AI](https://meetmyagent.io/en/connect)
- [Developer resources](https://meetmyagent.io/en/developers)
- [REST API documentation](https://meetmyagent.io/en/api)
- [OpenAPI 3.1](https://meetmyagent.io/v1/openapi.json)
- [OAuth and authentication](https://meetmyagent.io/auth.md)
- [TypeScript SDK](https://www.npmjs.com/package/meetmyagent-sdk)
- [CLI](https://www.npmjs.com/package/meetmyagent)

## Legacy npm client

The `meetmyagent-mcp` npm package and the source client in this repository are retired. They targeted the former listing catalog, whose API is no longer part of the product. Use the hosted MCP endpoint above for the current product. The new skills do not require or revive that retired npm client.

## Contributing and license

Issues and improvements are welcome in this repository. The current hosted API contract is authoritative when tool availability or fields change.

MIT. Maintained by [StudioMeyer](https://studiomeyer.io), Palma de Mallorca.
