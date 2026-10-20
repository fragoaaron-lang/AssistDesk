-- Seed the supplied parent/student-concern FAQs for Basic Education.
-- Existing identical questions for this department are left untouched.
INSERT INTO faqs (department_id, question, answer, keywords)
SELECT department.id, faq.question, faq.answer, faq.keywords
FROM departments AS department
JOIN (
  SELECT
    'Where can parents inquire about a student concern?' AS question,
    'Parents may inquire at the Office of the Principal, either by phone or in person.' AS answer,
    'basic education parent student concern principal office call phone visit' AS keywords
  UNION ALL SELECT
    'Where can I ask school activities or announcement?',
    'Check the Facebook page called “TCC Basic Education Department.” Announcements may also be shared with the department through its group chat by the responding coordinator.',
    'basic education school activities announcement facebook group chat coordinator'
  UNION ALL SELECT
    'Where can parents report for concern about the attendance?',
    'Parents may approach the class adviser or subject teachers about attendance concerns.',
    'basic education parent attendance absence class adviser subject teacher'
  UNION ALL SELECT
    'Where can parents inquire about students’ behavior concern?',
    'Parents should first approach the homeroom adviser. In some cases, the Prefect of Discipline may also assist.',
    'basic education parent student behavior concern homeroom adviser prefect discipline'
  UNION ALL SELECT
    'Where can I inquire about report card release?',
    'Ask the student’s adviser about report card release.',
    'basic education report card release adviser grades'
  UNION ALL SELECT
    'Who should I approach regarding a concern with a teacher?',
    'Approach the principal first. The principal will speak with the teacher involved.',
    'basic education concern complaint teacher principal'
  UNION ALL SELECT
    'What should I do if my child''s School ID is lost or damaged?',
    'Report the lost or damaged ID to the adviser to request a replacement.',
    'basic education school id lost damaged replacement adviser'
) AS faq
LEFT JOIN faqs AS existing
  ON existing.department_id = department.id
  AND LOWER(TRIM(existing.question)) = LOWER(TRIM(faq.question))
WHERE department.name = 'Basic Education Department'
  AND existing.id IS NULL;
