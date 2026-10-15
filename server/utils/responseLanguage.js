const isFilipinoOrTaglish = (value) => /\b(?:po|opo|saan|nasaan|paano|magkano|kailan|ano|sino|ba|naman|kasi|pwede|puwede|pede|hindi|wala|ako|ko|niyo|nyo|lang|yung|ito|iyan|mga)\b/i
  .test(String(value || ''));

module.exports = { isFilipinoOrTaglish };