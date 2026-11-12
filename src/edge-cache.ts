/**
 * Edge caching for provider calls. On Cloudflare Workers, `fetch` accepts a `cf` option that caches the
 * upstream response in Cloudflare's cache for that data centre. Unlike the Cache API it also works on
 * workers.dev. Other runtimes ignore the option, so the same code runs everywhere.
 *
 * Only 2xx responses are stored. A negative TTL tells Cloudflare not to cache a status at all.
 */
export function edgeCache(ttlSeconds: number): { cf: Record<string, unknown> } | Record<string, never> {
  if (ttlSeconds <= 0) return {};
  return { cf: { cacheEverything: true, cacheTtlByStatus: { "200-299": ttlSeconds, "300-599": -1 } } };
}
