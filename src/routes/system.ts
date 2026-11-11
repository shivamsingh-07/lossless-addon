import { html, json, type Router } from "../http.js";
import type { TelemetryProbe } from "../telemetry.js";
import { homePage } from "../ui/home.js";

/** The home page, liveness check and provider status. */
export function registerSystem(router: Router, telemetry: TelemetryProbe): void {
  router.get(/^\/$/, () => html(homePage));
  router.get(/^\/health$/, () => json(200, { ok: true }));
  router.get(/^\/api\/telemetry$/, async () => json(200, await telemetry.get(), { "cache-control": "no-store" }));
}
