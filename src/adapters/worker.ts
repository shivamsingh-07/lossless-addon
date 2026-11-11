/**
 * Cloudflare Workers entry point. Configuration comes from Worker bindings:
 * variables in wrangler.toml and the SECRET_ID secret (`wrangler secret put SECRET_ID`).
 * Nothing here or in the shared code needs the nodejs_compat flag.
 */
import { createApp, type App } from "../app.js";
import { loggerFromEnv } from "../logger.js";

/** One app per env object, so the search cache and provider state live as long as the isolate does. */
const apps = new WeakMap<object, App>();

export default {
  async fetch(request: Request, env: Record<string, unknown>): Promise<Response> {
    let app = apps.get(env);
    try {
      if (!app) {
        app = createApp(env);
        apps.set(env, app);
      }
    } catch (error) {
      loggerFromEnv(env).error("invalid configuration", error);
      return new Response(JSON.stringify({ error: "server misconfigured" }), {
        status: 500,
        headers: { "content-type": "application/json; charset=utf-8", "access-control-allow-origin": "*" },
      });
    }
    return app.fetch(request);
  },
};
