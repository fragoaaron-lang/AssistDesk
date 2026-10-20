const getDepartmentScope = (user) => {
  const departmentId = Number(user?.department_id);
  return user?.role === 'admin' && Number.isInteger(departmentId) && departmentId > 0
    ? departmentId
    : null;
};

const canUseDepartmentFilter = (user, requestedDepartmentId) => {
  const departmentScope = getDepartmentScope(user);
  return departmentScope == null
    || requestedDepartmentId == null
    || requestedDepartmentId === ''
    || Number(requestedDepartmentId) === departmentScope;
};

const applyDepartmentScope = (user, where = {}) => {
  const departmentScope = getDepartmentScope(user);
  return departmentScope == null ? { ...where } : { ...where, department_id: departmentScope };
};

const getTicketAccessWhere = (user) => {
  const departmentScope = getDepartmentScope(user);
  if (departmentScope != null) return { department_id: departmentScope };
  if (user?.role === 'staff') return { department_id: Number(user.department_id) || -1 };
  if (user?.role === 'admin') return {};
  return { user_id: user?.id };
};

module.exports = {
  getDepartmentScope,
  canUseDepartmentFilter,
  applyDepartmentScope,
  getTicketAccessWhere,
};