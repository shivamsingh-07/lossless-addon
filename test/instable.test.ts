import test from 'node:test';
import assert from 'node:assert/strict';
import { loadConfig } from '../src/config.js';
import { InstableProvider } from '../src/providers/instable.js';
import { mockFetch, settle } from './helpers.js';

const provider = new InstableProvider(loadConfig({ SECRET_ID: 'x', INSTABLE_BASE_URL: 'https://instable.test', UPSTREAM_RETRIES: '0' }));
const ok = (url = 'https://cdn.example/a.flac') => new Response(JSON.stringify({ url, mimeType: 'audio/flac', quality: 27, trackId: 1 }));
const fail = (status = 400) => new Response('{}', { status });
const formatAsked = (url: URL) => url.searchParams.get('quality');
const stream = (quality: 'LOSSLESS' | 'HIGH' | 'LOW') => provider.getStream('1', quality, 'auto');

test('lossless starts at hi-res (27) and stops there when it answers', async () => {
  const { result, calls } = await mockFetch(() => ok(), () => stream('LOSSLESS'));
  assert.deepEqual(calls.map(c => formatAsked(c.url)), ['27']);
  assert.equal(result?.url, 'https://cdn.example/a.flac');
});

test('lossless steps down to CD quality (6) when hi-res fails outright', async () => {
  const { result, calls } = await mockFetch(url => (formatAsked(url) === '27' ? fail() : ok('https://cdn.example/cd.flac')), () => stream('LOSSLESS'));
  assert.deepEqual(calls.map(c => formatAsked(c.url)), ['27', '6']);
  assert.equal(result?.url, 'https://cdn.example/cd.flac');
});

test('if every step fails the error surfaces; a miss on every step is a clean null', async () => {
  const failed = await mockFetch(() => fail(), () => settle(stream('LOSSLESS')));
  assert.deepEqual(failed.calls.map(c => formatAsked(c.url)), ['27', '6']);
  assert.ok(failed.result.error);
  const empty = await mockFetch(() => new Response('{}'), () => stream('LOSSLESS'));
  assert.equal(empty.result, null);
});

test('HIGH and LOW ask for the 320 kbps MP3 (5) only', async () => {
  for (const tier of ['HIGH', 'LOW'] as const) {
    const { calls } = await mockFetch(() => new Response(JSON.stringify({ url: 'https://cdn.example/a.mp3', mimeType: 'audio/mpeg' })), () => stream(tier));
    assert.deepEqual(calls.map(c => formatAsked(c.url)), ['5'], tier);
  }
});

test('the answer never states a tier, because the upstream echoes the format asked for, not what the file is', async () => {
  const { result } = await mockFetch(() => ok(), () => stream('LOSSLESS'));
  assert.equal(result?.quality, undefined);
  assert.equal(result?.format, 'flac');
});

test('search rows say HI-RES only for genuinely better-than-CD tracks', async () => {
  const items = [
    { id: 1, title: 'Hi-res flag', maximum_bit_depth: 24, maximum_sampling_rate: 96, hires: true },
    { id: 2, title: 'CD only', maximum_bit_depth: 16, maximum_sampling_rate: 44.1, hires: false },
    { id: 3, title: 'High rate', maximum_bit_depth: 16, maximum_sampling_rate: 96 },
    { id: 4, title: 'Unknown quality' },
  ];
  const { result } = await mockFetch(() => new Response(JSON.stringify({ data: { tracks: { items } } })), () => provider.search('q', 'LOSSLESS', 'auto'));
  assert.deepEqual(result.map(t => t.audioQuality), ['HI-RES', 'LOSSLESS', 'HI-RES', undefined]);
});
