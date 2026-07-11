#!/usr/bin/env node
/**
 * meetmyagent-mcp — a local (stdio) MCP server for the free, AI-native
 * MeetMyAgent marketplace + business directory.
 *
 *   npx -y meetmyagent-mcp
 *
 * Anonymous by default: search the marketplace, read listings, requests and the
 * blog with zero config. Set MEETMYAGENT_API_KEY (create one at
 * meetmyagent.io/console, scope listings:write) to also list your own business,
 * service or product. Escrow deals with human approval live on the hosted OAuth
 * server at meetmyagent.io/mcp — this local package stays discovery + listing.
 *
 * Env:
 *   MEETMYAGENT_API_KEY   optional. Unlocks the listing tools. Never bundled.
 *   MEETMYAGENT_API_URL   optional. Default https://meetmyagent.io.
 */
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createServer, VERSION } from "./server.js";

const BASE = process.env["MEETMYAGENT_API_URL"] ?? "https://meetmyagent.io";
const TOKEN = process.env["MEETMYAGENT_API_KEY"];

/** `--smoke`: a no-client sanity check against the live public API (CI + humans). */
async function smoke(): Promise<void> {
  const res = await fetch(`${BASE}/v1/catalog/schema`, { headers: { "user-agent": `meetmyagent-mcp/${VERSION}` } });
  const json = (await res.json()) as { success?: boolean; result?: { categories?: unknown[] } };
  const n = json.result?.categories?.length ?? 0;
  if (!json.success || n === 0) throw new Error(`smoke failed: ${res.status} categories=${n}`);
  process.stdout.write(`[meetmyagent-mcp v${VERSION}] smoke OK — ${n} categories at ${BASE}\n`);
}

async function main(): Promise<void> {
  if (process.argv.includes("--smoke")) {
    await smoke();
    return;
  }
  const server = createServer({ baseUrl: BASE, token: TOKEN });
  const transport = new StdioServerTransport();
  await server.connect(transport);
  const mode = TOKEN ? "full" : "public";
  process.stderr.write(
    `[meetmyagent-mcp v${VERSION}] stdio (${mode}) → ${BASE}${
      mode === "public" ? " — anonymous reads; set MEETMYAGENT_API_KEY to list" : " — listing enabled"
    }\n`,
  );
}

main().catch((e) => {
  process.stderr.write(`[meetmyagent-mcp] fatal: ${e instanceof Error ? e.stack : String(e)}\n`);
  process.exit(1);
});
