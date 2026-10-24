const test = require('node:test');
const assert = require('node:assert/strict');
const getAssistantHelpResponse = require('../utils/assistantHelpResponses');

test('introduces the selected assistant and explains its purpose', () => {
  assert.match(getAssistantHelpResponse('Who are you?', 'Maya'), /I’m Maya,/);
  assert.match(getAssistantHelpResponse('Who are you?', 'Alex'), /I’m Alex,/);
  assert.match(getAssistantHelpResponse('Who are you?', 'Maya'), /campus information.*create or track support tickets/);
});

test('explains what the assistant is and how it can be used', () => {
  const response = getAssistantHelpResponse('What are you?');
  assert.match(response, /AI-powered virtual assistant/);
  assert.match(response, /answer campus questions/);
  assert.match(response, /create or track a support ticket/);
});

test('explains the ticket creation process including maintenance photo requirement', () => {
  const response = getAssistantHelpResponse('How to create a ticket?');
  assert.match(response, /Create a ticket.*below the chat/);
  assert.match(response, /Choose a department.*select the issue and priority/);
  assert.match(response, /Maintenance requests require a photo/);
  assert.match(response, /ticket number here after it is created/);
  assert.match(response, /submit request:/);
});

test('returns no special answer for unrelated questions', () => {
  assert.equal(getAssistantHelpResponse('Where is the library?'), null);
});