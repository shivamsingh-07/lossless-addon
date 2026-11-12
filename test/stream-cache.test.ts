import test from 'node:test';
import assert from 'node:assert/strict';
import { loadConfig } from '../src/config.js';
import { Router } from '../src/http.js';
import { createLogger } from '../src/logger.js';
import { publicId } from '../src/track-id.js';
import { registerAddon } from '../src/routes/addon.js';
import type { Provider, UpstreamStream } from '../src/types.js';

const quiet = createLogger({ level: 'off' });

async function setup(env: Record<string, string>, getStream: () => Promise<UpstreamStream | null>) {
  const config = loadConfig({ SECRET_ID: 'k', ...env });
  let calls = 0;
  const provider: Provider = { search: async () => [], getStream: async () => { calls++; return getStream(); } };
  const router = new Router();
  registerAddon(router, { prefix: '', manifest: { id: 'x', name: 'X', version: '1' }, provider }, config, quiet);
  const id = await publicId({ upstreamId: 'track-1', title: 't' }, 'k');
  const get = async (suffix = '') => {
    const url = new URL(`http://addon.test/stream/${id}${suffix}`);
    return router.handle(new Request(url), url);
  };
  return { get, calls: () => calls };
}

const good = async (): Promise<UpstreamStream> => ({ url: 'https://cdn.example/a.flac', manifest: 'none' });

test('a repeated stream lookup within STREAM_CACHE_SECONDS asks the provider once', async () => {
  const { get, calls } = await setup({ STREAM_CACHE_SECONDS: '60' }, good);
  const first = await (await get()).json();
  const second = await (await get()).json();
  assert.equal(calls(), 1);
  assert.deepEqual(second, first);
  assert.equal(first.url, 'https://cdn.example/a.flac');
});

test('different qualities are cached separately', async () => {
  const { get, calls } = await setup({ STREAM_CACHE_SECONDS: '60' }, good);
  await get('?quality=LOSSLESS');
  await get('?quality=HIGH');
  await get('?quality=HIGH');
  assert.equal(calls(), 2);
});

test('STREAM_CACHE_SECONDS=0 turns reuse off', async () => {
  const { get, calls } = await setup({ STREAM_CACHE_SECONDS: '0' }, good);
  await get(); await get();
  assert.equal(calls(), 2);
});

test('failures are never cached, so a retry reaches the provider again', async () => {
  const { get, calls } = await setup({ STREAM_CACHE_SECONDS: '60' }, async () => null);
  await assert.rejects(get(), /track not available/);
  await assert.rejects(get(), /track not available/);
  assert.equal(calls(), 2);
});

test('an expired entry is not served stale', async () => {
  const { get, calls } = await setup({ STREAM_CACHE_SECONDS: '1' }, good);
  await get();
  await new Promise(resolve => setTimeout(resolve, 1100));
  await get();
  assert.equal(calls(), 2);
});
