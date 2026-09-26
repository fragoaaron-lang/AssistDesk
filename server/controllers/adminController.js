const { User, Department, Ticket, TicketUpdate, Notification, ChatLog, Admin, PasswordResetToken, Announcement, Faq } = require('../models');
const { notifyAdmins } = require('../utils/socket');
const { addTicketNumber } = require('../utils/ticketNumber');
const { Op } = require('sequelize');

exports.getReports = async (req, res) => {
  try {
    const departmentCounts = await Ticket.findAll({
      attributes: [
        'department_id',
        [Ticket.sequelize.fn('COUNT', Ticket.sequelize.col('Ticket.id')), 'count'],
      ],
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
      group: ['status'],
      raw: true,
    });

    const ticketCountsByPriority = await Ticket.findAll({
      attributes: ['priority', [Ticket.sequelize.fn('COUNT', Ticket.sequelize.col('id')), 'count']],
      group: ['priority'],
      order: [['priority', 'ASC']],
      raw: true,
    });

    const departmentStatusRows = await Ticket.findAll({
      attributes: ['department_id', 'status', [Ticket.sequelize.fn('COUNT', Ticket.sequelize.col('Ticket.id')), 'count']],
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
      group: ['category'],
      order: [[Ticket.sequelize.literal('count'), 'DESC']],
      raw: true,
    });

    const ticketCountsByConcern = concernCounts.map((row) => ({
      concern: row.category || 'Uncategorized',
      count: row.count,
    }));

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
      order: [['created_at', 'DESC']],
      limit: 100,
      include: [{ model: Department }, { model: User, include: [{ model: Department }] }],
    });
    recentTickets.forEach((ticket) => addTicketNumber(ticket));

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const monthlyTicketCounts = await Ticket.findAll({
      attributes: [
        [Ticket.sequelize.fn('DATE_FORMAT', Ticket.sequelize.col('created_at'), '%Y-%m-%d'), 'date'],
        [Ticket.sequelize.fn('COUNT', Ticket.sequelize.col('id')), 'count'],
      ],
      where: {
        created_at: {
          [Op.gte]: thirtyDaysAgo,
        },
      },
      group: ['date'],
      order: [['date', 'ASC']],
      raw: true,
    });

    return res.json({
      ticketCountsByDepartment,
      ticketCountsByStatus,
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
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Unable to generate reports.' });
  }
};

exports.createAnnouncement = async (req, res) => {
  try {
    const { title, content } = req.body;
    if (!title || !content) {
      return res.status(400).json({ message: 'Title and content are required.' });
    }

    const announcement = await Announcement.create({ title, content, created_by: req.user.id });
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

    const tickets = await user.getTickets ? await user.getTickets() : [];
    const ticketIds = tickets.map((ticket) => ticket.id);
    if (ticketIds.length) {
      await TicketUpdate.destroy({ where: { ticket_id: ticketIds } });
      await Ticket.destroy({ where: { id: ticketIds } });
    }

    await Notification.destroy({ where: { user_id: user.id } });
    await ChatLog.destroy({ where: { user_id: user.id } });
    await Admin.destroy({ where: { user_id: user.id } });
    await PasswordResetToken.destroy({ where: { email: user.email } });
    await user.update({ account_status: 'terminated' });

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

    await user.update({ account_status: 'active' });
    return res.json({ message: 'User account reactivated successfully.' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Unable to reactivate user account.' });
  }
};
