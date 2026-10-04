const { sequelize, Department, Faq } = require('./models');

const departmentAliases = new Set([
  'it department',
  'information technology department',
  'information and technology department',
  'information technology',
  'information and technology',
]);
const departmentName = 'IT department';
const officeHours = 'Monday-Friday 8:00 AM to 5:00 PM; closed Saturday';

const faqEntries = [
  {
    question: 'What IT services are available to students?',
    answer: 'The available services are the Computer Labs and Internet Room.',
    keywords: 'it department services student computer labs internet room',
  },
  {
    question: 'Where can students get IT-related technical support?',
    answer: 'Approach or visit the IT Department room to ask for technical support.',
    keywords: 'it department technical support help room student concern',
  },
  {
    question: 'Who are the IT department contact persons?',
    answer: 'For CCTV concerns, approach Sir Ton Sto Domingo or Sir Julius Puserio. For computer laboratory concerns, approach Sir Julius Puserio or Sir Rhommel Pascual.',
    keywords: 'it department contact cctv camera ton sto domingo julius puserio computer lab comlab rhommel pascual',
  },
  {
    question: 'Who should I contact about internet-related issues?',
    answer: 'Approach Sir Julius Puserio or Sir Rhommel Pascual for internet-related issues.',
    keywords: 'it department internet wifi connection network issue julius puserio rhommel pascual',
  },
  {
    question: 'How does the IT department handle concerns?',
    answer: 'After an issue or concern is reported, IT employees respond quickly.',
    keywords: 'it department process response concern issue technical support',
  },
  {
    question: 'What are the IT department office hours?',
    answer: 'The IT Department is open Monday to Friday from 8:00 AM to 5:00 PM and is closed on Saturday.',
    keywords: 'it department office hours schedule monday friday 8 am 5 pm closed saturday',
  },
];

const normalize = (value) => String(value || '').trim().toLowerCase();

async function seed() {
  let transaction;

  try {
    transaction = await sequelize.transaction();
    const departments = await Department.findAll({ transaction });
    let department = departments.find((record) => departmentAliases.has(normalize(record.name)));

    if (!department) {
      department = await Department.create({
        name: departmentName,
        description: 'Provides computer laboratory, Internet Room, CCTV, and IT technical support.',
        office_hours: officeHours,
      }, { transaction });
    } else if (department.office_hours !== officeHours) {
      await department.update({ office_hours: officeHours }, { transaction });
    }

    const existingFaqs = await Faq.findAll({
      where: { department_id: department.id },
      transaction,
    });
    const existingByQuestion = new Map(existingFaqs.map((faq) => [normalize(faq.question), faq]));
    let added = 0;
    let updated = 0;

    for (const entry of faqEntries) {
      const existing = existingByQuestion.get(normalize(entry.question));
      if (!existing) {
        const faq = await Faq.create({ department_id: department.id, ...entry }, { transaction });
        existingByQuestion.set(normalize(entry.question), faq);
        added += 1;
      } else if (existing.answer !== entry.answer || existing.keywords !== entry.keywords) {
        await existing.update({ answer: entry.answer, keywords: entry.keywords }, { transaction });
        updated += 1;
      }
    }

    await transaction.commit();
    console.log(`IT FAQ seed complete. Department: ${department.name}. Added ${added}, updated ${updated}.`);
  } catch (error) {
    if (transaction && !transaction.finished) await transaction.rollback();
    console.error('IT FAQ seed failed:', error.message);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
}

seed();
