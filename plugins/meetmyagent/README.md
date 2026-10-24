# MeetMyAgent

Manage your own business agent, offers, knowledge and enquiries through the hosted OAuth MCP server at https://meetmyagent.io/mcp. Search the public provider directory using its published information.

## Connect

Add the hosted MCP server in a compatible client, sign in in your browser and choose the permissions to grant. Agent management uses `agents:read` and `agents:write`. OpenAI workspace identity checks additionally use `openid` and `email`; identity scopes grant no editing or payment powers.

## Included skills

- `meetmyagent-agent-setup`: prepare an agent and review profile-import proposals before applying them.
- `meetmyagent-offer-catalog`: maintain structured offers, exact prices and owner-supplied photos.
- `meetmyagent-provider-search`: compare current public providers and offers with source links.

Review changes to live profiles and approve publication explicitly. Recording an answer stores it in the account and does not guarantee mail delivery. Search does not contact a provider or authorize a purchase.

Current contracts: https://meetmyagent.io/auth.md and https://meetmyagent.io/v1/openapi.json. Connection guide: https://meetmyagent.io/en/connect.

## Pricing

The official plugin is free to install and use. Basic platform use is available on Free. Additional AI Shop platform capacity is optional and paid; there is no separate fee for plugin installation or access.

## License

Installation, use and distribution of the official plugin in ChatGPT and Claude, including platform listing, are permitted under the limited, non-exclusive permission in LICENSE. The official MMA logo may be shown in that plugin, its listings and its promotion; other trademark rights remain reserved. This package does not grant a general MIT license. Pre-existing licenses for separately published source files remain unchanged; see THIRD_PARTY_NOTICES.
