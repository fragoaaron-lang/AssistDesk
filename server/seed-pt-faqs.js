const { sequelize, Department, Faq } = require('./models');

const departmentAliases = new Set([
  'pt',
  'pt department',
  'physical therapy',
  'physical therapy department',
  'college of physical therapy',
  'bspt',
  'bspt department',
]);

const faqEntries = [
  {
    question: 'Who is the dean, secretary, or point person of the PT Department?',
    answer: 'Dean Everly Ann L. Mata is the dean and point person of the PT Department. The secretary was not specified.',
    keywords: 'pt bspt physical therapy dean secretary point person department head contact Everly Ann L Mata who is the dean who is the secretary who is the point person',
  },
  {
    question: 'Where can I get the modules or books in the PT Department?',
    answer: 'Books are not available in the PT Department.',
    keywords: 'pt bspt physical therapy modules module books book textbooks learning materials not available unavailable',
  },
  {
    question: 'Where can I get PT uniforms?',
    answer: 'Uniforms are not available in the PT Department.',
    keywords: 'pt bspt physical therapy uniform uniforms attire clothing not available unavailable',
  },
  {
    question: 'Where can I get the PT class schedule?',
    answer: 'PT class schedules are given by Ms. Everly Ann Mata.',
    keywords: 'pt bspt physical therapy class schedule timetable schedule subjects classes Everly Ann Mata',
  },
  {
    question: 'Where is the PT Department building?',
    answer: 'The PT Department Building is between the CBA Building and the SHS Building.',
    keywords: 'pt bspt physical therapy department building location campus CBA building SHS building between where is PT building',
  },
];

const normalize = (value) => String(value || '').trim().toLowerCase();

async function seedPtFaqs({ closeConnection = true } = {}) {
  let transaction;

  try {
    transaction = await sequelize.transaction();
    const departments = await Department.findAll({ transaction });
    const department = departments.find((item) => departmentAliases.has(normalize(item.name)));
    if (!department) throw new Error('PT/BSPT/Physical Therapy Department not found. Seed or create departments first.');

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
    console.log(`PT/BSPT FAQ seed complete. Department: ${department.name}. Added ${added}, updated ${updated}.`);
    return { added, updated };
  } catch (error) {
    if (transaction && !transaction.finished) await transaction.rollback();
    throw error;
  } finally {
    if (closeConnection) await sequelize.close();
  }
}

if (require.main === module) {
  seedPtFaqs().catch((error) => {
    console.error('PT/BSPT FAQ seed failed:', error.message);
    process.exitCode = 1;
  });
}

module.exports = seedPtFaqs;
