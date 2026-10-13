const normalize = (value) => String(value || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();

const departmentAliases = [
  { label: 'Basic Education', aliases: ['basic education', 'elementary', 'jhs', 'shs'] },
  { label: 'CS', aliases: ['computer science', 'computer studies', 'bscs', 'cs'] },
  { label: 'CBA', aliases: ['business administration', 'accountancy', 'college of business', 'cba', 'bsa', 'bsba'] },
  { label: 'CRIM', aliases: ['criminology', 'criminal justice', 'crim', 'bscrim'] },
  { label: 'HM', aliases: ['hospitality management', 'hospitality', 'charm', 'bshm'] },
  { label: 'PT', aliases: ['physical therapy', 'bspt'] },
  { label: 'Nursing', aliases: ['nursing', 'bsn'] },
  { label: 'Education', aliases: ['education department', 'college of education', 'education', 'beed', 'bsed'] },
];

const SCHEDULE_PROMPT = 'Class schedules are department-specific. They are usually shared during enrollment or by your adviser or dean’s office; some departments also post them on a bulletin board, group chat, or official page. Check your department’s latest announcement, or tell me your program so I can point you to the relevant department information.';

const getClassScheduleFollowupQuery = (message, previousAssistantMessage) => {
  if (!String(previousAssistantMessage || '').includes('Class schedules are department-specific')) return null;
  const query = normalize(message);
  if (!query || query.length > 80) return null;

  const department = departmentAliases.find(({ aliases }) => aliases.some((alias) => (
    ` ${query} `.includes(` ${normalize(alias)} `)
  )));
  return department ? `Where can I get the ${department.label} class schedule?` : null;
};

module.exports = { getClassScheduleFollowupQuery, SCHEDULE_PROMPT };
