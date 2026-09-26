const { sequelize, Department, Faq } = require('./models');

const departmentName = 'Student Affairs';

const faqEntries = [
  {
    question: 'Who is the president of TCC?',
    answer: 'The president of Tomas Claudio Colleges is Pres. Edmund C. Francisco.',
    keywords: 'about tcc president school president edmund francisco',
  },
  {
    question: 'Who is the secretary of TCC?',
    answer: 'The secretary of Tomas Claudio Colleges is Ms. Reylyn R. Geron.',
    keywords: 'about tcc secretary school secretary reynlyn geron',
  },
  {
    question: 'Where can I locate the nearest parking?',
    answer: 'Parking is available along the gates, in front of the Administration Building, at the CHARM and Criminology parking areas, and along the Education Building toward the SHS Building.',
    keywords: 'about tcc nearest parking gates administration building charm criminology education shs',
  },
  {
    question: 'Where is the canteen located?',
    answer: 'The canteen is near the TCC Gymnasium.',
    keywords: 'about tcc canteen location gymnasium',
  },
  {
    question: 'What is Tomas Claudio Colleges (TCC)?',
    answer: 'Tomas Claudio Colleges (TCC) is a pioneering, community-owned educational institution in Taghangin, Morong, Rizal, Philippines. Founded on August 15, 1950, it honors Tomas Claudio, a local native recognized as the first Filipino national hero to die during World War I. TCC is a private institution in eastern Rizal offering programs from basic education through postgraduate studies.',
    keywords: 'about tcc what is tomas claudio colleges history founded location taghangin morong rizal community owned',
  },
  {
    question: 'What does Tomas Claudio Colleges (TCC) offer?',
    answer: 'TCC offers Accountancy, Business Administration, Public Administration, Computer Science, Elementary Education, Secondary Education, Criminology, Hospitality Management, Nursing, Physical Therapy, TESDA Caregiving, and a Juris Doctor program through the College of Law. Basic Education includes Kindergarten, Elementary, Junior High School, Senior High School, and Special Needs Education. Graduate programs include Master in Business Administration, Master in Public Administration, and Master of Arts in Education.',
    keywords: 'about tcc programs courses accountancy business administration public administration computer science education criminology hospitality nursing physical therapy caregiving basic education graduate studies law juris doctor',
  },
  {
    question: 'What are the admission requirements or application requirements?',
    answer: 'Incoming freshmen need a Grade 12 Report Card (Form 138), Certificate of Good Moral Character, photocopy of PSA birth certificate, and two 2x2 ID photos with name tags. Transfer students need an original Transcript of Records, Honorable Dismissal with Scholastic Record, photocopy of PSA birth certificate, and two 2x2 ID photos with name tags. Cross-enrollees need a Permit to Cross-Enroll, Certificate of Good Moral Character, photocopy of PSA birth certificate, and two 2x2 ID photos with name tags. Graduate studies applicants need an original Transcript of Records, photocopy of birth certificate, marriage contract if married, and two 2x2 ID photos with name tags.',
    keywords: 'about tcc admission application requirements freshman transferee transfer cross enrollee graduate studies form 138 tor good moral psa birth certificate 2x2 photos',
  },
  {
    question: 'What is the mission and vision of Tomas Claudio Colleges (TCC)?',
    answer: 'Vision: Tomas Claudio Colleges is the leading community-based institution of learning imbued with academic excellence, social advancement, and internationalization of education. Mission: TCC is committed to delivering affordable educational services guided by academic excellence, attaining social advancement and quality of life for all sectors of society, and actively participating in the internationalization of education.',
    keywords: 'about tcc mission vision academic excellence social advancement internationalization affordable education quality of life',
  },
];

async function seed() {
  const transaction = await sequelize.transaction();

  try {
    const [department] = await Department.findOrCreate({
      where: { name: departmentName },
      defaults: {
        name: departmentName,
        description: 'Provides general information about Tomas Claudio Colleges and student services.',
        location: 'Near TCC Gymnasium',
        office_hours: 'Mon-Fri 8AM-5PM',
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
    console.log(`About TCC FAQ seed complete. Department: ${department.name}. Added ${added} FAQ(s), updated ${updated}.`);
  } catch (error) {
    await transaction.rollback();
    console.error('About TCC FAQ seed failed:', error.message);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
}

seed();
