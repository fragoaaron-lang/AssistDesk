const { sequelize, GeneralIssue, SpecificIssue } = require('./models');
const {
  defaultGeneralIssueOptions,
  departmentGeneralIssueOptions,
} = require('../client/src/ticketIssueOptions.json');

const normalize = (value) => String(value || '').toLowerCase().trim();

const getOptionsForDepartment = (departmentName) => {
  const name = normalize(departmentName);
  if (name.includes('maintenance')) return departmentGeneralIssueOptions.maintenance;
  if (name.includes('clinic')) return departmentGeneralIssueOptions.clinic;
  if (name.includes('library')) return departmentGeneralIssueOptions.library;
  if (name.includes('accounting')) return departmentGeneralIssueOptions.accounting;
  if (name.includes('registrar')) return departmentGeneralIssueOptions.registrar;
  if (name.includes('student affairs') || name === 'osa') return departmentGeneralIssueOptions.osa;
  if (name.includes('guidance')) return departmentGeneralIssueOptions.guidance;
  if (name.includes('information technology') || name.includes('it department')) return departmentGeneralIssueOptions.it;
  if (name.includes('basic education')) return departmentGeneralIssueOptions.basic;
  if (name.includes('computer science') || name.includes('computer studies') || name === 'cs' || name.includes('bscs')) return departmentGeneralIssueOptions.cs;
  if (name.includes('business administration') || name.includes('business and accountancy') || name === 'cba' || name.includes('accountancy') || name.includes('bsa') || name.includes('bsba')) return departmentGeneralIssueOptions.cba;
  if (name.includes('criminology') || name.includes('crim') || name.includes('bscrim')) return departmentGeneralIssueOptions.crim;
  if (name.includes('hospitality') || name.includes('charm') || name.includes('bshm') || name === 'hm') return departmentGeneralIssueOptions.hm;
  if (name.includes('physical therapy') || name.includes('bspt')) return departmentGeneralIssueOptions.pt;
  if (name.includes('nursing') || name === 'bsn') return departmentGeneralIssueOptions.nursing;
  if (['education department', 'college of education'].includes(name)) return departmentGeneralIssueOptions.education;
  return defaultGeneralIssueOptions;
};

async function seed() {
  let transaction;

  try {
    transaction = await sequelize.transaction();
    const departments = await sequelize.query('SELECT id, name FROM departments ORDER BY id ASC', {
      type: sequelize.QueryTypes.SELECT,
      transaction,
    });
    if (!departments.length) throw new Error('No departments exist. Create departments before seeding ticket issue options.');

    let addedGeneral = 0;
    let addedSpecific = 0;

    for (const department of departments) {
      const issueOptions = getOptionsForDepartment(department.name);
      for (const [generalIssueName, specificIssueNames] of Object.entries(issueOptions)) {
        const [generalIssue, createdGeneral] = await GeneralIssue.findOrCreate({
          where: { department_id: department.id, name: generalIssueName },
          defaults: { department_id: department.id, name: generalIssueName },
          transaction,
        });
        if (createdGeneral) addedGeneral += 1;

        for (const specificIssueName of specificIssueNames) {
          const [, createdSpecific] = await SpecificIssue.findOrCreate({
            where: { general_issue_id: generalIssue.id, name: specificIssueName },
            defaults: { general_issue_id: generalIssue.id, name: specificIssueName },
            transaction,
          });
          if (createdSpecific) addedSpecific += 1;
        }
      }
    }

    await transaction.commit();
    console.log(`Ticket issue options seeded. Added ${addedGeneral} general issue(s) and ${addedSpecific} specific issue(s) across ${departments.length} department(s). Existing catalog entries were preserved.`);
  } catch (error) {
    if (transaction && !transaction.finished) await transaction.rollback();
    console.error('Ticket issue seed failed:', error.message);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
}

seed();
