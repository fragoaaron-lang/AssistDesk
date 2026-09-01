const { Ticket, TicketUpdate, Department, User, Notification, Faq, Service } = require('../models');
const { notifyUser, notifyAdmins, notifyDepartmentAdmins } = require('../utils/socket');

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
  const hoursByPriority = { high: 24, moderate: 48, medium: 48, low: 72 };
  const estimated = new Date(requestedAt);
  estimated.setHours(estimated.getHours() + (hoursByPriority[priority] || hoursByPriority.moderate));
  return estimated;
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
  // Temporary mapping until database is migrated
  const priorityMap = {
    'moderate': 'medium',
    'low': 'low',
    'high': 'high',
  };
  return priorityMap[priority] || 'medium';
};

exports.createTicket = async (req, res) => {
  try {
    const { user_id, subject, description, category = 'Other', priority = 'moderate', department_id: selectedDepartmentId, estimated_completion_at } = req.body;
    if (!subject || !description) {
      return res.status(400).json({ message: 'Subject and description are required.' });
    }

    const resolvedDepartmentId = selectedDepartmentId
      ? Number(selectedDepartmentId)
      : await inferDepartmentId(subject, description);

    // Map new priority names to old database values temporarily
    const databasePriority = mapPriorityToDatabase(priority);

    const ticket = await Ticket.create({
      user_id: user_id || req.user.id,
      department_id: resolvedDepartmentId || 1,
      subject,
      description,
      category,
      priority: databasePriority,
      status: 'open',
      estimated_completion_at: estimated_completion_at || getEstimatedCompletion(databasePriority),
    });

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

    return res.status(201).json(ticket);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Unable to create ticket.' });
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
        { model: User },
        { model: TicketUpdate, order: [['created_at', 'ASC']] },
      ],
      order: [['created_at', 'DESC']],
    });
    tickets.forEach((ticket) => {
      if (!ticket.category) ticket.category = 'Other';
      if (!ticket.estimated_completion_at) ticket.estimated_completion_at = getEstimatedCompletion(ticket.priority, ticket.created_at);
    });
    return res.json(tickets);
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
        { model: User },
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

exports.addTicketUpdate = async (req, res) => {
  try {
    const { message } = req.body;
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
    const update = await TicketUpdate.create({ ticket_id: ticket.id, message, updated_by: req.user.id });
    return res.status(201).json(update);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Unable to add ticket update.' });
  }
};
