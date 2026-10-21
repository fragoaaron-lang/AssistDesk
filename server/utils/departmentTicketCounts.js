const mergeDepartmentTicketCounts = (departments = [], counts = []) => {
  const countByDepartmentId = new Map(counts.map((row) => [
    String(row.department_id),
    Number(row.count) || 0,
  ]));
  const knownDepartmentIds = new Set(departments.map((department) => String(department.id)));

  const rows = departments.map((department) => ({
    department_id: department.id,
    department_name: department.name,
    count: countByDepartmentId.get(String(department.id)) || 0,
  }));

  const unassignedCount = counts
    .filter((row) => row.department_id == null || !knownDepartmentIds.has(String(row.department_id)))
    .reduce((total, row) => total + (Number(row.count) || 0), 0);
  if (unassignedCount > 0) rows.push({ department_id: null, department_name: 'Unassigned', count: unassignedCount });

  return rows;
};

const mergeDepartmentStatusCounts = (departments = [], statusRows = []) => {
  const rowsByDepartmentId = new Map(departments.map((department) => [String(department.id), {
    department_id: department.id,
    department_name: department.name,
    resolved: 0,
    unresolved: 0,
  }]));
  let unassigned = null;

  statusRows.forEach((statusRow) => {
    const departmentId = statusRow.department_id == null ? null : String(statusRow.department_id);
    let departmentRow = departmentId == null ? null : rowsByDepartmentId.get(departmentId);
    if (!departmentRow && departmentId != null) {
      departmentRow = {
        department_id: statusRow.department_id,
        department_name: statusRow.department_name || 'Unassigned',
        resolved: 0,
        unresolved: 0,
      };
      rowsByDepartmentId.set(departmentId, departmentRow);
    }
    if (!departmentRow) {
      unassigned ||= { department_id: null, department_name: 'Unassigned', resolved: 0, unresolved: 0 };
      departmentRow = unassigned;
    }

    const count = Number(statusRow.count) || 0;
    if (['closed', 'resolved'].includes(String(statusRow.status || '').toLowerCase())) departmentRow.resolved += count;
    else departmentRow.unresolved += count;
  });

  return [...rowsByDepartmentId.values(), ...(unassigned ? [unassigned] : [])];
};

module.exports = { mergeDepartmentTicketCounts, mergeDepartmentStatusCounts };