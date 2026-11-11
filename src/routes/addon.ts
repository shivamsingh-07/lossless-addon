import type { Addon } from "../addons.js";
import { TtlCache } from "../cache.js";
import type { Config } from "../config.js";
import { badRequest, notFound } from "../errors.js";
import { json, type Router } from "../http.js";
import type { Logger } from "../logger.js";
import { normalizeTrack, PUBLIC_ID, streamResponse, upstreamIdFromPublicId } from "../normalize.js";
import type { PublicTrack, Quality } from "../types.js";

function parseQuality(value?: string | null): Quality {
  const normalized = (value ?? "LOSSLESS").toUpperCase();
  if (normalized === "LOSSLESS" || normalized === "HIGH" || normalized === "LOW") return normalized;
  throw badRequest("quality must be LOSSLESS, HIGH, or LOW");
}

const FRESH = "public, max-age=30, s-maxage=300, stale-while-revalidate=600";
const STALE = "public, max-age=10, s-maxage=30, stale-while-revalidate=120";

/** Registers /manifest.json, /search and /stream/:id for one addon under its prefix. */
export function registerAddon(router: Router, addon: Addon, config: Config, logger: Logger): void {
  const { prefix, manifest, provider } = addon;
  const searchCache = new TtlCache<PublicTrack[]>(config.cacheTtlMs);

  router.get(new RegExp(`^${prefix}/manifest\\.json$`), () =>
    json(
      200,
      {
        ...manifest,
        resources: ["search", "stream"],
        allowDownloads: 0,
        bitchordAuth: true,
        settings: [
          {
            key: "quality",
            type: "select",
            default: "lossless",
            options: [
              { label: "Lossless", value: "lossless" },
              { label: "High", value: "high" },
              { label: "Low", value: "low" },
            ],
          },
        ],
      },
      { "cache-control": "public, max-age=3600, s-maxage=86400" },
    ),
  );

  router.get(new RegExp(`^${prefix}/search$`), async ({ url }) => {
    const query = url.searchParams.get("q")?.trim();
    if (!query) throw badRequest("q is required");
    const quality = parseQuality(url.searchParams.get("quality"));
    const atmos = url.searchParams.get("atmos") ?? "auto";
    const key = `${query}\u0000${quality}\u0000${atmos}`;

    const cached = searchCache.get(key);
    if (cached) return json(200, { tracks: cached }, { "cache-control": FRESH });

    try {
      const found = await provider.search(query, quality, atmos);
      const settled = await Promise.allSettled(found.map((track) => normalizeTrack(track, config.secretId)));
      const tracks = settled.flatMap((result) => (result.status === "fulfilled" ? [result.value] : []));
      searchCache.set(key, tracks);
      return json(200, { tracks }, { "cache-control": FRESH });
    } catch (error) {
      const stale = searchCache.getStale(key);
      if (!stale) throw error;
      logger.warn("search failed, serving stale results", error);
      return json(200, { tracks: stale, stale: true }, { "cache-control": STALE });
    }
  });

  router.get(new RegExp(`^${prefix}/stream/([^/]+)$`), async ({ url, params }) => {
    const quality = parseQuality(url.searchParams.get("quality"));
    const atmos = url.searchParams.get("atmos") ?? "auto";
    let id: string;
    try {
      id = decodeURIComponent(params[0] ?? "");
    } catch {
      throw notFound("track not found");
    }
    if (!PUBLIC_ID.test(id)) throw notFound("track not found");
    const upstreamId = await upstreamIdFromPublicId(id, config.secretId);
    if (!upstreamId) throw notFound("track not available");
    const stream = await provider.getStream(upstreamId, quality, atmos);
    if (!stream) throw notFound("track not available");
    try {
      return json(200, streamResponse(stream, quality));
    } catch {
      throw notFound("track has no playable rendition");
    }
  });
}
