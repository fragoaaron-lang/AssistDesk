require('dotenv').config();

const DEPARTMENT_SEED_DATA = [
  { name: 'Basic Education Department', description: 'Basic Education Department support department.', office_hours: '6:30 AM to 2:30 PM', map_x: 75, map_y: 30 },
  { name: 'College of Nursing', description: 'College of Nursing support department.', map_x: 62, map_y: 65 },
  { name: 'CS', description: 'CS support department.', map_x: 54.5, map_y: 31 },
  { name: 'CBA', description: 'CBA support department.', map_x: 54, map_y: 43 },
  { name: 'CHARM', description: 'CHARM support department.', map_x: 25, map_y: 9 },
  { name: 'College of Criminology', description: 'College of Criminology support department.', map_x: 67, map_y: 12 },
  { name: 'College of Physical Therapy', description: 'College of Physical Therapy support department.', map_x: 68, map_y: 44 },
  { name: 'Maintenance Department', description: 'Maintenance Department support department.', map_x: 85.5, map_y: 54 },
  { name: 'Accounting Department', description: 'Accounting Department support department.', location: 'Administration Building (J.B. Angeles Building)', map_x: 43, map_y: 65.5 },
  { name: 'Library', description: 'Library support department.', location: 'Administration Building (J.B. Angeles Building)', map_x: 47, map_y: 65.5 },
  { name: 'Guidance', description: 'Guidance support department.', location: 'Administration Building (J.B. Angeles Building)', map_x: 47, map_y: 61.5 },
  { name: 'Office of Student Affairs', description: 'Office of Student Affairs support department.', map_x: 15, map_y: 32 },
  { name: 'Clinic', description: 'Clinic support department.', map_x: 54, map_y: 37 },
  { name: 'IT department', description: 'IT department support department.', office_hours: 'Monday-Friday 8:00 AM to 5:00 PM; closed Saturday', map_x: 39, map_y: 32 },
  { name: 'CS Department', description: 'Supports computer science academic and student service needs.', point_person: 'Mr. Adrian Cruz', contact_number: '02-1234-5681', location: 'Computer Science Building, Room 210', office_hours: '8:00 AM - 5:00 PM', map_x: 54.5, map_y: 31 },
  { name: 'Education Department', description: 'Handles education-related concerns and academic coordination.', point_person: 'Ms. Liza Santos', contact_number: '02-1234-5682', location: 'Education Building, Room 115', office_hours: '8:00 AM - 5:00 PM', map_x: 35, map_y: 42 },
  { name: 'HM Department', description: 'Supports hospitality management requests and student concerns.', point_person: 'Mr. Ben Alvarez', contact_number: '02-1234-5683', location: 'Hospitality Building, Room 410', office_hours: '9:00 AM - 4:00 PM', map_x: 25, map_y: 9 },
  { name: 'Crim Department', description: 'Handles criminal justice-related requests and coordination.', point_person: 'Prof. Rose Dela Cruz', contact_number: '02-1234-5684', location: 'Criminal Justice Building, Room 305', office_hours: '8:00 AM - 5:00 PM', map_x: 67, map_y: 12 },
  { name: 'Nursing Department', description: 'Provides nursing department support and clinical coordination.', point_person: 'Ms. Grace Ramos', contact_number: '02-1234-5685', location: 'Nursing Building, Room 120', office_hours: '8:00 AM - 5:00 PM', map_x: 62, map_y: 65 },
  { name: 'Accounting', description: 'Handles payment, billing, and account assistance.', point_person: 'Ms. Joy Lim', contact_number: '02-1234-5686', location: 'Administration Building (J.B. Angeles Building)', office_hours: '8:00 AM - 5:00 PM', map_x: 43, map_y: 65.5 },
  { name: 'Maintenance', description: 'Handles facilities, repairs, and campus infrastructure concerns.', point_person: 'Mr. Joel Rivera', contact_number: '02-1234-5687', location: 'Maintenance Office, Room 007', office_hours: '7:00 AM - 6:00 PM', map_x: 85.5, map_y: 54 },
  { name: 'Student Affairs', description: 'Supports student welfare, guidance, and campus activities.', point_person: 'Mr. Rafael Santos', contact_number: '02-1234-5679', location: 'Student Center, Room 205', office_hours: '9:00 AM - 4:00 PM', map_x: 15, map_y: 32 },
  { name: 'Registrar Department', description: 'Handles student records, enrollment, and official document requests.', location: 'Administration Building (J.B. Angeles Building)', map_x: 43, map_y: 61.5 },
  { name: 'Office of the Student Affairs', description: 'Provides student orientation, student activities, canteen management, student security, and student affairs support.', location: 'Near TCC Gymnasium', office_hours: 'Monday-Friday 8:00 AM-5:00 PM; head usually available 6:00 AM-9:00 PM; lunch 12:00-1:00 PM', map_x: 15, map_y: 32 },
  { name: 'Registrar Office', description: 'Handles student records, transcripts, enrollment certificates, grades, and other official school documents.', location: 'Administration Building (J.B. Angeles Building)', office_hours: 'Weekdays 8AM-5PM; Grad/Doctorate Sat 8AM-noon', map_x: 43, map_y: 61.5 },
];

async function seedDepartments({ Department, transaction } = {}) {
  if (!Department) throw new Error('Department model is required.');
  let created = 0;
  let updated = 0;

  for (const seed of DEPARTMENT_SEED_DATA) {
    const department = await Department.findOne({ where: { name: seed.name }, transaction });
    if (!department) {
      await Department.create(seed, { transaction });
      created += 1;
      continue;
    }

    // Only overwrite fields supplied with actual values; leave existing values intact
    // where the source export was blank.
    const values = Object.fromEntries(Object.entries(seed).filter(([key, value]) => (
      key !== 'name' && value !== null && value !== undefined && value !== ''
    )));
    if (Object.keys(values).length) {
      await department.update(values, { transaction });
      updated += 1;
    }
  }

  return { created, updated, total: DEPARTMENT_SEED_DATA.length };
}

async function run() {
  const { sequelize, Department } = require('./models');
  let transaction;
  try {
    await sequelize.authenticate();
    transaction = await sequelize.transaction();
    const result = await seedDepartments({ Department, transaction });
    await transaction.commit();
    console.log(`Department seed complete: ${result.created} created, ${result.updated} updated, ${result.total} source rows processed. Existing IDs and blank source fields were preserved.`);
  } catch (error) {
    if (transaction && !transaction.finished) await transaction.rollback();
    console.error('Department seed failed:', error.message);
    process.exitCode = 1;
  } finally {
    const { sequelize } = require('./models');
    await sequelize.close();
  }
}

if (require.main === module) run();

module.exports = { DEPARTMENT_SEED_DATA, seedDepartments };
