const { Department, GeneralIssue, SpecificIssue } = require('../models');
const { recordAudit } = require('../utils/auditLog');

const isDepartmentScopedAdmin = (user) => user?.role === 'admin' && Number(user.department_id) > 0;
const canManageIssue = (user, issue) => !isDepartmentScopedAdmin(user)
  || Number(user.department_id) === Number(issue.department_id);

const withAuditTransaction = async (operation) => {
  const transaction = await GeneralIssue.sequelize.transaction();
  try {
    const result = await operation(transaction);
    await transaction.commit();
    return result;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

const sendError = (res, error, fallback) => {
  if (error.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({ message: 'That issue already exists for this selection.' });
  }
  console.error(error);
  return res.status(error.status || 500).json({ message: error.status ? error.message : fallback });
};

const getSpecificIssue = async (id) => SpecificIssue.findByPk(id, {
  include: [{ model: GeneralIssue, as: 'generalIssue' }],
});

exports.getIssues = async (req, res) => {
  try {
    const generalIssues = await GeneralIssue.findAll({
      ...(isDepartmentScopedAdmin(req.user) ? { where: { department_id: req.user.department_id } } : {}),
      include: [
        { model: Department },
        { model: SpecificIssue, as: 'specificIssues' },
      ],
      order: [['name', 'ASC'], [{ model: SpecificIssue, as: 'specificIssues' }, 'name', 'ASC']],
    });
    return res.json({ generalIssues });
  } catch (error) {
    return sendError(res, error, 'Unable to fetch general and specific issues.');
  }
};

exports.createGeneralIssue = async (req, res) => {
  try {
    const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
    const requestedDepartmentId = Number(req.body?.department_id);
    const departmentId = isDepartmentScopedAdmin(req.user) ? Number(req.user.department_id) : requestedDepartmentId;
    if (!name || name.length > 100 || !Number.isInteger(departmentId) || departmentId < 1) {
      return res.status(400).json({ message: 'A department and a general issue name of up to 100 characters are required.' });
    }
    if (!canManageIssue(req.user, { department_id: departmentId })) {
      return res.status(403).json({ message: 'You may only manage issues in your own department.' });
    }
    if (!await Department.findByPk(departmentId)) {
      return res.status(400).json({ message: 'Selected department is invalid.' });
    }

    const generalIssue = await withAuditTransaction(async (transaction) => {
      const created = await GeneralIssue.create({ department_id: departmentId, name }, { transaction });
      await recordAudit({ actor: req.user, action: 'catalog.general_issue_created', entityType: 'general_issue', entityId: created.id, departmentId, after: created.toJSON(), transaction });
      return created;
    });
    return res.status(201).json(generalIssue);
  } catch (error) {
    return sendError(res, error, 'Unable to create general issue.');
  }
};

exports.updateGeneralIssue = async (req, res) => {
  try {
    const generalIssue = await GeneralIssue.findByPk(req.params.id);
    if (!generalIssue) return res.status(404).json({ message: 'General issue not found.' });
    if (!canManageIssue(req.user, generalIssue)) return res.status(403).json({ message: 'You may only manage issues in your own department.' });
    const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
    if (!name || name.length > 100) return res.status(400).json({ message: 'General issue name is required and must be 100 characters or fewer.' });

    await withAuditTransaction(async (transaction) => {
      const before = generalIssue.toJSON();
      await generalIssue.update({ name }, { transaction });
      await recordAudit({ actor: req.user, action: 'catalog.general_issue_updated', entityType: 'general_issue', entityId: generalIssue.id, departmentId: generalIssue.department_id, before, after: generalIssue.toJSON(), transaction });
    });
    return res.json(generalIssue);
  } catch (error) {
    return sendError(res, error, 'Unable to update general issue.');
  }
};

exports.deleteGeneralIssue = async (req, res) => {
  try {
    const generalIssue = await GeneralIssue.findByPk(req.params.id, {
      include: [{ model: SpecificIssue, as: 'specificIssues' }],
    });
    if (!generalIssue) return res.status(404).json({ message: 'General issue not found.' });
    if (!canManageIssue(req.user, generalIssue)) return res.status(403).json({ message: 'You may only manage issues in your own department.' });

    await withAuditTransaction(async (transaction) => {
      await recordAudit({ actor: req.user, action: 'catalog.general_issue_deleted', entityType: 'general_issue', entityId: generalIssue.id, departmentId: generalIssue.department_id, before: generalIssue.toJSON(), transaction });
      await SpecificIssue.destroy({ where: { general_issue_id: generalIssue.id }, transaction });
      await generalIssue.destroy({ transaction });
    });
    return res.json({ message: 'General issue and its specific issues deleted.' });
  } catch (error) {
    return sendError(res, error, 'Unable to delete general issue.');
  }
};

exports.createSpecificIssue = async (req, res) => {
  try {
    const generalIssue = await GeneralIssue.findByPk(req.params.id);
    if (!generalIssue) return res.status(404).json({ message: 'General issue not found.' });
    if (!canManageIssue(req.user, generalIssue)) return res.status(403).json({ message: 'You may only manage issues in your own department.' });
    const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
    if (!name || name.length > 150) return res.status(400).json({ message: 'Specific issue name is required and must be 150 characters or fewer.' });

    const specificIssue = await withAuditTransaction(async (transaction) => {
      const created = await SpecificIssue.create({ general_issue_id: generalIssue.id, name }, { transaction });
      await recordAudit({ actor: req.user, action: 'catalog.specific_issue_created', entityType: 'specific_issue', entityId: created.id, departmentId: generalIssue.department_id, after: created.toJSON(), transaction });
      return created;
    });
    return res.status(201).json(specificIssue);
  } catch (error) {
    return sendError(res, error, 'Unable to create specific issue.');
  }
};

exports.updateSpecificIssue = async (req, res) => {
  try {
    const specificIssue = await getSpecificIssue(req.params.id);
    if (!specificIssue) return res.status(404).json({ message: 'Specific issue not found.' });
    if (!canManageIssue(req.user, { department_id: specificIssue.generalIssue.department_id })) {
      return res.status(403).json({ message: 'You may only manage issues in your own department.' });
    }
    const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
    if (!name || name.length > 150) return res.status(400).json({ message: 'Specific issue name is required and must be 150 characters or fewer.' });

    await withAuditTransaction(async (transaction) => {
      const before = specificIssue.toJSON();
      await specificIssue.update({ name }, { transaction });
      await recordAudit({ actor: req.user, action: 'catalog.specific_issue_updated', entityType: 'specific_issue', entityId: specificIssue.id, departmentId: specificIssue.generalIssue.department_id, before, after: specificIssue.toJSON(), transaction });
    });
    return res.json(specificIssue);
  } catch (error) {
    return sendError(res, error, 'Unable to update specific issue.');
  }
};

exports.deleteSpecificIssue = async (req, res) => {
  try {
    const specificIssue = await getSpecificIssue(req.params.id);
    if (!specificIssue) return res.status(404).json({ message: 'Specific issue not found.' });
    if (!canManageIssue(req.user, { department_id: specificIssue.generalIssue.department_id })) {
      return res.status(403).json({ message: 'You may only manage issues in your own department.' });
    }

    await withAuditTransaction(async (transaction) => {
      await recordAudit({ actor: req.user, action: 'catalog.specific_issue_deleted', entityType: 'specific_issue', entityId: specificIssue.id, departmentId: specificIssue.generalIssue.department_id, before: specificIssue.toJSON(), transaction });
      await specificIssue.destroy({ transaction });
    });
    return res.json({ message: 'Specific issue deleted.' });
  } catch (error) {
    return sendError(res, error, 'Unable to delete specific issue.');
  }
};
