const { Faq, Service, Department, User, ChatLog, Ticket, TicketUpdate, Notification } = require('../models');
const { notifyUser, notifyAdmins, notifyDepartmentAdmins, notifyDepartmentStaff } = require('../utils/socket');
const { addTicketNumber } = require('../utils/ticketNumber');
const { inferDepartment } = require('../utils/departmentRouting');
const { isSchoolRelatedQuestion, OUT_OF_SCOPE_RESPONSE } = require('../utils/schoolQuestionScope');
const normalizeFaqQuery = require('../utils/normalizeFaqQuery');
const isTorRequest = require('../utils/isTorRequest');
const isClassScheduleRequest = require('../utils/isClassScheduleRequest');
const isRegistrarDocumentRequest = require('../utils/isRegistrarDocumentRequest');
const isStudentIdRequest = require('../utils/isStudentIdRequest');
const { getClassScheduleFollowupQuery, getDepartmentScheduleAnswer, SCHEDULE_PROMPT } = require('../utils/classScheduleFollowup');
const normalizeStudentQuery = require('../utils/normalizeStudentQuery');
const {
  getDepartmentIntent,
  shouldUseGenericDepartmentHelp,
  departmentMatchesIntent,
  findDepartmentForIntent,
} = require('../utils/departmentIntent');
const { isDepartmentLocationRequest, findDepartmentByName, getDepartmentLocationAnswer } = require('../utils/departmentLocation');
const ASSISTANT_SYSTEM_INSTRUCTION = require('../utils/assistantSystemInstruction');
const { isFilipinoOrTaglish } = require('../utils/responseLanguage');
const { getOfficeFactRequest, findOfficeFactFaq } = require('../utils/officeLocationFaqs');

const normalize = normalizeStudentQuery;

const tokenize = (text) => normalize(text).split(' ').filter(Boolean);

const scoreText = (query, target) => {
  const qTokens = new Set(tokenize(query));
  const tTokens = tokenize(target);
  let score = 0;
  tTokens.forEach((token) => {
    if (qTokens.has(token)) score += 2;
  });
  return score;
};

const scoreFaq = (query, faq, departmentIntent) => {
  const normalizedQuery = normalizeFaqQuery(query);
  const normalizedQuestion = normalizeFaqQuery(faq.question);
  if (normalizedQuery === normalizedQuestion) return 1000;
  const genericWords = new Set(['a', 'an', 'and', 'are', 'can', 'do', 'does', 'for', 'get', 'how', 'i', 'in', 'is', 'it', 'me', 'my', 'of', 'or', 'the', 'to', 'was', 'what', 'when', 'where', 'which', 'who', 'you', 'your']);
  const specificQuery = tokenize(normalizedQuery).filter((token) => !genericWords.has(token)).join(' ');
  const specificQuestion = tokenize(normalizedQuestion).filter((token) => !genericWords.has(token)).join(' ');
  const questionScore = scoreText(specificQuery, specificQuestion);
  const keywordScore = scoreText(normalizedQuery, faq.keywords || '');
  const specificQuestionScore = tokenize(normalizedQuestion).filter((token) => !genericWords.has(token)).reduce((score, token) => (
    normalizedQuery.includes(token) ? score + 3 : score
  ), 0);
  const departmentScore = departmentIntent
    ? (departmentMatchesIntent(faq.Department, departmentIntent) ? 100 : -100)
    : 0;
  return questionScore * 4 + keywordScore + specificQuestionScore + departmentScore;
};

const rankKnowledgeMatches = (query, faqs, services, searchTerms = '') => {
  const retrievalQuery = [query, searchTerms].filter(Boolean).join(' ');
  const departmentIntent = getDepartmentIntent(query);
  const scoredFaqs = faqs.map((faq) => ({
    item: faq,
    score: scoreFaq(retrievalQuery, faq, departmentIntent),
    sourceType: 'faq',
  }));
  const scoredServices = services.map((service) => ({
    item: service,
    score: scoreText(retrievalQuery, `${service.name} ${service.requirements || ''} ${service.processing_time || ''}`)
      + (departmentIntent
        ? (departmentMatchesIntent(service.Department, departmentIntent) ? 100 : -100)
        : 0),
    sourceType: 'service',
  }));
  return [...scoredFaqs, ...scoredServices].sort((first, second) => second.score - first.score);
};

const splitCompoundQuestion = (query) => String(query || '')
  .split(/\s+(?:and|also)\s+(?=(?:how|where|what|who|when|can|do|is|are|does|should|could|will|which)\b)/i)
  .map((part) => part.replace(/^[\s,;]+|[\s,;]+$/g, '').trim())
  .filter(Boolean);

