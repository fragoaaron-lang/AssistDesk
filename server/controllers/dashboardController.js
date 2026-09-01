const { Department, Announcement, Ticket, Notification, sequelize, User } = require('../models');

const defaultDepartments = [
  { name: 'CS Department', description: 'Supports computer science academic and student service needs.', point_person: 'Mr. Adrian Cruz', contact_number: '02-1234-5681', location: 'Computer Science Building, Room 210', office_hours: '8:00 AM - 5:00 PM' },
  { name: 'Education Department', description: 'Handles education-related concerns and academic coordination.', point_person: 'Ms. Liza Santos', contact_number: '02-1234-5682', location: 'Education Building, Room 115', office_hours: '8:00 AM - 5:00 PM' },
  { name: 'HM Department', description: 'Supports hospitality management requests and student concerns.', point_person: 'Mr. Ben Alvarez', contact_number: '02-1234-5683', location: 'Hospitality Building, Room 410', office_hours: '9:00 AM - 4:00 PM' },
  { name: 'Crim Department', description: 'Handles criminal justice-related requests and coordination.', point_person: 'Prof. Rose Dela Cruz', contact_number: '02-1234-5684', location: 'Criminal Justice Building, Room 305', office_hours: '8:00 AM - 5:00 PM' },
  { name: 'Nursing Department', description: 'Provides nursing department support and clinical coordination.', point_person: 'Ms. Grace Ramos', contact_number: '02-1234-5685', location: 'Nursing Building, Room 120', office_hours: '8:00 AM - 5:00 PM' },
  { name: 'Accounting', description: 'Handles payment, billing, and account assistance.', point_person: 'Ms. Joy Lim', contact_number: '02-1234-5686', location: 'Finance Building, Room 204', office_hours: '8:00 AM - 5:00 PM' },
  { name: 'Maintenance', description: 'Handles facilities, repairs, and campus infrastructure concerns.', point_person: 'Mr. Joel Rivera', contact_number: '02-1234-5687', location: 'Maintenance Office, Room 007', office_hours: '7:00 AM - 6:00 PM' },
  { name: 'Student Affairs', description: 'Supports student welfare, guidance, and campus activities.', point_person: 'Mr. Rafael Santos', contact_number: '02-1234-5679', location: 'Student Center, Room 205', office_hours: '9:00 AM - 4:00 PM' },
  { name: 'Clinic', description: 'Provides health services and medical assistance.', point_person: 'Dr. Maria Torres', contact_number: '02-1234-5688', location: 'Clinic Building, Room 010', office_hours: '7:00 AM - 7:00 PM' },
];

exports.getDashboard = async (req, res) => {
  try {
    for (const department of defaultDepartments) {
      await Department.findOrCreate({
        where: { name: department.name },
        defaults: department,
      });
    }

    const departments = await Department.findAll({ order: [['name', 'ASC']] });
    const ticketCounts = await Ticket.findAll({
      attributes: [
        'department_id',
        [sequelize.fn('COUNT', sequelize.col('Ticket.id')), 'ticket_count'],
      ],
      group: ['department_id'],
      raw: true,
    });

    const ticketCountMap = Object.fromEntries(
      ticketCounts.map((row) => [String(row.department_id), Number(row.ticket_count)])
    );

    const tickets = await Ticket.findAll({
      attributes: ['id', 'department_id', 'subject', 'priority', 'status', 'created_at'],
      order: [['created_at', 'DESC']],
      raw: true,
    });

    const departmentsWithStats = departments.map((department) => {
      const ticketCount = ticketCountMap[String(department.id)] || 0;
      const volumeLevel = ticketCount >= 6 ? 'urgent' : ticketCount >= 3 ? 'medium' : 'low';
      return {
        ...department.toJSON(),
        ticket_count: ticketCount,
        volume_level: volumeLevel,
      };
    });

    const topConcernDepartments = [...departmentsWithStats]
      .sort((a, b) => b.ticket_count - a.ticket_count)
      .slice(0, 6);

    const announcements = await Announcement.findAll({ order: [['created_at', 'DESC']], limit: 5 });
    const stats = {
      departments: departmentsWithStats.length,
      announcements: announcements.length,
      tickets: await Ticket.count(),
      openTickets: await Ticket.count({ where: { status: 'open' } }),
    };

    return res.json({ departments: departmentsWithStats, announcements, stats, topConcernDepartments, tickets });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Unable to load dashboard.' });
  }
};

exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.findAll({
      where: { user_id: req.user.id },
      order: [['created_at', 'DESC']],
      limit: 20,
    });
    return res.json(notifications);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Unable to load notifications.' });
  }
};

exports.markNotificationsRead = async (req, res) => {
  try {
    await Notification.update({ is_read: true }, { where: { user_id: req.user.id } });
    return res.json({ message: 'Notifications marked as read.' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Unable to update notifications.' });
  }
};

exports.deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findByPk(id);
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found.' });
    }

    if (notification.user_id !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized to delete this notification.' });
    }

    await notification.destroy();
    return res.json({ message: 'Notification deleted successfully.' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Unable to delete notification.' });
  }
};

exports.saveMarkerPositions = async (req, res) => {
  try {
    const { positions } = req.body;
    if (!positions || typeof positions !== 'object') {
      return res.status(400).json({ message: 'Invalid positions format.' });
    }
    await User.update({ marker_positions: positions }, { where: { id: req.user.id } });
    return res.json({ message: 'Marker positions saved successfully.' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Unable to save marker positions.' });
  }
};

exports.getMarkerPositions = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
    return res.json({ positions: user.marker_positions || {} });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Unable to retrieve marker positions.' });
  }
};
