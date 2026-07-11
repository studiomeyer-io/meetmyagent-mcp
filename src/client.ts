/**
 * Thin HTTP client for the PUBLIC MeetMyAgent API (https://meetmyagent.io/v1).
 * Native fetch, no dependencies, no platform internals — every call hits a
 * documented public endpoint (see /v1/openapi.json). Anonymous by default; a
 * Bearer token (the user's own API key) is attached only for write tools.
 */

export const VERSION = "0.2.0";

export interface ClientOptions {
  baseUrl: string;
  /** the user's own API key (create at meetmyagent.io/console). Never bundled. */
  token?: string | undefined;
}

export interface Envelope<T = unknown> {
  success: boolean;
  result: T | null;
  errors?: Array<{ slug: string; message: string; documentation_url?: string }>;
  result_info?: unknown;
  links?: unknown;
  request_id?: string;
}

export class MmaClient {
  constructor(private readonly o: ClientOptions) {}

  hasToken(): boolean {
    return !!this.o.token;
  }

  private base(): string {
    return this.o.baseUrl.replace(/\/+$/, "");
  }

  /** GET a raw text document (e.g. /v1/skill.md) — not the envelope. */
  async text(path: string): Promise<string> {
    const res = await fetch(`${this.base()}${path}`, { headers: { "user-agent": `meetmyagent-mcp/${VERSION}` } });
    return res.text();
  }

  get<T>(path: string, auth = false): Promise<Envelope<T>> {
    return this.req<T>("GET", path, undefined, auth);
  }

  post<T>(path: string, body: unknown, auth = false): Promise<Envelope<T>> {
    return this.req<T>("POST", path, body, auth);
  }

  private async req<T>(method: string, path: string, body?: unknown, auth = false): Promise<Envelope<T>> {
    const headers: Record<string, string> = { "content-type": "application/json", "user-agent": `meetmyagent-mcp/${VERSION}` };
    if (auth) {
      if (!this.o.token) {
        throw new Error(
          "This action needs an API key. Set MEETMYAGENT_API_KEY (create one at https://meetmyagent.io/console with the listings:write scope).",
        );
      }
      headers["authorization"] = `Bearer ${this.o.token}`;
    }
    let res: Response;
    try {
      res = await fetch(`${this.base()}${path}`, {
        method,
        headers,
        ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
      });
    } catch (e) {
      throw new Error(`network error calling ${path}: ${e instanceof Error ? e.message : String(e)}`);
    }
    const env = (await res.json().catch(() => ({
      success: false,
      result: null,
      errors: [{ slug: "bad_response", message: `non-JSON response (${res.status})` }],
    }))) as Envelope<T>;
    if (!env.success) {
      const er = env.errors?.[0];
      throw new Error(
        `${er?.slug ?? "error"} (${res.status}): ${er?.message ?? "request failed"}${er?.documentation_url ? ` — ${er.documentation_url}` : ""}`,
      );
    }
    return env;
  }
}
