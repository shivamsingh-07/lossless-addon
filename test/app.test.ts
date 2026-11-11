import test from 'node:test';
import assert from 'node:assert/strict';
import { call, testApp } from './helpers.js';
import { publicId } from '../src/normalize.js';

const app = testApp();
const PREFIXES = ['', '/c', '/f'];

test('/health and the home page respond', async () => {
  assert.deepEqual(await (await call(app, '/health')).json(), { ok: true });
  const home = await call(app, '/');
  assert.equal(home.status, 200);
  assert.match(home.headers.get('content-type') ?? '', /text\/html/);
  assert.match(await home.text(), /Hi-Res Audio/);
});

test('every route serves a playback-only manifest that declares bitchordAuth', async () => {
  const ids = new Set<string>();
  for (const prefix of PREFIXES) {
    const res = await call(app, `${prefix}/manifest.json`);
    assert.equal(res.status, 200, prefix);
    const manifest = await res.json();
    assert.deepEqual(manifest.resources, ['search', 'stream']);
    assert.equal(manifest.allowDownloads, 0);
    assert.equal(manifest.bitchordAuth, true);
    assert.ok(manifest.id.startsWith('app.bitchord.lossless'));
    ids.add(manifest.id);
  }
  assert.equal(ids.size, PREFIXES.length);
});

test('removed provider routes are gone', async () => {
  for (const prefix of ['/a', '/b', '/d', '/e']) assert.equal((await call(app, `${prefix}/manifest.json`)).status, 404, prefix);
});

test('/search validates its input', async () => {
  assert.equal((await call(app, '/search')).status, 400);
  assert.equal((await call(app, '/search?q=a&quality=BOGUS')).status, 400);
  const ok = await call(app, '/search?q=a');
  assert.equal(ok.status, 200);
  assert.deepEqual((await ok.json()).tracks, []);
});

test('/stream rejects malformed, forged and unknown ids', async () => {
  assert.equal((await call(app, '/stream/nope')).status, 404);
  assert.equal((await call(app, '/stream/other_MTIzNDU2_AAAAAAAAAAAAAAAA')).status, 404);
  assert.equal((await call(app, '/stream/%E0%A4%A')).status, 404);
  assert.equal((await call(app, `/stream/${await publicId({ upstreamId: 'x', title: 't' }, 'other-secret')}`)).status, 404);
  assert.equal((await call(app, `/stream/${await publicId({ upstreamId: 'x', title: 't' }, 'test-secret')}`)).status, 404);
});

test('only GET and HEAD are allowed; unknown paths 404', async () => {
  assert.equal((await call(app, '/health', { method: 'POST' })).status, 405);
  assert.equal((await call(app, '/health', { method: 'HEAD' })).status, 200);
  assert.equal((await call(app, '/nowhere')).status, 404);
});

test('/api/telemetry reports each source without leaking upstream details', async () => {
  const res = await call(app, '/api/telemetry');
  assert.equal(res.status, 200);
  const text = await res.text();
  const data = JSON.parse(text);
  assert.equal(data.sources.length, PREFIXES.length);
  assert.ok(['operational', 'degraded', 'down'].includes(data.status));
  assert.doesNotMatch(text, /https?:\/\//);
});

test('a failing provider becomes a 5xx JSON error, never a thrown exception', async () => {
  const failing = testApp({ PROVIDER_MODE: 'multi' });
  const res = await call(failing, '/c/search?q=anything');
  assert.ok(res.status >= 400);
  assert.match(res.headers.get('content-type') ?? '', /json/);
  assert.ok((await res.json()).error);
});

test('the app refuses to build without SECRET_ID', () => {
  assert.throws(() => testApp({ SECRET_ID: '' }), /SECRET_ID is required/);
});
