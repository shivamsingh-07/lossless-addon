import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import type { App } from "../app.js";

/**
 * Rebuilds the request URL from the request target as text. It is never resolved against a base:
 * `new URL("//manifest.json", base)` would read "manifest.json" as a host.
 */
function requestUrl(req: IncomingMessage): URL {
  const target = req.url?.startsWith("/") ? req.url : "/";
  return new URL(`http://${req.headers.host ?? "localhost"}${target}`);
}

function toRequest(req: IncomingMessage): Request {
  const headers = new Headers();
  for (const [name, value] of Object.entries(req.headers)) {
    if (Array.isArray(value)) for (const item of value) headers.append(name, item);
    else if (value !== undefined) headers.set(name, value);
  }
  return new Request(requestUrl(req), { method: req.method, headers });
}

async function serve(app: App, req: IncomingMessage, res: ServerResponse): Promise<void> {
  try {
    const response = await app.fetch(toRequest(req));
    res.writeHead(response.status, Object.fromEntries(response.headers));
    if (req.method === "HEAD") res.end();
    else res.end(Buffer.from(await response.arrayBuffer()));
  } catch (error) {
    app.logger.error("node adapter failed", error);
    if (!res.headersSent) res.writeHead(400);
    res.end();
  }
}

/** Wraps an App in a node:http server. Does not listen: the caller decides on the port. */
export function createNodeServer(app: App): Server {
  return createServer((req, res) => void serve(app, req, res));
}
