const test = require('node:test');
const assert = require('node:assert/strict');
const { ChatLog } = require('../models');
const { getMyChatHistory } = require('../controllers/aiController');

test('chat history controller returns only records for the authenticated user', async () => {
  const originalFindAndCountAll = ChatLog.findAndCountAll;
  let receivedQuery;
  const rows = [{ id: 9, user_id: 42, message: 'Question', ai_response: 'Answer' }];
  ChatLog.findAndCountAll = async (query) => {
    receivedQuery = query;
    return { count: 1, rows };
  };
  const response = {
    statusCode: 200,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };

  try {
    await getMyChatHistory({ user: { id: 42 }, query: { limit: '10', offset: '0' } }, response);
  } finally {
    ChatLog.findAndCountAll = originalFindAndCountAll;
  }

  assert.deepEqual(receivedQuery.where, { user_id: 42 });
  assert.deepEqual(response.body, { history: rows, total: 1, limit: 10, offset: 0 });
});

test('chat history controller returns a safe error when history lookup fails', async () => {
  const originalFindAndCountAll = ChatLog.findAndCountAll;
  ChatLog.findAndCountAll = async () => { throw new Error('database details'); };
  const response = {
    statusCode: 200,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };

  try {
    await getMyChatHistory({ user: { id: 42 }, query: {} }, response);
  } finally {
    ChatLog.findAndCountAll = originalFindAndCountAll;
  }

  assert.equal(response.statusCode, 500);
  assert.deepEqual(response.body, { message: 'Unable to load your assistant conversation history.' });
});
