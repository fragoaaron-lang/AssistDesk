const getGlobalCampusTicketCounts = (Ticket, sequelize) => Ticket.unscoped().findAll({
  attributes: [
    'department_id',
    'priority',
    'status',
    [sequelize.fn('COUNT', sequelize.col('Ticket.id')), 'ticket_count'],
  ],
  group: ['department_id', 'priority', 'status'],
  raw: true,
});

module.exports = { getGlobalCampusTicketCounts };