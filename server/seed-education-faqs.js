const { sequelize, Department, Faq } = require('./models');

async function seed() {
  const transaction = await sequelize.transaction();

  try {
    // Find Education Department
    const eduDept = await Department.findOne({
      where: { name: 'Education Department' },
      transaction,
    });

    if (!eduDept) {
      throw new Error('Education Department not found.');
    }

    console.log(`Found Education Department with ID: ${eduDept.id}`);

    // Define FAQ entries for Education Department
    const faqs = [
      {
        department_id: eduDept.id,
        question: 'Who is the dean, secretary, or point person of the Education Department?',
        answer: 'Dean: Dr. Ruel G. Manalo\nBEEd Coordinator: Prof. Rency Caraan\nSecretary/Clerk: Lexter Villaran\nPoint person: Dean, BEEd Coordinator and Clerk',
        keywords: 'education dean coordinator secretary staff contact personnel',
      },
      {
        department_id: eduDept.id,
        question: 'Where can I get Education Department uniforms?',
        answer: 'We buy the fabrics like aqua blue and black at Ella\'s, a fabric shop located across SM Morong. We follow the uniform design posted at the dean\'s office. We also buy logo and program patch at the dean\'s office.',
        keywords: 'education uniform fabric aqua blue black patch logo ella\s',
      },
      {
        department_id: eduDept.id,
        question: 'Where can I get the Education Department class schedule?',
        answer: 'Your class schedule is given to you when you enroll and it is posted on the bulletin board in the dean\'s office.',
        keywords: 'education class schedule enrollment bulletin board',
      },
    ];

    // Check which FAQs already exist
    const existing = await Faq.findAll({
      where: { department_id: eduDept.id },
      attributes: ['question'],
      transaction,
    });

    const existingQuestions = new Set(existing.map((faq) => faq.question));

    // Filter out existing FAQs
    const newFaqs = faqs.filter((faq) => !existingQuestions.has(faq.question));

    if (newFaqs.length === 0) {
      console.log('All FAQs already exist. No new entries added.');
      await transaction.commit();
      return;
    }

    // Insert new FAQs
    await Faq.bulkCreate(newFaqs, { transaction });

    console.log(`Successfully added ${newFaqs.length} new FAQ entries for Education Department.`);

    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    console.error('Error seeding FAQs:', error.message);
    process.exit(1);
  }
}

seed().then(() => process.exit(0));
