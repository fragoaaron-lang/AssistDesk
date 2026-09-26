const { sequelize, Department, Faq } = require('./models');

const departmentName = 'Office of the Student Affairs';

const faqEntries = [
  {
    question: 'What services does the Office of the Student Affairs provide?',
    answer: 'The Office of the Student Affairs provides student orientation, student activities, canteen management, student security, and enforcement of basic rules and regulations. The supplied source information for this last service was incomplete; contact OSA for details.',
    keywords: 'osa office student affairs services orientation activities canteen management security rules regulations',
  },
  {
    question: 'How can I contact the Office of the Student Affairs?',
    answer: 'You can visit the Office of the Student Affairs in person or send an inquiry through the Facebook page named “TCC Office of Student Affairs.”',
    keywords: 'osa contact inquire online facebook tcc office student affairs visit walk in',
  },
  {
    question: 'Where is the Office of the Student Affairs, and what are its office hours?',
    answer: 'The Office of the Student Affairs is near the TCC Gymnasium. Regular office hours are Monday to Friday, 8:00 AM to 5:00 PM. The head is usually available from 6:00 AM until 9:00 PM. Lunch break is from 12:00 PM to 1:00 PM.',
    keywords: 'osa location office hours hours schedule gymnasium monday friday lunch break',
  },
  {
    question: 'How can I request a student ID or a replacement ID?',
    answer: 'A student ID is charged once during enrollment. If you lose it, have a new ID photo taken at Dante’s Photo Image Studio in Morong Proper and pay for the replacement ID.',
    keywords: 'osa student id replacement lost photo dantes dante photo image studio morong payment',
  },
  {
    question: 'How can I report a student concern or complaint to OSA?',
    answer: 'Report the concern directly to the Office of the Student Affairs by submitting a written incident report.',
    keywords: 'osa report student concern complaint written incident report',
  },
  {
    question: 'How do I file a complaint about another student?',
    answer: 'Submit an incident report to the Office of the Student Affairs. Student-related complaints are reviewed case by case and go through the Student Discipline Committee before a final decision. Simple concerns, such as lost-and-found inquiries or requests for CCTV access, may be handled directly by the relevant office.',
    keywords: 'osa complaint another student incident report student discipline committee cctv lost found case review',
  },
  {
    question: 'Where can I find the school rules and regulations for students?',
    answer: 'The supplied OSA information did not include the school rules and regulations. Please contact the Office of the Student Affairs for the current official policies.',
    keywords: 'osa school student rules regulations policies handbook official',
  },
  {
    question: 'What are the consequences of violating school policies?',
    answer: 'Depending on the case, consequences may include a warning, suspension from school, community work, or expulsion.',
    keywords: 'osa consequences violation school policy rules warning suspension community work expulsion discipline',
  },
  {
    question: 'How do I appeal a disciplinary decision?',
    answer: 'You may appeal a disciplinary decision if you believe the outcome was not appropriate or did not provide a fair resolution. Contact the Office of the Student Affairs for the appeal process.',
    keywords: 'osa appeal disciplinary decision complaint fairness resolution student discipline',
  },
  {
    question: 'How can a student organization request event approval?',
    answer: 'Submit an approval letter to the Office of the Student Affairs. Once approved, the organization may reserve event facilities. The student leader or person who submitted the letter must complete a form listing the facilities or equipment needed.',
    keywords: 'osa organization event approval letter reserve facilities equipment form student leader',
  },
  {
    question: 'What are the requirements for student leadership positions?',
    answer: 'The supplied OSA information lists no formal requirements. Students interested in leadership should demonstrate good leadership and set a positive example for their fellow students.',
    keywords: 'osa student leadership position requirements leader qualifications example',
  },
  {
    question: 'How can I become a student representative or student leader?',
    answer: 'You can create or join a party list that runs for positions in the Supreme Student Council.',
    keywords: 'osa student representative student leader supreme student council party list election',
  },
  {
    question: 'What should I do if I lose an item on campus?',
    answer: 'Ask the Office of the Student Affairs about lost items and check the “TCC Office of Student Affairs” Facebook page, where found items may be posted. Items are held only for a limited time and may be disposed of if unclaimed.',
    keywords: 'osa lost item lost property found item facebook page unclaimed dispose',
  },
  {
    question: 'How can I claim a lost-and-found item?',
    answer: 'Ask the Office of the Student Affairs about the item and describe it. If the description matches an item they hold, they can return it. Some items may be held by other offices or may not have been found. You can also check the “TCC Office of Student Affairs” Facebook page.',
    keywords: 'osa claim retrieve lost found item describe facebook office',
  },
  {
    question: 'How long does OSA take to process a request or complaint?',
    answer: 'Urgent complaints involving student safety or conduct, such as bullying, incidents, malicious activities, or vandalism, are handled immediately when possible. The Student Discipline Committee makes the final decision on cases it reviews. Contact OSA for the expected timing of other requests.',
    keywords: 'osa request complaint processing time urgent immediate bullying incident malicious activity vandalism student discipline committee',
  },
];

async function seed() {
  const transaction = await sequelize.transaction();

  try {
    const [department] = await Department.findOrCreate({
      where: { name: departmentName },
      defaults: {
        name: departmentName,
        description: 'Provides student orientation, student activities, canteen management, student security, and student affairs support.',
        location: 'Near TCC Gymnasium',
        office_hours: 'Weekdays 8AM-5PM; Head 6AM-9PM; Lunch 12-1PM',
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
    console.log(`OSA FAQ seed complete. Department: ${department.name}. Added ${added} FAQ(s), updated ${updated}.`);
  } catch (error) {
    await transaction.rollback();
    console.error('OSA FAQ seed failed:', error.message);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
}

seed();