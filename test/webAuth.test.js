const test = require('node:test');
const assert = require('node:assert/strict');
const { createAuthMiddleware, safeEqual } = require('../webAuth');

test('safeEqual handles equal and unequal secrets', () => {
  assert.equal(safeEqual('abc', 'abc'), true);
  assert.equal(safeEqual('abc', 'abd'), false);
  assert.equal(safeEqual('abc', 'abcd'), false);
});

test('auth middleware accepts bearer token', async () => {
  const middleware = createAuthMiddleware('secret');
  const req = { headers: { authorization: 'Bearer secret' } };
  let nextCalled = false;
  await middleware(req, { status: () => ({ json: () => {} }) }, () => { nextCalled = true; });
  assert.equal(nextCalled, true);
});

test('auth middleware rejects missing token', async () => {
  const middleware = createAuthMiddleware('secret');
  let statusCode = 0;
  let payload;
  const res = {
    status(code) { statusCode = code; return this; },
    json(value) { payload = value; },
  };
  let nextCalled = false;
  await middleware({ headers: {} }, res, () => { nextCalled = true; });
  assert.equal(nextCalled, false);
  assert.equal(statusCode, 401);
  assert.equal(payload.error, 'Unauthorized');
});
