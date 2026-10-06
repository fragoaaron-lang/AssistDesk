const { Ticket, TicketUpdate, Department, User, Notification } = require('../models');
const { notifyUser, notifyAdmins, notifyDepartmentAdmins, notifyDepartmentStaff } = require('../utils/socket');
const { addTicketNumber } = require('../utils/ticketNumber');
const { sendTicketEtaExpiredEmail } = require('../utils/email');
const { inferDepartment } = require('../utils/departmentRouting');
const { recordAudit } = require('../utils/auditLog');

const withTicketTransaction = async (operation) => {
  const transaction = await Ticket.sequelize.transaction();
  try {
    const result = await operation(transaction);
    await transaction.commit();
    return result;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

const normalize = (text) =>
  String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const getEstimatedCompletion = (priority, requestedAt = new Date()) => {
  const hoursByPriority = { urgent: 24, medium: 48, low: 72 };
  const estimated = new Date(requestedAt);
  estimated.setHours(estimated.getHours() + (hoursByPriority[priority] || hoursByPriority.medium));
  return estimated;
};

const collegeDepartmentNames = new Set([
  'basic education department',
  'college of nursing',
  'cs',
  'cba',
  'charm',
  'college of criminology',
  'college of physical therapy',
  'education department',
  'college of education',
]);

const getCollegeDepartmentKey = (department) => {
  const name = normalize(department?.name || department);
  if (name === 'basic education department') return 'basic-education';
  if (['cs', 'computer science department', 'college of computer studies'].includes(name)) return 'cs';
  if (['cba', 'college of business administration', 'college of business and accountancy'].includes(name)) return 'cba';
  if (['charm', 'college of hospitality and restaurant management', 'college of hospitality management'].includes(name)) return 'charm';
  if (['education department', 'college of education'].includes(name)) return 'education';
  if (collegeDepartmentNames.has(name)) return name;
  return null;
};

const canAccessSelectedDepartment = (user, department) => {
  const requesterCollegeKey = user?.role === 'student' ? getCollegeDepartmentKey(user.Department) : null;
  if (!requesterCollegeKey) return true;
  const selectedCollegeKey = getCollegeDepartmentKey(department);
  return !selectedCollegeKey || selectedCollegeKey === requesterCollegeKey;
};

const isTicketManager = (user) => ['admin', 'staff'].includes(user?.role);

const canManageTicket = (user, ticket) => {
  if (!isTicketManager(user)) return false;
  if (user.role === 'staff') return Number(user.department_id) === Number(ticket.department_id);
  return !user.department_id || Number(user.department_id) === Number(ticket.department_id);
};

const mapPriorityToDatabase = (priority) => {
  // Direct mapping - frontend and database use same priority values
  return priority || 'medium';
};

exports.processMissedEtaTickets = async () => {
  try {
    const tickets = await Ticket.findAll({
      include: [
        { model: Department, attributes: ['id', 'name'] },
        { model: User, attributes: ['id', 'name', 'email', 'role', 'department_id'] },
      ],
      order: [['estimated_completion_at', 'ASC']],
    });

    const expiredTickets = tickets.filter((ticket) => {
      if (ticket.priority === 'urgent') return false;
      if (['resolved', 'closed'].includes(ticket.status)) return false;
      if (!ticket.estimated_completion_at) return false;
      return new Date(ticket.estimated_completion_at) <= new Date();
    });

    for (const ticket of expiredTickets) {
      const submitter = ticket.User || await User.findByPk(ticket.user_id, { attributes: ['id', 'name', 'email', 'role', 'department_id'] });
      const departmentAdmins = await User.findAll({
        where: { role: 'admin', department_id: ticket.department_id },
        attributes: ['id', 'name', 'email'],
      });
      const fallbackAdmins = departmentAdmins.length > 0 ? departmentAdmins : await User.findAll({
        where: { role: 'admin' },
        attributes: ['id', 'name', 'email'],
      });
      const adminRecipients = [...new Map((fallbackAdmins || []).map((admin) => [admin.email, admin])).values()];

      const previousPriority = ticket.priority;
      const previousStatus = ticket.status;
      ticket.priority = 'urgent';
      ticket.updated_at = new Date();

      const escalationMessage = `ETA expired for ticket "${ticket.subject}" and priority was automatically set to urgent.`;
      const escalatedBy = adminRecipients[0]?.id || submitter?.id || ticket.user_id;
      await withTicketTransaction(async (transaction) => {
        await ticket.save({ transaction });
        await TicketUpdate.create({
          ticket_id: ticket.id,
          message: escalationMessage,
          updated_by: escalatedBy,
          action: 'system_priority_escalated',
          department_id: ticket.department_id,
        }, { transaction });
        await recordAudit({
          actor: { name: 'System', role: 'system' },
          action: 'ticket.priority_auto_escalated',
          entityType: 'ticket',
          entityId: ticket.id,
          departmentId: ticket.department_id,
          before: { priority: previousPriority, status: previousStatus },
          after: { priority: 'urgent', status: ticket.status },
          metadata: { department_id: ticket.department_id, estimated_completion_at: ticket.estimated_completion_at },
          transaction,
        });
      });

      await Notification.create({
        user_id: ticket.user_id,
        message: `Your ticket "${ticket.subject}" missed its ETA and has been escalated to urgent priority.`,
      });

      for (const admin of adminRecipients) {
        if (!admin?.email) continue;
        await Notification.create({
          user_id: admin.id,
          message: `Ticket "${ticket.subject}" missed its ETA and was automatically escalated to urgent priority.`,
        }).catch((notificationError) => {
          console.error('ETA notification creation failed for admin:', notificationError.message);
        });
      }

      notifyUser(ticket.user_id, 'ticketEtaExpired', { ticket });
      notifyDepartmentAdmins(ticket.department_id, 'ticketEtaExpired', { ticket });
      notifyDepartmentStaff(ticket.department_id, 'ticketEtaExpired', { ticket });
      notifyAdmins('ticketEtaExpired', { ticket });

      try {
        if (submitter?.email) {
          await sendTicketEtaExpiredEmail({
            to: submitter.email,
            userName: submitter.name,
            ticketSubject: ticket.subject,
            ticketId: ticket.id,
            eta: ticket.estimated_completion_at,
          });
        }
      } catch (emailError) {
        console.error('User ETA expiry email failed:', emailError.message);
      }

      for (const admin of adminRecipients) {
        if (!admin?.email) continue;
        try {
          await sendTicketEtaExpiredEmail({
            to: admin.email,
            userName: admin.name,
            ticketSubject: ticket.subject,
            ticketId: ticket.id,
            eta: ticket.estimated_completion_at,
          });
        } catch (emailError) {
          console.error(`Admin ETA expiry email failed for ${admin.email}:`, emailError.message);
        }
      }
    }

    return expiredTickets.length;
  } catch (error) {
    console.error('ETA expiry processing failed:', error.message, error.stack);
    return 0;
  }
};

exports.createTicket = async (req, res) => {
  try {
    const { subject, description, category = 'Other', priority = 'medium', department_id: selectedDepartmentId, estimated_completion_at, attachment_data, attachment_name, attachment_type } = req.body;
    if (!String(subject || '').trim() || !String(description || '').trim()) {
      return res.status(400).json({ message: 'Subject and description are required.' });
    }
    if (!['low', 'medium', 'urgent'].includes(priority)) {
      return res.status(400).json({ message: 'Priority must be low, medium, or urgent.' });
    }

    const requester = await User.findByPk(req.user.id, { include: [{ model: Department }] });
    if (!requester) return res.status(401).json({ message: 'Authenticated account not found.' });
    const routing = await inferDepartment(subject, description, category);
    const selectedDepartment = selectedDepartmentId ? await Department.findByPk(selectedDepartmentId) : null;
    if (selectedDepartmentId && !selectedDepartment) {
      return res.status(400).json({ message: 'Selected department is invalid.' });
    }
    if (selectedDepartment && !canAccessSelectedDepartment(requester, selectedDepartment)) {
      return res.status(403).json({ message: 'Students can only submit tickets to their own college department.' });
    }

    if (!selectedDepartment && !routing.accepted) {
      return res.status(409).json({
        message: 'The concern did not match a department confidently. Please select the correct department before submitting.',
        routing_candidates: routing.candidates,
        routing_score: routing.score,
      });
    }
    const resolvedDepartmentId = selectedDepartment ? Number(selectedDepartmentId) : routing.department_id;
    const resolvedDepartment = selectedDepartment || (resolvedDepartmentId ? await Department.findByPk(resolvedDepartmentId) : null);
    if (resolvedDepartment && !canAccessSelectedDepartment(requester, resolvedDepartment)) {
      return res.status(403).json({ message: 'Students can only submit tickets to their own college department.' });
    }
    const isMaintenanceDepartment = resolvedDepartment?.name?.toLowerCase().includes('maintenance');
    // Map new priority names to old database values temporarily
    const databasePriority = mapPriorityToDatabase(priority);

    let ticket;
    await withTicketTransaction(async (transaction) => {
      ticket = await Ticket.create({
        user_id: req.user.id,
        department_id: resolvedDepartmentId,
        subject: String(subject).trim(),
        description: String(description).trim(),
        attachment_data: attachment_data || null,
        attachment_name: attachment_name || null,
        attachment_type: attachment_type || null,
        category,
        priority: databasePriority,
        status: 'open',
        estimated_completion_at: estimated_completion_at || getEstimatedCompletion(databasePriority),
        routing_method: selectedDepartment ? 'user_selected' : 'automatic',
        suggested_department_id: routing.suggested_department_id,
        routing_confidence: routing.confidence,
      }, { transaction });
      ticket.Department = await Department.findByPk(ticket.department_id, { attributes: ['name'], transaction });
      addTicketNumber(ticket);
      await TicketUpdate.create({
        ticket_id: ticket.id,
        message: selectedDepartment
          ? `Ticket submitted to ${resolvedDepartment.name} by requester selection. Routing suggestion: ${routing.candidates[0]?.name || 'none'} (score ${routing.score}).`
          : `Ticket automatically routed to ${resolvedDepartment.name} with routing score ${routing.score} and margin ${routing.margin}.`,
        updated_by: req.user.id,
        action: 'ticket_created',
        department_id: resolvedDepartmentId,
      }, { transaction });
      await recordAudit({
        actor: req.user,
        action: 'ticket.created',
        entityType: 'ticket',
        entityId: ticket.id,
        departmentId: resolvedDepartmentId,
        after: { subject: ticket.subject, department_id: resolvedDepartmentId, category, priority: databasePriority, status: 'open', routing_method: ticket.routing_method },
        transaction,
      });
    });

    await Notification.create({
      user_id: ticket.user_id,
      message: `Your ticket "${subject}" has been created and routed to the assigned department.`,
    });

    const adminUsers = await User.findAll({ where: { role: 'admin', department_id: resolvedDepartmentId } });
    if (adminUsers.length > 0) {
      await Notification.bulkCreate(
        adminUsers.map((admin) => ({
          user_id: admin.id,
          message: `New ticket submitted: "${subject}".`,
        }))
      );
    }
    const departmentStaff = await User.findAll({ where: { role: 'staff', department_id: resolvedDepartmentId, account_status: 'active' } });
    if (departmentStaff.length > 0) {
      await Notification.bulkCreate(departmentStaff.map((staffMember) => ({
        user_id: staffMember.id,
        message: `New ticket in your department: "${subject}".`,
      })));
    }

    notifyUser(ticket.user_id, 'ticketCreated', { ticket });
    notifyDepartmentAdmins(resolvedDepartmentId, 'ticketCreated', { ticket });
    notifyDepartmentStaff(resolvedDepartmentId, 'ticketCreated', { ticket });
    notifyAdmins('ticketCreated', { ticket });

    await exports.processMissedEtaTickets();

    return res.status(201).json(ticket);
  } catch (error) {
    console.error('Ticket creation error:', error.message, error.stack);
    return res.status(500).json({ message: 'Unable to create ticket.', error: error.message });
  }
};

exports.getTickets = async (req, res) => {
  try {
    const where = req.user.role === 'admin'
      ? (req.user.department_id ? { department_id: req.user.department_id } : {})
      : req.user.role === 'staff'
        ? { department_id: req.user.department_id || -1 }
        : { user_id: req.user.id };
    const tickets = await Ticket.findAll({
      where,
      include: [
        { model: Department },
        { model: User, include: [{ model: Department }] },
        { model: User, as: 'Assignee', attributes: ['id', 'name', 'email', 'role'] },
        { model: TicketUpdate, include: [{ model: User, as: 'Updater', attributes: ['id', 'name', 'email'] }], order: [['created_at', 'ASC']] },
      ],
      order: [['created_at', 'DESC']],
    });
    const visibleTickets = req.user.role === 'student'
      ? (await User.findByPk(req.user.id, { include: [{ model: Department }] }))
        ? tickets.filter((ticket) => canAccessSelectedDepartment(
          { ...req.user, Department: ticket.User?.Department || null },
          ticket.Department,
        ))
        : []
      : tickets;
    visibleTickets.forEach((ticket) => {
      if (!ticket.category) ticket.category = 'Other';
      if (!ticket.estimated_completion_at) ticket.estimated_completion_at = getEstimatedCompletion(ticket.priority, ticket.created_at);
      addTicketNumber(ticket);
    });
    return res.json(visibleTickets);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Unable to fetch tickets.' });
  }
};

exports.getTicketById = async (req, res) => {
  try {
    const ticket = await Ticket.findByPk(req.params.id, {
      include: [
        { model: Department },
        { model: User, include: [{ model: Department }] },
        { model: TicketUpdate, include: [{ model: User, as: 'Updater', attributes: ['id', 'name', 'email'] }], order: [['created_at', 'ASC']] },
        { model: User, as: 'Assignee', attributes: ['id', 'name', 'email', 'role'] },
      ],
    });
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found.' });
    }
    if (isTicketManager(req.user)) {
      if (!canManageTicket(req.user, ticket)) return res.status(403).json({ message: 'You may only access tickets in your authorized department.' });
    } else if (ticket.user_id !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden.' });
    }
    if (req.user.role === 'student' && !canAccessSelectedDepartment(ticket.User, ticket.Department)) {
      return res.status(403).json({ message: 'Students can only view tickets for their own college or non-college departments.' });
    }
    addTicketNumber(ticket);
    return res.json(ticket);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Unable to fetch ticket.' });
  }
};

exports.updateTicketStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const ticket = await Ticket.findByPk(req.params.id);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found.' });
    }
    if (!canManageTicket(req.user, ticket)) return res.status(403).json({ message: 'Only authorized department staff can update ticket status.' });
    if (!['open', 'pending', 'in_progress', 'resolved', 'closed'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status.' });
    }
    const nextStatuses = { open: ['pending'], pending: ['in_progress'], in_progress: ['resolved'], resolved: ['closed'], closed: [] };
    if (!nextStatuses[ticket.status]?.includes(status)) {
      return res.status(409).json({ message: `Invalid status transition from ${ticket.status} to ${status}. Move the ticket through the defined workflow stages.` });
    }
    const previousStatus = ticket.status;
    ticket.status = status;
    ticket.updated_at = new Date();
    await withTicketTransaction(async (transaction) => {
      await ticket.save({ transaction });
      await recordAudit({
        actor: req.user,
        action: status === 'resolved' || status === 'closed' ? 'ticket.closed_or_resolved' : 'ticket.status_changed',
        entityType: 'ticket',
        entityId: ticket.id,
        departmentId: ticket.department_id,
        before: { status: previousStatus },
        after: { status },
        metadata: { department_id: ticket.department_id },
        transaction,
      });
      await TicketUpdate.create({
        ticket_id: ticket.id,
        message: `Status updated to ${status}.`,
        updated_by: req.user.id,
        action: 'status_changed',
        department_id: ticket.department_id,
      }, { transaction });
    });
    addTicketNumber(ticket);

    await Notification.create({
      user_id: ticket.user_id,
      message: `Your ticket "${ticket.subject}" status changed to ${status}.`,
    });

    const adminUsers = await User.findAll({ where: { role: 'admin', department_id: ticket.department_id } });
    if (adminUsers.length > 0) {
      await Notification.bulkCreate(
        adminUsers.map((admin) => ({
          user_id: admin.id,
          message: `Ticket "${ticket.subject}" status updated to ${status}.`,
        }))
      );
    }

    notifyUser(ticket.user_id, 'ticketStatusUpdated', { ticket });
    notifyDepartmentAdmins(ticket.department_id, 'ticketStatusUpdated', { ticket });
    notifyDepartmentStaff(ticket.department_id, 'ticketStatusUpdated', { ticket });
    notifyAdmins('ticketStatusUpdated', { ticket });

    return res.json(ticket);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Unable to update ticket status.' });
  }
};

