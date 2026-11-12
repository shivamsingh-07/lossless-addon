import { buildAddons } from "./addons.js";
import { loadConfig, stringEnv, type Config } from "./config.js";
import { AppError } from "./errors.js";
import { json, Router } from "./http.js";
import { loggerFromEnv, type Logger } from "./logger.js";
import { registerAddon } from "./routes/addon.js";
import { registerSystem } from "./routes/system.js";
import { TelemetryProbe } from "./telemetry.js";

export interface App {
  config: Config;
  logger: Logger;
  /** Handles one request. Never throws: failures become JSON error responses. */
  fetch(request: Request): Promise<Response>;
}

/**
 * Builds the whole application from an environment object. Runtime agnostic:
 * Node passes its environment variables, Cloudflare Workers pass their bindings. Throws if the
 * configuration is invalid.
 */
export function createApp(rawEnv: Readonly<Record<string, unknown>>, options: { logger?: Logger } = {}): App {
  const env = stringEnv(rawEnv);
  const logger = options.logger ?? loggerFromEnv(env);
  const config = loadConfig(env);

  const router = new Router();
  const addons = buildAddons(config);
  const telemetry = new TelemetryProbe(
    addons.map(({ manifest, prefix, provider }) => ({ name: manifest.name, route: prefix || "/", provider })),
    logger,
  );
  registerSystem(router, telemetry);
  for (const addon of addons) registerAddon(router, addon, config, logger);

  async function respond(request: Request, url: URL): Promise<Response> {
    try {
      return await router.handle(request, url);
    } catch (error) {
      if (error instanceof AppError) return json(error.statusCode, { error: error.message });
      const candidate = error as { statusCode?: unknown; status?: unknown };
      const status =
        typeof candidate.statusCode === "number" ? candidate.statusCode : typeof candidate.status === "number" ? candidate.status : 500;
      logger.error("request failed", error);
      return json(status, { error: status >= 500 ? "upstream service unavailable" : "request failed" });
    }
  }

  return {
    config,
    logger,
    async fetch(request) {
      const started = performance.now();
      const url = new URL(request.url);
      const response = await respond(request, url);
      if (url.pathname !== "/health") {
        const line = `${request.method} ${url.pathname.slice(0, 200)} ${response.status} ${(performance.now() - started).toFixed(1)}ms`;
        if (response.status >= 500) logger.warn(line);
        else logger.info(line);
      }
      return response;
    },
  };
}
