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
    { logger: createLogger({ level: 'silent' }) },
  );
}

export const call = (app: App, path: string, init?: RequestInit) => app.fetch(new Request(`http://addon.test${path}`, init));
