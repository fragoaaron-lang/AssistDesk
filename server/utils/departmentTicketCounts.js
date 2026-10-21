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

module.exports = { mergeDepartmentTicketCounts };