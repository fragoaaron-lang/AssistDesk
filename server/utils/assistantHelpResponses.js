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
    return 'To create a ticket right here, select “Create a ticket” below the chat. Choose a department (or let AssistDesk route it), select the issue and priority, describe what happened, then submit. Maintenance requests require a photo. You’ll see your ticket number here after it is created. You can also create one from the Tickets page or type “submit request:” followed by a description to submit through chat.';
  }

  return null;
};

module.exports = getAssistantHelpResponse;