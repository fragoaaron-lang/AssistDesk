const normalizeStudentQuery = require('./normalizeStudentQuery');
const normalizeFaqQuery = require('./normalizeFaqQuery');

const officeFacts = [
  {
    office: 'Clinic',
    departmentAliases: ['clinic', 'school clinic', 'health office'],
    departmentUpdates: { location: 'Behind the CBA Building', office_hours: 'Mon-Fri 6:30AM-5PM; Sat 8AM-2PM' },
    faqs: [
      {
        type: 'location',
        question: 'Where is the clinic?',
        answer: 'The Clinic is located behind the CBA Building.',
        keywords: "clinic location where is clinic where's the clinic clinic address nasaan ang clinic saan clinic where to go if sick",
      },
      {
        type: 'hours',
        question: 'What are the clinic hours?',
        answer: 'The Clinic is open Monday to Friday from 6:30 AM to 5:00 PM and Saturday from 8:00 AM to 2:00 PM.',
        keywords: 'clinic hours opening times schedule operating hours anong oras bukas clinic oras clinic',
      },
    ],
  },
  {
    office: 'Library',
    departmentAliases: ['library', 'library office'],
    departmentUpdates: { location: 'Administration Building (J.B. Angeles Building)', office_hours: 'Monday-Friday 8AM-5PM' },
    faqs: [
      {
        type: 'location',
        question: 'Where is the Library?',
        answer: 'The Library is located in the Administration Building (J.B. Angeles Building).',
        keywords: "library location where is library where's the library library address saan ang library nasaan ang library",
      },
      {
        type: 'hours',
        question: 'What are the Library hours?',
        answer: 'The Library is open Monday to Friday from 8:00 AM to 5:00 PM.',
        keywords: 'library hours opening times schedule operating hours anong oras bukas library oras library',
      },
    ],
  },
  {
    office: 'Registrar Office',
    departmentAliases: ['registrar office', 'registrar department', 'registrar', 'records office'],
    departmentUpdates: { location: 'Administration Building (J.B. Angeles Building)', office_hours: 'Weekdays 8AM-5PM; Grad/Doctorate Sat 8AM-noon' },
    faqs: [
      {
        type: 'location',
        question: 'Where is the Registrar Office?',
        answer: 'The Registrar Office is located in the Administration Building (J.B. Angeles Building).',
        keywords: "registrar location where is registrar where's the registrar registrar office address saan ang registrar nasaan ang registrar",
      },
      {
        type: 'hours',
        question: 'What are the Registrar Office hours?',
        answer: 'The Registrar Office is open Monday to Friday from 8:00 AM to 5:00 PM. Graduate and doctorate services are open Saturday from 8:00 AM to 12:00 noon.',
        keywords: 'registrar office hours opening times schedule operating hours anong oras bukas registrar oras registrar',
      },
    ],
  },
  {
    office: 'Cashier',
    departmentAliases: ['cashier', 'cashier office', 'accounting', 'accounting department', 'accounting office'],
    departmentUpdates: { location: 'Administration Building (J.B. Angeles Building), Window 8', office_hours: 'Mon-Fri 8AM-5PM' },
    faqs: [
      {
        type: 'location',
        question: 'Where is the Cashier?',
        answer: 'The Cashier is at Window 8 in the Administration Building (J.B. Angeles Building).',
        keywords: "cashier location where is cashier where's the cashier cashier office accounting window 8 address saan ang cashier nasaan ang cashier",
      },
      {
        type: 'hours',
        question: 'What are the Cashier hours?',
        answer: 'The Cashier is open Monday to Friday from 8:00 AM to 5:00 PM.',
        keywords: 'cashier hours opening times schedule operating hours accounting anong oras bukas cashier oras cashier',
      },
    ],
  },
  {
    office: 'Guidance Office',
    departmentAliases: ['guidance office', 'guidance', 'counseling office', 'counselling office'],
    departmentUpdates: { location: 'Underground level of the Administration Building (J.B. Angeles Building)' },
    faqs: [
      {
        type: 'location',
        question: 'Where is the Guidance Office?',
        answer: 'The Guidance Office is on the underground level of the Administration Building (J.B. Angeles Building).',
        keywords: "guidance office location where is guidance where's the guidance office counseling counselling address saan ang guidance nasaan ang guidance",
      },
      {
        type: 'hours',
        question: 'What are the Guidance Office hours?',
        answer: 'The current verified school information does not specify Guidance Office hours. Please contact or visit the Guidance Office to confirm its schedule.',
        keywords: 'guidance office hours opening times schedule operating hours anong oras bukas guidance oras guidance',
      },
    ],
  },
  {
    office: 'Canteen',
    contactOffice: 'Office of Student Affairs',
    departmentAliases: ['canteen', 'cafeteria'],
    faqDepartmentAliases: ['office of the student affairs', 'office of student affairs', 'student affairs', 'osa'],
    faqs: [
      {
        type: 'location',
        question: 'Where is the canteen?',
        answer: 'The canteen is near the TCC Gymnasium.',
        keywords: "canteen location where is canteen where's the canteen cafeteria address saan ang canteen nasaan ang canteen",
      },
      {
        type: 'hours',
        question: 'What are the canteen hours?',
        answer: 'The current verified school information does not specify canteen hours. Please ask the Office of Student Affairs to confirm the schedule.',
        keywords: 'canteen cafeteria hours opening times schedule operating hours anong oras bukas canteen oras canteen',
      },
    ],
  },
];

const isQuestionAboutLocation = (query) => /\b(?:where|location|located|saan|nasaan)\b/.test(query)
  || /\bwhere to go if sick\b/.test(query);
const isQuestionAboutHours = (query) => /\b(?:hours?|open|opening|operating|schedule|oras|bukas)\b/.test(query);

const getOfficeFactRequest = (value) => {
  const query = normalizeStudentQuery(value);
  const isLocation = isQuestionAboutLocation(query);
  const isHours = isQuestionAboutHours(query);
  if (!isLocation && !isHours) return null;

  const office = officeFacts.find(({ departmentAliases }) => departmentAliases.some((alias) => (
    ` ${query} `.includes(` ${normalizeStudentQuery(alias)} `)
  ))) || (isLocation && /\bwhere to go if sick\b/.test(query) ? officeFacts.find(({ office: name }) => name === 'Clinic') : null);
  if (!office) return null;

  return { office, type: isHours ? 'hours' : 'location' };
};

const officeNameMatches = (departmentName, aliases = []) => {
  const name = normalizeStudentQuery(departmentName);
  return aliases.some((alias) => {
    const normalizedAlias = normalizeStudentQuery(alias);
    return name === normalizedAlias || name.includes(normalizedAlias) || normalizedAlias.includes(name);
  });
};

const findOfficeFactFaq = (value, faqs = []) => {
  const request = getOfficeFactRequest(value);
  if (!request) return null;
  const expected = request.office.faqs.find(({ type }) => type === request.type);
  if (!expected) return null;

  return faqs.find((faq) => normalizeFaqQuery(faq.question) === normalizeFaqQuery(expected.question)
    && officeNameMatches(faq.Department?.name, request.office.faqDepartmentAliases || request.office.departmentAliases)) || null;
};

module.exports = { officeFacts, getOfficeFactRequest, findOfficeFactFaq, officeNameMatches };
