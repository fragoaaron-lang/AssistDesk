const { Ticket, TicketUpdate, Department, User, Notification, Faq, Service } = require('../models');
const { notifyUser, notifyAdmins, notifyDepartmentAdmins } = require('../utils/socket');
const { addTicketNumber } = require('../utils/ticketNumber');
const { sendTicketEtaExpiredEmail } = require('../utils/email');

const normalize = (text) =>
  String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const scoreText = (query, target) => {
  const qTokens = new Set(normalize(query).split(' ').filter(Boolean));
  const tTokens = normalize(target).split(' ').filter(Boolean);
  let score = 0;
  tTokens.forEach((token) => {
    if (qTokens.has(token)) score += 2;
  });
  return score;
};

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

const inferDepartmentId = async (subject, description) => {
  const faqs = await Faq.findAll({ include: [{ model: Department }] });
  const services = await Service.findAll({ include: [{ model: Department }] });
  const query = `${subject} ${description}`;

  const scoredFaqs = faqs
    .map((faq) => ({ id: faq.department_id, score: scoreText(query, `${faq.question} ${faq.answer} ${faq.keywords || ''}`) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);

  const scoredServices = services
    .map((service) => ({ id: service.department_id, score: scoreText(query, `${service.name} ${service.requirements || ''}`) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);

  const best = scoredFaqs[0] || scoredServices[0];
  return best ? best.id : null;
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

      ticket.priority = 'urgent';
      ticket.updated_at = new Date();
      await ticket.save();

      const escalationMessage = `ETA expired for ticket "${ticket.subject}" and priority was automatically set to urgent.`;
      const escalatedBy = adminRecipients[0]?.id || submitter?.id || ticket.user_id;
      await TicketUpdate.create({
        ticket_id: ticket.id,
        message: escalationMessage,
        updated_by: escalatedBy,
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
    const { user_id, subject, description, category = 'Other', priority = 'medium', department_id: selectedDepartmentId, estimated_completion_at, attachment_data, attachment_name, attachment_type } = req.body;
    if (!subject || !description) {
      return res.status(400).json({ message: 'Subject and description are required.' });
    }

    const requester = await User.findByPk(req.user.id, { include: [{ model: Department }] });
    const selectedDepartment = selectedDepartmentId ? await Department.findByPk(selectedDepartmentId) : null;
    if (selectedDepartmentId && !selectedDepartment) {
      return res.status(400).json({ message: 'Selected department is invalid.' });
    }
    if (selectedDepartment && !canAccessSelectedDepartment(requester, selectedDepartment)) {
      return res.status(403).json({ message: 'Students can only submit tickets to their own college department.' });
    }

    const resolvedDepartmentId = selectedDepartmentId
      ? Number(selectedDepartmentId)
      : await inferDepartmentId(subject, description);
    const resolvedDepartment = selectedDepartment || (resolvedDepartmentId ? await Department.findByPk(resolvedDepartmentId) : null);
    if (resolvedDepartment && !canAccessSelectedDepartment(requester, resolvedDepartment)) {
      return res.status(403).json({ message: 'Students can only submit tickets to their own college department.' });
    }
    const isMaintenanceDepartment = resolvedDepartment?.name?.toLowerCase().includes('maintenance');
    // Map new priority names to old database values temporarily
    const databasePriority = mapPriorityToDatabase(priority);

    const ticket = await Ticket.create({
      user_id: user_id || req.user.id,
      department_id: resolvedDepartmentId || 1,
      subject,
      description,
      attachment_data: attachment_data || null,
      attachment_name: attachment_name || null,
      attachment_type: attachment_type || null,
      category,
      priority: databasePriority,
      status: 'open',
      estimated_completion_at: estimated_completion_at || getEstimatedCompletion(databasePriority),
    });
    ticket.Department = await Department.findByPk(ticket.department_id, { attributes: ['name'] });
    addTicketNumber(ticket);

    await TicketUpdate.create({
      ticket_id: ticket.id,
      message: 'Ticket created and routed to the most relevant department.',
      updated_by: req.user.id,
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

    notifyUser(ticket.user_id, 'ticketCreated', { ticket });
    notifyDepartmentAdmins(resolvedDepartmentId, 'ticketCreated', { ticket });
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
      : { user_id: req.user.id };
    const tickets = await Ticket.findAll({
      where,
      include: [
        { model: Department },
        { model: User, include: [{ model: Department }] },
        { model: TicketUpdate, order: [['created_at', 'ASC']] },
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
        { model: TicketUpdate, order: [['created_at', 'ASC']] },
      ],
    });
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found.' });
    }
    if (req.user.role === 'admin') {
      if (req.user.department_id && ticket.department_id !== req.user.department_id) {
        return res.status(403).json({ message: 'Forbidden.' });
      }
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
    if (req.user.role === 'admin') {
      if (req.user.department_id && ticket.department_id !== req.user.department_id) {
        return res.status(403).json({ message: 'Forbidden.' });
      }
    } else if (ticket.user_id !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden.' });
    }
    if (!['open', 'pending', 'in_progress', 'resolved', 'closed'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status.' });
    }
    ticket.status = status;
    ticket.updated_at = new Date();
    await ticket.save();
    await TicketUpdate.create({
      ticket_id: ticket.id,
      message: `Status updated to ${status}.`,
      updated_by: req.user.id,
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
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can set the estimated completion time.' });
    }

    const ticket = await Ticket.findByPk(req.params.id);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found.' });
    }
    if (req.user.department_id && ticket.department_id !== req.user.department_id) {
      return res.status(403).json({ message: 'Forbidden.' });
    }

    const eta = new Date(estimatedCompletionAt);
    if (!estimatedCompletionAt || Number.isNaN(eta.getTime())) {
      return res.status(400).json({ message: 'A valid estimated completion time is required.' });
    }

    ticket.estimated_completion_at = eta;
    ticket.updated_at = new Date();
    await ticket.save();
    const update = await TicketUpdate.create({
      ticket_id: ticket.id,
      message: `Estimated completion updated to ${eta.toLocaleString()}.`,
      updated_by: req.user.id,
    });

    await Notification.create({
      user_id: ticket.user_id,
      message: `The estimated completion time for "${ticket.subject}" is ${eta.toLocaleString()}.`,
    });
    notifyUser(ticket.user_id, 'ticketEtaUpdated', { ticket, update });

    await exports.processMissedEtaTickets();

    return res.json({ ticket, update });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Unable to update estimated completion time.' });
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

    const transaction = await Ticket.sequelize.transaction();
    try {
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
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can add ticket updates.' });
    }
    if (!message || !String(message).trim()) {
      return res.status(400).json({ message: 'An update message is required.' });
    }
    const ticket = await Ticket.findByPk(req.params.id);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found.' });
    }
    if (req.user.role === 'admin') {
      if (req.user.department_id && ticket.department_id !== req.user.department_id) {
        return res.status(403).json({ message: 'Forbidden.' });
      }
    }
    const update = await TicketUpdate.create({ ticket_id: ticket.id, message: String(message).trim(), updated_by: req.user.id });
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
