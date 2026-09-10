const test = require('node:test');
const assert = require('node:assert/strict');
const { resolvePort, mergeConfig } = require('../bootstrap');

test('prefers PORT and falls back to SERVER_PORT', () => {
  assert.equal(resolvePort({ PORT: '8080', SERVER_PORT: '4063' }), 8080);
  assert.equal(resolvePort({ SERVER_PORT: '4063' }), 4063);
  assert.equal(resolvePort({}), 5000);
});

test('rejects invalid port values', () => {
  assert.throws(() => resolvePort({ PORT: 'abc' }), /valid port/i);
  assert.throws(() => resolvePort({ SERVER_PORT: '70000' }), /valid port/i);
});

test('merges local secrets without mutating base config', () => {
  const base = { name: 'bot', 'bot-account': { username: 'x' }, utils: { enabled: true } };
  const local = { 'bot-account': { password: 'secret' }, utils: { enabled: false } };
  const merged = mergeConfig(base, local);

  assert.deepEqual(merged, {
    name: 'bot',
    'bot-account': { username: 'x', password: 'secret' },
    utils: { enabled: false },
  });
  assert.deepEqual(base, { name: 'bot', 'bot-account': { username: 'x' }, utils: { enabled: true } });
});
