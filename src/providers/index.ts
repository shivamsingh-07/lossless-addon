import type { Config } from '../config.js';
import type { Provider } from '../types.js';
import { StubProvider } from './stub.js';
import { HttpProvider } from './http.js';
import { RacingProvider } from './racing.js';
import { MonochromeProvider } from './monochrome.js';
import { InstableProvider } from './instable.js';

export type IsolatedSource = 'monochrome' | 'instable';

export function createProvider(config: Config): Provider {
  if (config.provider === 'multi') {
    return new RacingProvider([
      { name: 'monochrome', provider: new MonochromeProvider(config) },
      { name: 'instable', provider: new InstableProvider(config) },
    ]);
  }
  if (config.provider === 'http') return new HttpProvider(config);
  return new StubProvider();
}

export function createSourceProvider(config: Config, source: IsolatedSource): Provider {
  return source === 'monochrome' ? new MonochromeProvider(config) : new InstableProvider(config);
}
