const { sequelize, Department, Faq } = require('./models');
const { officeFacts, officeNameMatches } = require('./utils/officeLocationFaqs');

const normalizeQuestion = (value) => String(value || '').trim().toLowerCase();

async function seedOfficeLocationFaqs({ closeConnection = true } = {}) {
  const transaction = await sequelize.transaction();

  try {
    const departments = await Department.findAll({ transaction });
    let added = 0;
    let updated = 0;

    for (const office of officeFacts) {
      const departmentAliases = office.faqDepartmentAliases || office.departmentAliases;
      let department = departments.find((candidate) => officeNameMatches(candidate.name, departmentAliases));
      if (!department) {
        const name = office.faqDepartmentAliases ? office.faqDepartmentAliases[0] : office.departmentAliases[0];
        [department] = await Department.findOrCreate({
          where: { name },
          defaults: { name, ...(office.departmentUpdates || {}) },
          transaction,
        });
        departments.push(department);
      }

      if (office.departmentUpdates) await department.update(office.departmentUpdates, { transaction });

      const existingFaqs = await Faq.findAll({ where: { department_id: department.id }, transaction });
      const existingByQuestion = new Map(existingFaqs.map((faq) => [normalizeQuestion(faq.question), faq]));
      for (const entry of office.faqs) {
        const current = existingByQuestion.get(normalizeQuestion(entry.question));
        if (!current) {
          const faq = await Faq.create({ department_id: department.id, ...entry }, { transaction });
          existingByQuestion.set(normalizeQuestion(entry.question), faq);
          added += 1;
        } else if (current.answer !== entry.answer || current.keywords !== entry.keywords) {
          await current.update({ answer: entry.answer, keywords: entry.keywords }, { transaction });
          updated += 1;
        }
      }
    }

    await transaction.commit();
    console.log(`Office location FAQ seed complete. Added ${added} FAQ(s), updated ${updated}.`);
    return { added, updated };
  } catch (error) {
    if (!transaction.finished) await transaction.rollback();
    throw error;
  } finally {
    if (closeConnection) await sequelize.close();
  }
}

if (require.main === module) {
  seedOfficeLocationFaqs().catch((error) => {
    console.error('Office location FAQ seed failed:', error.message);
    process.exitCode = 1;
  });
}

module.exports = seedOfficeLocationFaqs;
