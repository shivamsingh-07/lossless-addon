import test from 'node:test';
import assert from 'node:assert/strict';
import { createLogger } from '../src/logger.js';

const capture = (level?: 'info' | 'warn' | 'error' | 'silent') => {
  const lines: Array<{ line: string; severity: string }> = [];
  const logger = createLogger({ level, now: () => new Date('2026-01-02T03:04:05.678Z'), write: (line, severity) => lines.push({ line, severity }) });
  return { logger, lines, json: () => lines.map(l => JSON.parse(l.line)) };
};

test('each line is JSON with exactly time, severity and msg', () => {
  const { logger, json } = capture();
  logger.info('listening on 0.0.0.0:3000');
  assert.deepEqual(json(), [{ time: '2026-01-02T03:04:05.678Z', severity: 'INFO', msg: 'listening on 0.0.0.0:3000' }]);
});

test('errors add err with the message only, never the stack', () => {
  const { logger, json } = capture();
  logger.error('request failed', new Error('boom'));
  logger.warn('odd', 'plain text');
  assert.deepEqual(json().map(e => e.err), ['boom', 'plain text']);
  assert.doesNotMatch(JSON.stringify(json()), /\bat\s.+\.ts/);
  assert.deepEqual(Object.keys(json()[0]), ['time', 'severity', 'msg', 'err']);
});

test('LOG_LEVEL filtering', () => {
  const warn = capture('warn');
  warn.logger.info('i'); warn.logger.warn('w'); warn.logger.error('e');
  assert.deepEqual(warn.json().map(e => e.severity), ['WARN', 'ERROR']);
  const silent = capture('silent');
  silent.logger.error('nope');
  assert.equal(silent.lines.length, 0);
});

test('info is for stdout; warn and error carry their own severity for stderr', () => {
  const { logger, lines } = capture();
  logger.info('i'); logger.warn('w'); logger.error('e');
  assert.deepEqual(lines.map(l => l.severity), ['INFO', 'WARN', 'ERROR']);
});

test('very long messages are cut, and a throwing writer never throws', () => {
  const { logger, json } = capture();
  logger.error('x'.repeat(2000), new Error('y'.repeat(2000)));
  assert.ok(json()[0].msg.length <= 501 && json()[0].err.length <= 501);
  assert.doesNotThrow(() => createLogger({ write: () => { throw new Error('disk full'); } }).error('x'));
});

test('loggerFromEnv honours LOG_LEVEL and ignores unknown values', async () => {
  const { loggerFromEnv } = await import('../src/logger.js');
  const lines: string[] = [];
  const orig = { log: console.log, warn: console.warn, error: console.error };
  console.log = (l: string) => { lines.push(l); }; console.warn = console.log; console.error = console.log;
  try {
    loggerFromEnv({ LOG_LEVEL: 'silent' }).error('hidden');
    loggerFromEnv({ LOG_LEVEL: 'warn' }).info('hidden');
    assert.equal(lines.length, 0);
    loggerFromEnv({ LOG_LEVEL: 'nonsense' }).info('shown');
    assert.equal(lines.length, 2);
    assert.match(lines[0], /ignoring unknown LOG_LEVEL/);
  } finally { Object.assign(console, orig); }
});
