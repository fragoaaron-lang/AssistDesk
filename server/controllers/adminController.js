const { User, Department, Ticket, TicketUpdate, Notification, ChatLog, Admin, PasswordResetToken, Announcement, Faq, AuditLog } = require('../models');
const { notifyAdmins, moveStaffDepartmentRoom } = require('../utils/socket');
const { addTicketNumber } = require('../utils/ticketNumber');
const { recordAudit } = require('../utils/auditLog');
const { Op } = require('sequelize');

const buildTicketFilters = (query = {}) => {
  const where = {};
  const and = [];
  const departmentId = Number(query.department_id);
  if (query.department_id && Number.isInteger(departmentId) && departmentId > 0) where.department_id = departmentId;
  if (query.category === 'Uncategorized') where[Op.or] = [{ category: null }, { category: '' }];
  else if (query.category) where.category = String(query.category).slice(0, 80);
  if (query.priority && ['low', 'medium', 'urgent'].includes(query.priority)) where.priority = query.priority;
  if (query.status && ['open', 'pending', 'in_progress', 'resolved', 'closed'].includes(query.status)) where.status = query.status;

  const start = query.start_date ? new Date(`${query.start_date}T00:00:00.000Z`) : null;
  const end = query.end_date ? new Date(`${query.end_date}T23:59:59.999Z`) : null;
  if (start && !Number.isNaN(start.getTime())) and.push({ created_at: { [Op.gte]: start } });
  if (end && !Number.isNaN(end.getTime())) and.push({ created_at: { [Op.lte]: end } });
  if (and.length) where[Op.and] = and;
  return where;
};

const validateReportFilters = (query = {}) => {
  const datePattern = /^\d{4}-\d{2}-\d{2}$/;
  for (const key of ['start_date', 'end_date']) {
    if (!query[key]) continue;
    const parsedDate = new Date(`${query[key]}T00:00:00.000Z`);
    if (!datePattern.test(query[key]) || Number.isNaN(parsedDate.getTime()) || parsedDate.toISOString().slice(0, 10) !== query[key]) {
      return `${key} must use YYYY-MM-DD format.`;
    }
  }
  if (query.start_date && query.end_date && query.start_date > query.end_date) return 'start_date must be on or before end_date.';
  if (query.department_id && (!/^\d+$/.test(query.department_id) || Number(query.department_id) < 1)) return 'department_id must be a positive integer.';
  if (query.priority && !['low', 'medium', 'urgent'].includes(query.priority)) return 'priority is invalid.';
  if (query.status && !['open', 'pending', 'in_progress', 'resolved', 'closed'].includes(query.status)) return 'status is invalid.';
  if (query.category && String(query.category).length > 80) return 'category must be 80 characters or fewer.';
  return null;
};

const csvCell = (value) => {
  let text = value == null ? '' : String(value);
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
};

const formatCsv = (rows) => rows.map((row) => row.map(csvCell).join(',')).join('\r\n');