const getLocalConversationResponse = (query) => {
  const normalizedQuery = normalize(query);
  const now = new Date();
  const greetingPattern = /(?:^|\s)(hi|hii|hey|hello|good morning|good afternoon|good evening)(?:\s|$)/;

  if (/\b(?:i feel|i am|i m|im|feeling|sobrang|masyado)\b.{0,50}\b(?:distressed|overwhelmed|anxious|anxiety|stressed|stress|sad|depressed|panic|takot|nahihirapan|pagod)\b/.test(normalizedQuery)) {
    return 'I’m sorry you’re going through this. Please reach out to the TCC Guidance Office or someone you trust. If you may be in immediate danger, contact local emergency services or a trusted adult now.';
  }

  if (/\b(who are you|what are y[o]{1,3}u|what is your name|what should i call you|tell me about yourself|what do you do|what is your role|are you (?:an? )?(?:ai|bot|human|assistant))\b/.test(normalizedQuery)) {
    return 'I am AssistDesk, your campus support assistant. How can I help you today?';
  }

  if (greetingPattern.test(normalizedQuery)) {
    return 'Hello! I am AssistDesk, your campus support assistant. How can I help you today?';
  }

  if (/\b(thank you|thanks|thx)\b/.test(normalizedQuery)) {
    return 'You are welcome! I am here whenever you need help.';
  }
  if (/\b(help|what can you do|how can you help|assist me)\b/.test(normalizedQuery)) {
    return 'I can answer basic campus questions, help you find departments and services, explain school processes, submit a request, and check your ticket status.';
  }
  if (/\b(what is assistdesk|what is this|what is this app|what is this for)\b/.test(normalizedQuery)) {
    return 'AssistDesk is the campus support portal for finding information, contacting the right department, submitting requests, and tracking ticket progress.';
  }
  if (/\b(submit|create|file|make)\b.*\b(request|ticket|complaint|concern|report)\b/.test(normalizedQuery)) {
    return 'To submit a request, open Tickets, choose a department and issue, describe the concern, then select Create ticket. You can also say “submit request:” followed by your concern.';
  }
  if (/\b(ticket|request)\b.*\b(status|track|progress|follow up)\b|\b(status|track|progress)\b.*\b(ticket|request)\b/.test(normalizedQuery)) {
    return 'To check your request, say “status of my tickets” or provide a ticket number. I can show the current status and request details.';
  }
  if (/\b(department|office|service|help desk)\b.*\b(find|locate|where|contact)\b|\b(find|locate|where|contact)\b.*\b(department|office|service|help desk)\b/.test(normalizedQuery)) {
    return 'Tell me the department or service you need, such as Registrar, Accounting, Guidance, Clinic, Library, Maintenance, or Student Affairs, and I will provide the available details.';
  }
  if (/\b(hello|hi)\b.*\b(how are you|how is it going)\b|\bhow are you\b/.test(normalizedQuery)) {
    return 'I am ready to help with campus information and support requests. What would you like to know?';
  }
  if (/\b(what time|current time|time is it)\b/.test(normalizedQuery)) {
    return `The current time is ${now.toLocaleTimeString()}.`;
  }
  if (/\b(what day|today|date is it|what date)\b/.test(normalizedQuery)) {
    return `Today is ${now.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.`;
  }
  return null;
};

