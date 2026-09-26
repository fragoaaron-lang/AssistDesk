const { sequelize, Department, Faq } = require('./models');

const departmentName = 'Registrar Office';

const faqEntries = [
  {
    question: 'How can I request my Transcript of Records (TOR)?',
    answer: 'Fill out a request form available outside the Registrar window. Complete the required clearance through Accounting and the Library. Accounting will check for any outstanding fees. The Registrar will then give you a claim slip with the projected release date and contact information. If someone else will claim the TOR, they must bring an authorization letter from the person who requested it.',
    keywords: 'registrar transcript records tor request form clearance accounting library fees claim slip authorization letter representative',
  },
  {
    question: 'How long does a Transcript of Records request take?',
    answer: 'For first-time requests from fresh graduates, a Transcript of Records usually takes 2–3 weeks. If it is ready earlier, the Registrar will contact the requester.',
    keywords: 'registrar tor transcript processing time release fresh graduate 2 3 weeks',
  },
  {
    question: 'How can I request a Certificate of Enrollment (CoE)?',
    answer: 'Fill out a request form available outside the Registrar window. The Registrar checks whether you are enrolled. If you are enrolled, the school can issue the CoE even if you have an outstanding balance. If you are not enrolled, you must settle any remaining balance before claiming it.',
    keywords: 'registrar certificate enrollment coe request form enrolled outstanding balance payment',
  },
  {
    question: 'How can I request a certificate of grades?',
    answer: 'Fill out a request form available outside the Registrar window. Specify the semester, quarter, or school year you need, and say whether you need the General Weighted Average (GWA) or just a list of grades.',
    keywords: 'registrar certificate grades list gwa general weighted average semester quarter school year request form',
  },
  {
    question: 'How can I request other school documents from the Registrar?',
    answer: 'Fill out a request form available outside the Registrar window and specify which documents you need. The Registrar will provide a release date. Some documents may be released on the spot; others are commonly available after a day.',
    keywords: 'registrar other school documents request form release date on the spot one day',
  },
  {
    question: 'How can I check the status of my document request?',
    answer: 'Check the projected release date and Registrar contact information on your claim slip. You can also follow up in person at the Registrar. If a problem arises, the Registrar will contact you.',
    keywords: 'registrar document request status follow up claim slip release date contact',
  },
  {
    question: 'How much are the fees for documents requested from the Registrar?',
    answer: 'Based on the supplied information, certifications cost ₱200 each, including Good Moral, Certified True Copy, List of Grades, and Certificate of Enrollment. A Transcript of Records costs ₱527, and a diploma costs ₱550. Confirm current fees with the Registrar before paying.',
    keywords: 'registrar document fees certification 200 pesos good moral certified true copy grades coe transcript tor 527 diploma 550',
  },
  {
    question: 'How can I correct an error in my student records or documents?',
    answer: 'Before releasing a certification or transcript, the Registrar provides a checklist or acknowledgment form to verify details such as your name, address, course, graduation date, and remarks. If you find an error, approach the Registrar to request a correction.',
    keywords: 'registrar correct error student records name address course graduation date remarks checklist acknowledgement form',
  },
  {
    question: 'How can I request a transfer credential?',
    answer: 'Fill out the Registrar’s form and provide the required documents. The Registrar checks whether the requirements are complete. Form 137 must be provided before a transfer-credential schedule can be arranged. The transfer-credential schedule is usually 3 weeks. Initial documents released include the dismissal certificate, Good Moral, and List of Grades. Confirm the complete requirements with the Registrar, as processes may vary.',
    keywords: 'registrar transfer credential transfer credentials form requirements form 137 schedule 3 weeks dismissal certificate good moral grades',
  },
  {
    question: 'How can I get a copy of my academic records?',
    answer: 'Request transcripts at the Registrar windows. For a List of Grades or an evaluation, approach your assigned Registrar and complete the evaluation checklist they provide.',
    keywords: 'registrar copy academic records transcript list grades evaluation checklist windows',
  },
  {
    question: 'What are the Registrar Office hours?',
    answer: 'For collegiate services, the Registrar Office is open Monday to Friday, 8:00 AM to 5:00 PM. For graduate studies and doctorate services, it is open Saturday, 8:00 AM to 12:00 noon.',
    keywords: 'registrar office hours schedule collegiate monday friday graduate doctorate saturday morning',
  },
  {
    question: 'How can I fix an incomplete grade?',
    answer: 'Ask the Registrar about completing the grade; they may first recommend speaking with your adviser. Afterward, the Registrar will provide a completion form. The form is valid for one year after taking the subject. Complete the process by the next semester; otherwise, it may lapse and you may need to retake the subject.',
    keywords: 'registrar incomplete grade INC completion form adviser one year next semester lapse retake subject',
  },
  {
    question: 'Where is the Registrar Office located?',
    answer: 'The Registrar Office is in the Administration Building, also known as the J.B. Angeles Building.',
    keywords: 'registrar office location administration building jb angeles building',
  },
  {
    question: 'How can faculty submit grades to the Registrar?',
    answer: 'Use the grade spreadsheet template provided by the Registrar Office. Submit the grades to the Dean’s Office for signing first, then submit them to the Registrar.',
    keywords: 'registrar faculty staff submit grades spreadsheet template dean office signing',
  },
  {
    question: 'What is the deadline for submitting grades?',
    answer: 'Ideally, submit grades one to two weeks after the final exams.',
    keywords: 'registrar faculty staff grade submission deadline final exams 1 2 weeks',
  },
  {
    question: 'How can I correct or update a grade already submitted to the Registrar?',
    answer: 'Submitted grade sheets cannot be edited directly. You may submit a petition form to the Registrar Office. Approval is required, and you must provide substantial supporting evidence.',
    keywords: 'registrar faculty staff correct update change submitted grade petition form approval evidence',
  },
  {
    question: 'How can faculty or staff update their information?',
    answer: 'The current system does not provide a database for storing faculty or staff information. For reports, information is currently based on faculty loading from the Human Resources department.',
    keywords: 'registrar faculty staff update information database faculty loading human resources hr reports',
  },
];

async function seed() {
  const transaction = await sequelize.transaction();

  try {
    const [department] = await Department.findOrCreate({
      where: { name: departmentName },
      defaults: {
        name: departmentName,
        description: 'Handles student records, transcripts, enrollment certificates, grades, and other official school documents.',
        location: 'Administration Building (J.B. Angeles Building)',
        office_hours: 'Weekdays 8AM-5PM; Grad/Doctorate Sat 8AM-noon',
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
    console.log(`Registrar FAQ seed complete. Department: ${department.name}. Added ${added} FAQ(s), updated ${updated}.`);
  } catch (error) {
    await transaction.rollback();
    console.error('Registrar FAQ seed failed:', error.message);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
}

seed();
