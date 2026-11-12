import test from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { formatLabel, normalizeTrack, streamResponse, tierLabel } from '../src/normalize.js';
import { publicId, upstreamIdFromPublicId } from '../src/track-id.js';
import { TtlCache } from '../src/cache.js';

const SECRET = 'unit-test-secret';

test('normalizes a track to an opaque stable id', async () => {
  const track = await normalizeTrack({ upstreamId: '123', title: 'Song', artist: 'Artist', artworkURL: 'https://cdn.example/a.jpg' }, SECRET);
  assert.match(track.id, /^track_[A-Za-z0-9_-]+$/);
  assert.equal(track.title, 'Song');
  assert.equal(await upstreamIdFromPublicId(track.id, SECRET), '123');
});

test('signed IDs reject tampering and the wrong secret', async () => {
  const id = (await normalizeTrack({ upstreamId: '123', title: 'Song' }, SECRET)).id;
  assert.equal(await upstreamIdFromPublicId(`${id.slice(0, -1)}x`, SECRET), undefined);
  assert.equal(await upstreamIdFromPublicId(id, 'another-secret'), undefined);
});

test('signing requires a secret', async () => {
  await assert.rejects(normalizeTrack({ upstreamId: '9', title: 'Song' }, ''), /secret is required/);
});

test('ids are track_<id>_<signature>, and other prefixes are rejected', async () => {
  for (const upstreamId of ['123', '30332818', 'sp\u00e9cial/id+with=chars', '\u65e5\u672c\u8a9e']) {
    const encoded = Buffer.from(upstreamId, 'utf8').toString('base64url');
    const signature = createHmac('sha256', SECRET).update(encoded).digest('base64url').slice(0, 16);
    const id = await publicId({ upstreamId, title: 't' }, SECRET);
    assert.equal(id, `track_${encoded}_${signature}`);
    assert.equal(await upstreamIdFromPublicId(id, SECRET), upstreamId);
    assert.equal(await upstreamIdFromPublicId(`qobuz_${encoded}_${signature}`, SECRET), undefined);
  }
});

test('cache exposes stale values for outage fallback', async () => {
  const cache = new TtlCache<string>(1);
  cache.set('key', 'value');
  await new Promise(resolve => setTimeout(resolve, 5));
  assert.equal(cache.get('key'), undefined);
  assert.equal(cache.getStale('key'), 'value');
});

test('drops non-absolute artwork URLs', async () => {
  assert.equal((await normalizeTrack({ upstreamId: '123', title: 'Song', artworkURL: '/cover.jpg' }, SECRET)).artworkURL, undefined);
});

test('rejects encrypted, non-HTTPS and malformed stream URLs', () => {
  assert.throws(() => streamResponse({ url: 'https://cdn.example/a.flac', encrypted: true }));
  assert.throws(() => streamResponse({ url: 'http://cdn.example/a.flac' }), /HTTPS/);
  assert.throws(() => streamResponse({ url: 'https://', manifest: 'none' }), /invalid stream URL/);
  assert.equal(streamResponse({ url: 'https://api.arcod.xyz/v2/stream/play?t=x', manifest: 'none' }).url, 'https://api.arcod.xyz/v2/stream/play?t=x');
});

test('a stream answer without a quality stays without one: nothing is claimed that the provider did not say', () => {
  const answer = streamResponse({ url: 'https://cdn.example/a.flac', manifest: 'none' });
  assert.equal(answer.quality, undefined);
  assert.equal(answer.format, undefined);
  const labelled = streamResponse({ url: 'https://cdn.example/a.m4a', quality: 'HIGH', format: 'm4a' });
  assert.deepEqual([labelled.format, labelled.quality], ['M4A', 'HIGH']);
});

test('tiers and formats are written in capitals, whatever case the provider used', () => {
  assert.deepEqual(['LOSSLESS', 'lossless', ' High ', 'HI_RES', 'hi-res', 'HI_RES_LOSSLESS'].map(tierLabel), ['LOSSLESS', 'LOSSLESS', 'HIGH', 'HI-RES', 'HI-RES', 'HI-RES']);
  assert.deepEqual(['flac', 'M4a', ' mp3 '].map(formatLabel), ['FLAC', 'M4A', 'MP3']);
  assert.equal(tierLabel(undefined), undefined);
  assert.equal(tierLabel('  '), undefined);
  assert.equal(formatLabel(''), undefined);
  assert.equal(tierLabel('Studio Master'), 'Studio Master');
});

test('search rows carry the same style', async () => {
  const row = await normalizeTrack({ upstreamId: '1', title: 'Song', format: 'flac', audioQuality: 'LOSSLESS' }, SECRET);
  assert.deepEqual([row.format, row.audioQuality], ['FLAC', 'LOSSLESS']);
});