const schoolKnowledgeBase = [
  ['Where is the Registrar Office?', 'The Registrar Office is located in the Administration Building, usually near the main campus windows.'],
  ['How can I get my grades?', 'You may ask your adviser or check through the registrar or school portal, depending on the current school procedure.'],
  ['Where do I pay my school fees?', 'School fees are usually paid through the accounting department and cashier windows, especially Window 6 and Window 8.'],
  ['How do I apply for a scholarship?', 'You may ask the Guidance Office or the school administration for available scholarship programs and requirements.'],
  ['Where can I ask about my schedule or subject load?', 'Ask your adviser or the Registrar Office for your schedule and subject load concerns.'],
  ['Where can I get a certificate of enrollment?', 'You can request it from the Registrar Office, usually at Window 1 or 3.'],
  ['Where can I get a medical certificate?', 'You may secure a medical certificate from the clinic or the school health office.'],
  ['Where do I report a lost item?', 'You may report lost items to the Campus Security Office or the Office of Student Affairs.'],
  ['Where can I get a copy of my academic record?', 'Requests for academic records may be processed through the Registrar Office.'],
  ['Who should I ask if I have academic concerns?', 'You may consult your adviser, dean, or the Guidance Office depending on the concern.'],
  ['How can I request for a student ID replacement?', 'Visit the school office that handles IDs or coordination with the registrar or student affairs office.'],
  ['Where can I inquire about school announcements?', 'Check bulletin boards, school social media pages, or ask the Office of Student Affairs.'],
  ['Where can I ask for counseling or personal concerns?', 'Go to the Guidance Office for counseling and student support concerns.'],
  ['Where can I locate the nearest parking?', 'Parking can be located along the gates, in front of Administration building, CHARM parking, Criminology parking, and along the Education building until the SHS building.'],
  ['Where can I get a vehicle sticker pass?', 'In Window 10. First, you must pay for the sticker fee in Window 8 (cashier).'],
  ['Where is the canteen located?', 'Near TCC Gymnasium.'],
  ['Where is the Office of Student Affairs located?', 'Near TCC Gymnasium.'],
  ['Where can I get Form 137?', 'You can get these in registrar, either Window 1 or 3.'],
  ['Where can I get Form 138?', 'From professors or advisers.'],
  ['Who is the president of TCC?', 'The president of Tomas Claudio Colleges is Pres. Edmund C. Francisco.'],
  ['Who is the secretary of TCC?', 'The secretary of Tomas Claudio Colleges is Ms. Reylyn R. Geron.'],
  ['Where can I get a college school ID?', 'You can get a college school ID at Dante\'s Photo Image in Morong Proper.'],
  ['What is the enrollment process?', 'For freshmen and transferees: 1. Guidance Office. 2. Registrar\'s Office, Window 5. For old students: 1. Registrar\'s Office, Window 4, then the Dean\'s Office for advising. 2. Window 1, 2, or 3 for subject encoding; old-student encoding may be handled at Window 5. 3. Window 6 for tuition and other-fee assessment. 4. Administration Building for SC fee payment. 5. Window 8 for cashier payment. 6. Window 7 for the yellow copy. 7. Window 3 for the white copy. 8. Dean\'s Office for the green copy.'],
  ['Where can I get good moral?', 'You can get a Certificate of Good Moral Character at Guidance, located in the underground of the Administration Building.'],
  ['Where can I inquire about tuition or graduation fees?', 'Inquire at the Accounting Department, Window 6.'],
  ['Where can I ask about my current balance or tuition fee?', 'Ask at the Cashier, Window 8.'],
  ['Where can I get a college exam permit?', 'Get it from the Accounting Department, Window 6. Your current balance must be reduced first before claiming the permit.'],
  ['Where can I get a college PE uniform?', 'The respective professors coordinate the distribution or purchase of PE uniforms.'],
  ['Who is the point person for Maintenance?', 'The Maintenance point person is Mr. Jerry San Luis.'],
  ['Where is the Maintenance Department located?', 'The Maintenance Department is near the SHS Building.'],
  ['Who is the point person for the clinic?', 'The clinic point person is Marivic B. Rayo, RN, MAN.'],
  ['Where is the clinic located?', 'The clinic is behind the CBA Building.'],
  ['Who is the point person of Guidance?', 'The Guidance point person is Louie ES. Dematera.'],
  ['Who is the point person of the Library?', 'The Library point person is Julieta SJ. Belandres.'],
  ['Who is the dean, secretary, or point person of the Nursing Department?', 'The dean of the Nursing Department is Dean Perlita Santiago. The secretary and point person were not provided in the current school information.'],
  ['Where can I get the modules or books in the Nursing Department?', 'You can get Nursing modules at the Library or avail of Nursing books at the Dean\'s Office. In some cases, professors provide books and e-books.'],
  ['Where can I get Nursing uniforms?', 'Nursing uniforms are available at the Nightingales Office beside the Anatomy Room.'],
  ['Where can I get the class schedule in the Nursing Department?', 'Wait for the class schedule or check the bulletin board in front of the Dean\'s Office.'],
  ['Where is the Nursing Department building?', 'The Nursing Department building is near the Administration Building on the right side. Nursing department faculty can be found on the third floor of the Administration Building.'],
  ['Who is the dean, secretary, or point person of the CBA Department?', 'Dean Lalaine Toriado is the dean, and Ms. Rosenel Magday is the secretary and point person.'],
  ['Where can I get the modules in the CBA Department?', 'You can get the modules from the CBA Faculty.'],
  ['Where can I get BSA or BSBA uniforms?', 'You can get BSA or BSBA uniforms from the CBA Faculty.'],
  ['Where can I get the CBA class schedule?', 'You can get the CBA class schedule at the corner of the CBA bulletin board.'],
  ['Where is the BSA or BSBA Department building?', 'The CBA Building can be found near the Education Building, on the right side.'],
  ['What is Tomas Claudio Colleges?', 'Tomas Claudio Colleges (TCC) is a pioneering, community-owned educational institution in Taghangin, Morong, Rizal, Philippines. Founded on August 15, 1950, it honors Tomas Claudio, a local native recognized as the first Filipino national hero to die during World War I. TCC is a private institution in eastern Rizal offering programs from basic education through postgraduate studies.'],
  ['What does Tomas Claudio Colleges offer?', 'TCC offers Accountancy, Business Administration, Public Administration, Computer Science, Elementary Education, Secondary Education, Criminology, Hospitality Management, Nursing, Physical Therapy, and TESDA Caregiving courses. Basic Education includes Kindergarten, Elementary, Junior High School, Senior High School, and Special Needs Education. Graduate programs include Master in Business Administration, Master in Public Administration, and Master of Arts in Education. TCC also offers the College of Law Juris Doctor program.'],
  ['What are the admission requirements?', 'For incoming freshmen: Grade 12 Report Card (Form 138), Certificate of Good Moral Character, photocopy of PSA birth certificate, and two 2x2 ID pictures with name tag. For transferees: original Transcript of Records, Honorable Dismissal with Scholastic Record, photocopy of PSA birth certificate, and two 2x2 ID pictures with name tag. For cross-enrollees: Permit to Cross-Enroll, Certificate of Good Moral Character, photocopy of PSA birth certificate, and two 2x2 ID pictures with name tag. For graduate studies: original Transcript of Records, photocopy of birth certificate, marriage contract if married, and two 2x2 ID pictures with name tag.'],
  ['What is the mission and vision of TCC?', 'Vision: Tomas Claudio Colleges is the leading community-based institution of learning imbued with academic excellence, social advancement, and internationalization of education. Mission: TCC is committed to delivering affordable educational services guided by academic excellence, attaining social advancement and quality of life for all sectors of society, and actively participating in the internationalization of education.'],
  ['What is Accountancy?', 'The Bachelor of Science in Accountancy program prepares students for careers in accounting, auditing, taxation, and financial management while developing analytical, problem-solving, and decision-making skills.'],
  ['What is Business Administration?', 'The Bachelor of Science in Business Administration program develops skills for managing people, growing businesses, and making sound financial decisions in a dynamic business environment.'],
  ['What is Computer Science?', 'The Bachelor of Science in Computer Science program develops knowledge in programming, software development, and computing technologies, including system design, application development, and real-world problem solving.'],
  ['What is Education?', 'The Education program, including BSEd and BEEd, prepares effective and compassionate professional educators with the knowledge, skills, and values to teach and inspire the next generation.'],
  ['What is Criminology?', 'The Bachelor of Science in Criminology program prepares students for careers in law enforcement, public safety, and criminal justice, with emphasis on discipline, justice, and community safety.'],
  ['What is Hospitality Management?', 'The Bachelor of Science in Hospitality Management program prepares students for careers in hotels, restaurants, tourism, and events, developing service, management, and guest-relations skills.'],
  ['What is Nursing?', 'The Bachelor of Science in Nursing program prepares competent, compassionate, and globally competitive healthcare professionals with knowledge and clinical skills for quality patient care.'],
  ['What is Physical Therapy?', 'The Bachelor of Science in Physical Therapy program prepares healthcare professionals focused on rehabilitation, recovery, physical function, strength, mobility, and independence.'],
];

