import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import worker from '../src/adapters/worker.js';

const env = { SECRET_ID: 'worker-secret', PROVIDER_MODE: 'stub', LOG_LEVEL: 'off', SOME_BINDING: { not: 'a string' } };
const req = (path: string) => new Request(`https://audio.example.workers.dev${path}`);

test('the Worker entry serves requests from bindings', async () => {
  const health = await worker.fetch(req('/health'), env);
  assert.equal(health.status, 200);
  const manifest = await (await worker.fetch(req('/manifest.json'), env)).json();
  assert.equal(manifest.name, 'Hi-Res Audio');
});

test('a Worker without SECRET_ID answers 500 JSON instead of crashing', async () => {
  const res = await worker.fetch(req('/health'), { LOG_LEVEL: 'off' });
  assert.equal(res.status, 500);
  assert.deepEqual(await res.json(), { error: 'server misconfigured' });
});

/** Everything the Worker bundle can reach must avoid Node-only APIs, so it runs without nodejs_compat. */
test('shared source stays portable: no node: imports, process or Buffer outside the Node adapter', () => {
  const nodeOnly = new Set(['node.ts', 'node-server.ts', 'load-env.ts']);
  const walk = (dir: string): string[] => readdirSync(dir).flatMap(name => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
  const offenders: string[] = [];
  for (const file of walk('src').filter(f => f.endsWith('.ts') && !nodeOnly.has(f.split('/').pop()!))) {
    const code = readFileSync(file, 'utf8');
    if (/from ['"]node:/.test(code) || /\bprocess\./.test(code) || /\bBuffer\b/.test(code) || /\brequire\(/.test(code)) offenders.push(file);
  }
  assert.deepEqual(offenders, []);
});