exports.updateTicketEta = async (req, res) => {
  try {
    const { estimated_completion_at: estimatedCompletionAt } = req.body;
    const ticket = await Ticket.findByPk(req.params.id);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found.' });
    }
    if (!canManageTicket(req.user, ticket)) return res.status(403).json({ message: 'Only authorized department staff can set the estimated completion time.' });

    const eta = new Date(estimatedCompletionAt);
    if (!estimatedCompletionAt || Number.isNaN(eta.getTime())) {
      return res.status(400).json({ message: 'A valid estimated completion time is required.' });
    }

    const previousEta = ticket.estimated_completion_at;
    ticket.estimated_completion_at = eta;
    ticket.updated_at = new Date();
    let update;
    await withTicketTransaction(async (transaction) => {
      await ticket.save({ transaction });
      await recordAudit({
        actor: req.user,
        action: 'ticket.eta_changed',
        entityType: 'ticket',
        entityId: ticket.id,
        departmentId: ticket.department_id,
        before: { estimated_completion_at: previousEta },
        after: { estimated_completion_at: eta.toISOString() },
        metadata: { department_id: ticket.department_id },
        transaction,
      });
      update = await TicketUpdate.create({
        ticket_id: ticket.id,
        message: `Estimated completion updated to ${eta.toLocaleString()}.`,
        updated_by: req.user.id,
        action: 'eta_changed',
        department_id: ticket.department_id,
      }, { transaction });
    });

    await Notification.create({
      user_id: ticket.user_id,
      message: `The estimated completion time for "${ticket.subject}" is ${eta.toLocaleString()}.`,
    });
    notifyUser(ticket.user_id, 'ticketEtaUpdated', { ticket, update });
    notifyDepartmentStaff(ticket.department_id, 'ticketEtaUpdated', { ticket, update });

    await exports.processMissedEtaTickets();

    return res.json({ ticket, update });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Unable to update estimated completion time.' });
  }
};

  exports.getTicketAssignees = async (req, res) => {
    try {
      const ticket = await Ticket.findByPk(req.params.id);
      if (!ticket) return res.status(404).json({ message: 'Ticket not found.' });
      if (!canManageTicket(req.user, ticket)) return res.status(403).json({ message: 'You may only view assignees for tickets in your authorized department.' });

      const assignees = await User.findAll({
        where: { department_id: ticket.department_id, role: 'staff', account_status: 'active' },
        attributes: ['id', 'name', 'email', 'department_id'],
        order: [['name', 'ASC']],
      });
      return res.json({ assignees });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Unable to load department staff.' });
    }
  };

  exports.updateTicketAssignment = async (req, res) => {
    try {
      const ticket = await Ticket.findByPk(req.params.id);
      if (!ticket) return res.status(404).json({ message: 'Ticket not found.' });
      if (!canManageTicket(req.user, ticket)) return res.status(403).json({ message: 'Only authorized department staff can assign this ticket.' });

      const requestedAssigneeId = req.body.assigned_user_id ? Number(req.body.assigned_user_id) : null;
      if ((ticket.assigned_user_id ? Number(ticket.assigned_user_id) : null) === requestedAssigneeId) {
        return res.status(400).json({ message: 'The ticket already has that assignment.' });
      }
      if (req.user.role === 'staff' && !requestedAssigneeId) {
        return res.status(403).json({ message: 'Staff must assign a ticket to an active department staff member.' });
      }

      let assignee = null;
      if (requestedAssigneeId) {
        assignee = await User.findOne({
          where: { id: requestedAssigneeId, department_id: ticket.department_id, role: 'staff', account_status: 'active' },
        });
        if (!assignee) return res.status(400).json({ message: 'The assignee must be active staff in the ticket’s department.' });
      }

      const previousAssigneeId = ticket.assigned_user_id;
      const previousStatus = ticket.status;
      const previousAssignedAt = ticket.assigned_at;
      const previousAssignee = previousAssigneeId ? await User.findByPk(previousAssigneeId, { attributes: ['id', 'name'] }) : null;
      ticket.assigned_user_id = assignee?.id || null;
      ticket.assigned_at = assignee ? new Date() : null;
      const wasOpen = ticket.status === 'open' && Boolean(assignee);
      if (wasOpen) ticket.status = 'pending';
      ticket.updated_at = new Date();
      await withTicketTransaction(async (transaction) => {
        await ticket.save({ transaction });
        await recordAudit({
          actor: req.user,
          action: assignee ? (previousAssigneeId ? 'ticket.reassigned' : 'ticket.assigned') : 'ticket.unassigned',
          entityType: 'ticket',
          entityId: ticket.id,
          departmentId: ticket.department_id,
          before: { assigned_user_id: previousAssigneeId, assigned_at: previousAssignedAt, status: previousStatus },
          after: { assigned_user_id: assignee?.id || null, assigned_at: ticket.assigned_at, status: ticket.status },
          metadata: { department_id: ticket.department_id },
          transaction,
        });
        await TicketUpdate.create({
          ticket_id: ticket.id,
          updated_by: req.user.id,
          action: assignee ? (previousAssigneeId ? 'ticket_reassigned' : 'ticket_accepted') : 'ticket_unassigned',
          department_id: ticket.department_id,
          message: assignee
            ? (previousAssigneeId
              ? `Assignment changed from ${previousAssignee?.name || `staff user ${previousAssigneeId}`} to ${assignee.name}.`
              : `${assignee.name} accepted this ticket.`) + (wasOpen ? ' Status moved from open to pending.' : '')
            : `The ticket was unassigned${previousAssignee ? ` from ${previousAssignee.name}` : ''} by an administrator.`,
        }, { transaction });
      });
      if (previousAssigneeId && previousAssigneeId !== assignee?.id) {
        await Notification.create({ user_id: previousAssigneeId, message: `Ticket ${ticket.id} was reassigned away from you: "${ticket.subject}".` });
      }
      if (assignee) {
        await Notification.create({ user_id: assignee.id, message: `Ticket ${ticket.id} was assigned to you: "${ticket.subject}".` });
        notifyUser(assignee.id, 'ticketAssignmentUpdated', { ticket });
      }
      if (wasOpen) {
        await Notification.create({ user_id: ticket.user_id, message: `Your ticket "${ticket.subject}" has been accepted and is pending department action.` });
      }

      await ticket.reload({ include: [{ model: Department }, { model: User, as: 'Assignee', attributes: ['id', 'name', 'email', 'role'] }] });
      addTicketNumber(ticket);
      notifyUser(ticket.user_id, 'ticketAssignmentUpdated', { ticket });
      if (wasOpen) {
        notifyUser(ticket.user_id, 'ticketStatusUpdated', { ticket });
        notifyDepartmentAdmins(ticket.department_id, 'ticketStatusUpdated', { ticket });
        notifyDepartmentStaff(ticket.department_id, 'ticketStatusUpdated', { ticket });
        notifyAdmins('ticketStatusUpdated', { ticket });
      }
      notifyDepartmentAdmins(ticket.department_id, 'ticketAssignmentUpdated', { ticket });
      notifyDepartmentStaff(ticket.department_id, 'ticketAssignmentUpdated', { ticket });
      notifyAdmins('ticketAssignmentUpdated', { ticket });
      return res.json(ticket);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Unable to update ticket assignment.' });
    }
  };

  exports.updateTicketDepartment = async (req, res) => {
    try {
      const ticket = await Ticket.findByPk(req.params.id);
      if (!ticket) return res.status(404).json({ message: 'Ticket not found.' });
      if (!canManageTicket(req.user, ticket)) return res.status(403).json({ message: 'Only authorized staff in the current department can correct ticket routing.' });

      const newDepartmentId = Number(req.body.department_id);
      const newDepartment = Number.isInteger(newDepartmentId) ? await Department.findByPk(newDepartmentId) : null;
      if (!newDepartment) return res.status(400).json({ message: 'Select a valid destination department.' });
      if (newDepartmentId === Number(ticket.department_id)) return res.status(400).json({ message: 'The ticket is already routed to that department.' });

      const oldDepartmentId = ticket.department_id;
      const oldDepartment = await Department.findByPk(oldDepartmentId);
      const previousAssignee = ticket.assigned_user_id
        ? await User.findByPk(ticket.assigned_user_id, { attributes: ['id', 'name'] })
        : null;
      const previousDepartmentId = ticket.department_id;
      const previousAssigneeId = ticket.assigned_user_id;
      const previousRoutingMethod = ticket.routing_method;
      const reason = String(req.body.reason || '').trim();
      ticket.department_id = newDepartmentId;
      ticket.assigned_user_id = null;
      ticket.assigned_at = null;
      ticket.routing_method = 'corrected';
      ticket.updated_at = new Date();
      await withTicketTransaction(async (transaction) => {
        await ticket.save({ transaction });
        await recordAudit({
          actor: req.user,
          action: 'ticket.rerouted',
          entityType: 'ticket',
          entityId: ticket.id,
          departmentId: newDepartmentId,
          before: { department_id: previousDepartmentId, assigned_user_id: previousAssigneeId, routing_method: previousRoutingMethod },
          after: { department_id: newDepartmentId, assigned_user_id: null, routing_method: 'corrected' },
          metadata: { reason: reason || null },
          transaction,
        });

        await TicketUpdate.create({
          ticket_id: ticket.id,
          updated_by: req.user.id,
          action: 'department_rerouted',
          department_id: newDepartmentId,
          previous_department_id: oldDepartmentId,
          message: `Routing corrected from ${oldDepartment?.name || oldDepartmentId} to ${newDepartment.name}.${previousAssignee ? ` Previous assignee ${previousAssignee.name} was released.` : ''}${reason ? ` Reason: ${reason}` : ''}`,
        }, { transaction });
      });
      await Notification.create({ user_id: ticket.user_id, message: `Your ticket "${ticket.subject}" was routed to ${newDepartment.name}.` });
      if (previousAssignee) {
        await Notification.create({ user_id: previousAssignee.id, message: `Ticket ${ticket.id} was rerouted and removed from your assigned queue.` });
      }
      const newDepartmentStaff = await User.findAll({ where: { role: 'staff', department_id: newDepartmentId, account_status: 'active' } });
      if (newDepartmentStaff.length > 0) {
        await Notification.bulkCreate(newDepartmentStaff.map((staffMember) => ({
          user_id: staffMember.id,
          message: `A ticket was routed to your department: "${ticket.subject}".`,
        })));
      }

      await ticket.reload({ include: [{ model: Department }, { model: User, as: 'Assignee', attributes: ['id', 'name', 'email', 'role'] }] });
      addTicketNumber(ticket);
      notifyUser(ticket.user_id, 'ticketDepartmentUpdated', { ticket });
      notifyDepartmentAdmins(oldDepartmentId, 'ticketDepartmentUpdated', { ticket });
      notifyDepartmentAdmins(newDepartmentId, 'ticketDepartmentUpdated', { ticket });
      notifyDepartmentStaff(oldDepartmentId, 'ticketDepartmentUpdated', { ticket });
      notifyDepartmentStaff(newDepartmentId, 'ticketDepartmentUpdated', { ticket });
      notifyAdmins('ticketDepartmentUpdated', { ticket });
      return res.json(ticket);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Unable to correct ticket routing.' });
    }
  };

  exports.escalateTicketPriority = async (req, res) => {
    try {
      const ticket = await Ticket.findByPk(req.params.id);
      if (!ticket) return res.status(404).json({ message: 'Ticket not found.' });
      if (!canManageTicket(req.user, ticket)) return res.status(403).json({ message: 'Only authorized department staff can escalate this ticket.' });

      const levels = { low: 1, medium: 2, urgent: 3 };
      const priority = req.body.priority || 'urgent';
      if (!(priority in levels) || levels[priority] <= levels[ticket.priority]) {
        return res.status(400).json({ message: 'Escalation priority must be higher than the current ticket priority.' });
      }

      const previousPriority = ticket.priority;
      const previousStatus = ticket.status;
      ticket.priority = priority;
      ticket.updated_at = new Date();
      await withTicketTransaction(async (transaction) => {
        await ticket.save({ transaction });
        await recordAudit({
          actor: req.user,
          action: 'ticket.priority_escalated',
          entityType: 'ticket',
          entityId: ticket.id,
          departmentId: ticket.department_id,
          before: { priority: previousPriority, status: previousStatus },
          after: { priority, status: ticket.status },
          metadata: { reason: String(req.body.reason || '').trim() || null, department_id: ticket.department_id },
          transaction,
        });
        await TicketUpdate.create({
          ticket_id: ticket.id,
          updated_by: req.user.id,
          action: 'priority_escalated',
          department_id: ticket.department_id,
          message: `Priority escalated from ${previousPriority} to ${priority}. ${String(req.body.reason || '').trim()}`.trim(),
        }, { transaction });
      });
      await Notification.create({ user_id: ticket.user_id, message: `Your ticket "${ticket.subject}" was escalated to ${priority} priority.` });
      addTicketNumber(ticket);
      notifyUser(ticket.user_id, 'ticketPriorityUpdated', { ticket });
      notifyDepartmentAdmins(ticket.department_id, 'ticketPriorityUpdated', { ticket });
      notifyDepartmentStaff(ticket.department_id, 'ticketPriorityUpdated', { ticket });
      notifyAdmins('ticketPriorityUpdated', { ticket });
      return res.json(ticket);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Unable to escalate ticket priority.' });
    }
  };

  exports.deleteTicket = async (req, res) => {
  try {
    if (!['student', 'faculty', 'staff'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Only student, faculty, and staff users can delete their own tickets.' });
    }

    const ticket = await Ticket.findByPk(req.params.id);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found.' });
    }
    if (ticket.user_id !== req.user.id) {
      return res.status(403).json({ message: 'You can only delete your own tickets.' });
    }

    const routingCorrection = await TicketUpdate.findOne({ where: { ticket_id: ticket.id, action: 'department_rerouted' } });
    if (routingCorrection) {
      return res.status(409).json({ message: 'This ticket has a routing correction audit record and cannot be deleted.' });
    }

    const deletedTicketSnapshot = { subject: ticket.subject, status: ticket.status, department_id: ticket.department_id, priority: ticket.priority };
    const deletedTicketId = ticket.id;
    const deletedTicketDepartmentId = ticket.department_id;
    const transaction = await Ticket.sequelize.transaction();
    try {
      await recordAudit({
        actor: req.user,
        action: 'ticket.deleted',
        entityType: 'ticket',
        entityId: deletedTicketId,
        departmentId: deletedTicketDepartmentId,
        before: deletedTicketSnapshot,
        metadata: { requester_user_id: req.user.id },
        transaction,
      });
      await TicketUpdate.destroy({ where: { ticket_id: ticket.id }, transaction });
      await ticket.destroy({ transaction });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }

    return res.json({ message: 'Ticket deleted successfully.', ticket_id: ticket.id });
  } catch (error) {
    console.error('Ticket deletion error:', error);
    return res.status(500).json({ message: 'Unable to delete ticket.' });
  }
};

exports.addTicketUpdate = async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || !String(message).trim()) {
      return res.status(400).json({ message: 'An update message is required.' });
    }
    const ticket = await Ticket.findByPk(req.params.id);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found.' });
    }
    if (!canManageTicket(req.user, ticket)) return res.status(403).json({ message: 'Only authorized department staff can post ticket updates.' });
    let update;
    await withTicketTransaction(async (transaction) => {
      update = await TicketUpdate.create({
        ticket_id: ticket.id,
        message: String(message).trim(),
        updated_by: req.user.id,
        action: 'comment',
        department_id: ticket.department_id,
      }, { transaction });
      await recordAudit({
        actor: req.user,
        action: 'ticket.comment_added',
        entityType: 'ticket',
        entityId: ticket.id,
        departmentId: ticket.department_id,
        metadata: { department_id: ticket.department_id, update_id: update.id },
        transaction,
      });
    });
    await Notification.create({
      user_id: ticket.user_id,
      message: `New update on your ticket "${ticket.subject}".`,
    });
    notifyUser(ticket.user_id, 'ticketUpdateAdded', { ticket, update });
    return res.status(201).json(update);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Unable to add ticket update.' });
  }
};