const getGeminiResponse = async (query, faqs, services, departments) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || typeof fetch !== 'function') return null;

  const context = [
    ...faqs.map((faq) => `FAQ [${faq.Department?.name || 'General'}] Q: ${faq.question} A: ${faq.answer}`),
    ...services.map((service) => `Service [${service.Department?.name || 'General'}] ${service.name}: ${service.requirements || ''} ${service.processing_time || ''}`),
    ...departments.map((department) => `Department: ${department.name}; location: ${department.location || 'not listed'}; point person: ${department.point_person || 'not listed'}; contact: ${department.contact_number || 'not listed'}; office hours: ${department.office_hours || 'not listed'}`),
    ...schoolKnowledgeBase.map(([question, answer]) => `School fact Q: ${question} A: ${answer}`),
  ].join('\n');

  const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: {
        parts: [{ text: ASSISTANT_SYSTEM_INSTRUCTION }],
      },
      contents: [{ role: 'user', parts: [{ text: `School context:\n${context}\n\nStudent question: ${query}` }] }],
      generationConfig: { temperature: 0.4, maxOutputTokens: 300 },
    }),
  });

  if (!response.ok) throw new Error(`Gemini request failed with status ${response.status}`);
  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.map((part) => part.text).join('').trim() || null;
};

const getLocalizedGroundedResponse = async (query, officialAnswer) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || typeof fetch !== 'function') return null;

  const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: {
        parts: [{ text: `${ASSISTANT_SYSTEM_INSTRUCTION}\n\nFor this task, translate or briefly restate the official answer in the language used by the student. Use only the supplied answer. Preserve names, numbers, dates, and qualifications exactly; do not add facts. Return only the answer text.` }],
      },
      contents: [{ role: 'user', parts: [{ text: `Student question: ${query}\nOfficial answer: ${officialAnswer}` }] }],
      generationConfig: { temperature: 0.1, maxOutputTokens: 300 },
    }),
  });

  if (!response.ok) throw new Error(`Gemini localization failed with status ${response.status}`);
  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.map((part) => part.text).join('').trim() || null;
};

const buildDepartmentLocationResult = (department) => ({
  ai_response: getDepartmentLocationAnswer(department),
  matched_department: department.id,
  department_details: {
    id: department.id,
    name: department.name,
    point_person: department.point_person,
    location: department.location,
    office_hours: department.office_hours,
  },
  service_details: null,
  source: null,
  clarification_required: false,
  escalation_available: false,
});

