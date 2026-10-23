const test = require('node:test');
const assert = require('node:assert/strict');
const { faqGroups, seedStudentHandbook2025 } = require('../seed-student-handbook-2025');

function createSeedModels() {
  const rows = [];
  const transaction = {
    finished: false,
    async commit() { this.finished = 'commit'; },
    async rollback() { this.finished = 'rollback'; },
  };
  const departments = [
    { id: 1, name: 'Office of Student Affairs' },
    { id: 2, name: 'CS Department' },
    { id: 3, name: 'College of Nursing' },
    { id: 4, name: 'CBA' },
    { id: 5, name: 'Education Department' },
    { id: 6, name: 'Registrar Office' },
    { id: 7, name: 'Accounting Department' },
    { id: 8, name: 'College of Criminology' },
    { id: 9, name: 'CHARM' },
  ];
  const DepartmentModel = { findAll: async () => departments };
  const FaqModel = {
    async findAll() { return rows; },
    async create(values) {
      const faq = {
        ...values,
        async update(nextValues) { Object.assign(this, nextValues); },
      };
      rows.push(faq);
      return faq;
    },
  };
  return {
    rows,
    transaction,
    DepartmentModel,
    FaqModel,
    sequelizeInstance: { transaction: async () => transaction },
  };
}

test('handbook seed contains institution, CS, and Nursing knowledge with source-qualified answers', async () => {
  const { rows, transaction, DepartmentModel, FaqModel, sequelizeInstance } = createSeedModels();
  const result = await seedStudentHandbook2025({ sequelizeInstance, DepartmentModel, FaqModel });

  assert.equal(result.added, faqGroups.reduce((total, group) => total + group.entries.length, 0));
  assert.equal(result.updated, 0);
  assert.equal(rows.length, result.added);
  assert.equal(transaction.finished, 'commit');
  assert.ok(rows.every((faq) => faq.answer.startsWith('According to the TCC Student Handbook, 2025 Edition excerpt provided.')));
  assert.ok(rows.some((faq) => faq.question.includes('BSBA')));
  assert.ok(rows.some((faq) => faq.question === 'What is the vision of the College of Nursing?'));
  assert.equal(rows.find((faq) => faq.question === 'What programs are listed under Computer Science?').department_id, 2);
  assert.equal(rows.find((faq) => faq.question === 'What majors does the handbook list for BSBA?').department_id, 4);
  assert.equal(rows.find((faq) => faq.question === 'What are the admission requirements for entering freshmen?').department_id, 6);
  assert.equal(rows.find((faq) => faq.question === 'What are the benefits of the Student Assistantship Program?').department_id, 1);
  assert.equal(rows.find((faq) => faq.question === 'What payment arrangements are listed for tuition and fees?').department_id, 7);
  assert.equal(rows.find((faq) => faq.question === 'What is the vision of the College of Criminology?').department_id, 8);
  assert.equal(rows.find((faq) => faq.question === 'What is the mission of the College of Hospitality Management?').department_id, 9);
  assert.ok(rows.some((faq) => faq.question === 'Who are the Academic Officials named in the TCC Student Handbook 2025?'));
  assert.ok(rows.some((faq) => faq.question === 'What GWA and grade requirements are listed for Latin honors?'));
  assert.ok(rows.some((faq) => faq.question === 'What are the TCC Student Handbook requirements for on-the-job training (OJT)?'));
  assert.ok(rows.some((faq) => faq.question === 'How does the handbook say to report a student code-of-conduct violation?'));
  const organizationQuestions = [
    'How do student organizations request permission to conduct an activity?',
    'What happens after a student activity is approved, and can permission be revoked?',
    'How can a student organization have posters or announcements approved?',
    'How can students apply to establish a new student organization?',
    'Who may join a recognized student organization, and what are the officer requirements?',
    'What advance notice is required for student organization meetings and activities?',
    'When and where must a student organization submit its annual calendar of activities?',
    'What financial report must a student organization submit at the end of the school year?',
    'Who may advise a student organization, and what are the adviser’s duties?',
    'Which student organizations are listed as recognized in the 2025 handbook?',
  ];
  for (const question of organizationQuestions) {
    const faq = rows.find((row) => row.question === question);
    assert.ok(faq, `missing organization handbook FAQ: ${question}`);
    assert.equal(faq.department_id, 1);
    assert.ok(faq.answer.startsWith('According to the TCC Student Handbook, 2025 Edition excerpt provided.'));
  }
  assert.match(rows.find((faq) => faq.question === organizationQuestions[5]).answer, /three weeks/);
  assert.match(rows.find((faq) => faq.question === organizationQuestions[9]).answer, /National Service Reserve Corps \(NSRC\)/);
  const serviceQuestions = [
    'Who is eligible to file a student insurance claim, and what documents are listed?',
    'What are the TCC Library hours and basic library rules?',
    'How long can students borrow library books, and what are the library fines?',
    'What medical services and clinic hours are listed in the handbook?',
    'When may a student be observed in the school infirmary, and what happens during observation?',
    'What are the school clinic medication rules?',
    'How can an organization request a first-aid kit from the Clinic?',
    'What dental services are available through the school Clinic?',
    'What services does the Guidance and Counseling Office provide, and how can I request counseling?',
    'How do students request entrance-exam testing or a Certificate of Good Moral Character?',
    'What approval is needed for student outreach activities?',
    'How do researchers request statistical services from the TCC Statistical Center?',
    'What originality score is required for a thesis under the handbook anti-plagiarism rules?',
    'What documents and steps does the handbook list for international internships?',
    'What is the purpose of NSTP, and what are its components?',
    'Who is required or exempt from NSTP, and how long does the program take?',
    'What student support services and facilities are listed in the handbook?',
    'Who is covered by the handbook policies on sexual harassment, Safe Spaces, and bullying?',
    'What conduct does the handbook identify as sexual harassment or a Safe Spaces violation?',
    'How can I report sexual harassment, a Safe Spaces violation, or bullying at TCC?',
    'What committee investigates sexual-harassment, Safe Spaces, and bullying complaints?',
    'What due-process steps are described for sexual-harassment or bullying complaints?',
    'How are sexual-harassment, Safe Spaces, or bullying cases decided and kept confidential?',
    'What support and prevention measures are listed for people affected by harassment or bullying?',
    'What types of bullying are described in the handbook?',
    'What sanctions may apply to sexual harassment, bullying, or Safe Spaces violations?',
    'What does TCC’s drug-free workplace and school-campus policy say?',
    'What are the guidelines for attending flexible or online classes?',
    'How should students submit requirements in flexible learning classes?',
  ];
  for (const question of serviceQuestions) {
    const faq = rows.find((row) => row.question === question);
    assert.ok(faq, `missing handbook service FAQ: ${question}`);
    assert.equal(faq.department_id, 1);
    assert.ok(faq.answer.startsWith('According to the TCC Student Handbook, 2025 Edition excerpt provided.'));
  }
  assert.match(rows.find((faq) => faq.question === serviceQuestions[12]).answer, /80%.*85%/);
  assert.match(rows.find((faq) => faq.question === serviceQuestions[15]).answer, /Sangguniang Kabataan/);
  assert.match(rows.find((faq) => faq.question === serviceQuestions[16]).answer, /photocopying/);
  assert.match(rows.find((faq) => faq.question === serviceQuestions[16 + 5]).answer, /10 calendar days/);
  assert.match(rows.find((faq) => faq.question === serviceQuestions[16 + 10]).answer, /confirmatory testing/);
  assert.match(rows.find((faq) => faq.question === serviceQuestions[16 + 11]).answer, /five minutes early/);
  const appendixQuestions = [
    'What does the Flexible Learning Option student agreement require?',
    'What does the Flexible Learning Option teacher agreement require of faculty?',
    'What does the student handbook compliance agreement confirm?',
    'What is the Tomas Claudio Colleges alma mater hymn?',
    'What TCC contact information is printed in the 2025 handbook?',
  ];
  for (const question of appendixQuestions) {
    const faq = rows.find((row) => row.question === question);
    assert.ok(faq, `missing handbook appendix FAQ: ${question}`);
    assert.equal(faq.department_id, 1);
    assert.ok(faq.answer.startsWith('According to the TCC Student Handbook, 2025 Edition excerpt provided.'));
  }
  assert.match(rows.find((faq) => faq.question === appendixQuestions[0]).answer, /royalty-free/);
  assert.match(rows.find((faq) => faq.question === appendixQuestions[2]).answer, /non-readmission/);
  assert.match(rows.find((faq) => faq.question === appendixQuestions[4]).answer, /\(02\) 8234-5566/);
});

test('handbook seed is idempotent when run more than once', async () => {
  const { rows, DepartmentModel, FaqModel, sequelizeInstance } = createSeedModels();
  const first = await seedStudentHandbook2025({ sequelizeInstance, DepartmentModel, FaqModel });
  const second = await seedStudentHandbook2025({ sequelizeInstance, DepartmentModel, FaqModel });

  assert.ok(first.added > 0);
  assert.deepEqual(second, { added: 0, updated: 0 });
  assert.equal(rows.length, first.added);
});

test('handbook seed rolls back if a required department is absent', async () => {
  const { transaction, FaqModel, sequelizeInstance } = createSeedModels();
  const DepartmentModel = { findAll: async () => [] };

  await assert.rejects(
    seedStudentHandbook2025({ sequelizeInstance, DepartmentModel, FaqModel }),
    /Required handbook FAQ department not found/,
  );
  assert.equal(transaction.finished, 'rollback');
});
