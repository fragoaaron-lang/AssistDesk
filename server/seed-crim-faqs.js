const { sequelize, Department, Faq } = require('./models');

const departmentAliases = new Set([
  'crim',
  'crim department',
  'criminology',
  'criminology department',
  'college of criminology',
  'bscrim department',
]);

const faqEntries = [
  {
    question: 'Who is the dean, secretary, or point person of the CRIM Department?',
    answer: 'Dr. Ma. Charisse B. Vedaña is the dean, and Ms. Ma. Jane B. Gonzaga is the secretary and point person.',
    keywords: 'crim bscrim criminology criminology department college of criminology dean dean name dean charisse charisse vedana vedana vedaña charisse b vedana secretary secretary name jane gonzaga ma jane b gonzaga point person contact person department head chair officer who is the dean who is the secretary',
  },
  {
    question: 'Where can I get the modules or books in the CRIM Department?',
    answer: 'CRIM modules and books can be obtained from Ms. Ma. Jane B. Gonzaga.',
    keywords: 'crim bscrim criminology criminology department college of criminology module modules book books textbooks text books learning materials study materials jane gonzaga ma jane b gonzaga where to get modules where to get books obtain materials',
  },
  {
    question: 'Where can I get CRIM uniforms?',
    answer: 'CRIM uniforms can be obtained from Ms. Ma. Jane B. Gonzaga.',
    keywords: 'crim bscrim criminology criminology department college of criminology uniform uniforms criminology uniform attire clothing jane gonzaga ma jane b gonzaga where to get uniform where to buy uniform',
  },
  {
    question: 'Where can I get the CRIM class schedule?',
    answer: 'The CRIM class schedule can be obtained from Ms. Ma. Jane B. Gonzaga.',
    keywords: 'crim bscrim criminology criminology department college of criminology class schedule class schedules timetable subjects classes jane gonzaga ma jane b gonzaga where to get schedule where is schedule schedule inquiry',
  },
  {
    question: 'Where is the CRIM Department building?',
    answer: 'The CRIM Department Building is after passing through the TCC Gymnasium and CHARM Building.',
    keywords: 'crim bscrim criminology criminology department college of criminology building location address campus where is crim where is criminology building gymnasium tcc gym charm building after passing through gymnasium directions',
  },
];

const normalize = (value) => String(value || '').trim().toLowerCase();

async function seedCrimFaqs({ closeConnection = true } = {}) {
  let transaction;

  try {
    transaction = await sequelize.transaction();
    const departments = await Department.findAll({ transaction });
    const department = departments.find((item) => departmentAliases.has(normalize(item.name)));
    if (!department) throw new Error('CRIM/Criminology Department not found. Seed or create departments first.');

    let added = 0;
    let updated = 0;
    for (const entry of faqEntries) {
      const [faq, created] = await Faq.findOrCreate({
        where: { department_id: department.id, question: entry.question },
        defaults: { department_id: department.id, ...entry },
        transaction,
      });
      if (created) added += 1;
      else if (faq.answer !== entry.answer || faq.keywords !== entry.keywords) {
        await faq.update({ answer: entry.answer, keywords: entry.keywords }, { transaction });
        updated += 1;
      }
    }

    await transaction.commit();
    console.log(`CRIM FAQ seed complete. Department: ${department.name}. Added ${added}, updated ${updated}.`);
    return { added, updated };
  } catch (error) {
    if (transaction && !transaction.finished) await transaction.rollback();
    throw error;
  } finally {
    if (closeConnection) await sequelize.close();
  }
}

if (require.main === module) {
  seedCrimFaqs().catch((error) => {
    console.error('CRIM FAQ seed failed:', error.message);
    process.exitCode = 1;
  });
}

module.exports = seedCrimFaqs;
