const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const { createLimiter } = require('../middleware/rateLimits');

test('rate limiter rejects requests beyond its configured threshold', async () => {
  const app = express();
  app.use(createLimiter({ windowMs: 60_000, limit: 2, scope: 'test', message: 'Too many test requests.' }));
  app.get('/probe', (req, res) => res.json({ ok: true }));
  const server = await new Promise((resolve) => {
    const listener = app.listen(0, '127.0.0.1', () => resolve(listener));
  });

  try {
    const url = `http://127.0.0.1:${server.address().port}/probe`;
    assert.equal((await fetch(url)).status, 200);
    assert.equal((await fetch(url)).status, 200);
    const blocked = await fetch(url);
    assert.equal(blocked.status, 429);
    assert.deepEqual(await blocked.json(), { message: 'Too many test requests.', request_id: null });
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
});
