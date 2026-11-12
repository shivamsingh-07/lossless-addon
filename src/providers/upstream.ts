import { edgeCache } from '../edge-cache.js';

export class UpstreamError extends Error {
  constructor(public readonly status: number, message: string) { super(message); }
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

const delay = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));
const retryable = (status: number): boolean => status >= 500 || status === 408 || status === 425 || status === 429;

export interface FetchJsonOptions {
  /** The provider's name, used in error messages. */
  name: string;
  headers?: Record<string, string>;
  timeoutMs: number;
  /** Total tries, the first included. */
  attempts: number;
  /** Cache the answer at the Cloudflare edge for this long. */
  cacheSeconds?: number;
  /** Returns true when a 200 answer actually reports a failure. */
  failed?: (body: unknown) => boolean;
}

/**
 * GETs a JSON document, retrying what might work on a second try: network errors, timeouts, bad JSON,
 * 5xx and rate limits, with a short growing pause. Other 4xx answers fail at once. The error's status
 * is what the client sees: 404 stays 404, 4xx becomes 400 and everything else 502.
 */
export async function fetchJson(url: URL, options: FetchJsonOptions): Promise<unknown> {
  let lastError: unknown;
  for (let attempt = 0; attempt < options.attempts; attempt += 1) {
    if (attempt > 0) await delay(200 * 2 ** (attempt - 1));
    try {
      return await fetchOnce(url, options);
    } catch (error) {
      lastError = error;
      if (error instanceof UpstreamError && error.status < 500) throw error;
    }
  }
  throw lastError instanceof UpstreamError ? lastError : new UpstreamError(502, `${options.name} request failed`);
}

async function fetchOnce(url: URL, options: FetchJsonOptions): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeoutMs);
  try {
    const response = await fetch(url, {
      headers: { accept: 'application/json', ...options.headers },
      signal: controller.signal,
      ...edgeCache(options.cacheSeconds ?? 0),
    });
    if (!response.ok) throw new UpstreamError(retryable(response.status) ? 502 : response.status === 404 ? 404 : 400, `${options.name} request failed`);
    let body: unknown;
    try { body = await response.json(); } catch { throw new UpstreamError(502, `${options.name} returned invalid JSON`); }
    if (options.failed?.(body)) throw new UpstreamError(502, `${options.name} request failed`);
    return body;
  } finally {
    clearTimeout(timer);
  }
}
