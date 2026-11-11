import test from 'node:test';
import assert from 'node:assert/strict';
import { RacingProvider } from '../src/providers/racing.js';
import type { Provider, UpstreamTrack } from '../src/types.js';

const track: UpstreamTrack = { upstreamId: '1', title: 'Song' };
const make = (search: () => Promise<UpstreamTrack[]>): Provider => ({ search, getStream: async () => null });

test('racing returns the first non-empty result and prefixes the source', async () => {
  const racer = new RacingProvider([
    { name: 'slow', provider: make(() => new Promise(r => setTimeout(() => r([]), 30))) },
    { name: 'fast', provider: make(async () => [track]) },
  ]);
  const out = await racer.search('q', 'LOSSLESS', 'auto');
  assert.equal(out[0].upstreamId, 'fast:1');
});

test('racing treats empty answers plus one failure as no results, not an outage', async () => {
  const racer = new RacingProvider([
    { name: 'a', provider: make(async () => []) },
    { name: 'b', provider: make(() => new Promise((_, rej) => setTimeout(() => rej(new Error('down')), 20))) },
  ]);
  assert.deepEqual(await racer.search('q', 'LOSSLESS', 'auto'), []);
});

test('racing rejects only when every source fails', async () => {
  const fail = make(async () => { throw new Error('down'); });
  const racer = new RacingProvider([{ name: 'a', provider: fail }, { name: 'b', provider: fail }]);
  await assert.rejects(racer.search('q', 'LOSSLESS', 'auto'), /down/);
});

test('getStream tries the named source first and passes it the bare upstream id', async () => {
  const seen: string[] = [];
  const racer = new RacingProvider([
    { name: 'a', provider: { search: async () => [], getStream: async id => { seen.push('a:' + id); return null; } } },
    { name: 'b', provider: { search: async () => [], getStream: async id => { seen.push('b:' + id); return { url: 'https://b/' + id }; } } },
  ]);
  assert.equal((await racer.getStream('b:42', 'LOSSLESS', 'auto'))?.url, 'https://b/42');
  assert.deepEqual(seen, ['b:42']);
  assert.equal(await new RacingProvider([]).getStream('a:1', 'LOSSLESS', 'auto'), null);
});

test('getStream falls back to other sources when the named one has none or throws', async () => {
  const racer = new RacingProvider([
    { name: 'a', provider: { search: async () => [], getStream: async () => { throw new Error('down'); } } },
    { name: 'b', provider: { search: async () => [], getStream: async id => ({ url: 'https://b/' + id }) } },
  ]);
  assert.equal((await racer.getStream('a:7', 'LOSSLESS', 'auto'))?.url, 'https://b/7');
});
