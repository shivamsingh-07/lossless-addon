import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';
import type { AddressInfo } from 'node:net';
import { createNodeServer } from '../src/adapters/node-server.js';
import { testApp } from './helpers.js';

const server = createNodeServer(testApp());
let base = '';
before(async () => {
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});
after(() => { server.close(); });

test('the Node adapter serves the app over real HTTP', async () => {
  const res = await fetch(`${base}/health`);
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { ok: true });
  assert.match((await fetch(`${base}/manifest.json`)).headers.get('cache-control') ?? '', /s-maxage/);
});

test('HEAD returns headers and no body; POST is rejected', async () => {
  const head = await fetch(`${base}/`, { method: 'HEAD' });
  assert.equal(head.status, 200);
  assert.equal(await head.text(), '');
  assert.equal((await fetch(`${base}/health`, { method: 'POST' })).status, 405);
});
