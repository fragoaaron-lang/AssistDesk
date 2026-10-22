const test = require('node:test');
const assert = require('node:assert/strict');
const { getAppealContactEmail } = require('../utils/appealContact');

test('explicit appeal inbox takes priority and display names are stripped', () => {
  assert.equal(getAppealContactEmail({
    APPEAL_CONTACT_EMAIL: 'Appeals Team <appeals@example.edu>',
    MAIL_USER: 'sender@example.edu',
  }), 'appeals@example.edu');
});

test('requested administrator inbox is the default appeal destination', () => {
  assert.equal(getAppealContactEmail({ MAIL_FROM: 'AssistDesk <sender@example.edu>' }), 'fragoaaron@gmail.com');
});

test('unusable email configuration returns no appeal recipient', () => {
  assert.equal(getAppealContactEmail({ APPEAL_CONTACT_EMAIL: 'Appeals Office' }), 'fragoaaron@gmail.com');
});