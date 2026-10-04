const { sequelize, Department, Faq } = require('./models');

const departmentName = 'Basic Education Department';
const officeHours = '6:30 AM to 2:30 PM';

const faqEntries = [
  {
    question: 'Who is the principal of Basic Education?',
    answer: 'The principal of Basic Education is Mr. Dindo C. Punzalan.',
    keywords: 'basic education principal dindo c punzalan',
  },
  {
    question: 'Who is the assistant principal of Basic Education?',
    answer: 'The assistant principal is Mr. Rodolfo G. Hernandez Jr.',
    keywords: 'basic education assistant principal rodolfo hernandez',
  },
  {
    question: 'Where can parents inquire about a student concern?',
    answer: 'Parents may contact or visit the Office of the Principal about a student concern.',
    keywords: 'basic education parent student concern principal office call visit',
  },
  {
    question: 'How can I contact the Basic Education principal?',
    answer: 'Contact the principal through the TCC Basic Education Department Facebook page, by email at tccelbasiceddepartment10421@gmail.com, or by calling the Office of the Principal hotline at 571-3966.',
    keywords: 'basic education principal contact facebook email hotline phone 571 3966',
  },
  {
    question: 'Where can I ask about school activities or announcements?',
    answer: 'Check the TCC Basic Education Department Facebook page. Announcements may also be shared through the department group chat by the responding coordinator.',
    keywords: 'basic education school activities announcements facebook group chat coordinator',
  },
  {
    question: 'Where can parents report attendance concerns?',
    answer: 'Parents may approach the class adviser or subject teachers about attendance concerns.',
    keywords: 'basic education parent attendance absence class adviser subject teacher',
  },
  {
    question: 'Where can parents inquire about a student behavior concern?',
    answer: 'Parents should first approach the homeroom adviser. In some cases, the Prefect of Discipline may also assist.',
    keywords: 'basic education parent student behavior concern homeroom adviser prefect discipline',
  },
  {
    question: 'Where can I inquire about report card release?',
    answer: 'Ask the student’s adviser about report card release.',
    keywords: 'basic education report card release adviser grades',
  },
  {
    question: 'Who should I approach about a concern with a teacher?',
    answer: 'Approach the principal first. The principal will speak with the teacher involved.',
    keywords: 'basic education concern complaint teacher principal',
  },
  {
    question: 'What should I do if my Basic Education school ID is lost or damaged?',
    answer: 'Report the lost or damaged ID to the adviser to request a replacement.',
    keywords: 'basic education school id lost damaged replacement adviser',
  },
  {
    question: 'Where can parents ask about academic performance?',
    answer: 'For a concern about a particular subject, approach that subject’s teacher.',
    keywords: 'basic education parent academic performance grades subject teacher',
  },
  {
    question: 'Where can I get a Basic Education uniform or PE uniform?',
    answer: 'Basic Education uniforms and PE uniforms are available at the Office of the Principal.',
    keywords: 'basic education uniform pe uniform principal office',
  },
  {
    question: 'Where can I get Basic Education books?',
    answer: 'Ask at the Accounting Office or Accounting Department about getting books.',
    keywords: 'basic education books accounting office department textbooks',
  },
  {
    question: 'Where can I get my Basic Education school ID?',
    answer: 'School IDs are taken by section according to the school’s schedule. The adviser will announce the release date once available.',
    keywords: 'basic education school id photo section schedule release adviser',
  },
  {
    question: 'How can I get a library ID in Basic Education?',
    answer: 'Ask the librarian at the Basic Education Library for a library ID.',
    keywords: 'basic education library id librarian card',
  },
  {
    question: 'What are the office hours of the Basic Education Department?',
    answer: `The Basic Education Department office hours are ${officeHours}.`,
    keywords: 'basic education department office hours opening schedule 6 30 am 2 30 pm',
  },
  {
    question: 'Where can I get Form 138?',
    answer: 'Ask the class adviser about Form 138. The adviser can request it from the Registrar Office. After graduation, the adviser will provide the release date.',
    keywords: 'basic education form 138 report card registrar adviser graduate release date',
  },
  {
    question: 'Where can I find the Basic Education Library?',
    answer: 'The Basic Education Library is on the ground floor of the Senior High School Building.',
    keywords: 'basic education library location ground floor senior high school shs building',
  },
  {
    question: 'Where is the Basic Education principal’s office located?',
    answer: 'The Principal’s Office is alongside the CS Building, at the farthest right.',
    keywords: 'basic education principal office location cs building farthest right',
  },
];

const normalizeQuestion = (question) => String(question || '').trim().toLowerCase();

async function seed() {
  let transaction;

  try {
    transaction = await sequelize.transaction();
    const [department] = await Department.findOrCreate({
      where: { name: departmentName },
      defaults: {
        name: departmentName,
        description: 'Handles Kindergarten, Elementary, Junior High School, and Senior High School concerns.',
        office_hours: officeHours,
      },
      transaction,
    });

    if (department.office_hours !== officeHours) {
      await department.update({ office_hours: officeHours }, { transaction });
    }

    const existingFaqs = await Faq.findAll({
      where: { department_id: department.id },
      transaction,
    });
    const existingByQuestion = new Map(existingFaqs.map((faq) => [normalizeQuestion(faq.question), faq]));
    let added = 0;
    let updated = 0;

    for (const entry of faqEntries) {
      const existing = existingByQuestion.get(normalizeQuestion(entry.question));
      if (!existing) {
        const faq = await Faq.create({ department_id: department.id, ...entry }, { transaction });
        existingByQuestion.set(normalizeQuestion(entry.question), faq);
        added += 1;
      } else if (existing.answer !== entry.answer || existing.keywords !== entry.keywords) {
        await existing.update({ answer: entry.answer, keywords: entry.keywords }, { transaction });
        updated += 1;
      }
    }

    await transaction.commit();
    console.log(`Basic Education FAQ seed complete. Department: ${department.name}. Added ${added}, updated ${updated}.`);
  } catch (error) {
    if (transaction && !transaction.finished) await transaction.rollback();
    console.error('Basic Education FAQ seed failed:', error.message);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
}

seed();
