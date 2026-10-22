const canonicalDepartmentNames = {
  'basic education': 'Basic Education Department',
  'basic education department': 'Basic Education Department',
  'college of education': 'College of Education',
  'education department': 'College of Education',
  'college of nursing': 'College of Nursing',
  'nursing department': 'College of Nursing',
  cs: 'College of Computer Studies',
  'cs department': 'College of Computer Studies',
  'computer science department': 'College of Computer Studies',
  'college of computer studies': 'College of Computer Studies',
  cba: 'College of Business and Accountancy',
  'college of business administration': 'College of Business and Accountancy',
  'college of business and accountancy': 'College of Business and Accountancy',
  charm: 'College of Hospitality Management',
  'hm department': 'College of Hospitality Management',
  'college of hospitality and restaurant management': 'College of Hospitality Management',
  'college of hospitality management': 'College of Hospitality Management',
  'college of criminology': 'College of Criminology',
  'crim department': 'College of Criminology',
  'criminology department': 'College of Criminology',
  'college of physical therapy': 'College of Physical Therapy',
  'physical therapy department': 'College of Physical Therapy',
  maintenance: 'Maintenance Department',
  'maintenance department': 'Maintenance Department',
  accounting: 'Accounting Department',
  'accounting department': 'Accounting Department',
  'registrar department': 'Registrar Office',
  'registrar office': 'Registrar Office',
  library: 'Library',
  'library department': 'Library',
  guidance: 'Guidance Office',
  'guidance office': 'Guidance Office',
  'office of student affairs': 'Office of Student Affairs',
  'office of the student affairs': 'Office of Student Affairs',
  'student affairs': 'Office of Student Affairs',
  clinic: 'Clinic',
  'clinic department': 'Clinic',
  'it department': 'Information Technology Department',
  'information technology department': 'Information Technology Department',
};

const normalizeDepartmentName = (value) => String(value || '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, ' ')
  .trim();

const getCanonicalDepartmentName = (name) => {
  const normalized = normalizeDepartmentName(name);
  return canonicalDepartmentNames[normalized] || String(name || 'Unassigned').trim() || 'Unassigned';
};

const getDepartmentGroupKey = (name) => normalizeDepartmentName(getCanonicalDepartmentName(name));

const createDepartmentGroups = (departments, fields) => {
  const groupsByKey = new Map();
  const keyByDepartmentId = new Map();

  departments.forEach((department) => {
    const key = getDepartmentGroupKey(department.name);
    let group = groupsByKey.get(key);
    if (!group) {
      group = { department_id: department.id, department_name: getCanonicalDepartmentName(department.name), ...fields };
      groupsByKey.set(key, group);
    } else if (Number(department.id) < Number(group.department_id)) {
      group.department_id = department.id;
    }
    keyByDepartmentId.set(String(department.id), key);
  });

  return { groupsByKey, keyByDepartmentId };
};

const mergeDepartmentTicketCounts = (departments = [], counts = []) => {
  const { groupsByKey, keyByDepartmentId } = createDepartmentGroups(departments, { count: 0 });
  let unassignedCount = 0;

  counts.forEach((row) => {
    const key = row.department_id == null ? null : keyByDepartmentId.get(String(row.department_id));
    const count = Number(row.count) || 0;
    if (key) groupsByKey.get(key).count += count;
    else unassignedCount += count;
  });

  const rows = [...groupsByKey.values()];
  if (unassignedCount > 0) rows.push({ department_id: null, department_name: 'Unassigned', count: unassignedCount });
  return rows;
};

const mergeDepartmentStatusCounts = (departments = [], statusRows = []) => {
  const { groupsByKey, keyByDepartmentId } = createDepartmentGroups(departments, { resolved: 0, unresolved: 0 });
  let unassigned = null;

  statusRows.forEach((statusRow) => {
    const departmentId = statusRow.department_id == null ? null : String(statusRow.department_id);
    const key = departmentId == null ? null : keyByDepartmentId.get(departmentId);
    let departmentRow = key ? groupsByKey.get(key) : null;

    if (!departmentRow && departmentId != null && statusRow.department_name) {
      const rowKey = getDepartmentGroupKey(statusRow.department_name);
      departmentRow = groupsByKey.get(rowKey);
      if (!departmentRow) {
        departmentRow = {
          department_id: statusRow.department_id,
          department_name: getCanonicalDepartmentName(statusRow.department_name),
          resolved: 0,
          unresolved: 0,
        };
        groupsByKey.set(rowKey, departmentRow);
      }
    }

    if (!departmentRow) {
      unassigned ||= { department_id: null, department_name: 'Unassigned', resolved: 0, unresolved: 0 };
      departmentRow = unassigned;
    }

    const count = Number(statusRow.count) || 0;
    if (['closed', 'resolved'].includes(String(statusRow.status || '').toLowerCase())) departmentRow.resolved += count;
    else departmentRow.unresolved += count;
  });

  return [...groupsByKey.values(), ...(unassigned ? [unassigned] : [])];
};

module.exports = { mergeDepartmentTicketCounts, mergeDepartmentStatusCounts };