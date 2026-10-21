const { sequelize, Department, Faq } = require('./models');

const departmentAliases = new Set([
  'charm',
  'hm',
  'hm department',
  'bshm',
  'bshm department',
  'college of hospitality management',
  'college of hospitality and restaurant management',
]);

const faqEntries = [
  {
    question: 'Who is the dean, secretary, or point person of the HM Department?',
    answer: 'Dean Rachel Ann Dumlao is the dean, and Maam Melanie Valencia is the secretary and point person.',
    keywords: 'hm bshm charm hospitality management dean secretary point person department head contact Rachel Ann Dumlao Melanie Valencia who is the dean who is the secretary who is the point person',
  },
  {
    question: 'Where can I get the modules or books in the HM Department?',
    answer: 'HM modules and books can be obtained from the respective professors.',
    keywords: 'hm bshm charm hospitality management modules module books book learning materials professor professors instructor faculty where to get modules where to get books',
  },
  {
    question: 'Where can I get BSHM uniforms?',
    answer: 'BSHM uniforms can be obtained at the front desk of the CHARM Building.',
    keywords: 'hm bshm charm hospitality management uniform uniforms attire clothing front desk CHARM Building where to get uniform where to buy uniform',
  },
  {
    question: 'Where can I get the HM class schedule?',
    answer: 'The HM class schedule is available at the front desk.',
    keywords: 'hm bshm charm hospitality management class schedule timetable schedule subjects classes front desk where to get schedule',
  },
  {
    question: 'Where is the HM Department building?',
    answer: 'The HM Department Building is near the TCC Gymnasium.',
    keywords: 'hm bshm charm hospitality management department building location campus TCC Gymnasium gym where is the HM building',
  },
];

const normalize = (value) => String(value || '').trim().toLowerCase();

async function seedHmFaqs({ closeConnection = true } = {}) {
  let transaction;

  try {
    transaction = await sequelize.transaction();
    const departments = await Department.findAll({ transaction });
    const department = departments.find((item) => departmentAliases.has(normalize(item.name)));
    if (!department) throw new Error('HM/BSHM/CHARM Department not found. Seed or create departments first.');

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
    console.log(`HM/BSHM FAQ seed complete. Department: ${department.name}. Added ${added}, updated ${updated}.`);
    return { added, updated };
  } catch (error) {
    if (transaction && !transaction.finished) await transaction.rollback();
    throw error;
  } finally {
    if (closeConnection) await sequelize.close();
  }
}

if (require.main === module) {
  seedHmFaqs().catch((error) => {
    console.error('HM/BSHM FAQ seed failed:', error.message);
    process.exitCode = 1;
  });
}

module.exports = seedHmFaqs;
