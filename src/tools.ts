/**
 * The toolset. Public tools work with zero config (anonymous marketplace reads).
 * Account tools need the user's own API key (MEETMYAGENT_API_KEY) and are only
 * registered when one is present. Tool NAMES mirror the hosted MeetMyAgent MCP
 * so a developer moving between the local and hosted server sees one surface.
 *
 * Nothing here is secret: every schema mirrors the public /v1/openapi.json and
 * every handler calls a documented public endpoint. Escrow deals + credits live
 * on the hosted, OAuth-gated server (meetmyagent.io/mcp) — by design.
 */
import type { MmaClient } from "./client.js";

export interface Tool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  /**
   * Typed results (0.2.0): plain JSON-Schema contract of the STRUCTURED
   * result, advertised in tools/list. Conservative by design — `required`
   * holds only fields the API always emits, and objects stay OPEN (JSON
   * Schema's default `additionalProperties: true`) so additive API evolution
   * never breaks a validating client. Success results always carry a
   * structuredContent OBJECT matching this; error results carry none
   * (validating clients only exempt errors WITHOUT structuredContent).
   */
  outputSchema?: Record<string, unknown>;
  account?: boolean;
  run(args: Record<string, unknown>, client: MmaClient): Promise<unknown>;
}

/* ── shared outputSchema fragments (mirror the public /v1 views) ── */

const LISTING = {
  type: "object",
  description: "A public listing.",
  properties: {
    id: { type: "string" },
    category: { type: "string" },
    title: { type: "string" },
    description: { type: "string" },
    status: { type: "string", enum: ["draft", "active", "paused", "archived"] },
    priceCents: { type: "number" },
    currency: { type: "string" },
    location: { type: "object" },
    media: { type: "array", items: { type: "string" } },
    attributes: { type: "object" },
    aiVisibilityScore: { type: "number" },
    ratingAvg: { type: "number" },
    ratingCount: { type: "number" },
    provider: { type: "object" },
    domainVerified: { type: "boolean" },
    boosted: { type: "boolean" },
  },
  required: ["id", "category", "title", "description", "status"],
};

const LINKS = {
  type: "array",
  description: "Next-action links — chain by following `rel`, never by rebuilding URLs.",
  items: {
    type: "object",
    properties: { rel: { type: "string" }, method: { type: "string" }, href: { type: "string" } },
    required: ["rel", "method", "href"],
  },
};

const PAGE = {
  type: "object",
  description: "Pagination info.",
  properties: { count: { type: "number" }, cursor: { type: ["string", "null"] } },
};

const BLOG_POST = {
  type: "object",
  properties: {
    slug: { type: "string" },
    locale: { type: "string" },
    title: { type: "string" },
    description: { type: "string" },
    body: { type: "string" },
    tags: { type: "array", items: { type: "string" } },
  },
  required: ["slug", "title"],
};

const q = (path: string, params: Record<string, unknown>): string => {
  const usp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== null && v !== "") usp.set(k, String(v));
  const s = usp.toString();
  return s ? `${path}?${s}` : path;
};

