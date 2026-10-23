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