const buildResponse = async (query, suggestedQuestionKeywords = '') => {
  const officeFactRequest = getOfficeFactRequest(query);
  const isLocationQuery = isDepartmentLocationRequest(query);
  const departments = isLocationQuery ? await Department.findAll() : null;
  const namedLocationDepartment = isLocationQuery ? findDepartmentByName(query, departments) : null;

  if (!isSchoolRelatedQuestion(query) && !namedLocationDepartment && !officeFactRequest) {
    return {
      ai_response: OUT_OF_SCOPE_RESPONSE,
      matched_department: null,
      department_details: null,
      service_details: null,
      source: null,
      clarification_required: false,
      escalation_available: false,
    };
  }

  if (namedLocationDepartment && !officeFactRequest) return buildDepartmentLocationResult(namedLocationDepartment);

  const faqs = await Faq.findAll({ include: [{ model: Department }] });
  const services = await Service.findAll({ include: [{ model: Department }] });
  if (officeFactRequest) {
    const officeFaq = findOfficeFactFaq(query, faqs);
    if (officeFaq) {
      return {
        ai_response: officeFaq.answer,
        matched_department: officeFaq.department_id,
        matched_faq_id: officeFaq.id,
        department_details: null,
        service_details: null,
        source: {
          type: 'FAQ',
          id: officeFaq.id,
          label: officeFaq.question,
          department: officeFaq.Department?.name || officeFactRequest.office.office,
        },
        clarification_required: false,
        escalation_available: false,
      };
    }

    const contactOffice = officeFactRequest.office.contactOffice || officeFactRequest.office.office;
    return {
      ai_response: `I don’t have that information yet. Please contact ${contactOffice} to confirm.`,
      matched_department: null,
      department_details: null,
      service_details: null,
      source: null,
      clarification_required: false,
      escalation_available: false,
    };
  }

  const normalizedQuery = normalize(query);
  const departmentIntent = getDepartmentIntent(query);
  if (isLocationQuery) {
    const locationDepartment = findDepartmentForIntent(departments || await Department.findAll(), departmentIntent);
    if (locationDepartment) return buildDepartmentLocationResult(locationDepartment);
  }
  const normalizedFaqQuestion = normalizeFaqQuery(query);
  const exactFaq = faqs.find((faq) => normalizeFaqQuery(faq.question) === normalizedFaqQuestion);

  if (!exactFaq) {
    const localResponse = getLocalConversationResponse(query);
    if (localResponse && shouldUseGenericDepartmentHelp(query)) {
      return { ai_response: localResponse, matched_department: null, department_details: null, service_details: null };
    }

    if (isStudentIdRequest(query)) {
      const osa = findDepartmentForIntent(await Department.findAll(), 'osa');
      return {
        ai_response: 'If you are a college student, a new student ID is obtained at Dante’s Photo Image Studio in Morong Proper; the initial ID is charged once during enrollment. For a lost ID, have a replacement photo taken there and pay the replacement fee. Basic Education students should ask their adviser, who will announce the section photo schedule and ID release. For your specific case, contact the Office of Student Affairs.',
        matched_department: osa?.id || null,
        department_details: osa ? {
          id: osa.id,
          name: osa.name,
          point_person: osa.point_person,
          location: osa.location,
          office_hours: osa.office_hours,
        } : null,
        service_details: null,
        source: null,
        clarification_required: false,
        escalation_available: false,
      };
    }

    const registrarDocumentType = isRegistrarDocumentRequest(query);
    if (registrarDocumentType) {
      const registrar = findDepartmentForIntent(await Department.findAll(), 'registrar');
      const answer = registrarDocumentType === 'coe'
        ? 'Request your Certificate of Enrollment (COE) from the Registrar. Fill out the request form available outside the Registrar window. The Registrar will verify your enrollment; if you are enrolled, it can be issued even if you have an outstanding balance. If you are not enrolled, settle any remaining balance before claiming it.'
        : 'For a Certificate of Registration (COR), contact or visit the Registrar Office in the Administration Building and ask for the current COR request procedure. The available school information does not specify the COR requirements, so the Registrar can confirm what you need to submit.';
      return {
        ai_response: answer,
        matched_department: registrar?.id || null,
        department_details: registrar ? {
          id: registrar.id,
          name: registrar.name,
          point_person: registrar.point_person,
          location: registrar.location,
          office_hours: registrar.office_hours,
        } : null,
        service_details: null,
        source: null,
        clarification_required: false,
        escalation_available: false,
      };
    }

    if (isClassScheduleRequest(query)) {
      const scheduleAnswer = getDepartmentScheduleAnswer(departmentIntent);
      if (scheduleAnswer) {
        const department = findDepartmentForIntent(await Department.findAll(), departmentIntent);
        return {
          ai_response: scheduleAnswer,
          matched_department: department?.id || null,
          department_details: department ? {
            id: department.id,
            name: department.name,
            point_person: department.point_person,
            location: department.location,
            office_hours: department.office_hours,
          } : null,
          service_details: null,
          source: null,
          clarification_required: false,
          escalation_available: false,
        };
      }
      if (!departmentIntent) {
        return {
          ai_response: SCHEDULE_PROMPT,
          matched_department: null,
          department_details: null,
          service_details: null,
          source: null,
          clarification_required: false,
          escalation_available: false,
        };
      }
    }

    if (isTorRequest(query)) {
      const registrar = findDepartmentForIntent(await Department.findAll(), 'registrar');
      return {
        ai_response: 'Request your Transcript of Records (TOR) from the Registrar Office at Window 1 or 3. Complete the request form at the Registrar window; they will provide a claim slip with the projected release date.',
        matched_department: registrar?.id || null,
        department_details: registrar ? {
          id: registrar.id,
          name: registrar.name,
          point_person: registrar.point_person,
          location: registrar.location,
          office_hours: registrar.office_hours,
        } : null,
        service_details: null,
        source: null,
        clarification_required: false,
        escalation_available: false,
      };
    }
  }

  const rankedMatches = rankKnowledgeMatches(query, faqs, services, suggestedQuestionKeywords);

  const questionParts = splitCompoundQuestion(query);
  if (questionParts.length > 1) {
    const partMatches = questionParts.flatMap((part) => {
      const [bestMatch, secondBestMatch] = rankKnowledgeMatches(part, faqs, services);
      if (!bestMatch || bestMatch.score < 5) return [];
      const matches = [bestMatch];
      if (secondBestMatch && secondBestMatch.score >= 5 && secondBestMatch.score >= bestMatch.score * 0.5) {
        matches.push(secondBestMatch);
      }
      return matches;
    });
    const distinctPartMatches = [...new Map(partMatches.map((match) => [
      `${match.sourceType}:${match.item.id}`,
      match,
    ])).values()];

    if (distinctPartMatches.length > 1) {
      const firstMatch = distinctPartMatches[0];
      const firstDepartment = firstMatch.item.Department || await findDepartmentForIntent(await Department.findAll(), getDepartmentIntent(questionParts[0]));
      const combinedAnswer = distinctPartMatches.map((match) => {
        const label = match.sourceType === 'faq' ? match.item.question : match.item.name;
        const answer = match.sourceType === 'faq'
          ? match.item.answer
          : [match.item.name, match.item.requirements, match.item.processing_time && `Processing time: ${match.item.processing_time}`]
            .filter(Boolean)
            .join('. ');
        return `${label}: ${answer}`;
      }).join('\n\n');
      return {
        ai_response: combinedAnswer,
        matched_department: firstDepartment?.id || null,
        matched_faq_id: firstMatch.sourceType === 'faq' ? firstMatch.item.id : null,
        matched_service_id: firstMatch.sourceType === 'service' ? firstMatch.item.id : null,
        source: {
          type: distinctPartMatches.every((match) => match.sourceType === 'faq') ? 'FAQ' : 'Knowledge base',
          id: firstMatch.item.id,
          label: distinctPartMatches.map((match) => match.sourceType === 'faq' ? match.item.question : match.item.name).join(' + '),
          department: firstDepartment?.name || null,
        },
        clarification_required: false,
        escalation_available: false,
        department_details: firstDepartment ? {
          id: firstDepartment.id,
          name: firstDepartment.name,
          point_person: firstDepartment.point_person,
          location: firstDepartment.location,
          office_hours: firstDepartment.office_hours,
        } : null,
        service_details: firstMatch.sourceType === 'service' ? {
          name: firstMatch.item.name,
          requirements: firstMatch.item.requirements,
          processing_time: firstMatch.item.processing_time,
        } : null,
      };
    }
  }

  const best = rankedMatches[0];
  const secondBest = rankedMatches[1];
  const isAmbiguous = Boolean(best && secondBest && best.score >= 5 && best.score - secondBest.score < 2);
  const isConfidentMatch = Boolean(best && best.score >= 5 && !isAmbiguous);

  if (!isConfidentMatch) {
    if (process.env.GEMINI_API_KEY && typeof fetch === 'function') {
      try {
        const generalStudentHelp = await getGeminiResponse(query, faqs, services, await Department.findAll());
        if (generalStudentHelp) {
          return {
            ai_response: generalStudentHelp,
            matched_department: null,
            department_details: null,
            service_details: null,
            source: { type: 'AI', label: 'Student help' },
            clarification_required: false,
            escalation_available: false,
          };
        }
      } catch (error) {
        console.error(JSON.stringify({ event: 'student_help_generation_failed', error_name: error.name || 'Error' }));
      }
    }

    const clarificationOptions = rankedMatches
      .filter((match) => match.score > 0)
      .slice(0, 3)
      .map((match) => match.sourceType === 'faq' ? match.item.question : match.item.name);
    const clarificationText = isAmbiguous
      ? `I found a couple of close matches. Which one do you mean: ${clarificationOptions.join(' or ')}?`
      : clarificationOptions.length
        ? `I’m not sure I found the right answer. Are you asking about ${clarificationOptions.join(', or ')}?`
        : 'I could not find an approved FAQ or service entry for that question. Please include the department and a little more detail, or submit a support ticket for staff follow-up.';
    return {
      ai_response: clarificationText,
      matched_department: null,
      department_details: null,
      service_details: null,
      source: null,
      clarification_required: true,
      clarification_options: clarificationOptions,
      escalation_available: true,
    };
  }

  const department = best.item.Department || findDepartmentForIntent(await Department.findAll(), departmentIntent);
  const response = best.item.answer || best.item.name || 'I found a likely match in the knowledge base.';
  const source = best.sourceType === 'faq'
    ? { type: 'FAQ', id: best.item.id, label: best.item.question, department: department?.name || null }
    : { type: 'Service', id: best.item.id, label: best.item.name, department: department?.name || null };

  return {
    ai_response: response,
    matched_department: department ? department.id : null,
    matched_faq_id: best.sourceType === 'faq' ? best.item.id : null,
    matched_service_id: best.sourceType === 'service' ? best.item.id : null,
    source,
    clarification_required: false,
    escalation_available: false,
    department_details: department
      ? {
          id: department.id,
          name: department.name,
          point_person: department.point_person,
          location: department.location,
          office_hours: department.office_hours,
        }
      : null,
    service_details: best.item instanceof Service
      ? {
          name: best.item.name,
          requirements: best.item.requirements,
          processing_time: best.item.processing_time,
        }
      : null,
  };
};