export const PUBLIC_TOOLS: Tool[] = [
  {
    name: "mma_guide",
    description:
      "ALWAYS call this first when a user connects or asks what MeetMyAgent is. Returns the live agent operator manual (invariants, the uniform response envelope, the search/list/deal flows, webhooks, error recovery). Read it back to the user, then help them list or find something.",
    inputSchema: { type: "object", properties: {} },
    outputSchema: {
      type: "object",
      properties: { skill: { type: "string", description: "The operator manual, markdown." } },
      required: ["skill"],
    },
    async run(_args, client) {
      return { skill: await client.text("/v1/skill.md") };
    },
  },
  {
    name: "mma_describe_catalog",
    description:
      "Read the self-describing facet schema BEFORE searching or listing. Without a category it lists all categories (with live counts); with a category it returns that category's filterable facets, types and allowed enum values. Only use facet keys + values it returns — never invent them.",
    inputSchema: {
      type: "object",
      properties: { category: { type: "string", description: "Optional category slug (e.g. products, businesses, ai-agents, real-estate)." } },
    },
    outputSchema: {
      type: "object",
      properties: {
        categories: { type: "array", description: "All categories with live counts.", items: { type: "object" } },
        category: { type: "object", description: "The requested category (when a slug was given)." },
        facets: { type: "array", description: "Facet definitions: key, type, allowed values, distributions.", items: { type: "object" } },
        usage: { type: "string" },
      },
      required: ["categories", "facets", "usage"],
    },
    async run(args, client) {
      const env = await client.get(q("/v1/catalog/schema", { category: args["category"] }));
      return env.result;
    },
  },
  {
    name: "mma_search",
    description:
      "Structured marketplace search: a category + facet filters, an optional natural-language `q`, and an optional geo radius. Cursor-paginated (pass `cursor` back until null). Call mma_describe_catalog first so your filters use real facet keys.",
    inputSchema: {
      type: "object",
      properties: {
        q: { type: "string", description: "Optional natural-language query (semantic ranking)." },
        category: { type: "string", description: "Category slug." },
        filters: {
          type: "array",
          description: "Structured facet filters.",
          items: {
            type: "object",
            properties: {
              facet: { type: "string" },
              op: { type: "string", enum: ["eq", "neq", "gt", "gte", "lt", "lte", "in", "contains", "between"] },
              value: {},
            },
            required: ["facet", "op", "value"],
          },
        },
        sort: { type: "string", enum: ["relevance", "price_asc", "price_desc", "newest", "ai_visibility"] },
        cursor: { type: "string" },
        limit: { type: "number", minimum: 1, maximum: 100 },
      },
    },
    outputSchema: {
      type: "object",
      properties: { items: { type: "array", items: LISTING }, page: PAGE },
      required: ["items"],
    },
    async run(args, client) {
      const env = await client.post("/v1/catalog/search", args);
      return { items: env.result, page: env.result_info };
    },
  },
  {
    name: "mma_get_listing",
    description:
      "Fetch one listing by id — full detail incl. the agent/provider behind it, the verified-business badge, and next-action `links`. The human-readable page is https://meetmyagent.io/en/listings/{id}.",
    inputSchema: { type: "object", properties: { id: { type: "string" } }, required: ["id"] },
    outputSchema: {
      type: "object",
      properties: { listing: LISTING, links: LINKS },
      required: ["listing"],
    },
    async run(args, client) {
      const env = await client.get(`/v1/listings/${encodeURIComponent(String(args["id"]))}`);
      return { listing: env.result, links: env.links };
    },
  },
  {
    name: "mma_get_provider",
    description: "The public profile of a provider (the 'agent' behind listings), incl. its verified domains.",
    inputSchema: { type: "object", properties: { id: { type: "string" } }, required: ["id"] },
    outputSchema: {
      type: "object",
      properties: {
        id: { type: "string" },
        name: { type: "string" },
        bio: { type: "string" },
        verifiedDomains: { type: "array", items: { type: "string" } },
      },
      required: ["id"],
    },
    async run(args, client) {
      const env = await client.get(`/v1/providers/${encodeURIComponent(String(args["id"]))}`);
      return env.result;
    },
  },
  {
    name: "mma_list_requests",
    description: "Browse the demand side — things people are actively looking for. Filter by status, category or tag. Answer one by pointing the user to https://meetmyagent.io/en/requests.",
    inputSchema: {
      type: "object",
      properties: {
        status: { type: "string", enum: ["open", "answered", "closed"] },
        category: { type: "string" },
        tag: { type: "string" },
      },
    },
    outputSchema: {
      type: "object",
      properties: {
        requests: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: { type: "string" },
              title: { type: "string" },
              body: { type: "string" },
              status: { type: "string", enum: ["open", "answered", "closed"] },
              tags: { type: "array", items: { type: "string" } },
            },
            required: ["id", "title"],
          },
        },
        page: PAGE,
      },
      required: ["requests"],
    },
    async run(args, client) {
      const env = await client.get(q("/v1/requests", args));
      return { requests: env.result, page: env.result_info };
    },
  },
  {
    name: "mma_get_blog",
    description:
      "Read the MeetMyAgent blog: a slug returns one post (as `post`), no slug lists published posts (as `posts`).",
    inputSchema: {
      type: "object",
      properties: { slug: { type: "string" }, locale: { type: "string", enum: ["en", "de"] } },
    },
    outputSchema: {
      type: "object",
      properties: {
        posts: { type: "array", description: "Published posts (list mode).", items: BLOG_POST },
        post: { ...BLOG_POST, description: "One post (slug mode)." },
        jsonld: { type: "object", description: "BlogPosting JSON-LD (slug mode)." },
      },
    },
    async run(args, client) {
      const slug = args["slug"] ? `/${encodeURIComponent(String(args["slug"]))}` : "";
      const env = await client.get(q(`/v1/blog${slug}`, { locale: args["locale"] }));
      // structuredContent must be a JSON OBJECT (spec): the list mode returns a
      // bare array → wrap as { posts }; the slug mode already IS { post, jsonld }
      return Array.isArray(env.result) ? { posts: env.result } : env.result;
    },
  },
];

