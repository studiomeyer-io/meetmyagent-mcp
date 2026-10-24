---
name: meetmyagent-offer-catalog
description: Create or update structured MeetMyAgent offers with category attributes, exact prices, and owner-supplied photos. Use for maintaining a business's offer catalog, including property, vehicle, accommodation, and service listings.
---

# MeetMyAgent offer catalog

Maintain the owner's offer catalog without losing existing offers or publishing unsupported information.

## Read the current catalog and schema

Use the owner's existing MCP connection at `https://meetmyagent.io/mcp`. If needed, guide browser OAuth through [Connect](https://meetmyagent.io/connect); never request credentials in chat. Check `mma_my_scopes`, then `mma_my_agent`. Reads need `agents:read`; uploads and `mma_agent_setup` need `agents:write`. Installing a skill does not connect an account or change a plan.

Fetch [the live offer schema](https://meetmyagent.io/v1/hosted/_schema/offers) before constructing category attributes or filters. Use [the operator guide](https://meetmyagent.io/skill.md) and [OpenAPI](https://meetmyagent.io/v1/openapi.json) for current contracts. An authenticated REST client can read the complete owner state at `GET /v1/me/agent`; public offers omit private state and cannot substitute for that read.

`services` in `mma_agent_setup` is the complete replacement list. Build it from the current owner catalog, apply only requested edits, and show additions, changes, and removals. Preserve stable `key` values for the same offers. Missing keys remove offers. Omitted commercial, category, attribute, and image fields preserve their existing value for the same key; `null` clears them. Do not send an empty list to mean "leave unchanged".

## Construct useful structured offers

Each offer has `key` and `name`; an optional short `description` explains the concrete service or item. Use the owner's actual terms and supplied facts.

- `category`: `real-estate`, `vehicle`, `accommodation`, or `service`; category-specific facts go in `attributes` using the live schema. Unknown attributes are rejected. Keep a generic offer uncategorized rather than guessing.
- `priceCents`: exact integer in minor currency units, paired with a known two-decimal ISO `currency`, such as `EUR`. For example, an owner-approved EUR 90 price is `9000`, not `90`. Do not invent a price, tax treatment, or a unit such as per-night when the source does not state it.
- `availability`: only the owner-stated `available`, `limited`, or `unavailable`. Absence is not evidence of stock or appointment availability.
- `checkoutUrl`: only the owner's authorized public HTTPS checkout URL. It hands the buyer to the provider; it does not verify a purchase, charge money through MMA, or authorize this assistant to spend.
- Real-estate `rooms` uses German room counts, distinct from `bedrooms`. Use explicit source values; do not infer either count. Read `offerBlockers[]` for required country-specific disclosures and obtain the owner's exact facts before publication. Product validation does not establish complete legal compliance.

Respect server-returned plan limits. Do not remove unrelated offers or start a subscription to fit a limit; describe the constraint and the available owner choice.

## Attach real photos and floor plans

For files supplied or authorized by the owner, call `mma_offer_image_upload` with actual padded Base64 bytes in `data_base64` and `content_type` equal to `image/png`, `image/jpeg`, or `image/webp`. Each decoded file is at most 5 MiB. No `data:` prefix; never invent file bytes or hashes. The server strips metadata and returns the agent-owned `hash`.

Attach that returned hash through an offer's `images` list:

```json
{
  "hash": "<the exact hash returned by the upload>",
  "kind": "photo",
  "alt": "A factual description of this supplied image"
}
```

Use `kind: "floorplan"` for an actual floor plan. At most 20 references fit one offer. Read any supplied image before describing it. Uploading stores a file but does not attach it or publish an offer. External image URLs and another agent's hashes are not upload references. An empty image list removes references; omit `images` when no image change is intended.

## Apply and verify

Show the complete intended catalog change and get approval before updating an already live agent: `mma_agent_setup` applies live updates immediately. Draft agents stay drafts.

For a stored before/after review, use the existing owner's agent and this proposal flow (`agents:write` for proposing/applying; `agents:read` for reading):

1. Call `mma_profile_import_propose` with `services` containing the complete intended replacement catalog, including every existing offer that should remain. Use the actual uploaded image hashes. Omit unrelated `profile`, `card`, and `faqs` fields; FAQ entries would be additions. This saves a private proposal without changing live offers.
2. Show the returned exact `diff`, including offer removals, and retain its returned `id` and SHA-256 `revision`. Get the owner's explicit approval of that exact displayed revision.
3. Call `mma_profile_import_approve` with that stored `id`, unchanged `revision`, and `confirm: true`. Send no regenerated catalog. Approval may change live offers immediately; it never publishes or resumes a draft or paused agent.
4. After an approval timeout, call `mma_profile_import_get` with `id`. It always returns `items[]`; inspect `items[0].status`. `applied` is the durable receipt, while `pending` is not success. Repeating approval of the same stored revision is idempotent. A stale/conflicting or expired proposal requires reading current owner state, proposing again, and obtaining approval of the new diff and revision. Do not create another proposal merely to retry an uncertain approval.

Read owner state after applying to verify services, `missing[]`, and `offerBlockers[]`. For a direct setup timeout, read owner state before retrying. Never bypass disclosure blockers by deleting a category. Publish a draft only after explicit owner approval with `mma_agent_publish` and resolve the returned blockers first.

For live offers verify the returned public page, images, and `mma_list_offers` with `{ "slug": "<actual slug>", "filter": { "category": "service" } }` when that category is relevant. The public REST equivalent is `GET /v1/hosted/:slug/offers` with an optional URL-encoded JSON `filter`. A public photo is available only while referenced by a live offer; a private upload preview is not evidence of publication.

Report offers changed or removed, attached images, publication state, and unresolved facts. A live direct page does not alone mean directory listing: AI Shop, profile completeness, offer disclosures, and a matching verified website are additional requirements.
