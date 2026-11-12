import test from 'node:test';
import assert from 'node:assert/strict';
import { edgeCache } from '../src/edge-cache.js';
import { loadConfig } from '../src/config.js';
import { InstableProvider } from '../src/providers/instable.js';
import { MonochromeProvider } from '../src/providers/monochrome.js';
import { mockFetch } from './helpers.js';

const config = loadConfig({ SECRET_ID: 'x', CACHE_TTL_SECONDS: '120', STREAM_CACHE_SECONDS: '45', UPSTREAM_RETRIES: '0' });
const reply = (body: unknown) => () => new Response(JSON.stringify(body));

test('edgeCache caches 2xx only, for the given TTL, and does nothing for 0', () => {
  assert.deepEqual(edgeCache(120), { cf: { cacheEverything: true, cacheTtlByStatus: { '200-299': 120, '300-599': -1 } } });
  assert.deepEqual(edgeCache(0), {});
});

test('searches ask Cloudflare to cache the provider response for CACHE_TTL_SECONDS', async () => {
  const mono = await mockFetch(reply({ tracks: [] }), () => new MonochromeProvider(config).search('hello', 'LOSSLESS', 'auto'));
  assert.equal(mono.calls[0].init.cf.cacheTtlByStatus['200-299'], 120);
  const inst = await mockFetch(reply({ data: { tracks: { items: [] } } }), () => new InstableProvider(config).search('hello', 'LOSSLESS', 'auto'));
  assert.equal(inst.calls[0].init.cf.cacheTtlByStatus['200-299'], 120);
  assert.equal(inst.calls[0].init.cf.cacheTtlByStatus['300-599'], -1);
});

test('stream lookups are edge cached only briefly (STREAM_CACHE_SECONDS), because their URLs expire', async () => {
  const { calls } = await mockFetch(reply({ url: 'https://cdn.example/a.flac' }), () => new InstableProvider(config).getStream('123', 'LOSSLESS', 'auto'));
  assert.equal(calls.length, 1);
  assert.equal(calls[0].init.cf.cacheTtlByStatus['200-299'], 45);
  const off = loadConfig({ SECRET_ID: 'x', STREAM_CACHE_SECONDS: '0', UPSTREAM_RETRIES: '0' });
  const none = await mockFetch(reply({ url: 'https://cdn.example/a.flac' }), () => new InstableProvider(off).getStream('123', 'LOSSLESS', 'auto'));
  assert.equal(none.calls[0].init.cf, undefined);
});

test('the same code works on a runtime that ignores cf (real fetch with an unknown option does not throw)', async () => {
  const server = (await import('node:http')).createServer((_req, res) => res.end('{"tracks":[]}'));
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  const port = (server.address() as import('node:net').AddressInfo).port;
  try {
    const local = loadConfig({ SECRET_ID: 'x', MONOCHROME_BASE_URL: `http://127.0.0.1:${port}`, UPSTREAM_RETRIES: '0' });
    assert.deepEqual(await new MonochromeProvider(local).search('q', 'LOSSLESS', 'auto'), []);
  } finally { server.close(); }
});
