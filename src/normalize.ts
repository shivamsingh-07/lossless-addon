import type { PublicTrack, UpstreamStream, UpstreamTrack, Quality } from "./types.js";

/**
 * Track IDs look like `track_<base64url upstream id>_<16 char signature>`. The
 * signature is an HMAC-SHA-256 of the encoded id under SECRET_ID, so the server
 * only streams ids it issued. Uses Web Crypto, which Node and Workers both have.
 */

export const PUBLIC_ID = /^track_[A-Za-z0-9_-]{10,120}$/;
const ID_PATTERN = /^track_([A-Za-z0-9_-]+)_([A-Za-z0-9_-]{16})$/;

const encoder = new TextEncoder();
const decoder = new TextDecoder();
const keys = new Map<string, Promise<CryptoKey>>();

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}

function fromBase64Url(value: string): Uint8Array {
  const padded = value.replaceAll("-", "+").replaceAll("_", "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(padded);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

function hmacKey(secret: string): Promise<CryptoKey> {
  let key = keys.get(secret);
  if (!key) {
    key = crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
    keys.set(secret, key);
  }
  return key;
}

async function sign(encoded: string, secret: string): Promise<string> {
  if (!secret) throw new Error("a signing secret is required");
  const mac = await crypto.subtle.sign("HMAC", await hmacKey(secret), encoder.encode(encoded));
  return toBase64Url(new Uint8Array(mac)).slice(0, 16);
}

/** Compares without exiting early on the first difference. */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function publicId(track: UpstreamTrack, secret: string): Promise<string> {
  const encoded = toBase64Url(encoder.encode(track.upstreamId));
  return `track_${encoded}_${await sign(encoded, secret)}`;
}

export async function upstreamIdFromPublicId(id: string, secret: string): Promise<string | undefined> {
  const match = ID_PATTERN.exec(id);
  if (!match) return undefined;
  const [, encoded, supplied] = match;
  if (!safeEqual(supplied, await sign(encoded, secret))) return undefined;
  try {
    return decoder.decode(fromBase64Url(encoded)).trim() || undefined;
  } catch {
    return undefined;
  }
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
    format: track.format?.toLowerCase(),
    audioQuality: track.audioQuality?.trim(),
  };
}

export function streamResponse(stream: UpstreamStream, requested: Quality): UpstreamStream {
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
  return { ...stream, format: stream.format?.toLowerCase(), quality: stream.quality ?? requested };
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
