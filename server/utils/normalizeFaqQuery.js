const normalizeFaqQuery = (text) => String(text || '')
  .toLowerCase()
  .replace(/[^a-z0-9\s]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim()
  .replace(/\b(?:enroll(?:ment|ments|ing|ed)?|enrol(?:ment|ments|ling|led)?)\b/g, ' enrollment ')
  .replace(/\btranscript of records\b/g, ' tor ')
  .replace(/\bcomputer science\b/g, ' cs bscs ')
  .replace(/\bbasic education\b/g, ' basic education ')
  .replace(/\b(?:criminal justice|criminology)\b/g, ' crim bscrim ')
  .replace(/\bhospitality management\b/g, ' hm bshm ')
  .replace(/\bphysical therapy\b/g, ' pt bspt ')
  .replace(/\b(?:information technology|it department)\b/g, ' it ')
  .replace(/\s+/g, ' ')
  .trim();

module.exports = normalizeFaqQuery;
