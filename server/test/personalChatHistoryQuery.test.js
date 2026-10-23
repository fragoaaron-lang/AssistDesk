const test = require('node:test');
const assert = require('node:assert/strict');
const { PERSONAL_CHAT_HISTORY_ATTRIBUTES, buildPersonalChatHistoryQuery } = require('../utils/personalChatHistoryQuery');

test('personal chat-history query is scoped to the authenticated user and selects safe fields', () => {
  const query = buildPersonalChatHistoryQuery(42, 25, 10);

  assert.deepEqual(query.where, { user_id: 42 });
  assert.deepEqual(query.attributes, PERSONAL_CHAT_HISTORY_ATTRIBUTES);
  assert.deepEqual(query.order, [['created_at', 'DESC'], ['id', 'DESC']]);
  assert.equal(query.limit, 25);
  assert.equal(query.offset, 10);
});

test('personal chat-history pagination is bounded and handles invalid values', () => {
  assert.equal(buildPersonalChatHistoryQuery(7, '500', '50000').limit, 100);
  assert.equal(buildPersonalChatHistoryQuery(7, '0', '-1').limit, 25);
  assert.equal(buildPersonalChatHistoryQuery(7, 'invalid', 'invalid').offset, 0);
});
