/** Fetch-API helpers shared by every runtime: JSON/HTML responses and a small router. */

export function json(status: number, body: unknown, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", ...headers },
  });
}

export function html(body: string): Response {
  return new Response(body, { headers: { "content-type": "text/html; charset=utf-8" } });
}

interface RouteContext {
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
    for (const route of this.routes) {
      const match = route.pattern.exec(url.pathname);
      if (match) return route.handler({ url, params: match.slice(1) });
    }
    return json(404, { error: "not found" });
  }
}
