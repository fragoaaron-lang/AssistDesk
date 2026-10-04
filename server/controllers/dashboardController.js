const { Department, Service, Announcement, Ticket, Notification, sequelize, User } = require('../models');
const { formatTicketNumber } = require('../utils/ticketNumber');

const defaultDepartments = [
  { name: 'CS Department', description: 'Computer Science Department', map_x: 54.5, map_y: 31 },
  { name: 'Education Department', description: 'Education Department', map_x: 35, map_y: 42 },
  { name: 'HM Department', description: 'Hospitality Management Department', map_x: 25, map_y: 9 },
  { name: 'Crim Department', description: 'Criminology Department', map_x: 67, map_y: 12 },
  { name: 'Nursing Department', description: 'Nursing Department', map_x: 62, map_y: 65 },
  { name: 'Accounting Department', description: 'Accounting Department', map_x: 45, map_y: 63.5 },
  { name: 'Registrar Office', description: 'Registrar Office', map_x: 45, map_y: 63.5 },
  { name: 'Maintenance', description: 'Maintenance Department', map_x: 85.5, map_y: 54 },
  { name: 'Office of the Student Affairs', description: 'Office of Student Affairs', location: 'Near TCC Gymnasium', map_x: 15, map_y: 32 },
  { name: 'Clinic', description: 'Clinic', map_x: 54, map_y: 37 },
];

const initialMapPositions = {
  'cs department': [54.5, 31],
  cs: [54.5, 31],
  'computer science department': [54.5, 31],
  'college of computer studies': [54.5, 31],
  'basic education department': [75, 30],
  'education department': [35, 42],
  'college of education': [35, 42],
  'bshm department': [25, 9],
  'hm department': [25, 9],
  hm: [25, 9],
  'college of hospitality management': [25, 9],
  charm: [25, 9],
  'crim department': [67, 12],
  'bscrim department': [67, 12],
  bscrim: [67, 12],
  'college of criminology': [67, 12],
  'nursing department': [62, 65],
  nursing: [62, 65],
  'college of nursing': [62, 65],
  cba: [54, 43],
  accountancy: [54, 43],
  'college of business administration': [54, 43],
  'college of business and accountancy': [54, 43],
  'college of physical therapy': [68, 44],
  'physical therapy department': [68, 44],
  'bspt department': [68, 44],
  bspt: [68, 44],
  'accounting department': [45, 63.5],
  accounting: [45, 63.5],
  'registrar office': [45, 63.5],
  'registrar department': [45, 63.5],
  'library department': [45, 63.5],
  library: [45, 63.5],
  guidance: [45, 63.5],
  'guidance office': [45, 63.5],
  maintenance: [85.5, 54],
  'maintenance department': [85.5, 54],
  'maintenance office': [85.5, 54],
  'office of the student affairs': [15, 32],
  'office of student affairs': [15, 32],
  'student affairs': [15, 32],
  clinic: [54, 37],
  'it department': [39, 32],
  'information technology department': [39, 32],
  'information and technology department': [39, 32],
  'information technology': [39, 32],
  'information and technology': [39, 32],
};

exports.getDashboard = async (req, res) => {
  try {
    for (const department of defaultDepartments) {
      await Department.findOrCreate({
        where: { name: department.name },
        defaults: department,
      });
      const storedDepartment = await Department.findOne({ where: { name: department.name } });
      if (storedDepartment && (storedDepartment.map_x == null || storedDepartment.map_y == null)) {
        await storedDepartment.update({
          map_x: storedDepartment.map_x ?? department.map_x ?? null,
          map_y: storedDepartment.map_y ?? department.map_y ?? null,
        });
      }
    }

    const mapDepartments = await Department.findAll();
    for (const department of mapDepartments) {
      const normalizedName = String(department.name || '').toLowerCase().trim();
      const position = initialMapPositions[normalizedName];
      if (!position) continue;
      const isFixedBuildingLocation = normalizedName.includes('maintenance')
        || ['cs department', 'cs', 'computer science department', 'college of computer studies', 'it department', 'information technology department', 'information and technology department', 'information technology', 'information and technology'].includes(normalizedName)
        || ['accounting department', 'accounting', 'registrar office', 'registrar department', 'library department', 'library', 'guidance', 'guidance office'].includes(normalizedName);
      if (!isFixedBuildingLocation && department.map_x != null && department.map_y != null) continue;
      await department.update({
        map_x: isFixedBuildingLocation ? position[0] : (department.map_x ?? position[0]),
        map_y: isFixedBuildingLocation ? position[1] : (department.map_y ?? position[1]),
      });
    }

    const departments = await Department.findAll({ order: [['name', 'ASC']] });
    const services = await Service.findAll({
      include: [{ model: Department }],
      order: [['name', 'ASC']],
    });
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
      attributes: ['id', 'department_id', 'subject', 'description', 'priority', 'status', 'created_at'],
      order: [['created_at', 'DESC']],
      raw: true,
    });
    const ticketsWithCodes = tickets.map((ticket) => ({
      ...ticket,
      ticket_code: formatTicketNumber(
        ticket.id,
        departments.find((department) => Number(department.id) === Number(ticket.department_id))?.name,
      ),
    }));

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

    return res.json({ departments: departmentsWithStats, services, announcements, stats, topConcernDepartments, tickets: ticketsWithCodes });
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

    if (Number(notification.user_id) !== Number(req.user.id)) {
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
