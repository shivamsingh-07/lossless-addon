/** BitChord's own tiers. A lossless request means the best lossless file available, starting at hi-res. */
export type Quality = 'LOSSLESS' | 'HIGH' | 'LOW';

export interface UpstreamTrack {
  upstreamId: string;
  title: string;
  artist?: string;
  album?: string;
  duration?: number;
  artworkURL?: string;
  format?: string;
  audioQuality?: string;
}

export interface UpstreamStream {
  url: string;
  format?: string;
  quality?: string;
  manifest?: 'none' | 'hls' | 'dash';
  encrypted?: boolean;
}

export interface Provider {
  search(query: string, quality: Quality, atmos: string): Promise<UpstreamTrack[]>;
  getStream(trackId: string, quality: Quality, atmos: string): Promise<UpstreamStream | null>;
}

export interface PublicTrack extends Omit<UpstreamTrack, 'upstreamId'> {
  id: string;
}