const getEstimatedCompletion = (priority) => {
  const hoursByPriority = { urgent: 24, medium: 48, low: 72 };
  const estimated = new Date();
  estimated.setHours(estimated.getHours() + (hoursByPriority[priority] || 48));
  return estimated;
};

const mapPriorityToDatabase = (priority) => {
  // Direct mapping - frontend and database use same priority values
  return priority || 'medium';
};

const getTicketReference = (message) => {
  const codeMatch = String(message || '').match(/\b[A-Za-z]{2,6}-(\d{1,8})\b/);
  if (codeMatch) return Number(codeMatch[1]);

  const numericMatch = String(message || '').match(/(?:ticket|request|case)\s*(?:id|number|no\.?|#)?\s*#?(\d{1,8})\b/i);
  if (numericMatch) return Number(numericMatch[1]);

  const directIdMatch = String(message || '').match(/^\s*#?(\d{1,8})\s*$/);
  return directIdMatch ? Number(directIdMatch[1]) : null;
};

const handleTicketCommand = async (message, userId) => {
  const normalized = normalize(message);

  const ticketCodeMatch = String(message).match(/\b([A-Z]{2,5}-\d{1,6})\b/i);
  if (ticketCodeMatch) {
    const requestedCode = ticketCodeMatch[1].toUpperCase();
    const tickets = await Ticket.findAll({
      where: { user_id: userId },
      include: [{ model: Department }],
      order: [['created_at', 'DESC']],
    });
    const ticket = tickets.find((candidate) => {
      addTicketNumber(candidate);
      return candidate.ticket_code === requestedCode;
    });

    if (!ticket) {
      return {
        ai_response: `I could not find ticket ${requestedCode} in your requests. Please check the ticket ID and try again.`,
        action: 'ticket_not_found',
      };
    }

    const statusLabels = {
      open: 'Submitted',
      pending: 'Pending',
      in_progress: 'In Progress',
      resolved: 'Resolved',
      closed: 'Closed',
    };
    const statusLabel = statusLabels[ticket.status] || ticket.status;

    return {
      ai_response: `Here is a brief summary of ${requestedCode}: ${ticket.subject}. ${ticket.description}. It is currently ${statusLabel}.`,
      ticket,
      ticket_process: Object.entries(statusLabels).map(([key, label]) => ({ key, label })),
      action: 'ticket_details',
    };
  }

  const ticketReference = getTicketReference(message);
  if (ticketReference) {
    const ticket = await Ticket.findOne({
      where: {
        id: ticketReference,
        ...(userId ? { user_id: userId } : {}),
      },
      include: [
        { model: Department },
        { model: TicketUpdate, order: [['created_at', 'ASC']] },
      ],
    });

    if (!ticket) {
      return { ai_response: 'I could not find that ticket in your submitted requests.', action: 'ticket_lookup' };
    }

    addTicketNumber(ticket);
    const statusLabels = {
      open: 'Submitted',
      pending: 'Pending',
      in_progress: 'In Progress',
      resolved: 'Resolved',
      closed: 'Closed',
    };
    const statusLabel = statusLabels[ticket.status] || ticket.status;

    return {
      ai_response: `${ticket.ticket_code} is currently ${statusLabel}.`,
      ticket,
      ticket_process: Object.entries(statusLabels).map(([key, label]) => ({ key, label })),
      action: 'ticket_lookup',
    };
  }

  if (normalized.startsWith('status') || normalized.includes('my tickets') || normalized.includes('track my')) {
    const tickets = await Ticket.findAll({ where: { user_id: userId }, include: [{ model: Department }], order: [['created_at', 'DESC']], limit: 10 });
    tickets.forEach((ticket) => addTicketNumber(ticket));
    return {
      ai_response: tickets.length ? `You have ${tickets.length} recent request${tickets.length === 1 ? '' : 's'}.` : 'You have no submitted requests yet.',
      tickets,
      action: 'status',
    };
  }

  const submitMatch = message.match(/^(?:submit|create|report)\s+(?:a\s+)?(?:request|ticket|incident)\s*:?\s*(.*)$/i);
  if (!submitMatch) return null;

  const description = submitMatch[1].trim();
  if (!description) return { ai_response: 'Please include a short description after “submit request”.', action: 'submit_help' };
  const routing = await inferDepartment(description, description, 'Other');
  if (!routing.accepted) {
    const suggestions = routing.candidates.map((candidate) => candidate.name).join(', ');
    return {
      ai_response: `I could not confidently choose a department, so I have not created a ticket. Open Tickets, select the correct department, and submit your concern${suggestions ? `. Possible departments: ${suggestions}` : ''}.`,
      action: 'routing_clarification',
      clarification_required: true,
      clarification_options: [],
      escalation_available: true,
    };
  }
  const departmentId = routing.department_id;
  const department = await Department.findByPk(departmentId);
  const ticket = await Ticket.create({
    user_id: userId,
    department_id: departmentId,
    subject: description.slice(0, 200),
    description,
    category: 'Other',
    priority: mapPriorityToDatabase('medium'),
    status: 'open',
    estimated_completion_at: getEstimatedCompletion('medium'),
    suggested_department_id: routing.suggested_department_id,
    routing_method: 'automatic',
    routing_confidence: routing.confidence,
  });
  ticket.Department = department;
  addTicketNumber(ticket);
  await TicketUpdate.create({
    ticket_id: ticket.id,
    message: `Ticket created through the assistant and automatically routed to ${department?.name || 'the suggested department'} with routing score ${routing.score}.`,
    updated_by: userId,
    action: 'ticket_created',
    department_id: departmentId,
  });
  await Notification.create({ user_id: userId, message: `Your ticket "${ticket.subject}" has been created.` });
  const departmentStaff = await User.findAll({ where: { role: 'staff', department_id: departmentId, account_status: 'active' } });
  if (departmentStaff.length > 0) {
    await Notification.bulkCreate(departmentStaff.map((staffMember) => ({
      user_id: staffMember.id,
      message: `New ticket in your department: "${ticket.subject}".`,
    })));
  }
  notifyUser(userId, 'ticketCreated', { ticket });
  notifyAdmins('ticketCreated', { ticket });
  if (departmentId) notifyDepartmentAdmins(departmentId, 'ticketCreated', { ticket });
  if (departmentId) notifyDepartmentStaff(departmentId, 'ticketCreated', { ticket });
  return {
    ai_response: `Your request was submitted${department ? ` to ${department.name}` : ''}. Ticket ID: ${ticket.ticket_code}.`,
    ticket,
    action: 'created',
  };
};

exports.askAssistant = async (req, res) => {
  try {
    const { message, assistant_name: requestedAssistantName } = req.body || {};
    if (typeof message !== 'string' || !message.trim() || message.length > 2000) {
      return res.status(400).json({ message: 'Message must be a non-empty string of at most 2000 characters.' });
    }

    const rawSuggestedKeywords = req.body?.suggested_question_keywords;
    const suggestedQuestionKeywords = (Array.isArray(rawSuggestedKeywords)
      ? rawSuggestedKeywords.filter((keyword) => typeof keyword === 'string').slice(0, 24).join(' ')
      : typeof rawSuggestedKeywords === 'string' ? rawSuggestedKeywords : '')
      .trim()
      .split(/\s+/)
      .slice(0, 80)
      .join(' ')
      .slice(0, 500);
    const conversationContext = Array.isArray(req.body?.conversation_context)
      ? req.body.conversation_context
        .filter((entry) => entry && ['user', 'assistant'].includes(entry.role) && typeof entry.text === 'string')
        .slice(-4)
      : [];
    const previousAssistantMessage = [...conversationContext].reverse()
      .find((entry) => entry.role === 'assistant')?.text;
    const scheduleFollowupQuery = getClassScheduleFollowupQuery(message, previousAssistantMessage);
    const commandResult = await handleTicketCommand(message, req.user.id);
    const result = commandResult || await buildResponse(scheduleFollowupQuery || message, suggestedQuestionKeywords);
    if (!commandResult && isFilipinoOrTaglish(message)) {
      try {
        const localizedResponse = await getLocalizedGroundedResponse(message, result.ai_response);
        if (localizedResponse) result.ai_response = localizedResponse;
      } catch (error) {
        console.error(JSON.stringify({ event: 'student_help_localization_failed', error_name: error.name || 'Error' }));
      }
    }

    const assistantName = ['Alex', 'Maya'].includes(requestedAssistantName) ? requestedAssistantName : 'Assistant';
    result.ai_response = result.ai_response
      .replace('I am AssistDesk, your campus support assistant', `I am ${assistantName}, your AssistDesk campus support assistant`)
      .replace('Hello! I am AssistDesk, your campus support assistant', `Hello! I am ${assistantName}, your AssistDesk campus support assistant`);
    const chatLog = await ChatLog.create({
      user_id: req.user.id,
      message,
      ai_response: result.ai_response,
      matched_department_id: result.matched_department,
      matched_faq_id: result.matched_faq_id || null,
      matched_service_id: result.matched_service_id || null,
    });

    return res.json({
      message: 'Assistant response generated.',
      chatLog,
      ...result,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Unable to process assistant request.' });
  }
};
