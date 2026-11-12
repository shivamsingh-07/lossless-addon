import { createApp, type App } from '../src/app.js';
import { createLogger } from '../src/logger.js';

/** An app wired to the stub provider with every upstream pointed at a closed local port. */
export function testApp(extra: Record<string, string> = {}): App {
  return createApp(
    {
      SECRET_ID: 'test-secret',
      PROVIDER_MODE: 'stub',
      MONOCHROME_BASE_URL: 'http://127.0.0.1:1',
      INSTABLE_BASE_URL: 'http://127.0.0.1:1',
      UPSTREAM_RETRIES: '0',
      ...extra,
    },
    { logger: createLogger({ level: 'off' }) },
  );
}

export const call = (app: App, path: string, init?: RequestInit) => app.fetch(new Request(`http://addon.test${path}`, init));

interface FetchCall { url: URL; init: any }

/**
 * Runs `run` with the global fetch replaced by `handler`, then restores it.
 * Returns what `run` returned and every call that was made.
 */
export async function mockFetch<T>(
  handler: (url: URL, init: any) => Response | Promise<Response>,
  run: () => Promise<T>,
): Promise<{ result: T; calls: FetchCall[] }> {
  const original = globalThis.fetch;
  const calls: FetchCall[] = [];
  globalThis.fetch = (async (input: URL | string, init?: any) => {
    const url = new URL(String(input));
    calls.push({ url, init });
    return handler(url, init);
  }) as typeof fetch;
  try {
    return { result: await run(), calls };
  } finally {
    globalThis.fetch = original;
  }
}

/** The outcome of a promise, as a value, so tests can assert on failures without try/catch. */
export const settle = <T>(promise: Promise<T>) =>
  promise.then((value) => ({ value, error: undefined as unknown }), (error: unknown) => ({ value: undefined as T | undefined, error }));