export const ACCOUNT_TOOLS: Tool[] = [
  {
    name: "mma_create_listing",
    description:
      "List a business, service or product on MeetMyAgent (free, facet-validated). Call mma_describe_catalog first and use ONLY its facet keys + enum values in `attributes`. Write in third-person agent voice ('Acme Studio offers …'). Needs an API key with the listings:write scope.",
    account: true,
    inputSchema: {
      type: "object",
      properties: {
        category: { type: "string" },
        title: { type: "string", minLength: 3, maxLength: 200 },
        description: { type: "string", minLength: 1, maxLength: 20000 },
        priceCents: { type: "number", minimum: 0 },
        currency: { type: "string", description: "3-letter ISO code, e.g. EUR." },
        media: { type: "array", items: { type: "string" }, description: "http(s) image URLs (max 20)." },
        attributes: { type: "object", description: "Facet values validated against the category schema." },
      },
      required: ["category", "title", "description"],
    },
    outputSchema: {
      type: "object",
      properties: { listing: LISTING, links: LINKS },
      required: ["listing"],
    },
    async run(args, client) {
      const env = await client.post("/v1/listings", args, true);
      return { listing: env.result, links: env.links };
    },
  },
  {
    name: "mma_import_listing",
    description:
      "Zero-form listing: import a draft from a URL or pasted text (quarantined extraction). Returns a draft + a gapReport of what is still missing; fill the gaps, then publish from the console. Needs an API key with the listings:write scope.",
    account: true,
    inputSchema: {
      type: "object",
      properties: {
        url: { type: "string", description: "A page to import (a listing/product/profile URL)." },
        text: { type: "string", description: "Or raw text describing the offer." },
      },
    },
    outputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "Intake job id." },
        status: { type: "string" },
        draftListingId: { type: "string" },
        sourceUrl: { type: "string" },
        gapReport: { type: "object", description: "What is still missing before publish." },
      },
      required: ["id", "status"],
    },
    async run(args, client) {
      const env = await client.post("/v1/intake/imports", args, true);
      return env.result;
    },
  },
  {
    name: "mma_my_listings",
    description: "List the listings under your own account (needs your API key).",
    account: true,
    inputSchema: { type: "object", properties: {} },
    outputSchema: {
      type: "object",
      properties: { listings: { type: "array", items: LISTING } },
      required: ["listings"],
    },
    async run(_args, client) {
      const env = await client.get("/v1/listings?provider=me", true);
      return { listings: env.result };
    },
  },
];

export const ALL_TOOLS = [...PUBLIC_TOOLS, ...ACCOUNT_TOOLS];
