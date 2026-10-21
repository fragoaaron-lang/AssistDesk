-- Insert any missing Nursing Department FAQ rows.
-- Safe to rerun: exact existing questions for the department are skipped.
INSERT INTO faqs (department_id, question, answer, keywords)
SELECT department.id, faq.question, faq.answer, faq.keywords
FROM departments AS department
JOIN (
  SELECT
    'Who is the dean, secretary, or point person of the Nursing Department?' AS question,
    'The dean of the Nursing Department is Dean Perlita Santiago. The secretary and point person were not provided.' AS answer,
    'nursing nursing department college of nursing dean dean name perlita santiago dean perlita who is the dean nursing secretary nursing secretary point person nursing contact person department head nursing chair head of nursing nsg bsn college officer' AS keywords
  UNION ALL SELECT
    'Where can I get the modules or books in the Nursing Department?',
    'You can get the modules at the Library, or avail of Nursing books at the Dean''s Office. In some cases, professors provide the books and e-books.',
    'nursing nursing department college of nursing modules module books book textbooks text books ebook e books e-book learning materials study materials library nursing library dean office dean''s office professors professor instructor faculty where to get books where to get modules'
  UNION ALL SELECT
    'Where can I get Nursing uniforms?',
    'Nursing uniforms are available at the Nightingales Office, beside the Anatomy Room.',
    'nursing nursing department college of nursing uniform uniforms nursing uniform scrub scrubs attire clothing nightingales nightingales office anatomy room beside anatomy room where to buy uniform where to get uniform'
  UNION ALL SELECT
    'Where can I get the Nursing class schedule?',
    'You can wait for the class schedule or check it on the bulletin board in front of the Dean''s Office.',
    'nursing nursing department college of nursing class schedule class schedules timetable schedule subjects classes bulletin board dean office dean''s office in front of dean office when are classes schedule posting where to check schedule'
  UNION ALL SELECT
    'Where is the Nursing Department building?',
    'The Nursing Department building is near the Administration Building on the right side. Nursing department faculty can be found on the third floor of the Administration Building.',
    'nursing nursing department college of nursing building location address campus where is nursing department where is nursing building administration building admin building right side faculty teachers instructors third floor 3rd floor third level'
) AS faq
  ON LOWER(TRIM(department.name)) IN ('nursing', 'nursing department', 'college of nursing')
LEFT JOIN faqs AS existing
  ON existing.department_id = department.id
  AND LOWER(TRIM(existing.question)) = LOWER(TRIM(faq.question))
WHERE existing.id IS NULL;