exports.getReports = async (req, res) => {
  try {
    const filterError = validateReportFilters(req.query);
    if (filterError) return res.status(400).json({ message: filterError });
    const ticketWhere = buildTicketFilters(req.query);
    const departmentCounts = await Ticket.findAll({
      attributes: [
        'department_id',
        [Ticket.sequelize.fn('COUNT', Ticket.sequelize.col('Ticket.id')), 'count'],
      ],
      where: ticketWhere,
      include: [{ model: Department, attributes: ['name'] }],
      group: ['department_id', 'Department.id', 'Department.name'],
      raw: true,
    });

    const ticketCountsByDepartment = departmentCounts.map((row) => ({
      department_id: row.department_id,
      department_name: row['Department.name'] || 'Unassigned',
      count: row.count,
    }));

    const ticketCountsByStatus = await Ticket.findAll({
      attributes: ['status', [Ticket.sequelize.fn('COUNT', Ticket.sequelize.col('id')), 'count']],
      where: ticketWhere,
      group: ['status'],
      raw: true,
    });
    const assignmentCounts = {
      assigned: await Ticket.count({ where: { [Op.and]: [ticketWhere, { assigned_user_id: { [Op.ne]: null } }] } }),
      unassigned: await Ticket.count({ where: { [Op.and]: [ticketWhere, { assigned_user_id: null }] } }),
    };

    const ticketCountsByPriority = await Ticket.findAll({
      attributes: ['priority', [Ticket.sequelize.fn('COUNT', Ticket.sequelize.col('id')), 'count']],
      where: ticketWhere,
      group: ['priority'],
      order: [['priority', 'ASC']],
      raw: true,
    });

    const departmentStatusRows = await Ticket.findAll({
      attributes: ['department_id', 'status', [Ticket.sequelize.fn('COUNT', Ticket.sequelize.col('Ticket.id')), 'count']],
      where: ticketWhere,
      include: [{ model: Department, attributes: ['name'] }],
      group: ['department_id', 'status', 'Department.id', 'Department.name'],
      raw: true,
    });
    const ticketsByDepartmentStatus = {};
    departmentStatusRows.forEach((row) => {
      const departmentId = row.department_id || 'unassigned';
      if (!ticketsByDepartmentStatus[departmentId]) {
        ticketsByDepartmentStatus[departmentId] = {
          department_id: row.department_id,
          department_name: row['Department.name'] || 'Unassigned',
          resolved: 0,
          unresolved: 0,
        };
      }
      const count = Number(row.count) || 0;
      if (['closed', 'resolved'].includes(row.status)) ticketsByDepartmentStatus[departmentId].resolved += count;
      else ticketsByDepartmentStatus[departmentId].unresolved += count;
    });

    const faqs = await Faq.findAll({ attributes: ['id', 'question', 'keywords'] });
    const chatMessages = await ChatLog.findAll({ attributes: ['message'] });
    const normalizeText = (value) => String(value || '').toLowerCase().replace(/[^a-z0-9 ]/g, ' ');
    const faqUsage = faqs.map((faq) => {
      const terms = `${faq.question} ${faq.keywords || ''}`.split(/\s+/).map(normalizeText).filter((term) => term.length > 3);
      const count = chatMessages.filter((chat) => {
        const message = normalizeText(chat.message);
        return terms.length > 0 && terms.filter((term) => message.includes(term)).length >= Math.min(2, terms.length);
      }).length;
      return { id: faq.id, question: faq.question, count };
    }).sort((first, second) => second.count - first.count);
    const mostAskedFaqs = faqUsage.filter((faq) => faq.count > 0).slice(0, 5);
    const mostAskedFaq = faqUsage[0] || null;

    const concernCounts = await Ticket.findAll({
      attributes: ['category', [Ticket.sequelize.fn('COUNT', Ticket.sequelize.col('id')), 'count']],
      where: ticketWhere,
      group: ['category'],
      order: [[Ticket.sequelize.literal('count'), 'DESC']],
      raw: true,
    });

    const ticketCountsByConcern = concernCounts.map((row) => ({
      concern: row.category || 'Uncategorized',
      count: row.count,
    }));
    const availableCategories = [...new Set((await Ticket.findAll({ attributes: ['category'], raw: true }))
      .map((row) => row.category || 'Uncategorized'))].sort((first, second) => first.localeCompare(second));

    const usersByRole = await User.findAll({
      attributes: ['role', [User.sequelize.fn('COUNT', User.sequelize.col('id')), 'count']],
      group: ['role'],
      raw: true,
    });

    const users = await User.findAll({
      attributes: ['id', 'name', 'email', 'role', 'student_number', 'account_status'],
      where: { role: { [Op.in]: ['student', 'faculty', 'staff'] } },
      include: [{ model: Department, attributes: ['name'] }],
      order: [['role', 'ASC'], ['name', 'ASC']],
    });

    const requesterCounts = await Ticket.findAll({
      attributes: [
        'user_id',
        [Ticket.sequelize.fn('COUNT', Ticket.sequelize.col('Ticket.id')), 'count'],
      ],
      where: ticketWhere,
      include: [{ model: User, attributes: ['id', 'name', 'email'] }],
      group: ['user_id', 'User.id', 'User.name', 'User.email'],
      order: [[Ticket.sequelize.literal('count'), 'DESC']],
      raw: true,
    });

    const ticketCountsByRequester = requesterCounts.map((row) => ({
      requester_id: row.user_id,
      requester_name: row['User.name'] || row['User.email'] || 'Unknown requester',
      count: row.count,
    }));

    const recentTickets = await Ticket.findAll({
      attributes: ['id', 'user_id', 'department_id', 'subject', 'category', 'priority', 'status', 'created_at'],
      where: ticketWhere,
      order: [['created_at', 'DESC']],
      limit: 100,
      include: [{ model: Department }, { model: User, include: [{ model: Department }] }],
    });
    recentTickets.forEach((ticket) => addTicketNumber(ticket));

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const monthlyTickets = await Ticket.findAll({
      attributes: ['created_at'],
      where: { [Op.and]: [ticketWhere, { created_at: { [Op.gte]: thirtyDaysAgo } }] },
      raw: true,
    });
    const monthlyCounts = new Map();
    monthlyTickets.forEach(({ created_at: createdAt }) => {
      const date = new Date(createdAt).toISOString().slice(0, 10);
      monthlyCounts.set(date, (monthlyCounts.get(date) || 0) + 1);
    });
    const monthlyTicketCounts = [...monthlyCounts.entries()].sort(([first], [second]) => first.localeCompare(second))
      .map(([date, count]) => ({ date, count }));

    const filteredTickets = await Ticket.findAll({
      attributes: ['id', 'created_at', 'status', 'department_id'],
      where: ticketWhere,
      include: [
        { model: TicketUpdate, attributes: ['created_at', 'action', 'message', 'updated_by'], include: [{ model: User, as: 'Updater', attributes: ['role'] }] },
      ],
    });
    const responseStats = new Map();
    const auditActions = new Set(['ticket_created', 'ticket_accepted', 'ticket_reassigned', 'ticket_unassigned', 'status_changed', 'priority_escalated', 'system_priority_escalated', 'department_rerouted', 'eta_changed']);
    const auditRecords = [];
    filteredTickets.forEach((ticket) => {
      const updates = ticket.TicketUpdates || [];
      const firstStaffUpdate = updates
        .filter((update) => ['admin', 'staff'].includes(update.Updater?.role) && update.action !== 'ticket_created')
        .sort((first, second) => new Date(first.created_at) - new Date(second.created_at))[0];
      const terminalUpdate = updates
        .filter((update) => update.action === 'status_changed' && /resolved|closed/i.test(update.message))
        .sort((first, second) => new Date(first.created_at) - new Date(second.created_at))[0];
      const departmentId = String(ticket.department_id);
      if (!responseStats.has(departmentId)) responseStats.set(departmentId, { department_id: ticket.department_id, response_durations: [], resolution_durations: [] });
      const stats = responseStats.get(departmentId);
      if (firstStaffUpdate) stats.response_durations.push(new Date(firstStaffUpdate.created_at) - new Date(ticket.created_at));
      if (terminalUpdate) stats.resolution_durations.push(new Date(terminalUpdate.created_at) - new Date(ticket.created_at));
      updates.filter((update) => auditActions.has(update.action)).forEach((update) => auditRecords.push({
        ticket_id: ticket.id,
        action: update.action,
        actor_role: update.Updater?.role || 'unknown',
        created_at: update.created_at,
        department_id: ticket.department_id,
        message: update.message,
      }));
    });
    const averageHours = (durations) => durations.length
      ? Number((durations.reduce((sum, duration) => sum + duration, 0) / durations.length / 3600000).toFixed(2))
      : null;
    const responseAndResolutionByDepartment = [...responseStats.values()].map((stats) => ({
      department_id: stats.department_id,
      department_name: departmentCounts.find((row) => Number(row.department_id) === Number(stats.department_id))?.['Department.name'] || 'Unknown department',
      responded_ticket_count: stats.response_durations.length,
      average_first_response_hours: averageHours(stats.response_durations),
      resolved_ticket_count: stats.resolution_durations.length,
      average_resolution_hours: averageHours(stats.resolution_durations),
    }));

    return res.json({
      ticketCountsByDepartment,
      ticketCountsByStatus,
      assignmentCounts,
      ticketCountsByPriority,
      ticketsByDepartmentStatus: Object.values(ticketsByDepartmentStatus).sort((first, second) => second.unresolved - first.unresolved),
      ticketCountsByConcern,
      usersByRole,
      users,
      ticketCountsByRequester,
      recentTickets,
      monthlyTicketCounts,
      mostAskedFaq,
      mostAskedFaqs,
      responseAndResolutionByDepartment,
      auditRecords: auditRecords
        .sort((first, second) => new Date(second.created_at) - new Date(first.created_at))
        .slice(0, 200),
      availableCategories,
      filters: {
        start_date: req.query.start_date || null,
        end_date: req.query.end_date || null,
        department_id: req.query.department_id || null,
        category: req.query.category || null,
        priority: req.query.priority || null,
        status: req.query.status || null,
      },
      generated_at: new Date().toISOString(),
      prepared_by: req.user.name || req.user.email || `Admin ${req.user.id}`,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Unable to generate reports.' });
  }
};

exports.getAuditLogs = async (req, res) => {
  try {
    const limitValue = Number(req.query.limit);
    const limit = Number.isInteger(limitValue) && limitValue > 0 ? Math.min(limitValue, 500) : 200;
    const offsetValue = Number(req.query.offset);
    const offset = Number.isInteger(offsetValue) && offsetValue >= 0 ? Math.min(offsetValue, 100000) : 0;
    const where = {};
    if (req.user.department_id) where.department_id = req.user.department_id;
    if (req.query.entity_type) where.entity_type = String(req.query.entity_type).slice(0, 60);
    if (req.query.action) where.action = String(req.query.action).slice(0, 80);
    const { count, rows } = await AuditLog.findAndCountAll({ where, order: [['created_at', 'DESC'], ['id', 'DESC']], limit, offset });
    return res.json({ auditLogs: rows, total: count, limit, offset });
  } catch (error) {
    console.error('Audit log retrieval failed:', error);
    return res.status(500).json({ message: 'Unable to load audit history.' });
  }
};

exports.exportReportsCsv = async (req, res) => {
  try {
    const filterError = validateReportFilters(req.query);
    if (filterError) return res.status(400).json({ message: filterError });
    const ticketWhere = buildTicketFilters(req.query);
    const tickets = await Ticket.findAll({
      attributes: ['id', 'user_id', 'assigned_user_id', 'department_id', 'subject', 'category', 'priority', 'status', 'routing_method', 'created_at'],
      where: ticketWhere,
      include: [
        { model: Department, attributes: ['name'] },
        { model: User, attributes: ['name', 'email', 'role'] },
        { model: User, as: 'Assignee', attributes: ['name', 'email'] },
      ],
      order: [['created_at', 'DESC']],
    });
    const statuses = ['open', 'pending', 'in_progress', 'resolved', 'closed'];
    const summary = statuses.map((status) => [status, tickets.filter((ticket) => ticket.status === status).length]);
    const assignedCount = tickets.filter((ticket) => ticket.assigned_user_id != null).length;
    const summarizeBy = (label, getValue) => {
      const counts = new Map();
      tickets.forEach((ticket) => {
        const key = getValue(ticket) || 'Uncategorized';
        counts.set(key, (counts.get(key) || 0) + 1);
      });
      return [[label, 'Ticket count'], ...[...counts.entries()].sort(([first], [second]) => first.localeCompare(second))];
    };
    const generatedAt = new Date().toISOString();
    const filename = `assistdesk-report-${generatedAt.slice(0, 10)}.csv`;
    const rows = [
      ['AssistDesk Ticket Report'],
      ['Coverage start', req.query.start_date || 'All available dates'],
      ['Coverage end', req.query.end_date || 'All available dates'],
      ['Department filter', req.query.department_id || 'All departments'],
      ['Category filter', req.query.category || 'All categories'],
      ['Priority filter', req.query.priority || 'All priorities'],
      ['Status filter', req.query.status || 'All statuses'],
      ['Generated at', generatedAt],
      ['Prepared by', req.user.name || req.user.email || `Admin ${req.user.id}`],
      [],
      ['Status totals'],
      ['Status', 'Ticket count'],
      ...summary,
      ['Total tickets', tickets.length],
      ['Assigned tickets', assignedCount],
      ['Unassigned tickets', tickets.length - assignedCount],
      [],
      ['Department totals'],
      ...summarizeBy('Department', (ticket) => ticket.Department?.name || 'Unassigned'),
      [],
      ['Category totals'],
      ...summarizeBy('Category', (ticket) => ticket.category || 'Uncategorized'),
      [],
      ['Priority totals'],
      ...summarizeBy('Priority', (ticket) => ticket.priority || 'Unknown'),
      [],
      ['Ticket records'],
      ['Ticket ID', 'Created at', 'Status', 'Priority', 'Category', 'Department', 'Requester', 'Requester role', 'Assignee', 'Subject', 'Routing method'],
      ...tickets.map((ticket) => {
        addTicketNumber(ticket);
        return [ticket.ticket_code, ticket.created_at, ticket.status, ticket.priority, ticket.category, ticket.Department?.name || 'Unassigned', ticket.User?.name || ticket.User?.email, ticket.User?.role, ticket.Assignee?.name || ticket.Assignee?.email || 'Unassigned', ticket.subject, ticket.routing_method];
      }),
    ];
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Cache-Control', 'no-store');
    return res.send(`\uFEFF${formatCsv(rows)}`);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Unable to export report.' });
  }
};

exports.createAnnouncement = async (req, res) => {
  try {
    const { title, content } = req.body;
    if (!title || !content) {
      return res.status(400).json({ message: 'Title and content are required.' });
    }

    const transaction = await Announcement.sequelize.transaction();
    let announcement;
    try {
      announcement = await Announcement.create({ title, content, created_by: req.user.id }, { transaction });
      await recordAudit({ actor: req.user, action: 'announcement.created', entityType: 'announcement', entityId: announcement.id, after: { title: announcement.title, content: announcement.content }, transaction });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
    notifyAdmins('announcementCreated', announcement);
    return res.status(201).json(announcement);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Unable to create announcement.' });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
    if (user.id === req.user.id || user.role === 'admin') {
      return res.status(403).json({ message: 'Administrator accounts cannot be terminated here.' });
    }

    const before = { name: user.name, email: user.email, role: user.role, department_id: user.department_id, account_status: user.account_status };
    const transaction = await User.sequelize.transaction();
    try {
      await Notification.destroy({ where: { user_id: user.id }, transaction });
      await ChatLog.destroy({ where: { user_id: user.id }, transaction });
      await Admin.destroy({ where: { user_id: user.id }, transaction });
      await PasswordResetToken.destroy({ where: { email: user.email }, transaction });
      await user.update({ account_status: 'terminated' }, { transaction });
      await recordAudit({ actor: req.user, action: 'account.deactivated', entityType: 'user', entityId: user.id, departmentId: user.department_id, before, after: { ...before, account_status: 'terminated' }, transaction });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }

    return res.json({ message: 'User account terminated successfully.' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Unable to terminate user account.' });
  }
};

exports.reactivateUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
    if (user.id === req.user.id || user.role === 'admin') {
      return res.status(403).json({ message: 'Administrator accounts cannot be reactivated here.' });
    }
    if (user.account_status !== 'terminated') {
      return res.status(400).json({ message: 'Only terminated accounts can be reactivated.' });
    }

    const before = { account_status: user.account_status };
    const transaction = await User.sequelize.transaction();
    try {
      await user.update({ account_status: 'active' }, { transaction });
      await recordAudit({ actor: req.user, action: 'account.reactivated', entityType: 'user', entityId: user.id, departmentId: user.department_id, before, after: { account_status: 'active' }, transaction });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
    return res.json({ message: 'User account reactivated successfully.' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Unable to reactivate user account.' });
  }
};

exports.updateUserDepartment = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found.' });
    if (!['student', 'faculty', 'staff'].includes(user.role)) {
      return res.status(403).json({ message: 'Only student, faculty, and staff department assignments can be changed here.' });
    }

    const departmentId = Number(req.body.department_id);
    const department = Number.isInteger(departmentId) ? await Department.findByPk(departmentId) : null;
    if (!department) return res.status(400).json({ message: 'Select a valid department.' });

    if (user.role === 'staff' && Number(user.department_id) !== department.id) {
      const activeAssignments = await Ticket.count({
        where: {
          assigned_user_id: user.id,
          department_id: { [Op.ne]: department.id },
          status: { [Op.notIn]: ['resolved', 'closed'] },
        },
      });
      if (activeAssignments > 0) {
        return res.status(409).json({ message: 'Reassign this staff member’s active tickets before changing their department.' });
      }
    }

    const previousDepartmentId = user.department_id;
    const transaction = await User.sequelize.transaction();
    try {
      await user.update({ department_id: department.id }, { transaction });
      await recordAudit({ actor: req.user, action: 'account.department_changed', entityType: 'user', entityId: user.id, departmentId: previousDepartmentId || department.id, before: { department_id: previousDepartmentId }, after: { department_id: department.id }, metadata: { target_user_role: user.role }, transaction });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
    if (user.role === 'staff' && Number(previousDepartmentId) !== Number(department.id)) {
      moveStaffDepartmentRoom(user.id, previousDepartmentId, department.id);
    }
    return res.json({ message: 'User department updated successfully.', user: { id: user.id, role: user.role, department_id: department.id, department_name: department.name } });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Unable to update user department.' });
  }
};
