const { sequelize, Department, Faq } = require('./models');

const SOURCE = 'According to the TCC Student Handbook, 2025 Edition excerpt provided.';

const faqGroups = [
  {
    departmentAliases: ['Office of Student Affairs', 'Office of the Student Affairs', 'Student Affairs'],
    entries: [
      {
        question: 'What does the Flexible Learning Option student agreement require?',
        answer: `${SOURCE} the student agreement says TCC owns course content and students should use resources issued or suggested by the College. Students agree to submit requirements honestly through the prescribed learning option, not share, reproduce, or upload learning content without TCC approval, protect their learning-management account password and subject passcodes, and allow the institution to reproduce or publish their thesis royalty-free. The agreement states that, after due process, violations may result in suspension or dismissal. This summarizes the supplied appendix; check the official agreement for exact terms.`,
        keywords: 'Flexible Learning Option student agreement student responsibilities TCC owns course content resources intellectual property academic honesty requirements LMS learning management password passcode share reproduce upload thesis royalty free suspension dismissal due process',
      },
      {
        question: 'What does the Flexible Learning Option teacher agreement require of faculty?',
        answer: `${SOURCE} the teacher agreement says TCC owns course content and faculty should use resources issued or suggested by the College. Faculty agree not to share, reproduce, or upload learning content without TCC approval, to protect their learning-management account passwords, and not to share the passcodes or password IDs used for flexible learning in each subject. The appendix states that, after due process, violations may result in suspension or dismissal. Check the official faculty agreement for exact terms.`,
        keywords: 'Flexible Learning Option teacher faculty agreement responsibilities course content ownership intellectual property resources share reproduce upload approval LMS learning management password passcode subject suspension dismissal due process',
      },
      {
        question: 'What does the student handbook compliance agreement confirm?',
        answer: `${SOURCE} by signing the compliance agreement, a student acknowledges receiving the official TCC Student Handbook, accepts responsibility for reading and following its policies, rules, and regulations, and agrees to respectful and responsible conduct on campus and during school-related activities. The agreement also confirms the student's understanding of academic, attendance, and conduct requirements and that violations may result in disciplinary action, including suspension or non-readmission, after applicable process. The form requests the student's name and signature, course/year/block, address, contact number, parent or guardian name and signature, and date.`,
        keywords: 'student handbook compliance agreement acknowledge receive read understand comply rules regulations policies signature student parent guardian course year block address contact number suspension non-readmission discipline attendance conduct',
      },
      {
        question: 'What is the Tomas Claudio Colleges alma mater hymn?',
        answer: `${SOURCE} the supplied final-page excerpt includes the TCC alma mater hymn beginning “Minamahal na dalubhasaan, Palihan ng talino, Dangal nitong bayan.” The excerpt appears to contain OCR errors and does not reliably capture the full lyrics, so consult the official handbook or College materials for the complete and accurate hymn.`,
        keywords: 'TCC Tomas Claudio Colleges alma mater hymn school song lyrics Minamahal na dalubhasaan Palihan ng talino Dangal nitong bayan official',
      },
      {
        question: 'What TCC contact information is printed in the 2025 handbook?',
        answer: `${SOURCE} the supplied final-page excerpt prints the phone number (02) 8234-5566 and the website https://www.tomasclaudiocolleges.edu.ph, along with a reference to the Tomas Claudio Colleges Facebook page. Confirm current contact details on the College's official website or social-media page because they may change.`,
        keywords: 'TCC contact phone telephone number website official Facebook Tomas Claudio Colleges 02 8234 5566 https tomasclaudiocolleges.edu.ph',
      },
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
      {
        question: 'What is the history of Tomas Claudio Colleges?',
        answer: `${SOURCE} TCC is described as a community-owned, community-based institution in Eastern Rizal, founded on August 15, 1950 in honor of Tomas Claudio, a national hero from Morong who died in the First World War. The College first operated in downtown Morong. The high school moved to the Taghangin campus in 1989, followed by administration and college departments in 1993 and the elementary school in 1995. The excerpt says an Associate in Arts course was initially offered; four-year Education and Commerce courses followed in 1964–1965. Graduate Education began in consortium in 1975, TCC's own MAED was recognized in 1989–1990, MBA and MPA began in 1996–1997, and the College of Law was established in school year 2020–2021.`,
        keywords: 'TCC Tomas Claudio Colleges history founded founded date 1950 August 15 Morong Rizal Eastern Rizal Taghangin campus downtown Morong origins College of Law established timeline',
      },
      {
        question: 'What is the vision and mission of Tomas Claudio Colleges?',
        answer: `${SOURCE} the vision is to be the leading community-based institution of learning imbued with academic excellence, social advancement, and internationalization of education. Its mission is to deliver affordable educational services guided by academic excellence, attain social advancement and quality of life for all sectors of society, and actively participate in internationalization of education.`,
        keywords: 'TCC institutional vision mission community-based academic excellence social advancement internationalization affordable education quality life',
      },
      {
        question: 'What are the core values of Tomas Claudio Colleges?',
        answer: `${SOURCE} the core values are Trustworthiness, Competence, and Commitment (T-C-C).`,
        keywords: 'TCC core values values Trustworthiness Competence Commitment',
      },
      {
        question: 'What institutional objectives are listed in the TCC Student Handbook?',
        answer: `${SOURCE} the institutional objectives are to mold young people into responsible and productive citizens of the nation and global community; harmonize general education and professional knowledge; inculcate the pursuit of truth; and teach the utilization of knowledge to produce globally competitive graduates.`,
        keywords: 'TCC institutional objectives goals responsible productive citizens harmonize instruction general education professional knowledge pursuit of truth utilization knowledge globally competitive graduates',
      },
      {
        question: 'What is the foreword of the TCC Student Handbook about?',
        answer: `${SOURCE} President Edmund C. Francisco welcomes students to TCC and describes the campus as an environment-friendly, evergreen, tree-lined setting for classroom and experiential learning. The foreword says the handbook is a guide to college life, programs, student services, privileges, and responsibilities, but does not contain everything students need to know. It also refers readers to other publications and tcc.edu.ph.`,
        keywords: 'handbook foreword welcome president campus environment friendly evergreen tree lined classroom experiential learning guide programs services privileges responsibilities tcc.edu.ph',
      },
      {
        question: 'Who serves on the TCC Board of Directors according to the handbook?',
        answer: `${SOURCE} the Board of Directors list names Felino SM. Angeles Jr., DBM (Chairman); Antonio R. Mateo, MD, FPCS, DPBS, FPSGS, RCrim (Vice-Chairman); Edmund C. Francisco, Ed.D. (President); Fergie I. Santiago, BSA, CPA (Treasurer); Dalisay F. Soriano, BSBA, CPA (Internal Auditor); Emiliano A. Francisco, MD, MHA, FPCOM; Estela G. Pascual, CPA, DBA; Lylin B. Legaspi, BSN, RN; J. Richard Soriano; and Claire Donnah ES. Fernando (Corporate Secretary). The handbook excerpt may contain OCR or formatting errors; confirm current board information with TCC.`,
        keywords: 'TCC Board Directors chairman vice chairman treasurer internal auditor corporate secretary Felino Angeles Antonio Mateo Edmund Francisco Fergie Santiago Dalisay Soriano Emiliano Estela Lylin Richard Claire board members',
      },
      {
        question: 'Who are the Academic Officials named in the TCC Student Handbook 2025?',
        answer: `${SOURCE} it lists Dr. Edmund C. Francisco (President and MBA Program Coordinator); Dr. Eva R. De Rosas (Chief Academic Officer and Dean of Graduate Studies); Dr. Eduardo P. Garrovillas (Director for Research and Publication); Dr. Salvador N. Moya II (Dean, College of Law); Dr. Lalaine P. Toriado (Dean, Business and Accountancy); Dr. Myra SJ. Santos (Dean, College of Computer Science); Dr. Ma. Charisse B. Vedaña (Dean, College of Criminology); Dr. Ruel G. Manalo (Dean, College of Education and Liberal Arts); Dr. Perlita S. Santiago (Dean, College of Nursing); Prof. Rachel Ann S. Dumlao (Dean, College of Hospitality Management); Prof. Everly Ann L. Mata (OIC, Physical Therapy Program); Prof. Evangeline V. Buenaventura (Academic Coordinator, Accountancy); Prof. Janet C. Fernando (TESDA Courses Coordinator and OIC, Statistical Center); Prof. Dindo C. Punzalan (Principal, Basic Education); and Prof. Jossie P. Dioquino (Head Teacher, Elementary Department). These are handbook-listed roles and may have changed; confirm current assignments with TCC.`,
        keywords: 'academic officials list president chief academic officer dean officials names Edmund Francisco Eva De Rosas Eduardo Garrovillas Salvador Moya Lalaine Toriado Myra Santos Charisse Vedana Ruel Manalo Perlita Santiago Rachel Dumlao Everly Mata Evangeline Buenaventura Janet Fernando Dindo Punzalan Jossie Dioquino',
      },
      {
        question: 'Who are the Administrative Officials named in the TCC Student Handbook 2025?',
        answer: `${SOURCE} it lists Ms. Rosalina R. Baruel (Registrar); Ms. Melanie C. Santos (Human Resources Officer); Ms. Angelica F. Felix (Accountant); Ms. Julieta SJ. Belandres (Chief Librarian); Dr. Catherine M. Dungca (Head, Student Affairs); Prof. Louie ES. Dematera (Head, Guidance and Counseling); Engr. Antonio R. Sto. Domingo (Physical Plant Supervisor); Mr. Jeremiah Du. San Luis (General Services Officer); Dr. Andrea Diane I. Bernabe (Head, Community Extension Services); Dr. Patrick R. De Jesus (International Relations Officer); Prof. Joyce Colleen R. San Juan (NSTP Coordinator); Dr. Jose Don M. Soriano (School Physician); Dr. Marion Andrew M. Danganan (Marketing Officer); Dr. Maribeth F. Solis (Laboratory Custodian); Prof. Glenn B. Antipolo (ROTC Coordinator); and Mr. Rhommel M. Pascual (Head, Management Information System). These are handbook-listed roles and may have changed; confirm current assignments with TCC.`,
        keywords: 'administrative officials roster Registrar Human Resources HR Accountant Chief Librarian Student Affairs Guidance Counseling Physical Plant General Services Community Extension International Relations NSTP physician Marketing Laboratory ROTC MIS names Rosalina Melanie Angelica Julieta Catherine Louie Antonio Jeremiah Andrea Patrick Joyce Jose Marion Maribeth Glenn Rhommel',
      },
      {
        question: 'Who were the past presidents of TCC listed in the handbook history?',
        answer: `${SOURCE} the history section lists Jose B. Angeles (1950–1960); Isabelo Tupas (1961–1963), Academic Director/President; Domingo H. Soriano (1964–1967); Atilano Bautista (1968–1971); Aladdin F. Trinidad (1972–1973); Domingo H. Soriano (1974–1988); Vitaliano Bernardino (1988–1990); Daniel F. Francisco (1991–1992), Acting President; and Aladdin F. Trinidad (1993–1997). These are historical appointments, not necessarily current officials.`,
        keywords: 'TCC past former presidents history Jose Angeles Isabelo Tupas Domingo Soriano Atilano Bautista Aladdin Trinidad Vitaliano Bernardino Daniel Francisco 1950 1997',
      },
      {
        question: 'Where was TCC originally located, and where is the campus now?',
        answer: `${SOURCE} TCC was originally located in downtown Morong. The handbook says the high school department moved in 1989, the administrative and college groups in 1993, and the elementary school in 1995 to the eleven-hectare campus at Sitio Taghangin, about a kilometer from the poblacion.`,
        keywords: 'TCC campus location original downtown Morong current Sitio Taghangin eleven hectare campus poblacion history moved 1989 1993 1995',
      },
      {
        question: 'What degree programs did TCC add over time according to its history?',
        answer: `${SOURCE} the historical overview says TCC began with a two-year Associate in Arts course. Four-year Education and Commerce courses followed in 1964–1965. It later offered Accountancy, Computer Science/Information Technology, Public Administration, Arts, Nursing, and graduate Education. MAED began in consortium in 1975 and TCC's own MAED was recognized in 1989–1990; MPA and MBA followed in 1996–1997. The history also notes later programs including Computer Science, Nursing, Hotel and Restaurant Management, Accounting Technology, Criminology, Physical Therapy, Midwifery, TESDA courses, and a College of Law established in 2020–2021. Historical offerings do not confirm current availability.`,
        keywords: 'TCC history first courses Associate Arts Education Commerce Accountancy Computer Science IT Public Administration Arts Nursing MAED MPA MBA Hotel Restaurant Management Accounting Technology Criminology Physical Therapy Midwifery TESDA Law 2020',
      },
      {
        question: 'What is the academic structure of the TCC school year?',
        answer: `${SOURCE} the school year consists of two semesters of 18 weeks each and a six-week summer term. The handbook excerpt states each semester and summer term includes 54 hours of formal classroom instruction and examination, as required by CHED.`,
        keywords: 'TCC academic year two semesters 18 weeks summer six weeks 54 hours CHED school term structure',
      },
      {
        question: 'What does the handbook foreword say about the Student Handbook?',
        answer: `${SOURCE} the foreword from President Edmund C. Francisco describes the handbook as a guide to college life, TCC's programs, how they are implemented, student services, privileges, and responsibilities. It also says the handbook does not contain everything students need to know and points readers to other publications and tcc.edu.ph.`,
        keywords: 'handbook foreword welcome guide college life programs services privileges responsibilities president Edmund Francisco website tcc.edu.ph',
      },
      {
        question: 'Who is the TCC president according to the 2025 handbook?',
        answer: `${SOURCE} the handbook identifies Dr. Edmund C. Francisco, Ed.D., as President. Verify current appointments with the College because officials may change after publication.`,
        keywords: 'TCC Tomas Claudio Colleges president school president Dr Edmund C Francisco EdD official',
      },
      {
        question: 'Who are the academic officials named in the 2025 handbook?',
        answer: `${SOURCE} the Academic Officials section names Dr. Edmund C. Francisco (President and MBA Program Coordinator); Dr. Eva R. De Rosas (Chief Academic Officer and Dean of Graduate Studies); Dr. Eduardo P. Garrovillas (Director for Research and Publication); Dr. Salvador N. Moya II (Dean, College of Law); Dr. Lalaine P. Toriado (Dean, Business and Accountancy); Dr. Myra SJ. Santos (Dean, College of Computer Science); Dr. Ma. Charisse B. Vedaña (Dean, College of Criminology); Dr. Ruel G. Manalo (Dean, College of Education and Liberal Arts); Dr. Perlita S. Santiago (Dean, College of Nursing); Prof. Rachel Ann S. Dumlao (Dean, College of Hospitality Management); Prof. Everly Ann L. Mata (OIC, Physical Therapy Program); Prof. Evangeline V. Buenaventura (Academic Coordinator, Accountancy); Prof. Janet C. Fernando (TESDA Courses Coordinator and OIC, Statistical Center); Prof. Dindo C. Punzalan (Principal, Basic Education); and Prof. Jossie P. Dioquino (Head Teacher, Elementary Department). These are the names and roles in the 2025 excerpt; confirm current assignments with TCC.`,
        keywords: 'academic officials list president chief academic officer dean officials names president MBA graduate studies research publication law business accountancy computer science criminology education nursing hospitality physical therapy TESDA statistical center basic education elementary handbook',
      },
      {
        question: 'Who are the administrative officials named in the 2025 handbook?',
        answer: `${SOURCE} the Administrative Officials section lists Ms. Rosalina R. Baruel (Registrar); Ms. Melanie C. Santos (Human Resources Officer); Ms. Angelica F. Felix (Accountant); Ms. Julieta SJ. Belandres (Chief Librarian); Dr. Catherine M. Dungca (Head, Student Affairs); Prof. Louie ES. Dematera (Head, Guidance and Counseling); Engr. Antonio R. Sto. Domingo (Physical Plant Supervisor); Mr. Jeremiah Du. San Luis (General Services Officer); Dr. Andrea Diane I. Bernabe (Head, Community Extension Services); Dr. Patrick R. De Jesus (International Relations Officer); Prof. Joyce Colleen R. San Juan (NSTP Coordinator); Dr. Jose Don M. Soriano (School Physician); Dr. Marion Andrew M. Danganan (Marketing Officer); Dr. Maribeth F. Solis (Laboratory Custodian); Prof. Glenn B. Antipolo (ROTC Coordinator); and Mr. Rhommel M. Pascual (Head, Management Information System). These are the names and roles in the 2025 excerpt; confirm current assignments with TCC.`,
        keywords: 'administrative officials roster list Registrar Human Resources HR Accountant Chief Librarian Student Affairs Guidance Counseling Physical Plant General Services Community Extension International Relations NSTP physician Marketing Laboratory ROTC MIS names handbook 2025',
      },
      {
        question: 'What topics are covered in Articles II through VI of the Student Handbook?',
        answer: `${SOURCE} the supplied table of contents lists Article II, General Rules and Regulations (academic policies, attendance, grading, identification and campus policies, facilities, consultation, permits and fees, tuition, refunds, discounts, scholarships, athletics, and student assistantship); Article III, Student Life and Campus Policies (uniforms, identification, graduation requirements, academic distinction, commencement, loyalty award, OJT, and student discipline); Article IV, Student Organizations and Activities; Article V, Student Support Services (including Registrar, Admission, Student Affairs, Library, Medical and Dental Clinic, Guidance and Counseling, Placement, Community Extension, Statistical Center, International Relations, and NSTP); and Article VI, Policies on Safety, Discipline, and Rights, including anti-discrimination, harassment, Safe Spaces, anti-bullying, and drug-free campus/workplace policies. The excerpt provides contents headings, not the full policy text for every topic.`,
        keywords: 'handbook Article II Article III Article IV Article V Article VI table contents regulations student life campus policies organizations activities support services safety discipline rights anti-discrimination harassment bullying scholarships varsity student assistant OJT',
      },
      {
        question: 'What does the handbook say about methods of instruction at TCC?',
        answer: `${SOURCE} the curricular offerings and activities are based on sound general education and aim to support a satisfying life for students by connecting campus education with changing national and world conditions. The handbook says faculty use a variety of teaching strategies and instructional materials consistent with current educational technology.`,
        keywords: 'methods instruction teaching strategies curricular offerings activities general education education technology instructional materials faculty',
      },
      {
        question: 'How do student organizations request use of TCC facilities?',
        answer: `${SOURCE} a student organization submits a written facility-use request to the Office of the President at least three weeks before the activity, with a program proposal signed by the organization's president and adviser. The Office of the President reviews it through the Dean's Office. The organization then obtains a facilities-use form from Student Affairs, completes it and submits it to Accounting, and gives Student Affairs a copy. Confirm current forms and approvals before planning the activity.`,
        keywords: 'student organization facility facilities use request written letter Office President three weeks program proposal signature adviser Dean OSA Student Affairs form Accounting',
      },
      {
        question: 'How do student organizations request permission to conduct an activity?',
        answer: `${SOURCE} the organization president submits a letter of request to the Office of the President describing the activity name and purpose, date, time and location, expected participants, budget if applicable, and risk assessment with mitigation plan. The excerpt says the letter must be signed by the organization president, adviser, and Head of OSA. The administration reviews policy compliance, information accuracy, and alignment with the school's mission and may require additional documents, a briefing, or clarification before conditional approval. This activity-approval procedure is separate from the facility-use request, which the handbook excerpt says should be submitted at least three weeks before the activity. Confirm the required routing and current forms with OSA.`,
        keywords: 'student activity event permission approval request letter Office President organization president adviser Head OSA purpose date time location participants budget risk assessment mitigation conditional approval documents briefing',
      },
      {
        question: 'What happens after a student activity is approved, and can permission be revoked?',
        answer: `${SOURCE} students must carry out an approved activity according to its approved plan. The administration may supervise and monitor it, and incidents or emergencies must be reported immediately. Permission may be revoked for non-compliance with school policy or if newly identified risks cannot be mitigated. The procedure is reviewed annually; contact OSA for current implementation requirements.`,
        keywords: 'student activity after approval implementation approved plan supervision monitoring incident emergency report revoke permission non-compliance risk hazard mitigation annual review',
      },
      {
        question: 'How can a student organization have posters or announcements approved?',
        answer: `${SOURCE} only announcements, posters, or similar literature from College authorities or recognized student organizations are allowed. A recognized organization's material must first go through its adviser for comments and recommendations, then be submitted to OSA for approval. Only material bearing the OSA Head's signature may be posted, and it may be placed only on bulletin boards or in locations designated by the Office.`,
        keywords: 'student organization poster announcement literature flyer publication adviser comments recommendations OSA approval signature Head bulletin board designated posting places',
      },
      {
        question: 'How can students apply to establish a new student organization?',
        answer: `${SOURCE} an application may be made to the Dean, but a new organization will not be approved if a similar organization already exists. Applications are accepted only within 30 days after the beginning of a regular semester. The application must state the organization's primary objectives and include its by-laws, a list of elected officers, and an annual calendar of activities for consideration. Confirm the current application steps with the Dean or OSA.`,
        keywords: 'new student organization create establish apply application Dean 30 days regular semester similar organization objectives bylaws by-laws elected officers annual calendar activities',
      },
      {
        question: 'Who may join a recognized student organization, and what are the officer requirements?',
        answer: `${SOURCE} membership in an approved student organization is limited to students currently enrolled at the College. Elected officers must have good academic standing, defined in the excerpt as passing grades in all subjects in the preceding semester. The listed officers include a president, internal and external vice presidents, secretary, treasurer, auditor, public relations officer, two sergeants-at-arms, muse, escort, and year-level representatives. Elections should be held within 60 days after classes begin for the regular school year, and students graduating in the first semester may not be elected. The excerpt says organization by-laws should cover election procedures. Organizations following officer requirements set by a national chapter may submit a similar number of officers.`,
        keywords: 'student organization membership currently enrolled eligibility elected officers academic standing passing grades preceding semester president vice president secretary treasurer auditor public relations sergeant arms muse escort year level representatives election 60 days graduating',
      },
      {
        question: 'What advance notice is required for student organization meetings and activities?',
        answer: `${SOURCE} the excerpt says meetings or activities that require a College facility or excuse students from class should be calendared with the Dean at least 24 hours in advance for a meeting, and one week in advance for a convocation, seminar-workshop, or other affair involving speakers or guests. A separate facility-use procedure in the supplied excerpt requires a written request at least three weeks before an activity. Because these excerpts describe different requests and timelines, confirm the applicable deadline with the Dean and OSA, and allow the longer lead time when facility use is involved.`,
        keywords: 'student organization meeting activity advance notice schedule calendar Dean 24 hours one week convocation seminar workshop speaker guest facility use three weeks deadline',
      },
      {
        question: 'When and where must a student organization submit its annual calendar of activities?',
        answer: `${SOURCE} each organization submits its proposed whole-year activity calendar to its adviser at the beginning of the school year for presentation to the proper College authority or committee. After the Dean approves it, the adviser and organization president submit the calendar to the Office of Student Affairs. The excerpt says non-compliance may result in automatic suspension for a period determined at the discretion of the OSA Head and approved by the College President. Confirm the current submission schedule with OSA.`,
        keywords: 'student organization annual yearly calendar proposed activities beginning school year adviser College committee Dean approval president OSA Office Student Affairs non-compliance suspension',
      },
      {
        question: 'What financial report must a student organization submit at the end of the school year?',
        answer: `${SOURCE} each organization submits a brief year-end financial report showing its contributions, expenditures, and the holder of any remaining balance. The faculty adviser must note the report. If there were no financial transactions, a brief statement to that effect is sufficient. Non-compliance may result in suspension for the succeeding school year, subject to the Dean's approval.`,
        keywords: 'student organization finances financial report year end school year contributions expenditures balance fund holder adviser notation no transactions suspension succeeding year Dean approval',
      },
      {
        question: 'Who may advise a student organization, and what are the adviser’s duties?',
        answer: `${SOURCE} an organization adviser is nominated by the organization's officers and appointed from among the College's regular faculty. Advisers are expected to attend organization meetings and activities. Their listed duties include conducting the organizational meeting; supervising meetings and attending socials and undertakings; resolving procedural questions not covered by the rules; advising officers and members; coordinating activities and projects; commenting on proposed projects, activities, and posters; reviewing acts, resolutions, and fund disbursements before submission to the TCC President or Dean; submitting a written annual achievements report with observations and recommendations to the Dean before the school year ends; and monitoring organization funds. The excerpt says the adviser is a signatory on transactions involving funds or contributions.`,
        keywords: 'student organization adviser faculty regular nominated appointed duties responsibilities attend meetings activities supervise advise coordinate projects posters resolutions fund disbursement annual report Dean signatory finances',
      },
      {
        question: 'Which student organizations are listed as recognized in the 2025 handbook?',
        answer: `${SOURCE} the recognized organizations listed are: Supreme Student Council of Leaders; The Educators; Hospitality Management Society; Nightingale Society Organization; Bachelor of Science in Business Administration; Junior Philippine Institute of Accountants; CSA: ComSci Attitude; Guns and Roses Club; ROTARACT Club; NextGen Teachers Alliance; The Euclideans; English Vanguards; The Inquisitives; KAPARIZ; The Explorer; The Generalists; and National Service Reserve Corps (NSRC). This is the handbook's list and may not reflect current recognition status; confirm with OSA.`,
        keywords: 'recognized student organizations clubs list Supreme Student Council Leaders Educators Hospitality Management Society Nightingale BSBA Business Administration Junior Philippine Institute Accountants JPIA CSA ComSci Attitude Guns Roses ROTARACT NextGen Teachers Euclideans English Vanguards Inquisitives KAPARIZ Explorer Generalists NSRC',
      },
      {
        question: 'How can a student consult with a faculty member?',
        answer: `${SOURCE} the Dean's Office prepares and posts faculty consultation schedules on college bulletin boards. Students may visit a faculty member during the listed consultation period at the designated room or office, complete the counseling form, and register in the logbook. The handbook says the faculty member may refer the student to Guidance and Counseling if further counseling is needed.`,
        keywords: 'student faculty consultation schedule hours bulletin board Dean office designated room counseling form logbook Guidance referral',
      },
      {
        question: 'How do I get a school ID and current-year sticker?',
        answer: `${SOURCE} freshmen and transferees apply for an identification card through the College ID section and claim it on the date indicated on the approved registration form. The excerpt says students present a valid student ID to the Registrar's Office upon enrollment to receive the sticker for the current academic year. It also notes that old students must visibly wear the ID on their uniform during school hours; failure to present the ID or obtain a sticker may delay access to some facilities, events, or services. Confirm current steps with the Registrar or ID section.`,
        keywords: 'student ID identification card apply claim freshmen transferees ID section registration form sticker current academic year registrar old students wear uniform facilities',
      },
      {
        question: 'What is required for a Curricular Enhancement Program or educational field trip?',
        answer: `${SOURCE} the excerpt says a Curricular Enhancement Program must follow CHED Memorandum Order No. 17, Series of 2012, on educational tours and field trips. The Dean files a written permit application with supporting documents signed by the Dean to the Office of the President. After review, the President may grant the permit, and the Dean submits a narrative report to the President one week after the activity. Do not proceed until the required approval is confirmed.`,
        keywords: 'curricular enhancement program educational tour field trip permit CHED CMO 17 2012 Dean written application supporting documents President approval narrative report one week',
      },
      {
        question: 'Who is covered by the handbook policies on sexual harassment, Safe Spaces, and bullying?',
        answer: `${SOURCE} the excerpts state that the policies apply to members of the educational community, including students, pupils, parents or guardians, administrators, teaching staff, academic and non-academic personnel. The sexual-harassment and Safe Spaces provisions also expressly cover applicants for employment, interns, volunteers, contractors, and visitors. The bullying policy describes coverage across the educational community and workplace. The excerpts are summaries of handbook rules, not legal advice; contact OSA or Human Resources for guidance about a specific situation.`,
        keywords: 'sexual harassment Safe Spaces anti bullying policy coverage who applies students pupils parents guardians administrators teachers staff employees applicants interns volunteers contractors visitors educational community workplace',
      },
      {
        question: 'What conduct does the handbook identify as sexual harassment or a Safe Spaces violation?',
        answer: `${SOURCE} the excerpts describe work-, education-, or training-related sexual harassment as unwelcome sexual demands, requests, advances, or conduct by a person with authority, influence, or moral ascendancy, including conduct that affects employment or education, conditions benefits on a sexual favor, or creates an intimidating, hostile, or offensive environment. Listed examples include persistent unwanted attempts to turn a professional or educational relationship into a personal one; unwelcome advances or sexual jokes and messages; sexual comments about a person's body; leering, whistling, or unwanted touching; and displaying sexually offensive material. The Safe Spaces excerpt also identifies gender-based online harassment, such as unwanted sexual remarks, threats, sharing images or recordings without consent, cyberstalking, and online identity theft, and unwanted sexual remarks or actions in streets and public places. This summary is not a legal determination; report concerns through the school process.`,
        keywords: 'sexual harassment Safe Spaces conduct definition unwanted advances sexual favors quid pro quo hostile offensive environment sexual jokes texts comments body touching leering online harassment threats images without consent cyberstalking public spaces catcalling',
      },
      {
        question: 'How can I report sexual harassment, a Safe Spaces violation, or bullying at TCC?',
        answer: `${SOURCE} the excerpt says a student may file a written complaint or report with the Office of Student Affairs (OSA); an employee may file with Human Resources. Any student or employee may report or file a complaint. It encourages reporting and describes informal resolution first, followed by formal resolution if informal steps do not resolve the matter. The written report should include the complainant's and respondent's names and addresses, the substance and grounds of the complaint, when and where the incident occurred, and witness names. If someone is in immediate danger, seek immediate help from school authorities or emergency services. Ask OSA or HR how to submit information safely and confidentially.`,
        keywords: 'report file complaint sexual harassment Safe Spaces bullying student employee OSA Office Student Affairs Human Resources HR written names addresses respondent grounds incident when where witnesses informal formal resolution',
      },
      {
        question: 'What committee investigates sexual-harassment, Safe Spaces, and bullying complaints?',
        answer: `${SOURCE} the Committee on Decorum and Investigation (CODI) is described as responsible for prevention and awareness meetings and investigating alleged sexual-harassment, Safe Spaces, and bullying cases. Its membership should include at least one representative each from administration, teaching or academic staff, academic non-teaching and non-academic personnel, and students or trainees, as applicable. The excerpt says the committee may also initiate a case on its own (motu proprio). For filing instructions or current committee membership, contact OSA or HR.`,
        keywords: 'Committee Decorum Investigation CODI committee investigates sexual harassment Safe Spaces bullying composition administration academic teaching nonteaching non-academic student trainee motu proprio',
      },
      {
        question: 'What due-process steps are described for sexual-harassment or bullying complaints?',
        answer: `${SOURCE} the excerpt says the respondent is given the complaint and attachments and generally has 10 calendar days after receipt to answer and submit supporting documents. The parties are to be notified of a conference scheduled after the answer, with the goal of an amicable settlement. The respondent must be informed in writing of the accusation and evidence, may answer with counsel if desired, and may present evidence; the committee must consider the evidence. If a summary decision is not appropriate, both parties may be directed to submit position papers or memoranda within 10 calendar days after notice. Where complicated factual issues require it, the committee may request affidavits and ask clarifying questions. The excerpt also describes a possible waiver if a respondent does not answer or attend; consult OSA or HR for the official procedure and applicable deadlines.`,
        keywords: 'due process complaint respondent answer 10 calendar days evidence counsel conference amicable settlement position papers memorandum affidavits clarifying questions waiver investigation sexual harassment bullying CODI',
      },
      {
        question: 'How are sexual-harassment, Safe Spaces, or bullying cases decided and kept confidential?',
        answer: `${SOURCE} the excerpt says the committee evaluates the evidence and decides the case; it describes the committee's decision as final and executory. It may decide from the record when sufficient grounds exist, otherwise it may request position papers or conduct an investigation with affidavits and clarifying questions. The evaluation should consider the perspective of a person similarly situated to the complainant. Written case records must be kept confidential as much as possible under data-privacy requirements, while complainants should be told that complete anonymity may not be possible because the institution may need to investigate and act. The excerpt says discretion should be used in deciding which witnesses are necessary. Contact OSA or HR about records and support in a specific case.`,
        keywords: 'case decision judgment resolution evidence confidentiality privacy data privacy anonymity witness investigation summary judgment position paper affidavit final executory sexual harassment bullying Safe Spaces',
      },
      {
        question: 'What support and prevention measures are listed for people affected by harassment or bullying?',
        answer: `${SOURCE} the excerpt states that counseling and legal assistance will be available to people who have experienced sexual harassment or bullying. It also calls for regular training for employees and students on recognizing and preventing harassment and bullying, along with educational materials. Affected members of the educational community should be treated with respect and given an opportunity to present their side. Contact OSA, HR, or the Guidance and Counseling Office to ask about current support options.`,
        keywords: 'harassment bullying victim support services counseling legal assistance prevention training education materials respect present side OSA HR Guidance',
      },
      {
        question: 'What types of bullying are described in the handbook?',
        answer: `${SOURCE} the excerpts describe severe or repeated written, verbal, electronic, physical, or gestural conduct that causes or reasonably threatens physical or emotional harm or property damage, creates a hostile school environment, infringes another student's rights, or substantially disrupts education or school operations. Examples include unwanted physical contact, pranks or fighting; emotional harm; slander, profanity, name-calling, or humiliating comments; spreading rumors or provoking conflict; targeting someone based on race, gender, sexual orientation, or disability; and cyberbullying through email, the internet, or other electronic devices. The workplace-bullying section also describes harm to workplace safety, teams, attendance, and productivity. Report concerns to OSA for students or HR for employees.`,
        keywords: 'bullying types physical verbal indirect cyberbullying school workplace severe repeated harm hostile environment rights disruption rumors race gender sexual orientation disability email internet electronic devices',
      },
      {
        question: 'What sanctions may apply to sexual harassment, bullying, or Safe Spaces violations?',
        answer: `${SOURCE} the excerpts list administrative sanctions that may include warning (for educational or training-related bullying), suspension, dismissal, or termination, depending on the policy and whether the incident is work- or education-related. They state that administrative sanctions do not prevent prosecution in the proper courts for unlawful conduct. The handbook also says violations may lead to disciplinary action and that all affected parties should have an opportunity to present their side. Sanctions depend on the findings and applicable process; this summary does not predict an individual outcome.`,
        keywords: 'sanctions penalty warning suspension dismissal termination sexual harassment bullying Safe Spaces work education training court prosecution administrative discipline',
      },
      {
        question: 'What does TCC’s drug-free workplace and school-campus policy say?',
        answer: `${SOURCE} the handbook prohibits the use, sale, transfer, ownership, possession, and related transactions involving dangerous drugs or intoxicating liquor on campus/workplace. It describes education and awareness activities, random drug testing of students and a selected annual sample of 10–15% of the current workforce, with screening and confirmatory testing if a screening test is positive. Testing is to follow Department of Health procedures at DOH-accredited centers, and screening and results are to be kept confidential; employees are to be informed of results. The excerpt states that prospective employees pay for pre-employment testing and the school pays testing costs for existing employees. Any discipline must follow due process; contact HR or OSA for current policy and procedures.`,
        keywords: 'drug free workplace campus policy dangerous drugs intoxicating liquor alcohol possession sale transfer testing random sample 10 15 percent employees students DOH accredited screening confirmatory confidentiality costs due process',
      },
      {
        question: 'What are the guidelines for attending flexible or online classes?',
        answer: `${SOURCE} the flexible-learning excerpt lists Zoom and Google Meet, supplemented by Messenger, text, and other devices; classroom group chats may be used for communication, schedules, announcements, and school-related activity posts. For online-class etiquette, it advises joining five minutes early, using a real name, wearing presentable and decent clothing (uniform or organization T-shirt; collared polo for first-year students and transferees), choosing a clear and suitable learning space, turning on the camera when called to recite or participate, muting the microphone unless asked to speak, and listening attentively. It also advises students to turn off video when eating or drinking, take notes, and use careful language. Follow the professor's current instructions if platform or class rules differ.`,
        keywords: 'flexible learning online class Zoom Google Meet Messenger text classroom group chat schedule announcement etiquette join five minutes early real name dress uniform polo camera microphone mute learning space participation',
      },
      {
        question: 'How should students submit requirements in flexible learning classes?',
        answer: `${SOURCE} requirements should be submitted through the prescribed learning option. Professors are expected to give concrete instructions about how to submit required work, and the time allotted should remain within the specified timeframe. Check the course or classroom group chat for the professor's submission directions and deadlines, and ask the professor if the instructions are unclear.`,
        keywords: 'flexible learning submit requirements assignments coursework prescribed platform learning option professor instructions timeframe deadline classroom group chat',
      },
      {
        question: 'How does the handbook say to report a student code-of-conduct violation?',
        answer: `${SOURCE} suspected violations should be reported promptly to the Office of Student Affairs (OSA). The listed process is: OSA conducts an initial investigation; if the allegation has merit, the accused is notified and given a fair opportunity to explain in writing and orally; a determination is made based on the preponderance of evidence and communicated to the parties; and any disciplinary action is determined under school policy, considering severity, prior behavior, and relevant circumstances. The handbook says records are documented and kept confidential. For a real case, contact OSA and follow the official process.`,
        keywords: 'report student conduct code violation complaint OSA investigation accused response written oral due process evidence determination disciplinary action confidential records',
      },
      {
        question: 'What sanctions does the handbook list for minor student offenses?',
        answer: `${SOURCE} examples of minor offenses include tardiness, excessive unexcused absenteeism, not wearing the required uniform or ID, boys wearing earrings contrary to dress code, littering, and loitering without authorization. The listed sanctions are: first offense, reprimand and 5 hours of community service; second offense, 3-day suspension and 10 hours of community service; third offense, treated as a serious offense. The excerpt describes handbook sanctions, not an outcome for any individual case.`,
        keywords: 'minor offense sanction first second third tardiness absenteeism absence uniform ID earrings littering loitering reprimand community service suspension',
      },
      {
        question: 'What examples of serious student offenses and sanctions are listed?',
        answer: `${SOURCE} serious-offense examples include hooliganism, vandalism, smoking or vaping on school grounds, gambling, cheating, plagiarism, libelous acts, disrespect, bullying or cyberbullying, damaging school property, extortion, pornography in the school environment, and starting a fight during a sports event. The excerpt lists for a first serious offense a 5-day suspension and 15 hours of community service, and for a second offense denial of readmission. Consult OSA for the official classification and current procedure.`,
        keywords: 'serious offense examples sanctions hooliganism vandalism smoking vaping gambling cheating plagiarism libel disrespect bullying cyberbullying extortion pornography fight property damage suspension 5 days 15 hours denial readmission',
      },
      {
        question: 'What does the handbook classify as gross offenses?',
        answer: `${SOURCE} the gross-offense examples listed are selling, possessing, or using illegal drugs on school grounds; hazing; carrying deadly weapons on school property; immorality as described by the handbook; drunkenness at school or school-sponsored events; arson; falsification of documents; forgery; theft; misuse of funds; and sexual harassment. The supplied excerpt does not show the specific sanctions for each gross offense. Report concerns to OSA; do not infer an outcome from this summary.`,
        keywords: 'gross offenses drugs selling possession use hazing deadly weapons immorality drunkenness arson falsification documents forgery theft misuse funds sexual harassment sanctions',
      },
      {
        question: 'What is community service as a disciplinary action intended to do?',
        answer: `${SOURCE} the program is intended to help students reflect on behavior, understand its impact, maintain academic progress during suspension, and develop responsibility. Duration depends on the infraction and Discipline Committee advice. The Community Extension Services Coordinator supervises in coordination with the College Dean and OSA; activities may be on campus or in adopted barangays, and parents/guardians are notified. Listed activities include completing regular class assignments, reflective essays or journals, counseling, responsibility and conflict-resolution workshops, team building, school service, physical exercise, mindfulness, time-management workshops, and study-skills sessions. It begins with orientation and includes monitoring and an end-of-service assessment/report to OSA.`,
        keywords: 'community service disciplinary action goals reflection behavior impact academic progress responsibility supervisor CES coordinator dean OSA parent guardian orientation monitoring assessment report activities counseling essays journals workshops conflict resolution teamwork school service exercise mindfulness study skills',
      },
      {
        question: 'Who handles student discipline cases according to the handbook?',
        answer: `${SOURCE} minor cases are handled by the Head of Student Affairs and the Dean affiliated with the student. Serious and gross offenses are handled by the Head of OSA, faculty representatives designated by the Office of the President, and student-body representatives. The supplied text is internally inconsistent about the number of faculty representatives (“two (3)”), so confirm the committee composition with OSA.`,
        keywords: 'discipline committee who handles minor serious gross offense Head Student Affairs OSA Dean faculty representatives student body president committee composition two three',
      },
      {
        question: 'What are the eligibility requirements for the TCC Student Assistantship Program?',
        answer: `${SOURCE} the listed eligibility requirements are: be a Filipino citizen; be a bona fide second-year college student or a TCC Senior High School graduate with one semester of residency; be enrolled in at least 12 units during the assistantship semester; have no failing grade in the preceding term; have good moral character; and provide written consent from the parent or guardian on record. Confirm current requirements with Human Resources before applying.`,
        keywords: 'student assistant assistantship eligibility Filipino citizen second year college TCC senior high graduate residency one semester 12 units enrolled no failing grade good moral parent guardian written consent HR human resources',
      },
      {
        question: 'What are the benefits of the Student Assistantship Program?',
        answer: `${SOURCE} student assistants receive 100% non-payment of tuition fees and a monthly allowance of Php 500. The student assistant still pays miscellaneous fees each semester.`,
        keywords: 'student assistant assistantship benefits tuition waiver 100 percent allowance monthly 500 Php miscellaneous fees',
      },
      {
        question: 'How many hours may a student assistant work each week?',
        answer: `${SOURCE} student assistants may render a maximum of 20 hours per week, Monday through Saturday. Their assigned hours should be listed on the Work Schedule Form.`,
        keywords: 'student assistant work duty hours schedule maximum 20 hours per week Monday Saturday',
      },
      {
        question: 'What documents are required to apply for a student assistantship?',
        answer: `${SOURCE} the application procedure lists a completed Student Assistantship Application Form, an updated resume with cover letter, one recent colored 2x2 photo, and a printed copy of grades from previous terms. The eligibility section also requires proof of written parent/guardian consent. Ask Human Resources whether additional documents are currently required.`,
        keywords: 'student assistant assistantship apply application requirements documents form resume cover letter 2x2 photo grades parent guardian consent HR',
      },
      {
        question: 'How does a department request a student assistant?',
        answer: `${SOURCE} the requesting office head sends a letter to the Office of the President. Human Resources coordinates with the office, processes the request, and provides updates. The stated processing period is approximately two weeks after the request is received. The HR Office then arranges an initial interview with the requesting-office head and recommends candidates for a final interview with the President.`,
        keywords: 'request student assistant department office head letter President HR Human Resources hiring placement interview processing two weeks',
      },
      {
        question: 'What happens after a student is accepted for an assistantship?',
        answer: `${SOURCE} Human Resources informs the applicant about possible placement and coordinates with the student after acceptance by the President. Listed submission items include a copy of the enrollment registration form, preceding-term grades, a Certificate of Good Moral Character from Guidance and Counseling, parental consent with the parent or guardian's valid ID, and for continuing assistants, a prior performance evaluation form.`,
        keywords: 'student assistant accepted acceptance placement HR documents registration form grades good moral guidance parental consent guardian ID performance evaluation continuing',
      },
      {
        question: 'What orientation or forms are provided to a new student assistant?',
        answer: `${SOURCE} Human Resources provides a Student Assistant Manual and Work Schedule Form. On the first workday, the assigned department head or office conducts an orientation covering policies, procedures, and position expectations.`,
        keywords: 'student assistant onboarding orientation first day Student Assistant Manual Work Schedule Form HR department head policies procedures expectations',
      },
      {
        question: 'What are the responsibilities of a student assistant?',
        answer: `${SOURCE} listed responsibilities include administrative tasks such as filing and data entry; maintaining confidentiality; following program policies and procedures; working independently and taking initiative; communicating effectively with colleagues and supervisors; meeting deadlines; and performing other duties assigned by the supervisor.`,
        keywords: 'student assistant roles responsibilities duties administrative filing data entry confidentiality discretion policies procedures initiative communication colleagues supervisors deadlines',
      },
      {
        question: 'How are student assistants evaluated?',
        answer: `${SOURCE} the Student Assistant Performance Evaluation Form gives feedback and identifies strengths and areas for improvement. It evaluates attitude, dependability, confidentiality, cooperation, and quality of work. The handbook describes ratings from Outstanding, Very Good, Satisfactory, Needs Improvement, to Unsatisfactory. Continuing in the program requires at least a Satisfactory rating in the previous semester, along with the eligibility criteria.`,
        keywords: 'student assistant performance evaluation rating form attitude dependability confidentiality cooperation quality work Outstanding Very Good Satisfactory Needs Improvement Unsatisfactory retention continue',
      },
      {
        question: 'What should a student assistant do when absent from work?',
        answer: `${SOURCE} a student assistant must notify the supervisor no later than the beginning of the scheduled work period when unable to work. For an extended absence, report the anticipated duration as soon as possible. The supervisor approves or disapproves the absence.`,
        keywords: 'student assistant absence absent sick notify supervisor scheduled work period extended duration approval disapproval',
      },
      {
        question: 'How does a student assistant resign or leave the program?',
        answer: `${SOURCE} a student assistant must submit written resignation notice to the Human Resources Office through the supervising head. The notice should be accompanied by the Student Assistant Performance Evaluation Form.`,
        keywords: 'student assistant resignation resign offboarding leaving program written notice HR Human Resources supervising head evaluation form',
      },
      {
        question: 'How is student assistant attendance recorded?',
        answer: `${SOURCE} student assistants are required to register their fingerprint in the Digital Biometrics system and use the logbook at the same time for attendance records.`,
        keywords: 'student assistant attendance fingerprint Digital Biometrics logbook timekeeping register',
      },
      {
        question: 'What can cause a student assistant to be terminated?',
        answer: `${SOURCE} listed reasons include unsatisfactory performance or failure to meet job expectations, academic probation or suspension, non-compliance with institutional policies or procedures, and unavailability or excessive absences. The assistantship is also subject to student discipline under the handbook. Confirm any individual case with Human Resources.`,
        keywords: 'student assistant terminated termination dismissal unsatisfactory performance job expectations academic probation suspension noncompliance policies excessive absences unavailability',
      },
      {
        question: 'What are the TCC Student Handbook requirements for on-the-job training (OJT)?',
        answer: `${SOURCE} students in OJT must follow school rules and the code of conduct, act professionally and with integrity, follow supervisor instructions and safety rules, engage in learning, and ask for clarification when needed. Program heads deploy students to partner agencies, give guidance, monitor progress, provide feedback, and help ensure a safe workplace. The handbook calls for a Memorandum of Agreement among the school, trainee, and partner organization, a training plan before placement, regular performance evaluations, confidentiality, reporting concerns to the designated faculty member, and acknowledgment of the policy by students and supervising faculty. Misconduct may have disciplinary consequences.`,
        keywords: 'OJT on job training internship student responsibilities program head agency partner MOA memorandum agreement training plan evaluation safety confidentiality report concern code ethics professionalism supervisor',
      },
      {
        question: 'What is the student marching band scholarship benefit?',
        answer: `${SOURCE} the supplied marching-band scholarship excerpt says band members receive a 100% tuition-fee benefit during the semester, while miscellaneous fees remain payable. The excerpt is incomplete and contains other conditions; confirm current eligibility, duration, and terms with the academic clerk or school before relying on this benefit.`,
        keywords: 'student marching band scholarship band player instrument tuition 100 percent miscellaneous fees benefit grant',
      },
      {
        question: 'What are the listed criteria and application steps for the marching band scholarship?',
        answer: `${SOURCE} the excerpt lists ability to play an instrument needed by the marching band, willingness to attend band activities on and off campus, and ability to read notes and music. It says family annual income is preferably not more than Php 250,000. Applicants submit a performance video or audition in person, provide proof of prior band experience, and if accepted submit a registration-form copy to the academic clerk. The excerpt also mentions a scholarship agreement, semester evaluation/renewal, a stated eight-semester limit, a deadline set by the academic clerk, and a rule against combining two or more special scholarships. Because the excerpt begins mid-section and may omit qualifications, confirm complete current terms with the school.`,
        keywords: 'marching band scholarship eligibility criteria application audition video instrument music notes experience certificate income 250000 academic clerk scholarship agreement renewal evaluation eight semesters deadline grants',
      },
      {
        question: 'What discount does the handbook list for student athletes?',
        answer: `${SOURCE} it lists a tuition discount of 50% for first place at the provincial level, 75% for first place at the regional level, and 100% for first place at the national level. The excerpt does not specify all proof, timing, or renewal requirements; confirm those with the school.`,
        keywords: 'student athlete varsity sports discount scholarship tuition provincial regional national first place 50 75 100 percent',
      },
      {
        question: 'What is the TCC varsity eligibility policy in the handbook?',
        answer: `${SOURCE} varsity participants must be enrolled in both the first and second semesters. The excerpt requires a minimum 60% passing grade during the first semester, good behavior on and off the field, compliance with the code of conduct, and participation in tryouts. It also describes attendance at practices, games, and team events; academic monitoring; care of issued equipment; safety measures; and possible recognition or scholarships. Confirm current eligibility details with the coaching staff.`,
        keywords: 'student varsity athlete eligibility enrolled first second semester 60 percent passing grade tryouts behavior conduct practice games team events equipment safety coach',
      },
      {
        question: 'Are student varsity athletes exempt from Physical Education classes?',
        answer: `${SOURCE} the supplied Student Varsity Policy says students actively participating in competitive sports are exempt from Physical Education classes to accommodate training and competition schedules. Confirm how to document active participation with the school.`,
        keywords: 'student athlete varsity exempt PE physical education classes competitive sports training competition schedule',
      },
      {
        question: 'Who is eligible to file a student insurance claim, and what documents are listed?',
        answer: `${SOURCE} a claimant must be currently enrolled, included in the list submitted to the school's accredited insurer, and covered by an active policy at the time of the incident. The listed claim documents, submitted as originals plus two photocopies, are a detailed claim form, statement of account, hospital and prescription official receipts, doctor's prescription and certificate, clinical abstract, police report, narrative report, school ID, driver's license, and birth certificate, as applicable. Claims must be reported within the insurer's specified timeframe. Coverage, exclusions, required documents, and deadlines depend on the actual insurance policy, so contact the school or insurer to confirm what applies.`,
        keywords: 'student insurance claim eligibility enrolled active coverage accredited insurer documents requirements claim form statement account hospital receipt prescription doctor certificate clinical abstract police report narrative report school ID drivers license birth certificate deadline timeframe',
      },
      {
        question: 'What does the handbook say about student insurance coverage, exclusions, and claim disputes?',
        answer: `${SOURCE} insurance coverage depends on the school's current policy with its selected insurer. The excerpt warns that claims arising from pre-existing conditions, risky behavior, or illegal activity may not be reimbursed. Claims are reviewed by the insurance provider, and approved reimbursement or coverage follows the policy terms. A formal appeal process is described for disputes, and students should use the insurer contact information provided by the school. These statements are a handbook summary only; review the actual policy and contact the insurer or OSA for a specific claim.`,
        keywords: 'student insurance policy coverage exclusions pre-existing condition risky behavior illegal activity reimbursement claim approval appeal dispute insurer contact',
      },
      {
        question: 'What does the Office of Student Affairs do for students and organizations?',
        answer: `${SOURCE} the Office of Student Affairs (OSA) is both an administrative and service office. It implements institutional and Department of Education policies concerning student conduct, behavior, discipline, organizations, associations, programs, forums, and activities, while also considering student interests. The handbook lists duties including preparing the Student Handbook for the President's approval; advising the student government; supervising organization advisers, membership, annual reports, records, and officers; holding regular meetings and consultations; recommending facility-use requests to the Physical Facilities Coordinator for approval; conducting first-year orientation; coordinating student development, guidance, counseling, and community-extension services; developing external linkages; implementing uniform guidelines; and assisting with insurance claims.`,
        keywords: 'Office Student Affairs OSA responsibilities duties student government organizations membership annual reports records monthly meetings orientation facility requests physical facilities student services guidance counseling community extension uniforms insurance claims',
      },
      {
        question: 'What are the TCC Library hours and basic library rules?',
        answer: `${SOURCE} the Library is listed as open 8:00 AM–6:00 PM Monday through Friday and 8:00 AM–5:00 PM Saturday. Students need a library ID card, which the excerpt says may be obtained from the librarian by presenting a registration card, completing an application, and submitting one colored 1-by-1-inch photo. The card is not transferable. The rules require silence, cleanliness, care of materials, and no sleeping, eating, or chatting; rule violations may result in being asked to leave or temporary loss of privileges.`,
        keywords: 'library hours open schedule Monday Friday Saturday library ID card application registration card photo rules silence clean food eating sleeping talking chatting books materials privileges',
      },
      {
        question: 'How long can students borrow library books, and what are the library fines?',
        answer: `${SOURCE} one reserve book may be borrowed overnight, starting at 4:00 PM and due by 9:00 AM the next day. Reference materials, pamphlets, theses, newspapers, magazines, periodicals, and book sets are for room use only; theses may not be taken out or photocopied. Books not in demand may be borrowed for one week and renewed for another week depending on demand. The excerpt lists a late-return penalty of Php 5 per day for elementary, high-school, college, and graduate students. Confirm current borrowing terms and fines with the Library.`,
        keywords: 'library borrow borrowing book reserve overnight 4 PM 9 AM reference room use thesis photocopy circulation one week renew fine overdue late return P5 5 pesos per day',
      },
      {
        question: 'What medical services and clinic hours are listed in the handbook?',
        answer: `${SOURCE} the Medical and Dental Clinic attends to minor ailments, sudden illness, and injuries from accidents on school premises; complicated cases may be referred to Morong Doctors' Hospital. The handbook lists clinic hours as Monday–Friday 6:30 AM–7:30 PM and Saturday 8:00 AM–5:00 PM. Students must present a school ID and sign in; clinic staff conduct preliminary checks and provide first aid, while the doctor may assess the patient, prescribe or refer, and request tests. The excerpt says complimentary medicine may be provided if available. It also states that students sent home with a fever of 37.5°C or higher should remain away until fever-free without medication for 24 hours, and students returning after a suspected communicable disease should be readmitted through the Clinic with a family-doctor medical certificate. Verify current hours and health directions with the Clinic.`,
        keywords: 'medical clinic health services hours open schedule minor illness injury first aid ID logbook nurse doctor referral Morong Doctors Hospital fever 37.5 communicable disease readmission certificate',
      },
      {
        question: 'When may a student be observed in the school infirmary, and what happens during observation?',
        answer: `${SOURCE} students needing monitoring may be observed in the infirmary for conditions such as nausea or vomiting, fever, vertigo, dysmenorrhea, migraine or tension headache, asthma, allergies, diarrhea with fewer than three episodes per hour, hypertension, or another condition that needs monitoring. The nurse monitors the student and updates the doctor on duty, who evaluates the situation and determines disposition. The excerpt prohibits overnight confinement in the Clinic and says the nurse records the case and notifies the student's parent or guardian and adviser. For medical concerns, follow the Clinic's current assessment and instructions.`,
        keywords: 'clinic infirmary observation temporary monitoring nausea vomiting fever vertigo dysmenorrhea migraine headache asthma allergies diarrhea LBM hypertension nurse doctor overnight parent guardian adviser',
      },
      {
        question: 'What are the school clinic medication rules?',
        answer: `${SOURCE} the handbook says prescription and non-prescription medicines are kept in the Clinic and administered by a nurse or medical assistant. Medication permits and physician statements must be filed at the start of the school year or before administration begins; prescription or dosage changes require a physician's statement, while over-the-counter medication requires a parent's note for each medication. Medicines must remain in their original container with dosage and expiration information. The excerpt says the Clinic does not supply cough drops, antibiotics, inhalers, or throat sprays; students with asthma may keep an inhaler if written parental permission or a medical prescription is on file. Confirm current requirements with the Clinic before bringing or taking medication at school.`,
        keywords: 'clinic medicine medication policy prescription nonprescription over the counter OTC nurse medical assistant parent note physician statement dosage change original container expiration asthma inhaler cough drops antibiotics throat spray',
      },
      {
        question: 'How can an organization request a first-aid kit from the Clinic?',
        answer: `${SOURCE} for an activity on or off campus, request a first-aid kit from the Clinic using a First Aid Kits Borrow Form at least one week before the event. Record medicines and supplies used in the kit's logbook. The requesting department is responsible for lost or unaccounted-for supplies; kits must be picked up from and returned to the Clinic. If a kit is lost, the department must replace its exact contents within two weeks.`,
        keywords: 'first aid kit borrow request form Clinic event activity one week advance logbook supplies medicine loss return replace exact contents two weeks',
      },
      {
        question: 'What dental services are available through the school Clinic?',
        answer: `${SOURCE} the school dentist conducts an oral screening as part of the physical examination and provides students with free dental consultation. The excerpt lists a 20% discount on other dental services for TCC students and says available medication may be dispensed for symptomatic relief. Complicated cases beyond the Clinic's equipment may be referred to Dr. Daisy Victorio's Dental Clinic. Confirm current services, discounts, and referrals with the Clinic.`,
        keywords: 'school dentist dental clinic oral examination screening free consultation 20 percent discount medication complicated case referral Dr Daisy Victorio',
      },
      {
        question: 'What services does the Guidance and Counseling Office provide, and how can I request counseling?',
        answer: `${SOURCE} the Guidance and Counseling Office coordinates guidance services and provides information and support for educational, career, emotional, and moral concerns. Listed services include maintaining student information inventories, counseling to help students understand themselves and their environment and make workable decisions, and standardized achievement, aptitude, and career testing. For a walk-in counseling request, obtain a self-referral form from the Guidance secretary, complete it with informed consent, and ask for an appointment; if the student is a minor, the excerpt says a parent or guardian must complete the consent. With a referral slip, present it to the counselor, complete informed consent, and request an appointment. Contact the office for current scheduling and confidentiality details.`,
        keywords: 'Guidance Counseling Office services counseling self referral walk in appointment informed consent minor parent guardian referral slip inventory student information testing achievement aptitude career emotional educational',
      },
      {
        question: 'How do students request entrance-exam testing or a Certificate of Good Moral Character?',
        answer: `${SOURCE} for an entrance exam, the excerpt says to complete the application through the Google Form linked or QR code posted on TCC's Facebook page, or visit the Guidance and Counseling Office to schedule. Attend at the Testing Center at the scheduled time, show a screenshot of the submitted application, claim the entrance-exam certification, and ask when results will be available. For a Certificate of Good Moral Character, obtain and complete the Guidance office request form, collect required signatures, pay the fee at the Cashier, then submit the completed form and receipt to Guidance. After verification, claim the certificate, sign the office logbook, and proceed to Registrar Window 5 for the dry seal. Confirm current forms, fees, and steps with the offices.`,
        keywords: 'entrance exam test application Google Form QR code Facebook Guidance Testing Center schedule screenshot certification result Certificate Good Moral Character request form signatures cashier fee receipt logbook Registrar Window 5 dry seal',
      },
      {
        question: 'What is the Career Placement Program for?',
        answer: `${SOURCE} the Career Placement Program, a Student Affairs support service, addresses pre-employment and employment needs of graduating students and alumni. It also networks with industry practitioners to gather feedback that can support curricular improvement and student skills development. Contact Student Affairs for current placement services and opportunities.`,
        keywords: 'career placement program employment jobs pre-employment graduating students alumni industry practitioners networking feedback curriculum improvement skills development',
      },
      {
        question: 'What approval is needed for student outreach activities?',
        answer: `${SOURCE} outreach activities initiated by students or student organizations require prior approval from both the Community Extension Services (CES) Coordinator and the Head of Student Affairs. The handbook advises organizations to reach agreement among members before starting, identify a focus based on community input, available resources, and members' skills, and publicize activities through suitable channels. Participation is voluntary and must not affect or be linked to a student's academic performance. Contact CES and OSA before making commitments or announcing an event.`,
        keywords: 'student outreach community extension CES approval coordinator Head Student Affairs OSA organization voluntary consensus community input resources skills publicity academic performance',
      },
      {
        question: 'Who can qualify for the Gawad Tomas Claudio community-service award?',
        answer: `${SOURCE} the Gawad Tomas Claudio for Excellence and Virtue in Community Service recognizes community-service dedication, leadership, and impact. The excerpt says an awardee must be a TCC student or alumnus/alumna; must have led or be leading community-engagement initiatives, with service-learning leadership or participation also considered; must have no derogatory record under institutional ethics and applicable laws or policies; and must have voluntarily led or spearheaded at least one community-service or engagement activity while at TCC. Confirm current nomination procedures and eligibility with Community Extension Services.`,
        keywords: 'Gawad Tomas Claudio award excellence virtue community service eligibility student alumni alumnus leadership engagement service learning ethical record voluntary led spearheaded CES',
      },
      {
        question: 'How do researchers request statistical services from the TCC Statistical Center?',
        answer: `${SOURCE} the Statistical Center processes only the data and output specified on the Job Order Form. The listed steps are to obtain the form from the Center, complete it, pay the SPSS fee at the Cashier and keep the receipt, then submit the form with required documents and a photocopy of the receipt to the Center. The researcher pays the total service amount before data analysis is released. Ask the Center about current forms, required documents, and fees.`,
        keywords: 'TCC Statistical Center statistics statistical services research data analysis job order form service contract SPSS fee cashier receipt documentary requirements output payment release',
      },
      {
        question: 'What originality score is required for a thesis under the handbook anti-plagiarism rules?',
        answer: `${SOURCE} the Statistical Center Head is identified as custodian and administrator of the anti-plagiarism software, and research studies submitted to the Center for statistical requirements and all theses are subject to testing. The listed minimum originality ratings are 80% for undergraduate theses and 85% for master's theses. Work below the required rating may be returned for editing or paraphrasing with proper acknowledgment, or relevant text may be quoted and acknowledged using the handbook's stated SPSS style. The excerpt says a thesis may be tested only twice. Confirm the software interpretation and current citation instructions with the Statistical Center; an originality score alone does not determine whether citation practices are adequate.`,
        keywords: 'research thesis anti plagiarism plagiarism originality rating score undergraduate 80 percent masters 85 percent Statistical Center software appeal review paraphrase acknowledgement quotation twice SPSS style',
      },
      {
        question: 'What are the student responsibilities and opportunities under the International Relations Office?',
        answer: `${SOURCE} the International Relations Office (IRO) supports international partnerships, intercultural exchange, and internationalization of education. The handbook describes opportunities such as seminars, research collaborations, workshops and conferences, joint academic programs, student exchanges, and international internships. Students are expected to follow IRO requirements, submit documents on time, attend pre-departure orientations and re-entry programs, respect host-culture norms, maintain academic and personal standards, participate actively, and provide feedback. The supplied text lists exchange-program criteria including the program's minimum GPA, good moral record, communication skills, and a recommendation from the student's dean. Confirm current opportunities and requirements with IRO.`,
        keywords: 'International Relations Office IRO international exchange study abroad student exchange internship seminars research collaboration workshops conferences joint academic programs requirements GPA good moral communication dean recommendation orientation reentry culture',
      },
      {
        question: 'What documents and steps does the handbook list for international internships?',
        answer: `${SOURCE} the handbook excerpt says internship applicants must be of legal age and understand the hosting agency's Memorandum of Agreement (MOA). Listed items include a dean's recommendation letter, signed departure and arrival forms, and an overseas visa sponsor. The excerpt also mentions completing a J-1 visa process, attending an International Cultural Exchange Program orientation with parents, and passing an interview with the visa sponsor and prospective employer. These are handbook-listed requirements and may be incomplete or outdated; confirm current program, visa, and travel requirements with IRO and the relevant authorities before relying on them.`,
        keywords: 'international internship legal age MOA memorandum agreement dean recommendation departure arrival forms visa sponsor J1 J-1 visa process cultural exchange orientation parents interview employer IRO',
      },
      {
        question: 'What is the purpose of NSTP, and what are its components?',
        answer: `${SOURCE} the National Service Training Program (NSTP) aims to develop nationalism, patriotism, civic consciousness, leadership, social responsibility, and commitment to nation-building through training and community service. The excerpt lists three components: Civic Welfare Training Service (CWTS), involving community immersion, volunteering, and outreach; Literacy Training Service (LTS), promoting literacy and numeracy through tutoring and education; and Reserve Officers' Training Corps (ROTC), providing military training, leadership, and discipline in preparation for national defense and disaster response.`,
        keywords: 'NSTP National Service Training Program purpose components CWTS Civic Welfare Training Service LTS Literacy Training Service ROTC Reserve Officers Training Corps civic consciousness patriotism nationalism community service literacy military training',
      },
      {
        question: 'Who is required or exempt from NSTP, and how long does the program take?',
        answer: `${SOURCE} the excerpt says incoming freshmen, male and female, enrolled in a baccalaureate, at least two-year technical-vocational, or associate course must complete one NSTP component as a graduation requirement. It describes one to two semesters, with three units and 54–90 training hours per semester. Listed exclusions include students who already completed the NSTP requirement and will finish or graduate from a baccalaureate or two-year TVET program; students who completed a component but transferred or shifted courses or institutions; qualifying Sangguniang Kabataan officials in good standing during their incumbency, who must submit written reports or documentation of participation; and foreign students. The excerpt summarizes RA 9163 and related rules; confirm a student's status and current requirements with the NSTP Coordinator.`,
        keywords: 'NSTP eligibility required freshman baccalaureate associate two year TVET technical vocational units semesters training hours exemption completed transferred shifted Sangguniang Kabataan SK officials good standing foreign students RA 9163',
      },
      {
        question: 'What are the NSTP attendance, conduct, and assessment expectations?',
        answer: `${SOURCE} participants are expected to attend scheduled NSTP sessions and events, demonstrate respect, discipline, teamwork, and integrity, engage actively and contribute to service projects, and follow the rules and facilitator instructions. Assessment is described as based on participation, leadership, completion of service projects, and compliance with program guidelines. Non-compliance may lead to disciplinary action, including warnings, probation, or removal from the program. Ask the NSTP coordinating body for current procedures and any announced policy amendments.`,
        keywords: 'NSTP attendance sessions conduct respect discipline teamwork integrity performance participation leadership service projects compliance rules assessment evaluation warning probation removal amendments',
      },
      {
        question: 'What student support services and facilities are listed in the handbook?',
        answer: `${SOURCE} Article V describes the Registrar as custodian of student records and provider of academic record, transcript, diploma, and credential services; Admission handles applications, enrollment, and admissions inquiries; and OSA administers student conduct and organization matters while supporting student interests. Other listed services include the Library, Medical and Dental Clinic, Guidance and Counseling, Career Placement, Community Extension Services, Statistical Center, International Relations Office, and NSTP. The handbook also describes a canteen and food-service locations, campus security and designated parking (vehicle stickers are available from HR), the D. H. Soriano Multi Media Hall/AVR, Multi-Purpose Gymnasium, CHARM Hall for school-related activities, chapel, and printing/photocopying machines in accessible locations. Confirm availability, access rules, and current hours with the relevant office.`,
        keywords: 'student support services facilities Registrar Admission OSA Library Clinic Guidance Counseling Placement CES Statistical Center IRO NSTP canteen food security parking sticker HR AVR multimedia hall gymnasium CHARM Hall chapel printing photocopying',
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
    departmentAliases: ['College of Criminology', 'Crim Department', 'Criminology Department'],
    entries: [
      {
        question: 'What is the vision of the College of Criminology?',
        answer: `${SOURCE} the College aims to set standards for crime and criminal-justice education and develop legal knowledge with the highest values of honesty, integrity, and commitment to responding to crimes effectively.`,
        keywords: 'College Criminology CRIM vision crime criminal justice education legal knowledge honesty integrity commitment',
      },
      {
        question: 'What is the mission of the College of Criminology?',
        answer: `${SOURCE} the College aspires to educate and prepare individuals for criminological study and produce desirable, competent professionals who are morally effective in criminology and law enforcement.`,
        keywords: 'College Criminology CRIM mission criminological study competent professionals morally effective law enforcement',
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
      {
        question: 'What is the vision of the College of Business and Accountancy?',
        answer: `${SOURCE} the College of Business and Accountancy's vision is to be a leading academy of graduates who shall meet the challenges of an ever-dynamic business environment.`,
        keywords: 'CBA College Business Accountancy vision leading academy graduates dynamic business environment',
      },
      {
        question: 'What is the mission of the College of Business and Accountancy?',
        answer: `${SOURCE} the College of Business and Accountancy shall equip and educate students with the theoretical, technical, and practical competencies required of business graduates within the framework of Claudian values, philosophy, and principles.`,
        keywords: 'CBA College Business Accountancy mission theoretical technical practical competencies business graduates Claudian values philosophy principles',
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
      {
        question: 'What is the vision of the College of Education and Liberal Arts?',
        answer: `${SOURCE} the College of Education and Liberal Arts vision is to be a beacon light of excellence, competence, and sustainable development in the citadel of education.`,
        keywords: 'Education Liberal Arts vision beacon light excellence competence sustainable development citadel education',
      },
      {
        question: 'What is the mission of the College of Education?',
        answer: `${SOURCE} the College of Education will develop globally competitive educators with the academic and technical skills and values needed in a rapidly changing world.`,
        keywords: 'Education mission globally competitive educators academic technical skills values rapidly changing world',
      },
    ],
  },
  {
    departmentAliases: ['CHARM', 'HM Department', 'College of Hospitality Management'],
    entries: [
      {
        question: 'What is the vision of the College of Hospitality Management?',
        answer: `${SOURCE} Hospitality Management aspires to deliver hospitality education services that meet the challenges of the globally competitive hospitality business.`,
        keywords: 'CHARM HM hospitality management vision hospitality education services globally competitive business',
      },
      {
        question: 'What is the mission of the College of Hospitality Management?',
        answer: `${SOURCE} Hospitality Management aims to educate and develop a hotelier's full potential with the skills and competencies required by globally competitive hospitality industries.`,
        keywords: 'CHARM HM hospitality management mission develop hotelier skills competencies globally competitive hospitality industries',
      },
    ],
  },
  {
    departmentAliases: ['Registrar Office', 'Registrar Department', 'Registrar'],
    entries: [
      {
        question: 'What are the admission requirements for entering freshmen?',
        answer: `${SOURCE} the excerpt lists the original School Form 9/Senior High School Card (or ALS Certificate of Rating for ALS applicants), original Certificate of Good Moral Character from the principal, one 2x2 and two passport-size photos with name tags taken within the last six months, a photocopy of the PSA birth certificate, applicable USVA/PVA entitlement certificate, Guidance Office admission-test results, and a Clinic physical exam. The excerpt may not be a complete current checklist; confirm with the Registrar before applying.`,
        keywords: 'admission requirements freshmen first year new enrollee School Form 9 SF9 senior high card ALS certificate rating good moral principal photos 2x2 passport PSA birth USVA PVA admission test guidance physical exam clinic',
      },
      {
        question: 'What are the admission requirements for transfer students?',
        answer: `${SOURCE} the excerpt lists transfer credentials/Honorable Dismissal; scholastic records showing subjects taken and corresponding grades; a Certificate of Good Moral Character signed by school officials; one 2x2 and two passport-size photos with name tags taken within the last six months; a photocopy of the PSA birth certificate; and an applicable USVA/PVA entitlement certificate. Confirm the current checklist with the Registrar.`,
        keywords: 'transfer student admission requirements transferee transfer credentials honorable dismissal scholastic records subjects grades good moral photos 2x2 passport PSA birth USVA PVA',
      },
      {
        question: 'What admission documents are listed for degree holders and cross-enrollees?',
        answer: `${SOURCE} for degree holders, the excerpt lists an original Transcript of Records, one 2x2 photo taken within the last six months, a photocopy of the PSA birth certificate, and a marriage-license photocopy for female students. For cross-enrollees it lists a Registrar-issued cross-enrollment permit, PSA birth certificate, one 2x2 photo, and marriage contract if applicable. Confirm current requirements with the Registrar.`,
        keywords: 'degree holder admission documents original TOR transcript records 2x2 photo PSA birth marriage license cross enrollee cross enrollment permit marriage contract',
      },
      {
        question: 'How do foreign students apply for a student visa according to the handbook?',
        answer: `${SOURCE} the supplied section says foreign students who are at least 18 at enrollment communicate with a Philippine higher-education institution authorized to admit foreign students and provide institutional requirements. The excerpt lists authenticated original scholastic records, original Certificate of Good Moral Character, birth-certificate photocopy, passport with at least six months validity, notarized medical-health certificate (FA Form 11), a $250 cash fee, two recent 2x2 photos, certified true copy of a Personal History Statement, and police clearance bearing the issuing officer's signature and agency seal. This is a handbook excerpt, not immigration advice; verify current requirements with TCC and the Bureau of Immigration.`,
        keywords: 'foreign international student visa requirements age 18 scholastic records authenticated good moral passport six months medical health FA Form 11 250 dollars photos personal history statement police clearance',
      },
      {
        question: 'What does the handbook say about admission of expectant mothers?',
        answer: `${SOURCE} the excerpt says an expectant mother may be admitted if the expected delivery date, certified by the College Health Clinic, does not fall during the semester or summer term of enrollment. It says the certification should be submitted upon enrollment and that the student should leave school six weeks before the expected date or follow an agreement with the program head. Contact Admissions and the Clinic for current guidance and accommodations.`,
        keywords: 'expectant mother pregnant admission enrollment delivery due date certificate health clinic semester summer term six weeks program head',
      },
      {
        question: 'How do freshmen and transferees apply for admission?',
        answer: `${SOURCE} the listed steps are: take the entrance examination and secure its result; attend an interview conducted by the program representative; and submit admission requirements and the entrance-examination certificate to the Registrar's Office.`,
        keywords: 'freshman transferee admission process entrance examination result program representative interview submit requirements registrar',
      },
      {
        question: 'How do cross-enrollees apply at TCC?',
        answer: `${SOURCE} cross-enrollees should first check with the Dean's Office whether the desired subject is offered. The Dean endorses the applicant to the Registrar for admission; the applicant then completes the Registrar's admission application, submits credentials, secures an enrollment permit and student number, and proceeds to the College Dean's Office for enrollment. The handbook separately limits cross-enrollment to graduating students in their final term when a needed subject is not offered at TCC.`,
        keywords: 'cross enrollee admission procedure Dean subject offered endorsement registrar application credentials permit student number enrollment',
      },
      {
        question: 'How do I secure a scholastic record from TCC?',
        answer: `${SOURCE} the listed steps are to complete an application form and requisition slip from the Registrar's Office, pay the required fees, and claim the scholastic records after two weeks upon verification. Confirm current processing times and fees with the Registrar.`,
        keywords: 'secure scholastic records academic record application form requisition slip registrar fees claim two weeks verification',
      },
      {
        question: 'How do I apply for transfer credentials?',
        answer: `${SOURCE} complete the transfer-credential application and request form at the Registrar's Office, pay the required fees, and claim the transfer credentials after two weeks upon verification. Confirm current requirements and timing with the Registrar.`,
        keywords: 'transfer credentials transfer credential application request form registrar fees two weeks verification honorable dismissal',
      },
      {
        question: 'How do I apply for graduation?',
        answer: `${SOURCE} the listed steps are to complete and submit the graduation application form to the Registrar's Office, pay the required fees, submit all credentials to the Registrar, and return after two weeks for verification. Confirm deadlines and current requirements with the Registrar.`,
        keywords: 'application graduation graduate requirements form registrar credentials fees two weeks verification',
      },
      {
        question: 'How long does it take to claim a diploma and Transcript of Records?',
        answer: `${SOURCE} submit the diploma application form and Transcript of Records request form to the Registrar's Office and pay applicable fees. The excerpt says the diploma and TOR may be claimed two weeks after request. Confirm the projected release date with the Registrar.`,
        keywords: 'diploma transcript records TOR claim request form registrar fees two weeks release',
      },
      {
        question: 'What is the enrollment procedure for old or returning students?',
        answer: `${SOURCE} the excerpt says old or returning students should secure a grade evaluation from the Registrar's Office and then follow the enrollment steps. It also lists filling out a pre-registration form with the curriculum checklist, copying the class schedule from the Dean's Office, getting subject encoding at the Registrar with the adviser's signature, and fee assessment at Accounting. The excerpt continues with cashier payment, submitting forms to Accounting, Registrar, and Dean's offices, and proceeding to the respective College Dean's Office. Confirm the current sequence with those offices.`,
        keywords: 'enrollment procedure old returning student grade evaluation pre-registration curriculum checklist class schedule dean adviser registrar subject encoding accounting assessment cashier payment forms',
      },
      {
        question: 'How can a student cross-enroll at another school?',
        answer: `${SOURCE} cross-enrollment is limited to graduating students in their final term when a subject needed for graduation is not offered at TCC during that term. The listed steps are to complete the Registrar's cross-enrollment form, obtain College Dean approval, present the approved permit to the receiving school, and submit approved enrollment and registration forms to the Registrar. Confirm eligibility and procedure before enrolling elsewhere.`,
        keywords: 'cross enroll cross-enrollment another school graduating final term subject not offered TCC registrar form dean approval permit receiving school registration',
      },
      {
        question: 'When may I add or change a subject?',
        answer: `${SOURCE} the excerpt says adding or changing subjects is allowed only in the third week from the start of classes. The student completes the Registrar's form, gets approval from the professors for the affected subjects and the Dean, then returns the form to the Registrar for encoding. The listed procedure also says to submit copies to the Registrar, Accounting, and Dean's Office. Confirm the current academic calendar and deadlines.`,
        keywords: 'add adding change changing subject course third week start classes registrar form professor dean approval encoding accounting deadline',
      },
      {
        question: 'What is the policy for dropping a subject?',
        answer: `${SOURCE} a subject drop must be acknowledged by the Dean and professor and officially reported to the Registrar on the prescribed form. The excerpt says drops within the allowed load-revision period will not appear in the permanent record; a drop after the enrollment period but before preliminary examinations receives an A.W. (Authorized Withdrawal). No drops are allowed after preliminary examinations. An unofficial drop may receive U.W. and be treated as a failing grade. Confirm dates and your case with the Registrar and Dean.`,
        keywords: 'drop dropping subject course dean professor registrar prescribed form load revision AW authorized withdrawal preliminary examinations UW unauthorized withdrawal failing grade',
      },
      {
        question: 'How can I request correction of a final grade?',
        answer: `${SOURCE} a grade correction requires a valid reason and supporting evidence such as class records, computational tabulation, or test papers. The excerpt says to obtain a Petition for Change of Grades form from the Registrar after approval through the Office of the President. A reconsideration request should be made within 30 days after the student receives the Registrar's final-grade sheet. Confirm the current process with the Registrar.`,
        keywords: 'change correct grade final grade reconsideration petition form valid reason evidence class records computation test papers President registrar 30 days',
      },
      {
        question: 'How long do I have to complete an incomplete grade?',
        answer: `${SOURCE} a student with an incomplete grade must complete it within one year of its occurrence by completing the form obtained from the Registrar's Office.`,
        keywords: 'incomplete INC grade completion one year registrar completion form',
      },
      {
        question: 'What reasons are listed for cancellation of registration?',
        answer: `${SOURCE} cancellation of registration means withdrawal from all subjects before the official start of classes. The excerpt lists illness preventing return to school, a residence transfer that makes attendance difficult, or employment conflicting with the class schedule. It says cancellation must not be used to avoid a failing grade. Ask the Registrar about documentation and the current procedure.`,
        keywords: 'cancel cancellation registration withdraw all subjects before official classes illness residence transfer employment conflicting schedule failing grade',
      },
      {
        question: 'Can a graduating student take an overload?',
        answer: `${SOURCE} a graduating student may be allowed up to six academic units above the institution's normal load in the final term. The excerpt also says multiple PE subjects may be allowed case by case and gives required request information, including the student's name, reason, PE schedule, and Registrar endorsement stating “Graduation upon completion of load.” Approval is not automatic; consult the Dean and Registrar.`,
        keywords: 'graduating student overload excess academic units six 6 final term PE subjects case by case request dean registrar graduation completion load',
      },
      {
        question: 'Can credits from another school be recognized?',
        answer: `${SOURCE} credits from another school may be recognized if the subjects are similar in content to, or are cognates of, subjects in TCC's curriculum and are sequenced appropriately in the course where the credits are applied. The excerpt does not specify the evaluation steps; ask the Dean or Registrar.`,
        keywords: 'credit transfer other school subjects recognized similar content cognates curriculum course sequence credit evaluation',
      },
      {
        question: 'How long is a TCC school year according to the handbook?',
        answer: `${SOURCE} the school year consists of two 18-week semesters. TCC also offers a six-week summer term. The excerpt states that each semester and summer term consists of 54 hours of formal classroom instruction and examination, as required by CHED.`,
        keywords: 'school year academic calendar semester 18 weeks two semesters summer term six weeks 54 hours instruction examination CHED',
      },
      {
        question: 'What is the attendance requirement for college subjects?',
        answer: `${SOURCE} college students are required to attend at least 80% of class periods in each subject to earn the corresponding units. The excerpt says there are no excused absences and students should attend punctually and regularly. For health-related absences, submit a doctor's certificate; for other absences, present an excuse letter from a parent or guardian.`,
        keywords: 'college classroom attendance 80 percent class periods absences no excused absence punctual regular doctor certificate excuse letter parent guardian units',
      },
      {
        question: 'How many absences are allowed for a college subject?',
        answer: `${SOURCE} the excerpt lists maximum accumulated absences of 3 class hours for a 1-unit subject, 6 for 2 units, 9 for 3 units, 12 for 4 units, 15 for 5 units, and 18 for 6 units. It says exceeding the maximum may result in a 5.00 grade; students who exceed half the allowed absences are referred to Guidance by the instructor. Confirm how class hours are calculated for your subject with your instructor.`,
        keywords: 'maximum absences allowed class hours 1 unit 2 3 4 5 6 units 3 6 9 12 15 18 hours 5.00 guidance',
      },
      {
        question: 'How are college preliminary, midterm, and semifinal grades computed?',
        answer: `${SOURCE} for each of the preliminary, midterm, and semifinal grades, the excerpt lists class participation as 60% and the corresponding examination as 40%. The supplied grade-scale table is fragmented, so the assistant cannot reliably map percentages to all grade equivalents from this excerpt; confirm the complete grading scale with your instructor or Dean.`,
        keywords: 'college grading system preliminary PTG midterm MTG semifinal STG class participation 60 percent exam 40 percent grade scale equivalent',
      },
      {
        question: 'What is the handbook grade conversion table?',
        answer: `${SOURCE} the supplied conversion table maps: 1.0 to 100%; 1.1 to 98–99%; 1.2 to 97%; 1.3 to 95–96%; 1.4 to 94%; 1.5 to 93%; 1.6 to 92%; 1.7 to 91%; 1.8 to 89–90%; 1.9 to 88%; 2.0 to 87%; 2.1 to 86%; 2.2 to 85%; 2.3 to 83–84%; 2.4 to 82%; 2.5 to 81%; 2.6 to 80%; 2.7 to 79%; 2.8 to 77–78%; 2.9 to 76%; and 3.0 to 75%, listed as Competent. The excerpt lists 3.1–5.0 as below 75% / Not Competent and also lists 5.0 as Failed. It gives NCA as No Credit Due to Absences, NG as No Grade, and NC as No Credit. Ask the Registrar or instructor to confirm how this table applies to a particular course or record.`,
        keywords: 'grade conversion table percentage grade point equivalent 1.0 1.1 1.2 2.0 3.0 5.0 competent not competent failed NCA NG NC no credit absences',
      },
      {
        question: 'What are the graduation requirements listed in the handbook?',
        answer: `${SOURCE} the listed requirements are: file the graduation application on the prescribed form with the Registrar during the last term; have complete school records ready for final credit evaluation; complete at least one year of residence at the College; complete at least 80% of major-subject work in residence; and clear all financial, property, and administrative accountabilities. The handbook also says all curriculum requirements must be completed before recommendation for a degree, title, or certificate. Confirm the current checklist and deadlines with the Registrar.`,
        keywords: 'graduation requirements graduate application prescribed form registrar last term records credit evaluation residence one year 80 percent major credits clearance financial property administrative curriculum',
      },
      {
        question: 'What GWA and grade requirements are listed for Latin honors?',
        answer: `${SOURCE} the Latin-honor ranges listed are: Summa Cum Laude, GWA 1.00–1.20, with no grade lower than 1.70 in major subjects or 1.50 in minor subjects; Magna Cum Laude, GWA 1.21–1.50, with no grade lower than 2.00 in major subjects or 1.70 in minor subjects; and Cum Laude, GWA 1.51–1.70, with no grade lower than 2.20 in major subjects or 2.00 in minor subjects. The excerpt also says a grade below 2.20 in any subject, including non-credit/non-academic and institutional subjects, disqualifies a student from the honor roll. Confirm the current resolution and full requirements with the Registrar or Dean.`,
        keywords: 'Latin honors Summa Cum Laude Magna Cum Laude Cum Laude GWA GPA grade requirements major minor 1.0 1.2 1.7 1.5 2.2 honor roll academic distinction',
      },
      {
        question: 'Which grades disqualify a student from the honor list or TCC Scholarship Grant?',
        answer: `${SOURCE} the excerpt says Incomplete (INC), Authorized Withdrawal (AW), Unauthorized Withdrawal (UW), Authorized Drop (AD), No Grade (NG), No Credit (NC), and No Credit due to Absences (NCA) in any enrolled course disqualify a student from the Honor's List and TCC Scholarship Grant, even if an incomplete is later completed. Confirm the current resolution and its effective period with the Registrar or Dean.`,
        keywords: 'honor list honor roll scholarship grant disqualified INC incomplete AW authorized withdrawal UW unauthorized AD authorized drop NG no grade NC no credit NCA absences',
      },
      {
        question: 'What are the requirements for graduation commencement exercises?',
        answer: `${SOURCE} students are recommended for a degree, title, or certificate only after completing curriculum requirements and clearing obligations to the College. Candidates are required to wear the College-prescribed academic costume during the academic procession and graduation exercises, including the tassel color adopted for their degree department.`,
        keywords: 'commencement graduation ceremony academic costume attire procession tassel color clear obligations curriculum degree certificate',
      },
      {
        question: 'What is the TCC Loyalty Award?',
        answer: `${SOURCE} the Loyalty Award excerpt describes Gold and Silver Medal categories for students who studied continuously at TCC without transferring at the specified school levels. The Gold description includes Kindergarten through Grade 12 and continued study through collegiate, graduate, and post-graduate/JD levels; the Silver description begins with Grades 7–10 and Grades 11–12, then lists continued study at collegiate, graduate, and post-graduate/JD levels. The eligibility wording is difficult to interpret from the excerpt, so ask the Registrar to confirm which levels and completion history qualify.`,
        keywords: 'loyalty award Gold Medal Silver Medal continuous study residency no transfer kindergarten elementary junior high senior high collegiate graduate postgraduate JD eligibility',
      },
      {
        question: 'What tassel colors are listed for TCC degree programs?',
        answer: `${SOURCE} the excerpt lists: BS Nursing—Gold; BS Physical Therapy—Green; BS Criminology—Maroon; BS Accountancy—Yellow; BS Public Administration—Yellow; BS Business Administration—Yellow; BS Hospitality Management—Red; BS Computer Science—Royal Blue; BEEd and BSEd—Light Blue; MA Education and MA Counseling—Blue; Master of Arts in Business Administration—Yellow; MPA—Maroon; and Juris Doctor—Purple. Confirm the prescribed academic attire with the Registrar before commencement.`,
        keywords: 'tassel colors graduation academic costume BSN nursing gold BSPT green criminology maroon accountancy yellow public administration BSBA BSHM red BSCS royal blue BEEd BSEd light blue MAED MAC blue MBA MPA JD purple',
      },
      {
        question: 'Who may be excluded or disqualified from admission under the handbook?',
        answer: `${SOURCE} as a general rule, the College may not accept applicants who were refused admission elsewhere for academic deficiencies or discipline; were previously admitted to TCC but not readmitted under its discipline rules; transfer from a school without government authority or recognition to operate; or have highly contagious or communicable diseases or mental disorders. This excerpt summarizes a handbook policy, not an individual admission decision; contact Admissions or the Registrar for guidance.`,
        keywords: 'admission exclusion disqualification refused admission academic deficiencies discipline readmission transfer school government authority recognition contagious communicable disease mental disorder',
      },
      {
        question: 'What does the handbook say about student retention?',
        answer: `${SOURCE} bona fide students have a right to continue their studies until finishing the level of instruction they started, subject to exceptions for violations of student-conduct rules and academic deficiencies. For an individual decision, consult the Dean or Registrar.`,
        keywords: 'student retention continue studies right exceptions school rules conduct academic deficiencies bona fide',
      },
    ],
  },
  {
    departmentAliases: ['Accounting Department', 'Accounting'],
    entries: [
      {
        question: 'Where is the schedule of tuition and other fees posted?',
        answer: `${SOURCE} the schedule of fees and other charges for each semester and summer term is posted on the bulletin board. The excerpt does not contain the current amounts; check the posted schedule or ask Accounting.`,
        keywords: 'tuition fees charges schedule amount cost semester summer term bulletin board accounting',
      },
      {
        question: 'What payment arrangements are listed for tuition and fees?',
        answer: `${SOURCE} fees are payable at the Cashier's Office upon registration. Installment arrangements may be made with the Office of the Treasurer. The listed installments are upon registration, before the first preliminary examination, before the midterm examination, before the semifinal examination, and before the final examination. The excerpt cautions that installments do not mean fees are payable monthly and says withdrawal does not remove responsibility for unpaid balances for the term. Confirm current arrangements with the Treasurer or Accounting.`,
        keywords: 'tuition payment fees installment schedule cashier Treasurer registration preliminary midterm semifinal final examination monthly balance withdrawal',
      },
      {
        question: 'What tuition discounts are listed in the 2025 handbook?',
        answer: `${SOURCE} the excerpt lists: an Early Bird discount of 20% of tuition for the first 100 freshmen enrolling for the first semester only (not transferees or repeaters); a 20% sibling discount and 20% spouse discount for currently enrolled family members; a 10% cash-payment tuition discount for paying in full upon enrollment, with a two-week grace period after classes open to complete payment; and entrance honors scholarships for ranks 1–3, although the supplied excerpt only includes the Rank 1 amount of 100%. The associated note says certification from previous schools must be submitted at Window 7 and that this applies to Grade 6, 10, and 12 graduates. Confirm current availability, complete rank amounts, documents, deadlines, and eligibility with Accounting before relying on a discount.`,
        keywords: 'tuition discounts scholarship early bird first 100 freshmen 20 percent sibling spouse 10 percent cash payment honors entrance scholarship rank 1 2 3 100 percent Window 7 Grade 6 10 12',
      },
      {
        question: 'What documents are needed for sibling or spouse tuition discounts?',
        answer: `${SOURCE} for the sibling discount, the excerpt asks for a photocopy of birth certificates submitted to Window 7 by the end of the school year. For the spouse discount it asks for a photocopy of the marriage certificate at Window 7, but the next sentence refers to a birth-certificate deadline; this appears inconsistent in the supplied text. Confirm the correct document and deadline with Accounting.`,
        keywords: 'sibling spouse discount requirements birth certificate marriage certificate photocopy Window 7 deadline accounting',
      },
      {
        question: 'How much is the discount for student-athlete competition results?',
        answer: `${SOURCE} the athletic discount excerpt lists 50% tuition discount for first place at provincial level, 75% for first place at regional level, and 100% for first place at national level. The excerpt does not specify all application documents, timing, or renewal conditions; confirm with the school.`,
        keywords: 'athlete sports competition discount provincial regional national first place 50 75 100 percent tuition scholarship',
      },
      {
        question: 'What does the handbook say about refund amounts after withdrawing?',
        answer: `${SOURCE} the supplied withdrawal and refund excerpts contain overlapping rules: they mention charges of 10% in the first week and 20% in the second week; another passage says charges after the second week may be the total amount, while a later passage mentions 50% of fees from the third week for a justifiable reason supported by medical records and a doctor's certification. The text also says registration fees may be deducted if the student never attended, and tuition may be charged through the last month attended if the student attended even one day. Because these passages may depend on different circumstances and are not fully consistent in the supplied extract, ask Accounting for a written calculation for your case.`,
        keywords: 'refund withdrawal cancellation registration fees first week second week third week 10 percent 20 percent 50 percent medical certificate illness attended tuition accounting',
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
