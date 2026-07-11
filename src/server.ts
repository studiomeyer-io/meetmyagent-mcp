/**
 * Builds the MCP server: registers the tools (public always; account tools only
 * when an API key is present) plus two live resources (catalog schema + the
 * operator skill). Low-level Server so tool inputSchemas are plain JSON Schema
 * that mirrors /v1/openapi.json — no zod, no private types.
 */
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { MmaClient, VERSION } from "./client.js";
import { PUBLIC_TOOLS, ACCOUNT_TOOLS, type Tool } from "./tools.js";

export { VERSION };

const INSTRUCTIONS = `MeetMyAgent is a free, AI-native marketplace + business directory. You act as the user's agent: find what they need and list what they offer, for people AND AI to discover.

Golden rules:
1. Call mma_guide first — it returns the live operator manual.
2. Describe before search: mma_describe_catalog for a category BEFORE mma_search or mma_create_listing. Facet keys + enum values come from the schema, never invented.
3. Write listings in third-person agent voice ("Acme Studio offers …").
4. Reads are anonymous; listing needs the user's own API key (MEETMYAGENT_API_KEY, scope listings:write, from meetmyagent.io/console). Escrow deals with human approval live on the hosted server meetmyagent.io/mcp — not here.
5. Don't poll for platform events — GET https://meetmyagent.io/v1/webhooks/events describes every subscribable event + the signed delivery contract (describe before you subscribe).`;

export function createServer(opts: { baseUrl: string; token?: string | undefined }): Server {
  const client = new MmaClient({ baseUrl: opts.baseUrl, token: opts.token });
  const tools: Tool[] = opts.token ? [...PUBLIC_TOOLS, ...ACCOUNT_TOOLS] : [...PUBLIC_TOOLS];
  const byName = new Map(tools.map((t) => [t.name, t]));

  const server = new Server(
    {
      name: "meetmyagent",
      title: "MeetMyAgent",
      version: VERSION,
      websiteUrl: "https://meetmyagent.io",
      icons: [{ src: "https://meetmyagent.io/icon.svg", mimeType: "image/svg+xml", sizes: ["any"] }],
    },
    { capabilities: { tools: {}, resources: {} }, instructions: INSTRUCTIONS },
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: tools.map((t) => ({
      name: t.name,
      description: t.description,
      inputSchema: t.inputSchema,
      // typed results (0.2.0) — advertised contract; success results always
      // carry a matching structuredContent object, error results never do
      ...(t.outputSchema ? { outputSchema: t.outputSchema } : {}),
    })),
  }));

  server.setRequestHandler(CallToolRequestSchema, async (req) => {
    const tool = byName.get(req.params.name);
    if (!tool) {
      return {
        isError: true,
        content: [{ type: "text", text: JSON.stringify({ error: { slug: "unknown_tool", message: `no tool named ${req.params.name}` } }) }],
      };
    }
    try {
      const result = await tool.run((req.params.arguments ?? {}) as Record<string, unknown>, client);
      const payload = (typeof result === "object" && result !== null ? result : { result }) as Record<string, unknown>;
      return { content: [{ type: "text", text: JSON.stringify(result) }], structuredContent: payload };
    } catch (e) {
      return {
        isError: true,
        content: [{ type: "text", text: JSON.stringify({ error: { message: e instanceof Error ? e.message : String(e) } }) }],
      };
    }
  });

  server.setRequestHandler(ListResourcesRequestSchema, async () => ({
    resources: [
      { uri: "mma://catalog/schema", name: "Catalog schema", description: "All categories + facets (fetched live).", mimeType: "application/json" },
      { uri: "mma://docs/skill", name: "Agent operator skill", description: "How to operate MeetMyAgent (fetched live).", mimeType: "text/markdown" },
    ],
  }));
  server.setRequestHandler(ReadResourceRequestSchema, async (req) => {
    const uri = req.params.uri;
    if (uri === "mma://catalog/schema") {
      const env = await client.get("/v1/catalog/schema");
      return { contents: [{ uri, mimeType: "application/json", text: JSON.stringify(env.result) }] };
    }
    if (uri === "mma://docs/skill") {
      return { contents: [{ uri, mimeType: "text/markdown", text: await client.text("/v1/skill.md") }] };
    }
    throw new Error(`unknown resource: ${uri}`);
  });

  return server;
}
