import type { Provider, UpstreamStream, UpstreamTrack, Quality } from '../types.js';

/** Fallback provider for contract-only local testing. */
export class StubProvider implements Provider {
  async search(_query: string, _quality: Quality, _atmos: string): Promise<UpstreamTrack[]> { return []; }
  async getStream(_trackId: string, _quality: Quality, _atmos: string): Promise<UpstreamStream | null> { return null; }
}
