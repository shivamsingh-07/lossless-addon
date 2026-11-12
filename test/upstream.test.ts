import test from 'node:test';
import assert from 'node:assert/strict';
import { fetchJson, UpstreamError } from '../src/providers/upstream.js';
import { mockFetch, settle } from './helpers.js';

const url = new URL('https://upstream.test/x');
const options = { name: 'Test', timeoutMs: 1000, attempts: 3 };
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });

test('returns the parsed JSON and sends an accept header plus the extra headers', async () => {
  const { result, calls } = await mockFetch(() => json({ ok: 1 }), () => fetchJson(url, { ...options, headers: { 'user-agent': 'ua' } }));
  assert.deepEqual(result, { ok: 1 });
  assert.equal(calls[0].init.headers.accept, 'application/json');
  assert.equal(calls[0].init.headers['user-agent'], 'ua');
});

test('a 5xx is retried and the second answer wins', async () => {
  let n = 0;
  const { result, calls } = await mockFetch(() => (++n === 1 ? json({}, 503) : json({ ok: true })), () => fetchJson(url, options));
  assert.deepEqual(result, { ok: true });
  assert.equal(calls.length, 2);
});

test('rate limits, bad JSON and network errors are retried too, up to the attempt limit', async () => {
  for (const failure of [() => json({}, 429), () => new Response('<html>', { status: 200 }), () => { throw new Error('down'); }]) {
    const { result, calls } = await mockFetch(failure, () => settle(fetchJson(url, { ...options, attempts: 2 })));
    assert.equal(calls.length, 2);
    assert.ok(result.error instanceof UpstreamError);
    assert.equal((result.error as UpstreamError).status, 502);
  }
});

test('other 4xx answers fail at once with a clean status: 404 stays 404, the rest become 400', async () => {
  for (const [upstream, expected] of [[404, 404], [400, 400], [401, 400], [403, 400]] as const) {
    const { result, calls } = await mockFetch(() => json({}, upstream), () => settle(fetchJson(url, options)));
    assert.equal(calls.length, 1, String(upstream));
    assert.equal((result.error as UpstreamError).status, expected, String(upstream));
  }
});

test('a 200 that reports failure counts as a failed attempt', async () => {
  const { result, calls } = await mockFetch(() => json({ success: false }), () => settle(fetchJson(url, { ...options, attempts: 2, failed: b => (b as any).success === false })));
  assert.equal(calls.length, 2);
  assert.equal((result.error as UpstreamError).status, 502);
});

test('attempts: 1 means no retry', async () => {
  const { calls } = await mockFetch(() => json({}, 500), () => settle(fetchJson(url, { ...options, attempts: 1 })));
  assert.equal(calls.length, 1);
});

test('a slow upstream times out and the abort signal is passed to fetch', async () => {
  const { result, calls } = await mockFetch((_u, init) => new Promise<Response>((_resolve, reject) => init.signal.addEventListener('abort', () => reject(new Error('aborted')))), () => settle(fetchJson(url, { ...options, timeoutMs: 20, attempts: 1 })));
  assert.ok(result.error instanceof UpstreamError);
  assert.ok(calls[0].init.signal instanceof AbortSignal);
});

test('cacheSeconds asks Cloudflare to cache 2xx only, and 0 asks for nothing', async () => {
  const cached = await mockFetch(() => json({}), () => fetchJson(url, { ...options, cacheSeconds: 90 }));
  assert.deepEqual(cached.calls[0].init.cf.cacheTtlByStatus, { '200-299': 90, '300-599': -1 });
  const plain = await mockFetch(() => json({}), () => fetchJson(url, options));
  assert.equal(plain.calls[0].init.cf, undefined);
});
