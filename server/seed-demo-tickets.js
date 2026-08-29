const { sequelize, Department, User, Ticket, TicketUpdate } = require('./models');

const samples = [
  ['Enrollment verification request', 'Enrollment', 'moderate', 'open'],
  ['Student ID replacement', 'Student Services', 'high', 'in_progress'],
  ['Campus Wi-Fi access issue', 'Technical Support', 'high', 'pending'],
  ['Workstation software installation', 'Technical Support', 'moderate', 'open'],
  ['Programming laboratory access', 'Facilities', 'low', 'open'],
  ['Teaching practicum documents', 'Academic Services', 'moderate', 'resolved'],
  ['Hospitality training schedule', 'Academic Services', 'moderate', 'open'],
  ['Criminal justice clearance inquiry', 'Academic Services', 'high', 'pending'],
  ['Clinical rotation requirements', 'Academic Services', 'high', 'in_progress'],
  ['Transcript request follow-up', 'Records', 'moderate', 'open'],
  ['Tuition assessment question', 'Finance', 'high', 'open'],
  ['Classroom projector repair', 'Facilities', 'moderate', 'pending'],
  ['Health clearance appointment', 'Health Services', 'low', 'resolved'],
];

async function seed() {
  const transaction = await sequelize.transaction();

  try {
    const user = await User.findByPk(1, { transaction });
    const departments = await Department.findAll({ order: [['id', 'ASC']], transaction });

    if (!user) throw new Error('Seed user 1 was not found.');
    if (departments.length < samples.length) throw new Error('Not enough departments for demo tickets.');

    const subjects = samples.map(([subject]) => `[DEMO] ${subject}`);
    const existing = await Ticket.findAll({ where: { subject: subjects }, attributes: ['subject'], transaction });
    const existingSubjects = new Set(existing.map((ticket) => ticket.subject));
    const rows = [];

    samples.forEach(([subject, category, priority, status], index) => {
      const demoSubject = subjects[index];
      if (existingSubjects.has(demoSubject)) return;

      const createdAt = new Date(Date.now() - index * 60 * 60 * 1000);
      rows.push({
        user_id: user.id,
        department_id: departments[index].id,
        subject: demoSubject,
        description: 'Sample request for testing department ticket routing and dashboard counts.',
        priority,
        status,
        created_at: createdAt,
        updated_at: createdAt,
      });
    });

    if (rows.length) {
      const tickets = await Ticket.bulkCreate(rows, {
        transaction,
        returning: true,
        fields: ['user_id', 'department_id', 'subject', 'description', 'priority', 'status', 'created_at', 'updated_at'],
      });
      await TicketUpdate.bulkCreate(
        tickets.map((ticket) => ({
          ticket_id: ticket.id,
          message: 'Demo ticket seeded for department dashboard testing.',
          updated_by: user.id,
        })),
        { transaction }
      );
      console.log(`Created ${tickets.length} demo tickets.`);
    } else {
      console.log('Demo tickets already exist; no duplicates created.');
    }

    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  } finally {
    await sequelize.close();
  }
}

seed().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});