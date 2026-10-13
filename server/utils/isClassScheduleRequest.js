const normalize = (value) => String(value || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();

const isClassScheduleRequest = (value) => {
  const query = normalize(value);
  return /\b(schedule|timetable)\b/.test(query)
    && /\b(how|where|is|are|find|get|check|see|view|access|my)\b/.test(query)
    && !/\b(exam|examination|test)\b/.test(query);
};

module.exports = isClassScheduleRequest;
