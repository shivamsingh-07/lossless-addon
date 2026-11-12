import type { Addon, AddonManifest } from "../addons.js";
import { TtlCache } from "../cache.js";
import type { Config } from "../config.js";
import { badRequest, notFound } from "../errors.js";
import { json, type RouteHandler, type Router } from "../http.js";
import type { Logger } from "../logger.js";
import { normalizeTrack, streamResponse } from "../normalize.js";
import { PUBLIC_ID, upstreamIdFromPublicId } from "../track-id.js";
import type { Provider, PublicTrack, Quality, UpstreamStream } from "../types.js";

interface Context {
  provider: Provider;
  config: Config;
  logger: Logger;
}

const FRESH = "public, max-age=30, s-maxage=300, stale-while-revalidate=600";
const STALE = "public, max-age=10, s-maxage=30, stale-while-revalidate=120";

/** Registers /manifest.json, /search and /stream/:id for one addon under its prefix. */
export function registerAddon(router: Router, { prefix, manifest, provider }: Addon, config: Config, logger: Logger): void {
  const context: Context = { provider, config, logger };
  router.get(new RegExp(`^${prefix}/manifest\\.json$`), manifestHandler(manifest));
  router.get(new RegExp(`^${prefix}/search$`), searchHandler(context));
  router.get(new RegExp(`^${prefix}/stream/([^/]+)$`), streamHandler(context));
}

function manifestHandler(manifest: AddonManifest): RouteHandler {
  return () =>
    json(
      200,
      {
        ...manifest,
        resources: ["search", "stream"],
        allowDownloads: 0,
        bitchordAuth: true,
      },
      { "cache-control": "public, max-age=300, s-maxage=300" },
    );
}

function searchHandler({ provider, config, logger }: Context): RouteHandler {
  const cache = new TtlCache<PublicTrack[]>(config.cacheTtlMs);

  return async ({ url }) => {
    const query = url.searchParams.get("q")?.trim();
    if (!query) throw badRequest("q is required");
    const { quality, atmos } = readRequest(url);
    const key = cacheKey(query, quality, atmos);

    const cached = cache.get(key);
    if (cached) return json(200, { tracks: cached }, { "cache-control": FRESH });

    try {
      const found = await provider.search(query, quality, atmos);
      const settled = await Promise.allSettled(found.map((track) => normalizeTrack(track, config.secretId)));
      const tracks = settled.flatMap((result) => (result.status === "fulfilled" ? [result.value] : []));
      cache.set(key, tracks);
      return json(200, { tracks }, { "cache-control": FRESH });
    } catch (error) {
      // A search that fails is better answered with the last results than with an error.
      const stale = cache.getStale(key);
      if (!stale) throw error;
      logger.warn("search failed, serving stale results", error);
      return json(200, { tracks: stale, stale: true }, { "cache-control": STALE });
    }
  };
}

function streamHandler({ provider, config }: Context): RouteHandler {
  const cache = new TtlCache<UpstreamStream>(config.streamCacheMs);

  return async ({ url, params }) => {
    const { quality, atmos } = readRequest(url);
    const upstreamId = await verifyTrackId(params[0], config.secretId);

    // Only successes are kept, and an expired entry is never served stale: a dead link is worse than a slow one.
    const key = cacheKey(upstreamId, quality, atmos);
    const reused = config.streamCacheMs > 0 ? cache.get(key) : undefined;
    if (reused) return json(200, reused);

    const stream = await provider.getStream(upstreamId, quality, atmos);
    if (!stream) throw notFound("track not available");
    let result: UpstreamStream;
    try {
      result = streamResponse(stream);
    } catch {
      throw notFound("track has no playable rendition");
    }
    if (config.streamCacheMs > 0) cache.set(key, result);
    return json(200, result);
  };
}

/** The tier and the immersive-audio hint that every search and stream request carries. */
function readRequest(url: URL): { quality: Quality; atmos: string } {
  const quality = (url.searchParams.get("quality") ?? "LOSSLESS").trim().toUpperCase();
  if (quality !== "LOSSLESS" && quality !== "HIGH" && quality !== "LOW") throw badRequest("quality must be LOSSLESS, HIGH, or LOW");
  return { quality, atmos: url.searchParams.get("atmos") ?? "auto" };
}

/** The upstream id inside a track id this server issued. Anything else is a 404. */
async function verifyTrackId(raw: string | undefined, secret: string): Promise<string> {
  let id: string;
  try {
    id = decodeURIComponent(raw ?? "");
  } catch {
    throw notFound("track not found");
  }
  if (!PUBLIC_ID.test(id)) throw notFound("track not found");
  const upstreamId = await upstreamIdFromPublicId(id, secret);
  if (!upstreamId) throw notFound("track not available");
  return upstreamId;
}

const cacheKey = (...parts: string[]): string => parts.join("\u0000");
