const { sequelize, Department, Faq } = require('./models');

const SOURCE = 'According to the TCC Student Handbook, 2025 Edition excerpt provided.';

const faqGroups = [
  {
    departmentAliases: ['Office of Student Affairs', 'Office of the Student Affairs', 'Student Affairs'],
    entries: [
      {
        question: 'What academic courses and degree programs are listed in the TCC Student Handbook 2025?',
        answer: `${SOURCE} the listed programs are: Arts and Sciences—Bachelor of Science in Nursing (BSN), Physical Therapy (BSPT), Public Administration (BSPAd), and Criminology; Business Administration—Bachelor of Science in Accountancy (BSA), Hospitality Management (BSHM), and Business Administration (BSBA); Computer Science—Bachelor of Science in Computer Science (BSCS) and Associate in Computer Technology (ACT); Education—Bachelor of Elementary Education (BEEd) and Bachelor of Secondary Education (BSEd); Graduate School—Master of Arts in Education (MAED), Master of Arts in Counseling (MAC), Master in Business Administration (MBA), and Master in Public Administration (MPA); and College of Law—Juris Doctor. This answer reflects the supplied handbook excerpt; confirm current offerings with the school before applying.`,
        keywords: 'tcc tomas claudio colleges student handbook 2025 academic courses offered courses programs degree list undergraduate graduate school law arts sciences business administration computer science education BSN BSPT BSPAd criminology BSA BSHM BSBA BSCS ACT BEEd BSEd MAED MAC MBA MPA juris doctor what courses degrees programs are available',
      },
      {
        question: 'What courses are under Arts and Sciences in the 2025 handbook?',
        answer: `${SOURCE} Arts and Sciences lists Bachelor of Science in Nursing (BSN), Bachelor of Science in Physical Therapy (BSPT), Bachelor of Science in Public Administration (BSPAd), and Bachelor of Science in Criminology.`,
        keywords: 'arts sciences courses degrees programs BSN nursing BSPT physical therapy BSPAd public administration criminology',
      },
      {
        question: 'What graduate programs are listed in the handbook?',
        answer: `${SOURCE} Graduate School lists Master of Arts in Education (MAED), major in Educational Management; Master of Arts in Counseling (MAC); Master in Business Administration (MBA); and Master in Public Administration (MPA).`,
        keywords: 'graduate school graduate programs postgraduate MAED education educational management MAC counseling MBA business administration MPA public administration masters',
      },
      {
        question: 'Does the handbook list a College of Law program?',
        answer: `${SOURCE} the College of Law entry lists the Juris Doctor program. The excerpt does not provide admission requirements or program details.`,
        keywords: 'college law Juris Doctor JD law program course admission requirements handbook',
      },
      {
        question: 'What sections are listed in Article I of the 2025 Student Handbook?',
        answer: `${SOURCE} Article I is titled “Academic Policies and Procedures.” The supplied table of contents lists: Section 1, Methods of Instruction; Section 2, Admission and Enrollment Policies (including Admission Policy); Section 3, Securing Scholastic Record; Section 4, Application of Transfer Credentials; Section 5, Application for Graduation; Section 6, Securing Diploma and Transcript of Records; Section 7, Adding and Changing of Subjects; Section 8, Cross Enrollment to another School; Section 9, Dropping of Subjects; Section 10, Changing Grades; Section 11, Completion of Grades; Section 12, Cancellation of Registration; Section 13, Excess or Overload; and Section 14, Credit from Other Schools. The excerpt gives section titles only, not the detailed rules.`,
        keywords: 'handbook article I academic policies procedures table contents sections methods instruction admission enrollment scholastic record transfer credentials graduation diploma transcript adding changing subjects cross enrollment dropping grades completion cancellation registration excess overload credit other schools',
      },
      {
        question: 'What topics are included in the Student Handbook table of contents?',
        answer: `${SOURCE} the supplied contents include introductory sections (Foreword, Board of Directors, Academic Officials, Administrative Officials, and Brief History of the College), Vision, Mission, and Academic Programs, Academic Courses Offered, and Article I: Academic Policies and Procedures. The excerpt lists sections on instruction, admission and enrollment, scholastic records, transfer credentials, graduation, diplomas and transcripts, subject changes, cross-enrollment, dropping subjects, grades, registration cancellation, overload, and credit from other schools. It does not include the full text of these policies.`,
        keywords: 'handbook table contents contents foreword directors academic officials administrative officials history vision mission academic programs courses policies procedures topics sections',
      },
    ],
  },
  {
    departmentAliases: ['CS Department', 'CS', 'College of Computer Studies'],
    entries: [
      {
        question: 'What programs are listed under Computer Science?',
        answer: `${SOURCE} the Computer Science section lists Bachelor of Science in Computer Science (BSCS) and Associate in Computer Technology (ACT). The supplied text spells “Technology” as “Technolagy”; confirm the official program title with the College of Computer Studies.`,
        keywords: 'computer science courses programs BSCS bachelor science associate computer technology technolagy ACT college computer studies',
      },
      {
        question: 'What is the vision of the College of Computer Studies?',
        answer: `${SOURCE} the College of Computer Studies is envisioned to sustain academic excellence in Computer Science to achieve the quality of life in the community.`,
        keywords: 'college computer studies CS computer science vision academic excellence quality life community handbook 2025',
      },
      {
        question: 'What is the mission of the College of Computer Studies?',
        answer: `${SOURCE} its mission is to pursue the development of entrepreneurial skills and competencies in Computer Science that allow thriving in a changing world, and to inculcate positive values to produce responsible citizens who are globally competitive and community-service oriented.`,
        keywords: 'college computer studies CS computer science mission entrepreneurial skills competencies changing world positive values responsible citizens globally competitive community service',
      },
    ],
  },
  {
    departmentAliases: ['College of Nursing', 'Nursing Department'],
    entries: [
      {
        question: 'What Nursing program is listed in the 2025 handbook?',
        answer: `${SOURCE} it lists Bachelor of Science in Nursing (BSN) under Arts and Sciences.`,
        keywords: 'nursing program BSN bachelor science nursing arts sciences degree course',
      },
      {
        question: 'What is the vision of the College of Nursing?',
        answer: `${SOURCE} the College of Nursing shall produce influential leaders and dominant professionals in nursing and healthcare practice who are highly qualified in local and global markets.`,
        keywords: 'college nursing nursing healthcare practice vision influential leaders professionals local global markets handbook 2025',
      },
      {
        question: 'What is the mission of the College of Nursing?',
        answer: `${SOURCE} Nursing education is committed to developing caring, responsible, nationalistic, creative, and critical-thinking generalists who demonstrate professional competencies upon completing the program.`,
        keywords: 'college nursing nursing education mission caring responsible nationalistic creative critical thinking generalists professional competencies',
      },
    ],
  },
  {
    departmentAliases: ['CBA', 'College of Business and Accountancy', 'College of Business Administration'],
    entries: [
      {
        question: 'What programs are listed under Business Administration?',
        answer: `${SOURCE} the Business Administration section lists Bachelor of Science in Accountancy (BSA), Bachelor of Science in Hospitality Management (BSHM), and Bachelor of Science in Business Administration (BSBA). The excerpt lists BSBA majors as Business Economics, Financial Management, Human Resource & Development Management, Marketing Management, Operations Management, and Financial Management Accounting. Financial Management appears more than once in the supplied text, so confirm the official current major list with the College of Business and Accountancy.`,
        keywords: 'business administration programs BSA accountancy BSHM hospitality management BSBA business economics financial management human resource development management marketing operations financial management accounting major majors CBA',
      },
      {
        question: 'What majors does the handbook list for BSBA?',
        answer: `${SOURCE} it lists Business Economics, Financial Management, Human Resource & Development Management, Marketing Management, Operations Management, and Financial Management Accounting. The supplied excerpt repeats Financial Management, so please confirm the current official list with the College of Business and Accountancy.`,
        keywords: 'BSBA majors major business economics financial management human resource development management marketing operations accounting CBA handbook',
      },
    ],
  },
  {
    departmentAliases: ['Education Department', 'College of Education'],
    entries: [
      {
        question: 'What programs are listed under Education?',
        answer: `${SOURCE} Education lists Bachelor of Elementary Education (BEEd), with Generalist as its area of concentration, and Bachelor of Secondary Education (BSEd), with majors in English, Filipino, Mathematics, Social Studies, and Science.`,
        keywords: 'education programs courses BEEd Bachelor Elementary Education generalist BSEd Bachelor Secondary Education English Filipino Mathematics Social Studies Science majors',
      },
    ],
  },
];

