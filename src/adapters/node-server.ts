import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import type { App } from "../app.js";

/**
 * Rebuilds the request URL from the HTTP request target. The target is used as text, never
 * resolved against a base: resolving would read a leading `//` as a host (`//manifest.json`
 * becoming http://manifest.json/). Origin-form (`/path?query`) is the normal case;
 * absolute-form (`http://host/path`) is accepted, and `*` or anything unusable becomes `/`.
 */
function requestUrl(req: IncomingMessage): URL {
  const host = req.headers.host ?? "localhost";
  const target = req.url ?? "/";
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(target)) {
    const absolute = new URL(target);
    return new URL(`http://${host}${absolute.pathname}${absolute.search}`);
  }
  return new URL(`http://${host}${target.startsWith("/") ? target : "/"}`);
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
