import { mapChatLogsToEntries } from './aiChatHistory';

test('maps newest-first chat logs to chronological user and assistant turns', () => {
  const entries = mapChatLogsToEntries([
    { message: 'Second question', ai_response: 'Second answer', created_at: '2025-02-02T00:00:00.000Z' },
    { message: 'First question', ai_response: 'First answer', created_at: '2025-02-01T00:00:00.000Z' },
  ]);

  expect(entries.map(({ role, text }) => [role, text])).toEqual([
    ['user', 'First question'],
    ['assistant', 'First answer'],
    ['user', 'Second question'],
    ['assistant', 'Second answer'],
  ]);
});

test('maps unanswered chat log entries without fabricating an assistant turn', () => {
  expect(mapChatLogsToEntries([{ message: 'A question without an answer', ai_response: null }])).toEqual([
    { role: 'user', text: 'A question without an answer', timestamp: undefined },
  ]);
});
