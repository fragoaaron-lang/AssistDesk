const normalizeStudentQuery = require('./normalizeStudentQuery');

const getAssistantHelpResponse = (query, assistantName = 'Assistant') => {
  const normalized = normalizeStudentQuery(query);
  const name = ['Alex', 'Maya'].includes(assistantName) ? assistantName : 'Assistant';

  if (/\b(?:who are you|what is your name|what should i call you|tell me about yourself)\b/.test(normalized)) {
    return `I’m ${name}, AssistDesk’s virtual campus support assistant. I help TCC students and families find campus information, learn about services, reach the right department, and create or track support tickets.`;
  }

  if (/\bwhat are y[o]{1,3}u\b|\bare you (?:an? )?(?:ai|bot|human|assistant)\b/.test(normalized)) {
    return 'I’m an AI-powered virtual assistant in AssistDesk. I use the school’s help information to answer campus questions and guide you through services. You can also ask me to create or track a support ticket. I can’t make official decisions.';
  }

  if (/\bhow\b.*\b(?:create|submit|make|file)\b.*\b(?:ticket|request)\b|\bhow (?:is|are) (?:a |the )?(?:ticket|request)s? created\b|\bsteps to (?:create|submit|make|file) (?:a )?(?:ticket|request)\b/.test(normalized)) {
    return 'To create a ticket:\n1. Open Tickets (Support tickets).\n2. Optionally choose a department, then select a general issue and specific issue.\n3. Choose a priority and describe what happened, including helpful details or location.\n4. For Maintenance requests, attach a photo of the issue (required).\n5. Select Create Ticket to submit it. You’ll see the ticket number after submission. You can later ask me to check its status. You can also type “submit request:” followed by a description to submit a request through chat.';
  }

  return null;
};

module.exports = getAssistantHelpResponse;