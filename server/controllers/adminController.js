const { User, Department, Ticket, Announcement } = require('../models');
const { notifyAdmins } = require('../utils/socket');
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
      limit: 10,
      include: [{ model: Department }, { model: User, include: [{ model: Department }] }],
    });

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
      ticketCountsByConcern,
      usersByRole,
      ticketCountsByRequester,
      recentTickets,
      monthlyTicketCounts,
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
