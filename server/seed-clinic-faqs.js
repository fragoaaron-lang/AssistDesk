const { sequelize, Department, Faq } = require('./models');

const departmentName = 'Clinic';

const faqEntries = [
  {
    question: 'What services are available at the school clinic?',
    answer: 'The school clinic provides counseling, first aid, medical and dental services including student physical examinations, and consultations.',
    keywords: 'clinic services counseling first aid kit medical dental student physical examination consultation',
  },
  {
    question: 'What should I bring when visiting the clinic?',
    answer: 'Bring your School ID or another form of proper identification.',
    keywords: 'clinic visit bring school id proper identification',
  },
  {
    question: 'Where can I get first-aid assistance?',
    answer: 'Go to the School Clinic for first-aid assistance.',
    keywords: 'clinic first aid assistance injury school clinic',
  },
  {
    question: 'Can I request a medical certificate from the clinic?',
    answer: 'Medical certificates are available for OJT and Work Immersion students only, with a laboratory result.',
    keywords: 'clinic medical certificate ojt work immersion laboratory result',
  },
  {
    question: 'What should I do if I need to rest because I feel unwell?',
    answer: 'For a non-emergency, you may rest in the clinic for 15 minutes. If it is an emergency or you still feel unwell, tell the clinic staff or your adviser so they can assist you.',
    keywords: 'clinic feel unwell rest 15 minutes non emergency emergency sick',
  },
  {
    question: 'What are the clinic operating hours?',
    answer: 'The clinic is open Monday to Friday from 6:30 AM to 5:00 PM, and Saturday from 8:00 AM to 2:00 PM.',
    keywords: 'clinic operating hours schedule monday friday saturday 6:30 am 5 pm 8 am 2 pm',
  },
  {
    question: 'What should I do if the clinic is closed?',
    answer: 'If the clinic is closed, seek help from your adviser.',
    keywords: 'clinic closed after hours adviser help assistance',
  },
  {
    question: 'What documents are needed when requesting a medical certificate?',
    answer: 'Bring your laboratory result and School ID, and have an appointment with the doctor. Medical certificates are for OJT and Work Immersion students only.',
    keywords: 'clinic medical certificate documents laboratory result school id appointment doctor ojt work immersion',
  },
  {
    question: 'Can the clinic contact my parent or guardian if I become sick?',
    answer: 'Yes. The clinic can contact your parent or guardian if you become sick.',
    keywords: 'clinic sick contact parent guardian family emergency',
  },
  {
    question: 'Can I stay in the clinic until I feel better?',
    answer: 'Yes. You may stay in the clinic until you feel better. For a non-emergency, the stated clinical rest period is 15 minutes; ask clinic staff for assistance if you need more help.',
    keywords: 'clinic stay rest until feel better clinical rest 15 minutes sick',
  },
  {
    question: 'What should I do if I get injured during a school activity?',
    answer: 'Go directly to the Clinic for assistance.',
    keywords: 'clinic injured injury school activity accident first aid',
  },
  {
    question: 'What should I do if another student needs urgent medical attention?',
    answer: 'Go directly to the Clinic for assistance. If the clinic is closed, seek help from an adviser.',
    keywords: 'clinic urgent medical attention emergency injured student help adviser',
  },
  {
    question: 'Does the clinic provide medicine for all types of illnesses?',
    answer: 'The clinic provides over-the-counter drugs only. Ask the clinic staff for guidance about your situation.',
    keywords: 'clinic medicine medication illness over the counter drugs otc',
  },
];

async function seed() {
  const transaction = await sequelize.transaction();

  try {
    const [department] = await Department.findOrCreate({
      where: { name: departmentName },
      defaults: {
        name: departmentName,
        description: 'Provides first aid, consultation, counseling, and medical and dental services to students.',
        location: 'Behind the CBA Building',
        office_hours: 'Mon-Fri 6:30AM-5PM; Sat 8AM-2PM',
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

      if (created) {
        added += 1;
      } else if (faq.answer !== entry.answer || faq.keywords !== entry.keywords) {
        await faq.update({ answer: entry.answer, keywords: entry.keywords }, { transaction });
        updated += 1;
      }
    }

    await transaction.commit();
    console.log(`Clinic FAQ seed complete. Department: ${department.name}. Added ${added} FAQ(s), updated ${updated}.`);
  } catch (error) {
    await transaction.rollback();
    console.error('Clinic FAQ seed failed:', error.message);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
}

seed();
