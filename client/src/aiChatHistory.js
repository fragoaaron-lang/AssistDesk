export const mapChatLogsToEntries = (chatLogs = []) => [...chatLogs]
  .reverse()
  .flatMap((chatLog) => [
    { role: 'user', text: chatLog.message, timestamp: chatLog.created_at },
    ...(chatLog.ai_response ? [{ role: 'assistant', text: chatLog.ai_response, timestamp: chatLog.created_at }] : []),
  ]);
