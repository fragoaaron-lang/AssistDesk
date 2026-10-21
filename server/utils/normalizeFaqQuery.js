const normalizeStudentQuery = require('./normalizeStudentQuery');

const normalizeFaqQuery = (text) => normalizeStudentQuery(text)
  .replace(/\bcertificate of enrollment\b/g, ' coe ')
  .replace(/\bcertificate of registration\b/g, ' cor ')
  .replace(/\b(?:enroll(?:ment|ments|ing|ed)?|enrol(?:ment|ments|ling|led)?)\b/g, ' enrollment ')
  .replace(/\btranscript of records\b/g, ' tor ')
  .replace(/\b(?:bscrim|criminology|criminal justice)\b/g, ' crim ')
  .replace(/\bcomputer science\b/g, ' cs bscs ')
  .replace(/\bbasic education\b/g, ' basic education ')
  .replace(/\bhospitality management\b/g, ' hm bshm ')
  .replace(/\b(?:pt|bspt|physical therapy)\b/g, ' physical therapy ')
  .replace(/\b(?:information technology|it department)\b/g, ' it ')
  .replace(/\s+/g, ' ')
  .trim();

module.exports = normalizeFaqQuery;
