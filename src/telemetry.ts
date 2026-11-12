import type { Logger } from "./logger.js";
import type { Provider } from "./types.js";

export interface ProbeTarget {
  name: string;
  route: string;
  provider: Provider;
}

export interface SourceHealth {
  name: string;
  route: string;
  status: "up" | "down";
  latencyMs: number | null;
  /** A short, generic reason. Never an upstream URL or raw error text. */
  reason?: "timeout" | "error";
}

export interface Telemetry {
  status: "operational" | "degraded" | "down";
  checkedAt: number;
  sources: SourceHealth[];
}

/**
 * Probes each source with a tiny search and caches the answer, so hitting the
 * endpoint repeatedly costs the upstreams one request per source per `ttlMs`.
 */
export class TelemetryProbe {
  private cached?: { at: number; value: Telemetry };
  private inflight?: Promise<Telemetry>;
  private lastStatus?: Telemetry["status"];

  constructor(
    private readonly targets: ProbeTarget[],
    private readonly logger: Logger,
    private readonly ttlMs = 60_000,
    private readonly timeoutMs = 6_000,
  ) {}

  async get(): Promise<Telemetry> {
    if (this.cached && Date.now() - this.cached.at < this.ttlMs) return this.cached.value;
    this.inflight ??= this.run().finally(() => {
      this.inflight = undefined;
    });
    return this.inflight;
  }

  private async run(): Promise<Telemetry> {
    const sources = await Promise.all(this.targets.map((target) => this.probe(target)));
    const up = sources.filter((s) => s.status === "up").length;
    const value: Telemetry = {
      status: up === sources.length ? "operational" : up === 0 ? "down" : "degraded",
      checkedAt: Date.now(),
      sources,
    };
    this.cached = { at: value.checkedAt, value };
    const down = sources.filter((s) => s.status === "down").map((s) => s.route);
    if (value.status !== this.lastStatus) {
      const msg = `provider status: ${value.status}${down.length ? ` (down: ${down.join(", ")})` : ""}`;
      if (value.status === "operational") this.logger.info(msg);
      else this.logger.warn(msg);
      this.lastStatus = value.status;
    }
    return value;
  }

  private async probe({ name, route, provider }: ProbeTarget): Promise<SourceHealth> {
    const started = Date.now();
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      await Promise.race([
        provider.search(`health ${Date.now()}`, "LOSSLESS", "auto"), // unique, so edge caches never answer for the provider
        new Promise((_, reject) => {
          timer = setTimeout(() => reject(new Error("timeout")), this.timeoutMs);
        }),
      ]);
      return { name, route, status: "up", latencyMs: Date.now() - started };
    } catch (error) {
      const timedOut = error instanceof Error && error.message === "timeout";
      return { name, route, status: "down", latencyMs: null, reason: timedOut ? "timeout" : "error" };
    } finally {
      clearTimeout(timer);
    }
  }
}
