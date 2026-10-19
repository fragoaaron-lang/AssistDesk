const test = require('node:test');
const assert = require('node:assert/strict');
const { buildPersonalActivityQuery } = require('../utils/personalActivityQuery');

test('personal activity query is scoped to the authenticated actor and selects safe fields', () => {
  const query = buildPersonalActivityQuery(42, 25, 10);

  assert.deepEqual(query.where, { actor_user_id: 42 });
  assert.deepEqual(query.attributes, ['id', 'action', 'entity_type', 'entity_id', 'created_at']);
  assert.deepEqual(query.order, [['created_at', 'DESC'], ['id', 'DESC']]);
  assert.equal(query.limit, 25);
  assert.equal(query.offset, 10);
});

test('personal activity pagination is bounded and invalid input falls back safely', () => {
  assert.equal(buildPersonalActivityQuery(7, '1000', '999999').limit, 100);
  assert.equal(buildPersonalActivityQuery(7, '-5', '-1').limit, 50);
  assert.equal(buildPersonalActivityQuery(7, '-5', '-1').offset, 0);
});