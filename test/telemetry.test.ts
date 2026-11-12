import test from 'node:test';
import assert from 'node:assert/strict';
import { TelemetryProbe } from '../src/telemetry.js';
import { createLogger } from '../src/logger.js';
import type { Provider } from '../src/types.js';

const quiet = createLogger({ level: 'off' });

const provider = (search: () => Promise<unknown[]>): Provider => ({ search: search as never, getStream: async () => null });

test('telemetry marks sources up, down and timed out, and caches the result', async () => {
  let calls = 0;
  const probe = new TelemetryProbe([
    { name: 'ok', route: '/a', provider: provider(async () => { calls++; return []; }) },
    { name: 'bad', route: '/b', provider: provider(async () => { throw new Error('https://secret.example/x'); }) },
    { name: 'slow', route: '/c', provider: provider(() => new Promise(() => {})) },
  ], quiet, 60_000, 30);
  const first = await probe.get();
  assert.equal(first.status, 'degraded');
  assert.deepEqual(first.sources.map(s => [s.status, s.reason]), [['up', undefined], ['down', 'error'], ['down', 'timeout']]);
  assert.doesNotMatch(JSON.stringify(first), /secret\.example/);
  await probe.get();
  assert.equal(calls, 1);
});

test('telemetry is "down" when every source fails', async () => {
  const probe = new TelemetryProbe([{ name: 'x', route: '/', provider: provider(async () => { throw new Error('x'); }) }], quiet);
  assert.equal((await probe.get()).status, 'down');
});
