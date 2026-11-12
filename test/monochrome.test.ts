import test from 'node:test';
import assert from 'node:assert/strict';
import { loadConfig } from '../src/config.js';
import { MonochromeProvider } from '../src/providers/monochrome.js';
import { mockFetch } from './helpers.js';

const provider = new MonochromeProvider(loadConfig({ SECRET_ID: 'x', MONOCHROME_BASE_URL: 'https://mono.test' }));
const bytes = (...codes: Array<number | string>) => Uint8Array.from(codes.flatMap(c => typeof c === 'string' ? [...c].map(ch => ch.charCodeAt(0)) : [c]));
const stream = () => provider.getStream('123', 'LOSSLESS', 'auto');

test('a FLAC file is labelled flac / LOSSLESS', async () => {
  const { result, calls } = await mockFetch(() => new Response(bytes('fLaC', 0, 0, 0, 34, 16, 0, 16, 0), { status: 206 }), stream);
  assert.equal(result?.url, 'https://mono.test/track/123');
  assert.deepEqual([result?.format, result?.quality], ['flac', 'LOSSLESS']);
  assert.equal(calls[0].init.headers.range, 'bytes=0-11');
});

test('an MP4 (AAC) file is NOT passed off as lossless', async () => {
  const { result } = await mockFetch(() => new Response(bytes(0, 0, 0, 28, 'ftypisom'), { status: 206 }), stream);
  assert.deepEqual([result?.format, result?.quality], ['m4a', 'HIGH']);
});

test('unknown content, a failed check or an ignored Range header make no claim and never download the file', async () => {
  for (const answer of [
    () => new Response(bytes('OggS', 0, 0, 0, 0, 0, 0, 0, 0), { status: 206 }),
    () => { throw new Error('network down'); },
    () => new Response('x'.repeat(10_000), { status: 200 }),
  ]) {
    const { result } = await mockFetch(answer, stream);
    assert.equal(result?.url, 'https://mono.test/track/123');
    assert.equal(result?.format, undefined);
    assert.equal(result?.quality, undefined);
  }
});

test('invalid track ids are rejected before any request is made', async () => {
  const { result, calls } = await mockFetch(() => new Response('x'), () => provider.getStream('../etc', 'LOSSLESS', 'auto'));
  assert.equal(result, null);
  assert.equal(calls.length, 0);
});
