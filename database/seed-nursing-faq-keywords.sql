-- Expand the search keywords for the five Nursing Department FAQs.
-- This is one MySQL UPDATE statement; it does not add or duplicate FAQ rows.
UPDATE faqs AS faq
JOIN departments AS department ON department.id = faq.department_id
SET faq.keywords = CASE faq.question
  WHEN 'Who is the dean, secretary, or point person of the Nursing Department?'
    THEN 'nursing nursing department college of nursing dean dean name perlita santiago dean perlita who is the dean nursing secretary nursing secretary point person nursing contact person department head nursing chair head of nursing nsg bsn college officer'
  WHEN 'Where can I get the modules or books in the Nursing Department?'
    THEN 'nursing nursing department college of nursing modules module books book textbooks text books ebook e books e-book learning materials study materials library nursing library dean office dean''s office professors professor instructor faculty where to get books where to get modules'
  WHEN 'Where can I get Nursing uniforms?'
    THEN 'nursing nursing department college of nursing uniform uniforms nursing uniform scrub scrubs attire clothing nightingales nightingales office anatomy room beside anatomy room where to buy uniform where to get uniform'
  WHEN 'Where can I get the Nursing class schedule?'
    THEN 'nursing nursing department college of nursing class schedule class schedules timetable schedule subjects classes bulletin board dean office dean''s office in front of dean office when are classes schedule posting where to check schedule'
  WHEN 'Where is the Nursing Department building?'
    THEN 'nursing nursing department college of nursing building location address campus where is nursing department where is nursing building administration building admin building right side faculty teachers instructors third floor 3rd floor third level'
  ELSE faq.keywords
END
WHERE LOWER(department.name) IN ('nursing', 'nursing department', 'college of nursing')
  AND faq.question IN (
    'Who is the dean, secretary, or point person of the Nursing Department?',
    'Where can I get the modules or books in the Nursing Department?',
    'Where can I get Nursing uniforms?',
    'Where can I get the Nursing class schedule?',
    'Where is the Nursing Department building?'
  );