const normalize = (value) => String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');

async function seedStudentHandbook2025({ sequelizeInstance = sequelize, DepartmentModel = Department, FaqModel = Faq } = {}) {
  let transaction;
  let added = 0;
  let updated = 0;

  try {
    transaction = await sequelizeInstance.transaction();
    const departments = await DepartmentModel.findAll({ transaction });
    const existingByQuestion = new Map();
    const existingFaqs = await FaqModel.findAll({ transaction });
    existingFaqs.forEach((faq) => {
      existingByQuestion.set(`${faq.department_id}:${normalize(faq.question)}`, faq);
    });

    for (const group of faqGroups) {
      const department = group.departmentAliases
        .map((alias) => departments.find((candidate) => normalize(candidate.name) === normalize(alias)))
        .find(Boolean);
      if (!department) {
        throw new Error(`Required handbook FAQ department not found: ${group.departmentAliases.join(' / ')}. Run the department seed first.`);
      }

      for (const entry of group.entries) {
        const key = `${department.id}:${normalize(entry.question)}`;
        const existing = existingByQuestion.get(key);
        if (!existing) {
          const faq = await FaqModel.create({ department_id: department.id, ...entry }, { transaction });
          existingByQuestion.set(key, faq);
          added += 1;
        } else if (existing.answer !== entry.answer || existing.keywords !== entry.keywords) {
          await existing.update({ answer: entry.answer, keywords: entry.keywords }, { transaction });
          updated += 1;
        }
      }
    }

    await transaction.commit();
    return { added, updated };
  } catch (error) {
    if (transaction && !transaction.finished) await transaction.rollback();
    throw error;
  }
}

if (require.main === module) {
  seedStudentHandbook2025()
    .then(({ added, updated }) => {
      console.log(`TCC Student Handbook 2025 FAQ seed complete. Added ${added}, updated ${updated}.`);
    })
    .catch((error) => {
      console.error('TCC Student Handbook 2025 FAQ seed failed:', error.message);
      process.exitCode = 1;
    })
    .finally(() => sequelize.close());
}

module.exports = { faqGroups, seedStudentHandbook2025 };
