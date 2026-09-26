const { sequelize, Department, Faq } = require('./models');

const departmentName = 'Maintenance Department';

const faqEntries = [
  {
    question: 'Who are the contact persons in the Maintenance Department?',
    answer: 'General Services contact directory:\n• Physical Plant Engineer: Engr. Antonio Sto. Domingo — 09230833433\n• General Services Officer: Mr. Jeremiah San Luis — 09952156301\n• Safety Officer: Mr. Louis Klein Santos — 09165678843\n• Drivers: Mr. Donato Arquiza — 09655799132 or 09489481650; Mr. Christian Garrovillas — 09356051876; Mr. John Kaezer Magdalena — 09150062520\n• Carpenter: Mr. Ryan Patrick Gaddi — 09656001284\n• Electrician: Mr. Wendel Perez — 09307017814\n• Plumber: Mr. Emerson Trinidad — 09368537929\n• Utility: Mr. Gerardo Delos Santos — 09054843124\n• Janitorial Head: Mr. Ronnie Loyares — 09972293618.\nContact the relevant staff member for the issue.',
    keywords: 'maintenance general services contact persons phone numbers physical plant engineer officer safety officer driver carpenter electrician plumber utility janitorial head',
  },
  {
    question: 'Where can I report a broken chair, table, or classroom equipment?',
    answer: 'Contact the General Services Officer or Utility Head, Mr. Gerardo Delos Santos, at 09054843124.',
    keywords: 'maintenance broken chair table classroom equipment repair utility gerardo delos santos 09054843124',
  },
  {
    question: 'Where can I report a problem with classroom facilities?',
    answer: 'Contact the General Services Officer or Utility Head, Mr. Gerardo Delos Santos, at 09054843124.',
    keywords: 'maintenance classroom facility problem report utility gerardo delos santos 09054843124',
  },
  {
    question: 'Who should I contact if I find damaged school property?',
    answer: 'Contact the General Services Officer, Mr. Jeremiah San Luis, at 09952156301.',
    keywords: 'maintenance damaged school property report general services officer jeremiah san luis 09952156301',
  },
  {
    question: 'Where can I report cleanliness concerns?',
    answer: 'Contact the Janitorial Head, Mr. Ronnie Loyares, at 09972293618.',
    keywords: 'maintenance cleanliness concern janitorial head ronnie loyares 09972293618',
  },
  {
    question: 'How can I request assistance for a facility problem?',
    answer: 'Contact the General Services Officer, Mr. Jeremiah San Luis, at 09952156301.',
    keywords: 'maintenance facility problem request assistance general services officer jeremiah san luis 09952156301',
  },
  {
    question: 'Who should I approach regarding campus maintenance concerns?',
    answer: 'Contact the General Services Officer, Mr. Jeremiah San Luis, at 09952156301.',
    keywords: 'maintenance campus concern approach general services officer head jeremiah san luis 09952156301',
  },
  {
    question: 'How do I follow up on a maintenance report?',
    answer: 'Follow up with the General Services Officer, Mr. Jeremiah San Luis, at 09952156301.',
    keywords: 'maintenance follow up report status general services officer jeremiah san luis 09952156301',
  },
  {
    question: 'Can I report a maintenance problem anonymously?',
    answer: 'Yes. The supplied Maintenance information says reports can be made anonymously.',
    keywords: 'maintenance anonymous report problem facility concern privacy',
  },
  {
    question: 'What information should I provide when reporting a damaged facility?',
    answer: 'Provide your contact information along with details about the issue so Maintenance can follow up.',
    keywords: 'maintenance report damaged facility information contact details student concern',
  },
  {
    question: 'What should I do if a facility problem is dangerous?',
    answer: 'Report it to Maintenance immediately and contact the Safety Officer, Mr. Louis Klein Santos, at 09165678843.',
    keywords: 'maintenance dangerous facility problem hazard urgent safety officer louis klein santos 09165678843',
  },
  {
    question: 'What should I do if classroom equipment suddenly stops working during class?',
    answer: 'Report it to Maintenance and contact the Utility Head, Mr. Gerardo Delos Santos, at 09054843124.',
    keywords: 'maintenance classroom equipment stops working during class utility gerardo delos santos 09054843124',
  },
  {
    question: 'What should I do if there is no electricity in my classroom?',
    answer: 'Report it to Maintenance and contact the Electrician, Mr. Wendel Perez, at 09307017814.',
    keywords: 'maintenance no electricity classroom power electrical electrician wendel perez 09307017814',
  },
  {
    question: 'What should I do if there is no water in the restroom?',
    answer: 'Report it to Maintenance and contact the Plumber, Mr. Emerson Trinidad, at 09368537929.',
    keywords: 'maintenance no water restroom plumbing plumber emerson trinidad 09368537929',
  },
  {
    question: 'What should I do if a restroom needs immediate cleaning?',
    answer: 'Report it to Maintenance and contact the Janitorial Head, Mr. Ronnie Loyares, at 09972293618.',
    keywords: 'maintenance restroom immediate cleaning janitorial head ronnie loyares 09972293618',
  },
  {
    question: 'Can students request repairs for school equipment?',
    answer: 'Yes. Students can request repairs for school equipment by reporting the issue to Maintenance.',
    keywords: 'maintenance student request repair school equipment',
  },
  {
    question: 'How long does a maintenance request take?',
    answer: 'The supplied estimate is about one hour to one day, depending on the request.',
    keywords: 'maintenance request repair processing time duration one hour one day',
  },
];

async function seed() {
  const transaction = await sequelize.transaction();

  try {
    const [department] = await Department.findOrCreate({
      where: { name: departmentName },
      defaults: {
        name: departmentName,
        description: 'Provides general services, campus maintenance, facilities repair, safety, and janitorial support.',
        office_hours: '7AM-6PM',
      },
      transaction,
    });

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
    console.log(`Maintenance FAQ seed complete. Department: ${department.name}. Added ${added} FAQ(s), updated ${updated}.`);
  } catch (error) {
    await transaction.rollback();
    console.error('Maintenance FAQ seed failed:', error.message);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
}

seed();
