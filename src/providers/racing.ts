import type { Provider, UpstreamStream, UpstreamTrack, Quality } from '../types.js';

export interface Source { name: string; provider: Provider }

export class RacingProvider implements Provider {
  constructor(private readonly sources: Source[]) {}

  async search(query: string, quality: Quality, atmos: string): Promise<UpstreamTrack[]> {
    return new Promise((resolve, reject) => {
      let pending = this.sources.length;
      let failures = 0;
      let lastError: unknown;
      if (pending === 0) return resolve([]);
      for (const source of this.sources) {
        source.provider.search(query, quality, atmos).then(tracks => {
          if (tracks.length > 0) {
            resolve(tracks.map(track => ({ ...track, upstreamId: `${source.name}:${track.upstreamId}` })));
            return;
          }
          pending -= 1;
          if (pending === 0) resolve([]);
        }).catch(error => {
          lastError = error;
          failures += 1;
          pending -= 1;
          // Only an outage if every source failed; some empty answers are a plain "no results".
          if (pending === 0) failures === this.sources.length ? reject(lastError) : resolve([]);
        });
      }
    });
  }

  async getStream(trackId: string, quality: Quality, atmos: string): Promise<UpstreamStream | null> {
    const separator = trackId.indexOf(':');
    const named = separator > 0 ? this.sources.find(candidate => candidate.name === trackId.slice(0, separator)) : undefined;
    const upstreamId = named ? trackId.slice(separator + 1) : trackId;

    // The source that found the track goes first; if it has no stream (or is
    // down) the rest are tried, since the same upstream id often resolves elsewhere.
    const order = named ? [named, ...this.sources.filter(source => source !== named)] : this.sources;
    for (const source of order) {
      try {
        const stream = await source.provider.getStream(upstreamId, quality, atmos);
        if (stream) return stream;
      } catch {
        // Try the next source.
      }
    }
    return null;
  }
}
