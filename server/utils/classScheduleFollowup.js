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

const departmentScheduleAnswers = {
  basic: 'Basic Education class schedules are provided by the respective advisers. Please check with your adviser for your current schedule and room assignments.',
  cs: 'CS class schedules are usually shared in the department group chat or posted on the BSCS page. Check those announcements or ask your adviser for your current schedule and room assignments.',
  cba: 'The CBA class schedule is posted at the corner of the CBA bulletin board. Check there or ask your adviser for your current room assignments.',
  crim: 'You can get the CRIM class schedule from Ms. Ma. Jane B. Gonzaga. Contact or visit the department to confirm your current schedule and room assignments.',
  hm: 'The HM class schedule is available at the front desk. Please confirm your room assignments with the department.',
  pt: 'PT class schedules are provided by Ms. Everly Ann Mata. Contact or visit the department to confirm your schedule and room assignments.',
  nursing: 'You can check the Nursing class schedule on the bulletin board in front of the Dean’s Office or ask the department for the current schedule.',
  education: 'Education class schedules are given after enrollment and posted on the bulletin board in the Dean’s Office. Check with the department for your current room assignments.',
};

const getDepartmentScheduleAnswer = (departmentIntent) => departmentScheduleAnswers[departmentIntent] || null;

const getClassScheduleFollowupQuery = (message, previousAssistantMessage) => {
  if (!String(previousAssistantMessage || '').includes('Class schedules are department-specific')) return null;
  const query = normalize(message);
  if (!query || query.length > 80) return null;

  const department = departmentAliases.find(({ aliases }) => aliases.some((alias) => (
    ` ${query} `.includes(` ${normalize(alias)} `)
  )));
  return department ? `Where can I get the ${department.label} class schedule?` : null;
};

module.exports = { getClassScheduleFollowupQuery, getDepartmentScheduleAnswer, SCHEDULE_PROMPT };
