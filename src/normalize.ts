import { publicId } from "./track-id.js";
import type { PublicTrack, UpstreamStream, UpstreamTrack } from "./types.js";

/**
 * How tiers and formats are written in everything this server sends:
 * capitals (HI-RES, LOSSLESS, HIGH, FLAC, M4A). BitChord compares these case-insensitively, so this
 * only changes what people read. Anything unrecognised is left as is.
 */
export function tierLabel(value?: string): string | undefined {
  const text = value?.trim();
  if (!text) return undefined;
  const upper = text.toUpperCase();
  if (/^HI[-_ ]?RES/.test(upper)) return "HI-RES";
  if (upper === "LOSSLESS" || upper === "HIGH") return upper;
  return text;
}

export function formatLabel(value?: string): string | undefined {
  return value?.trim().toUpperCase() || undefined;
}

export async function normalizeTrack(track: UpstreamTrack, secret: string): Promise<PublicTrack> {
  if (!track.upstreamId.trim() || !track.title.trim()) throw new Error("provider returned an unusable track");
  return {
    id: await publicId(track, secret),
    title: track.title.trim(),
    artist: track.artist?.trim() || undefined,
    album: track.album?.trim() || undefined,
    duration: Number.isFinite(track.duration) && (track.duration as number) >= 0 ? track.duration : undefined,
    artworkURL: absoluteUrl(track.artworkURL),
    format: formatLabel(track.format),
    audioQuality: tierLabel(track.audioQuality),
  };
}

/** Validates a provider's stream answer. It states only what the provider stated: a missing quality stays missing. */
export function streamResponse(stream: UpstreamStream): UpstreamStream {
  if (!/^https:\/\//i.test(stream.url) || stream.encrypted === true) {
    throw new Error("stream is not an openable HTTPS rendition");
  }
  try {
    new URL(stream.url);
  } catch {
    throw new Error("invalid stream URL");
  }
  if (stream.manifest && !["none", "hls", "dash"].includes(stream.manifest)) {
    throw new Error("unsupported manifest type");
  }
  return { ...stream, format: formatLabel(stream.format), quality: tierLabel(stream.quality) };
}

function absoluteUrl(value?: string): string | undefined {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    return /^https?:$/.test(url.protocol) ? url.toString() : undefined;
  } catch {
    return undefined;
  }
}
