const departmentPrefixes = [
  ['basic education', 'BE'],
  ['computer science', 'CS'],
  ['cs', 'CS'],
  ['college of business administration', 'CBA'],
  ['cba', 'CBA'],
  ['accountancy', 'CBA'],
  ['business administration', 'CBA'],
  ['college of criminology', 'CR'],
  ['criminology', 'CR'],
  ['hospitality management', 'HM'],
  ['charm', 'HM'],
  ['physical therapy', 'PT'],
  ['college of nursing', 'NU'],
  ['nursing', 'NU'],
  ['education', 'ED'],
  ['maintenance', 'MT'],
  ['clinic', 'CL'],
  ['accounting', 'AC'],
  ['guidance', 'GU'],
  ['library', 'LI'],
  ['student affairs', 'OSA'],
  ['information technology', 'IT'],
  ['it department', 'IT'],
];

const getDepartmentPrefix = (departmentName) => {
  const normalizedName = String(departmentName || '').toLowerCase();
  const match = departmentPrefixes.find(([name]) => normalizedName.includes(name));
  if (match) return match[1];
  const fallback = normalizedName.replace(/[^a-z]/g, '').slice(0, 3).toUpperCase();
  return fallback || 'GEN';
};

const formatTicketNumber = (ticketId, departmentName) => (
  `${getDepartmentPrefix(departmentName)}-${String(ticketId).padStart(4, '0')}`
);

const addTicketNumber = (ticket) => {
  if (!ticket) return ticket;
  const departmentName = ticket.Department?.name || ticket.department?.name;
  ticket.setDataValue('ticket_code', formatTicketNumber(ticket.id, departmentName));
  return ticket;
};

module.exports = { addTicketNumber, formatTicketNumber, getDepartmentPrefix };