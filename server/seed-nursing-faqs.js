const { sequelize, Department, Faq } = require('./models');

const departmentAliases = new Set([
  'nursing',
  'nursing department',
  'college of nursing',
]);

const faqEntries = [
  {
    question: 'Who is the dean, secretary, or point person of the Nursing Department?',
    answer: 'The dean of the Nursing Department is Dean Perlita Santiago. The secretary and point person were not provided.',
    keywords: 'nursing nursing department college of nursing dean dean name perlita santiago dean perlita who is the dean nursing secretary nursing secretary point person nursing contact person department head nursing chair head of nursing nsg bsn college officer',
  },
  {
    question: 'Where can I get the modules or books in the Nursing Department?',
    answer: 'You can get the modules at the Library, or avail of Nursing books at the Dean\'s Office. In some cases, professors provide the books and e-books.',
    keywords: 'nursing nursing department college of nursing modules module books book textbooks text books ebook e books e-book learning materials study materials library nursing library dean office dean\'s office professors professor instructor faculty where to get books where to get modules',
  },
  {
    question: 'Where can I get Nursing uniforms?',
    answer: 'Nursing uniforms are available at the Nightingales Office, beside the Anatomy Room.',
    keywords: 'nursing nursing department college of nursing uniform uniforms nursing uniform scrub scrubs attire clothing nightingales nightingales office anatomy room beside anatomy room where to buy uniform where to get uniform',
  },
  {
    question: 'Where can I get the Nursing class schedule?',
    answer: 'You can wait for the class schedule or check it on the bulletin board in front of the Dean\'s Office.',
    keywords: 'nursing nursing department college of nursing class schedule class schedules timetable timetable schedule subjects classes bulletin board dean office dean\'s office in front of dean office when are classes schedule posting where to check schedule',
  },
  {
    question: 'Where is the Nursing Department building?',
    answer: 'The Nursing Department building is near the Administration Building on the right side. Nursing department faculty can be found on the third floor of the Administration Building.',
    keywords: 'nursing nursing department college of nursing building location address campus where is nursing department where is nursing building administration building admin building right side faculty teachers instructors third floor 3rd floor third level',
  },
];

const normalize = (value) => String(value || '').trim().toLowerCase();

async function seedNursingFaqs({ closeConnection = true } = {}) {
  let transaction;

  try {
    transaction = await sequelize.transaction();
    const departments = await Department.findAll({ transaction });
    const department = departments.find((item) => departmentAliases.has(normalize(item.name)));
    if (!department) throw new Error('Nursing Department not found. Seed or create departments first.');

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
    console.log(`Nursing FAQ seed complete. Department: ${department.name}. Added ${added}, updated ${updated}.`);
    return { added, updated };
  } catch (error) {
    if (transaction && !transaction.finished) await transaction.rollback();
    throw error;
  } finally {
    if (closeConnection) await sequelize.close();
  }
}

if (require.main === module) {
  seedNursingFaqs().catch((error) => {
    console.error('Nursing FAQ seed failed:', error.message);
    process.exitCode = 1;
  });
}

module.exports = seedNursingFaqs;