import test from 'node:test';
import assert from 'node:assert/strict';
import { loadConfig, stringEnv } from '../src/config.js';

test('loadConfig refuses to run without SECRET_ID', () => {
  assert.throws(() => loadConfig({}), /SECRET_ID is required/);
  assert.throws(() => loadConfig({ SECRET_ID: '   ' }), /SECRET_ID is required/);
  assert.equal(loadConfig({ SECRET_ID: 'abc' }).secretId, 'abc');
});

test('defaults and overrides', () => {
  const config = loadConfig({ SECRET_ID: 'x' });
  assert.deepEqual([config.requestTimeoutMs, config.upstreamRetries, config.cacheTtlMs, config.provider], [6000, 1, 300_000, 'multi']);
  const custom = loadConfig({ SECRET_ID: 'x', REQUEST_TIMEOUT_MS: '2500', UPSTREAM_RETRIES: '0', CACHE_TTL_SECONDS: '60' });
  assert.deepEqual([custom.requestTimeoutMs, custom.upstreamRetries, custom.cacheTtlMs], [2500, 0, 60_000]);
});

test('invalid values are rejected with a clear message', () => {
  assert.throws(() => loadConfig({ SECRET_ID: 'x', UPSTREAM_RETRIES: '-1' }), /UPSTREAM_RETRIES/);
  assert.throws(() => loadConfig({ SECRET_ID: 'x', REQUEST_TIMEOUT_MS: 'abc' }), /REQUEST_TIMEOUT_MS/);
  assert.throws(() => loadConfig({ SECRET_ID: 'x', PROVIDER_MODE: 'qobuzdl' }), /PROVIDER_MODE/);
  assert.throws(() => loadConfig({ SECRET_ID: 'x', PROVIDER_MODE: 'http' }), /PROVIDER_URL/);
  assert.throws(() => loadConfig({ SECRET_ID: 'x', PROVIDER_MODE: 'http', PROVIDER_URL: 'http://insecure' }), /HTTPS/);
});

test('stringEnv drops non-string bindings', () => {
  assert.deepEqual(stringEnv({ A: 'a', KV: { get() {} }, N: 3, U: undefined }), { A: 'a' });
});
