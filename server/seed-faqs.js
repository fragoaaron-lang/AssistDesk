const { sequelize, Department, Faq } = require('./models');

const departmentAliases = {
  general: ['Student Affairs', 'Office of Student Affairs', 'Basic Education Department'],
  basic: ['Basic Education Department'],
  cs: ['CS Department', 'CS'],
  crim: ['Crim Department', 'College of Criminology'],
  hm: ['HM Department', 'BSHM Department', 'CHARM'],
  pt: ['Physical Therapy Department', 'College of Physical Therapy'],
  nursing: ['Nursing Department', 'College of Nursing'],
  education: ['Education Department', 'Basic Education Department'],
  maintenance: ['Maintenance', 'Maintenance Department'],
  clinic: ['Clinic'],
  accounting: ['Accounting', 'Accounting Department'],
  guidance: ['Guidance'],
  library: ['Library'],
};

const faqData = {
  general: [
    ['Who is the president of TCC?', 'Pres. Edmund C. Francisco', 'president tcc school president'],
    ['Who is the secretary of TCC?', 'Ms. Reylyn R. Geron', 'secretary tcc school secretary'],
    ['Where can I get my college school ID?', 'College school IDs are available at Dantes Studio in Morong Proper.', 'college school id dantes studio morong'],
    ['What is the enrollment process?', 'For freshman or transferee students: 1. Guidance Office. 2. Registrar\'s Office, Window 5. For old students: 1. Registrar\'s Office, Window 4, for advising of subjects. 2. Window 1, 2, or 3 for encoding subjects; old student encoding is in Window 5. 3. Window 6 for assessment of tuition and other fees. 4. Administration Building for SC fee payment. 5. Window 8 for the cashier. 6. Window 7 for the yellow copy. 7. Window 3 for the white copy. 8. Dean\'s Office for the green copy.', 'enrollment process freshman transferee old student registrar guidance window'],
    ['Where can I get my TOR?', 'You can get your TOR at the Registrar, Window 1 or 3.', 'tor transcript registrar window 1 3'],
    ['Where can I get a good moral certificate?', 'You can get a good moral certificate at Guidance, located underground in the Administration Building.', 'good moral certificate guidance administration building'],
    ['Where can I inquire about tuition or graduation fees?', 'You can inquire at the Accounting Department, Window 6.', 'tuition graduation fee accounting window 6'],
    ['Where can I ask about my current balance or tuition fee?', 'You can ask at the Cashier, Window 8.', 'current balance tuition fee cashier window 8'],
    ['Where can I get a college exam permit?', 'You can get an exam permit at the Accounting Department, Window 6. To claim a permit, your current balance must be reduced first.', 'exam permit college accounting window 6 balance'],
    ['Where can I get a college PE uniform?', 'Your respective professors coordinate college PE uniforms.', 'college pe uniform professor'],
    ['Where can I locate the nearest parking?', 'Parking is available along the gates, in front of the Administration Building, at CHARM parking, Criminology parking, and along the Education Building through the SHS Building.', 'parking nearest gate administration charm criminology education shs'],
    ['Where can I get a vehicle sticker pass?', 'Get the vehicle sticker pass at Window 10. Pay the sticker fee first at Window 8, the Cashier.', 'vehicle sticker pass window 10 cashier window 8'],
    ['Where is the canteen located?', 'The canteen is near the TCC Gymnasium.', 'canteen location gymnasium'],
    ['Where is the Office of Student Affairs located?', 'The Office of Student Affairs is near the TCC Gymnasium.', 'office student affairs osa location gymnasium'],
    ['Where can I get Form 137?', 'You can get Form 137 at the Registrar, Window 1 or 3.', 'form 137 registrar window'],
    ['Where can I get Form 138?', 'You can get Form 138 from your professors or advisers.', 'form 138 professor adviser'],
  ],
  maintenance: [
    ['Who is the point person for maintenance?', 'The point person for Maintenance is Mr. Jerry San Luis.', 'maintenance point person contact jerry san luis'],
    ['Where is the maintenance department located?', 'The Maintenance Department is near the SHS Building.', 'maintenance department location shs building'],
  ],
  clinic: [
    ['Who is the point person for the clinic?', 'The clinic point person is Marivic B. Rayo, RN, MAN.', 'clinic point person marivic rayo nurse'],
    ['Where is the clinic located?', 'The clinic is behind the CBA Building.', 'clinic location cba building'],
  ],
  guidance: [
    ['Who is the point person of Guidance?', 'The point person of Guidance is Louie ES. Dematera.', 'guidance point person louie dematera'],
  ],
  library: [
    ['Who is the point person of the Library?', 'The point person of the Library is Julieta SJ. Belandres.', 'library point person julieta belandres'],
  ],
  basic: [
    ['Who is the principal of Basic Education?', 'The principal of Basic Education is Mr. Dindo Punzalan.', 'basic education principal dindo punzalan'],
    ['Where can I get a Basic Education uniform or PE uniform?', 'Basic Education uniforms and PE uniforms are available at the Principal\'s Office.', 'basic education uniform pe uniform principal office'],
    ['Where can I get Basic Education books?', 'Basic Education books can be claimed through the school.', 'basic education books claim'],
    ['Where can I get my Basic Education school ID?', 'Basic Education IDs are taken by section according to the school\'s schedule.', 'basic education school id section schedule'],
    ['Where is the Basic Education Department located?', 'The Basic Education Department is in the SHS, JHS, and Elementary Buildings.', 'basic education department location shs jhs elementary'],
    ['Where can I get the Basic Education class schedule?', 'Basic Education class schedules are given by the respective advisers.', 'basic education class schedule adviser'],
    ['Where is the Basic Education principal\'s office located?', 'The Principal\'s Office is alongside the CS Building, on the farthest right.', 'principal office basic education cs building'],
  ],
  cs: [
    ['Who is the dean, secretary, or point person of the CS Department?', 'Dr. Myra Santos is the Dean, and Mark Catameo is the secretary and point person.', 'cs bscs dean secretary point person myra santos mark catameo'],
    ['Where can I get the modules or books in the CS Department?', 'CS modules can be obtained from Sec. Mark Catameo.', 'cs bscs modules books mark catameo'],
    ['Where can I get CS uniforms?', 'CS uniforms can be obtained from Sec. Mark Catameo.', 'cs bscs uniform mark catameo'],
    ['Where can I get the CS class schedule?', 'CS class schedules are often given in the group chat or posted publicly on the BSCS page.', 'cs bscs class schedule group chat page'],
    ['Where is the CS Department building?', 'The CS/IT Department Building is alongside the AVR Building or in front of the TCC Gymnasium.', 'cs it department building avr gymnasium'],
  ],
  crim: [
    ['Who is the dean, secretary, or point person of the CRIM Department?', 'Dr. Ma. Charisse B. Vedana is the dean, and Ms. Ma. Jane B. Gonzaga is the secretary and point person.', 'crim bscrim dean secretary point person'],
    ['Where can I get the modules or books in the CRIM Department?', 'CRIM modules and books can be obtained from Ms. Ma. Jane B. Gonzaga.', 'crim bscrim modules books'],
    ['Where can I get CRIM uniforms?', 'CRIM uniforms can be obtained from Ms. Ma. Jane B. Gonzaga.', 'crim bscrim uniform'],
    ['Where can I get the CRIM class schedule?', 'The CRIM class schedule can be obtained from Ms. Ma. Jane B. Gonzaga.', 'crim bscrim class schedule'],
    ['Where is the CRIM Department building?', 'The CRIM Department Building is after passing through the TCC Gymnasium and CHARM Building.', 'crim department building gymnasium charm'],
  ],
  hm: [
    ['Who is the dean, secretary, or point person of the HM Department?', 'Dean Rachel Ann Dumlao is the dean, and Maam Melanie Valencia is the secretary and point person.', 'hm bshm dean secretary point person'],
    ['Where can I get the modules or books in the HM Department?', 'HM modules and books can be obtained from the respective professors.', 'hm bshm modules books professor'],
    ['Where can I get HM uniforms?', 'HM uniforms can be obtained at the front desk of the CHARM Building.', 'hm bshm uniform charm front desk'],
    ['Where can I get the HM class schedule?', 'The HM class schedule is available at the front desk.', 'hm bshm class schedule front desk'],
    ['Where is the HM Department building?', 'The HM Department Building is near the TCC Gymnasium.', 'hm department building gymnasium'],
  ],
  pt: [
    ['Who is the dean, secretary, or point person of the PT Department?', 'Dean Everly Ann L. Mata is the dean and point person of PT.', 'bspt pt dean secretary point person everly mata'],
    ['Where can I get the modules or books in the PT Department?', 'Books are not available in the PT Department.', 'bspt pt modules books'],
    ['Where can I get PT uniforms?', 'Uniforms are not available in the PT Department.', 'bspt pt uniform'],
    ['Where can I get the PT class schedule?', 'PT class schedules are given by Ms. Everly Ann Mata.', 'bspt pt class schedule'],
    ['Where is the PT Department building?', 'The PT Department Building is between the CBA Building and SHS Building.', 'pt bspt department building cba shs'],
  ],
  education: [
    ['Who is the dean, secretary, or point person of the Education Department?', 'Dr. Ruel G. Manalo is the dean, Prof. Rency Caraan is the BEEd Coordinator, and Lexter Villaran is the secretary. All three are point persons.', 'education educ dean secretary point person ruel manalo rency caraan lexter villaran'],
    ['Where can I get the modules or books in the Education Department?', 'Professors provide the books when available.', 'education educ modules books professor'],
    ['Where can I get Education uniforms?', 'Uniforms are processed by students. Students can buy the logo and program patches from the department, while the rest is handled by the students.', 'education educ bsed beed uniform logo program patch'],
    ['Where can I get the Education class schedule?', 'Education class schedules are given after enrollment and posted on the bulletin board in the dean\'s office.', 'education educ class schedule enrollment bulletin board dean office'],
    ['Where is the Education Department building?', 'The Education Department Building is in front of the hallways.', 'education educ department building hallway'],
  ],
};

async function findDepartment(names, allDepartments) {
  return names.map((name) => allDepartments.find((department) => department.name.toLowerCase() === name.toLowerCase())).find(Boolean);
}

async function seed() {
  const transaction = await sequelize.transaction();
  try {
    const departments = await Department.findAll({ transaction });
    const fallback = departments[0];
    const existing = await Faq.findAll({ attributes: ['question'], transaction });
    const existingQuestions = new Set(existing.map((faq) => faq.question.toLowerCase()));
    const rows = [];

    for (const [key, entries] of Object.entries(faqData)) {
      const department = await findDepartment(departmentAliases[key], departments) || fallback;
      if (!department) throw new Error('No departments exist. Run the server database sync first.');
      for (const [question, answer, keywords] of entries) {
        if (!existingQuestions.has(question.toLowerCase())) {
          rows.push({ department_id: department.id, question, answer, keywords });
          existingQuestions.add(question.toLowerCase());
        }
      }
    }

    if (rows.length) await Faq.bulkCreate(rows, { transaction });
    await transaction.commit();
    console.log(`Added ${rows.length} FAQ entries.`);
  } catch (error) {
    await transaction.rollback();
    console.error('FAQ seed failed:', error.message);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
}

seed();
