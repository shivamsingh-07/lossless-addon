import type { Config } from '../config.js';
import type { Provider, UpstreamStream, UpstreamTrack, Quality } from '../types.js';
import { fetchJson, isRecord } from './upstream.js';

export class InstableProvider implements Provider {
  constructor(private readonly config: Config) {}

  async search(query: string, _quality: Quality, _atmos: string): Promise<UpstreamTrack[]> {
    const body = await this.request('/api/get-music', { q: query, offset: '0', source: 'qobuz' }, Math.round(this.config.cacheTtlMs / 1000));
    const data = isRecord(body) && isRecord(body.data) ? body.data : undefined;
    const items = data && isRecord(data.tracks) && Array.isArray(data.tracks.items) ? data.tracks.items : [];
    return items.filter(isRecord).map(toTrack).filter((track): track is UpstreamTrack => track !== null);
  }

  /**
   * Tries the formats for the tier from best to worst and takes the first that answers: for lossless,
   * hi-res then CD quality. Qobuz already hands back the best file a track has at or below the format
   * asked for, so the second step only matters when a lookup fails outright.
   *
   * The answer states no tier: the upstream echoes the format that was *asked for*, not what the file
   * is (a CD-only track comes back as "27"), so repeating it would call CD files hi-res.
   */
  async getStream(trackId: string, quality: Quality, _atmos: string): Promise<UpstreamStream | null> {
    const path = `/api/player/stream/${encodeURIComponent(trackId)}`;
    const cacheSeconds = Math.round(this.config.streamCacheMs / 1000);
    let failure: unknown;
    for (const format of formatLadder(quality)) {
      try {
        const body = await this.request(path, { quality: format }, cacheSeconds);
        if (isRecord(body) && typeof body.url === 'string' && /^https:\/\//i.test(body.url)) {
          return { url: body.url, format: mimeFormat(body.mimeType), manifest: 'none', encrypted: false };
        }
      } catch (error) {
        failure = error;
      }
    }
    if (failure) throw failure;
    return null;
  }

  /** GETs one Instable endpoint. `cacheSeconds` caches the answer at the edge: searches use CACHE_TTL_SECONDS, stream lookups the shorter STREAM_CACHE_SECONDS because their URLs expire. */
  private request(path: string, params: Record<string, string>, cacheSeconds: number): Promise<unknown> {
    const url = new URL(path, this.config.instableBaseUrl);
    for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
    return fetchJson(url, {
      name: 'Instable',
      headers: { 'user-agent': 'hi-res-audio-addon' },
      timeoutMs: Math.max(this.config.requestTimeoutMs, 15_000),
      attempts: this.config.upstreamRetries + 1,
      cacheSeconds,
      failed: body => isRecord(body) && body.success === false,
    });
  }
}

function toTrack(raw: Record<string, unknown>): UpstreamTrack | null {
  const id = raw.id;
  const title = raw.title;
  if ((typeof id !== 'number' && typeof id !== 'string') || typeof title !== 'string' || !title.trim()) return null;
  const performer = isRecord(raw.performer) ? raw.performer : undefined;
  const album = isRecord(raw.album) ? raw.album : undefined;
  const image = album && isRecord(album.image) ? album.image : undefined;
  return {
    upstreamId: String(id),
    title: title.trim(),
    artist: performer && typeof performer.name === 'string' ? performer.name : undefined,
    album: album && typeof album.title === 'string' ? album.title : undefined,
    duration: typeof raw.duration === 'number' ? raw.duration : undefined,
    artworkURL: image && typeof image.large === 'string' ? image.large : undefined,
    format: typeof raw.maximum_bit_depth === 'number' ? 'flac' : undefined,
    audioQuality: typeof raw.maximum_bit_depth === 'number' ? (isHiRes(raw) ? 'HI-RES' : 'LOSSLESS') : undefined,
  };
}

/** Hi-res means better than CD: more than 16 bits or a rate above 44.1 kHz. */
function isHiRes(raw: Record<string, unknown>): boolean {
  return raw.hires === true || (typeof raw.maximum_bit_depth === 'number' && raw.maximum_bit_depth > 16) || (typeof raw.maximum_sampling_rate === 'number' && raw.maximum_sampling_rate > 44.1);
}

/** Qobuz format ids, in the order to try: 27 is up to 24-bit/192 kHz FLAC, 6 is CD-quality FLAC, 5 is 320 kbps MP3. */
function formatLadder(quality: Quality): string[] { return quality === 'LOSSLESS' ? ['27', '6'] : ['5']; }
function mimeFormat(value: unknown): string | undefined { return typeof value === 'string' ? value.split('/').pop() : undefined; }
