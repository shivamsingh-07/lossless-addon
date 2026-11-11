/** Fetch-API helpers shared by every runtime: JSON/HTML responses and a small router. */

export function json(status: number, body: unknown, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", ...headers },
  });
}

export function html(body: string, headers: Record<string, string> = {}): Response {
  return new Response(body, {
    status: 200,
    headers: { "content-type": "text/html; charset=utf-8", ...headers },
  });
}

/**
 * CORS: the data is public and read-only and no cookies are involved, so any origin may read it.
 * Browser-based clients need this, and BitChord's auth headers force a preflight request.
 */
export function withCors(response: Response): Response {
  response.headers.set("access-control-allow-origin", "*");
  return response;
}

export function preflight(request: Request): Response {
  return withCors(
    new Response(null, {
      status: 204,
      headers: {
        "access-control-allow-methods": "GET, HEAD, OPTIONS",
        "access-control-allow-headers":
          request.headers.get("access-control-request-headers") ?? "Content-Type, Range, X-BitChord-Token, X-BitChord-Proof",
        "access-control-max-age": "86400",
      },
    }),
  );
}

/** Repeated slashes count as one and a trailing slash is ignored, so `//manifest.json` and `/search/` still match. */
function normalizePath(pathname: string): string {
  const collapsed = pathname.replace(/\/{2,}/g, "/");
  return collapsed.length > 1 && collapsed.endsWith("/") ? collapsed.slice(0, -1) : collapsed;
}

interface RouteContext {
  request: Request;
  url: URL;
  /** Capture groups from the route pattern. */
  params: string[];
}

export type RouteHandler = (ctx: RouteContext) => Response | Promise<Response>;

export class Router {
  private readonly routes: Array<{ pattern: RegExp; handler: RouteHandler }> = [];

  get(pattern: RegExp, handler: RouteHandler): void {
    this.routes.push({ pattern, handler });
  }

  async handle(request: Request, url: URL): Promise<Response> {
    if (request.method !== "GET" && request.method !== "HEAD") {
      return json(405, { error: "method not allowed" });
    }
    const path = normalizePath(url.pathname);
    for (const route of this.routes) {
      const match = route.pattern.exec(path);
      if (match) return route.handler({ request, url, params: match.slice(1) });
    }
    return json(404, { error: "not found" });
  }
}
