const { sequelize, Department, Faq } = require('./models');

const departmentName = 'Library';

const faqEntries = [
  {
    question: 'What are the library operating hours?',
    answer: 'The Library is open Monday to Friday, from 8:00 AM to 5:00 PM.',
    keywords: 'library operating opening hours schedule monday friday 8 am 5 pm',
  },
  {
    question: 'What do I need to borrow a book from the library?',
    answer: 'You need a Library Card to borrow a book.',
    keywords: 'library borrow book requirement library card',
  },
  {
    question: 'How many books can I borrow at a time?',
    answer: 'You may borrow one book at a time.',
    keywords: 'library borrow books limit one book at a time',
  },
  {
    question: 'How long can I keep a borrowed library book?',
    answer: 'Books may be borrowed overnight. The stated borrowing period is from 4:00 PM until 9:00 AM the following day. A ₱5 penalty applies if the book is returned late.',
    keywords: 'library book borrowing period overnight return 4 pm 9 am next day late penalty 5 pesos',
  },
  {
    question: 'What should I do if I lose a borrowed library book?',
    answer: 'You must replace a lost borrowed book. Please contact the Library for replacement details.',
    keywords: 'library lost missing borrowed book replace replacement',
  },
  {
    question: 'Can I use the library for studying?',
    answer: 'Yes. You may use the Library as a place to study.',
    keywords: 'library study studying use space',
  },
  {
    question: 'Where can I return borrowed books?',
    answer: 'Return borrowed books at the Library desk.',
    keywords: 'library return borrowed book desk drop off',
  },
  {
    question: 'Can I borrow reference books from the library?',
    answer: 'Some student reference materials may be borrowed. Encyclopedias, Merriam-Webster references, and similar reference materials are not available for borrowing.',
    keywords: 'library borrow reference books student references encyclopedia merriam webster prohibited',
  },
  {
    question: 'What happens if I return a library book late?',
    answer: 'A late return incurs a ₱5 penalty. Contact the Library desk for payment and return details.',
    keywords: 'library late overdue book return penalty fee 5 pesos',
  },
  {
    question: 'What happens if I damage a library book?',
    answer: 'You must replace a damaged book. Please contact the Library for replacement details.',
    keywords: 'library damaged book damage replace replacement',
  },
  {
    question: 'Can I renew a borrowed library book?',
    answer: 'Yes, you may renew a borrowed book. Contact the Library desk to renew it.',
    keywords: 'library renew extend borrowed book loan',
  },
  {
    question: 'Can I reserve a book that is currently unavailable?',
    answer: 'You may ask the Library about reserving a book in person. Online reservation is not currently available. You can search the catalog through the OPAC website at http://tcc.onstrike.com.ph.',
    keywords: 'library reserve unavailable book reservation online opac catalog tcc.onstrike.com.ph',
  },
  {
    question: 'Can I search the library collection before visiting?',
    answer: 'Yes. You can search the Library collection through the OPAC website at http://tcc.onstrike.com.ph.',
    keywords: 'library search collection catalog before visit online opac tcc.onstrike.com.ph',
  },
  {
    question: 'Are research or thesis materials available in the library?',
    answer: 'Yes. Research and thesis materials are available in the Library.',
    keywords: 'library research thesis materials available',
  },
  {
    question: 'Can I use a computer in the library?',
    answer: 'Yes. Library computers are available for use.',
    keywords: 'library use computer computers access',
  },
  {
    question: 'Can I access online academic resources through the library?',
    answer: 'Yes. You can access online academic resources through the Library.',
    keywords: 'library online academic resources access digital research',
  },
];

async function seed() {
  const transaction = await sequelize.transaction();

  try {
    const [department] = await Department.findOrCreate({
      where: { name: departmentName },
      defaults: {
        name: departmentName,
        description: 'Provides book borrowing, study space, research materials, computers, and access to academic resources.',
        office_hours: 'Monday-Friday 8AM-5PM',
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
    console.log(`Library FAQ seed complete. Department: ${department.name}. Added ${added} FAQ(s), updated ${updated}.`);
  } catch (error) {
    await transaction.rollback();
    console.error('Library FAQ seed failed:', error.message);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
}

seed();
