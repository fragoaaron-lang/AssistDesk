const normalizeStudentQuery = (value) => String(value || '')
  .toLowerCase()
  .replace(/[^a-z0-9\s]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim()
  .replace(/\b(?:ere|wher|whr)\b/g, 'where')
  .replace(/\b(?:u)\b/g, 'you')
  .replace(/\b(?:ur)\b/g, 'your')
  .replace(/\b(?:pls|plz)\b/g, 'please')
  .replace(/\bthx\b/g, 'thanks')
  .replace(/\s+/g, ' ')
  .trim();

module.exports = normalizeStudentQuery;