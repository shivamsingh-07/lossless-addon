export type Env = Readonly<Record<string, string | undefined>>;

export interface Config {
  requestTimeoutMs: number;
  upstreamRetries: number;
  cacheTtlMs: number;
  secretId: string;
  provider: "stub" | "http" | "multi";
  apiBaseUrl?: string;
  searchPath?: string;
  streamPath?: string;
  apiToken?: string;
  monochromeBaseUrl: string;
  instableBaseUrl: string;
}

/** Keeps only string values. Worker bindings can also be objects, such as KV namespaces. */
export function stringEnv(raw: Readonly<Record<string, unknown>>): Env {
  return Object.fromEntries(Object.entries(raw).filter((entry): entry is [string, string] => typeof entry[1] === "string"));
}

function integer(env: Env, name: string, fallback: number, min: number): number {
  const value = Number(env[name] ?? fallback);
  if (!Number.isInteger(value) || value < min) throw new Error(`${name} must be an integer of at least ${min}`);
  return value;
}

export function loadConfig(env: Env): Config {
  const secretId = env.SECRET_ID?.trim();
  if (!secretId) throw new Error("SECRET_ID is required. Generate one with: openssl rand -hex 32");

  const provider = (env.PROVIDER_MODE ?? "multi").toLowerCase();
  if (provider !== "stub" && provider !== "http" && provider !== "multi") {
    throw new Error("PROVIDER_MODE must be stub, http, or multi");
  }
  const apiBaseUrl = env.PROVIDER_URL;
  if (provider === "http" && (!apiBaseUrl || !/^https:\/\//i.test(apiBaseUrl))) {
    throw new Error("PROVIDER_URL must be an HTTPS URL when PROVIDER_MODE=http");
  }

  return {
    requestTimeoutMs: integer(env, "REQUEST_TIMEOUT_MS", 6000, 1),
    upstreamRetries: integer(env, "UPSTREAM_RETRIES", 1, 0),
    cacheTtlMs: integer(env, "CACHE_TTL_SECONDS", 300, 1) * 1000,
    secretId,
    provider,
    apiBaseUrl,
    searchPath: env.PROVIDER_SEARCH_PATH,
    streamPath: env.PROVIDER_STREAM_PATH,
    apiToken: env.PROVIDER_TOKEN,
    monochromeBaseUrl: env.MONOCHROME_BASE_URL ?? "https://tracks.monochrome.st",
    instableBaseUrl: env.INSTABLE_BASE_URL ?? "https://instable.arcod.xyz",
  };
}
