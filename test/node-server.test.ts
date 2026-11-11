import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';
import type { AddressInfo } from 'node:net';
import { request } from 'node:http';
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

/** Sends a raw request target, which fetch() would never let us send unmodified. */
function raw(path: string): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const req = request({ host: '127.0.0.1', port: Number(new URL(base).port), path }, res => {
      let body = '';
      res.on('data', chunk => { body += chunk; });
      res.on('end', () => resolve({ status: res.statusCode ?? 0, body }));
    });
    req.on('error', reject);
    req.end();
  });
}

test('a leading // is a path, not a host: //manifest.json serves the manifest', async () => {
  const res = await raw('//manifest.json');
  assert.equal(res.status, 200);
  assert.equal(JSON.parse(res.body).name, 'Hi-Res Audio');
  assert.equal((await raw('//c//manifest.json')).status, 200);
  assert.equal(JSON.parse((await raw('//health')).body).ok, true);
});

test('other request-target forms: absolute-form, trailing slash, query strings, asterisk', async () => {
  assert.equal(JSON.parse((await raw('http://anything.example/health')).body).ok, true);
  assert.equal((await raw('/manifest.json/')).status, 200);
  assert.equal((await raw('/search?q=a')).status, 200);
  assert.equal((await raw('*')).status, 200);
});
