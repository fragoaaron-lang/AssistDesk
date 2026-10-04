-- Railway MySQL SQL editor accepts one statement per execution.
-- Run Query 1, then Query 2, then Query 3, then Query 4 separately.

-- Query 1: Create the department if it does not exist.
INSERT INTO departments (name, description, office_hours, created_at)
SELECT
  'Basic Education Department',
  'Handles Kindergarten, Elementary, Junior High School, and Senior High School concerns.',
  '6:30 AM to 2:30 PM',
  CURRENT_TIMESTAMP
WHERE NOT EXISTS (
  SELECT 1
  FROM departments
  WHERE LOWER(TRIM(name)) = LOWER('Basic Education Department')
);

-- Query 2: Set the department office hours.
UPDATE departments
SET office_hours = '6:30 AM to 2:30 PM'
WHERE id = (
  SELECT department_id
  FROM (
    SELECT id AS department_id
    FROM departments
    WHERE LOWER(TRIM(name)) = LOWER('Basic Education Department')
    ORDER BY id
    LIMIT 1
  ) AS basic_ed
);

-- Query 3: Update matching existing FAQs (including legacy principal, uniform, books, ID, schedule, and location questions).
UPDATE faqs AS faq
JOIN (
  SELECT 'Who is the principal of Basic Education?' AS question, 'The principal of Basic Education is Mr. Dindo C. Punzalan.' AS answer, 'basic education principal dindo c punzalan' AS keywords
  UNION ALL SELECT 'Who is the assistant principal of Basic Education?', 'The assistant principal is Mr. Rodolfo G. Hernandez Jr.', 'basic education assistant principal rodolfo hernandez'
  UNION ALL SELECT 'Where can parents inquire about a student concern?', 'Parents may contact or visit the Office of the Principal about a student concern.', 'basic education parent student concern principal office call visit'
  UNION ALL SELECT 'How can I contact the Basic Education principal?', 'Contact the principal through the TCC Basic Education Department Facebook page, by email at tccelbasiceddepartment10421@gmail.com, or by calling the Office of the Principal hotline at 571-3966.', 'basic education principal contact facebook email hotline phone 571 3966'
  UNION ALL SELECT 'Where can I ask about school activities or announcements?', 'Check the TCC Basic Education Department Facebook page. Announcements may also be shared through the department group chat by the responding coordinator.', 'basic education school activities announcements facebook group chat coordinator'
  UNION ALL SELECT 'Where can parents report attendance concerns?', 'Parents may approach the class adviser or subject teachers about attendance concerns.', 'basic education parent attendance absence class adviser subject teacher'
  UNION ALL SELECT 'Where can parents inquire about a student behavior concern?', 'Parents should first approach the homeroom adviser. In some cases, the Prefect of Discipline may also assist.', 'basic education parent student behavior concern homeroom adviser prefect discipline'
  UNION ALL SELECT 'Where can I inquire about report card release?', 'Ask the student adviser about report card release.', 'basic education report card release adviser grades'
  UNION ALL SELECT 'Who should I approach about a concern with a teacher?', 'Approach the principal first. The principal will speak with the teacher involved.', 'basic education concern complaint teacher principal'
  UNION ALL SELECT 'What should I do if my Basic Education school ID is lost or damaged?', 'Report the lost or damaged ID to the adviser to request a replacement.', 'basic education school id lost damaged replacement adviser'
  UNION ALL SELECT 'Where can parents ask about academic performance?', 'For a concern about a particular subject, approach that subject teacher.', 'basic education parent academic performance grades subject teacher'
  UNION ALL SELECT 'Where can I get a Basic Education uniform or PE uniform?', 'Basic Education uniforms and PE uniforms are available at the Office of the Principal.', 'basic education uniform pe uniform principal office'
  UNION ALL SELECT 'Where can I get Basic Education books?', 'Ask at the Accounting Office or Accounting Department about getting books.', 'basic education books accounting office department textbooks'
  UNION ALL SELECT 'Where can I get my Basic Education school ID?', 'School IDs are taken by section according to the school schedule. The adviser will announce the release date once available.', 'basic education school id photo section schedule release adviser'
  UNION ALL SELECT 'How can I get a library ID in Basic Education?', 'Ask the librarian at the Basic Education Library for a library ID.', 'basic education library id librarian card'
  UNION ALL SELECT 'What are the office hours of the Basic Education Department?', 'The Basic Education Department office hours are 6:30 AM to 2:30 PM.', 'basic education department office hours opening schedule 6 30 am 2 30 pm'
  UNION ALL SELECT 'Where can I get Form 138?', 'Ask the class adviser about Form 138. The adviser can request it from the Registrar Office. After graduation, the adviser will provide the release date.', 'basic education form 138 report card registrar adviser graduate release date'
  UNION ALL SELECT 'Where can I find the Basic Education Library?', 'The Basic Education Library is on the ground floor of the Senior High School Building.', 'basic education library location ground floor senior high school shs building'
  UNION ALL SELECT 'Where is the Basic Education principal''s office located?', 'The Principal''s Office is alongside the CS Building, at the farthest right.', 'basic education principal office location cs building farthest right'
) AS seed
  ON LOWER(TRIM(faq.question)) = LOWER(TRIM(seed.question))
SET faq.answer = seed.answer,
    faq.keywords = seed.keywords
WHERE faq.department_id = (
  SELECT department_id
  FROM (
    SELECT id AS department_id
    FROM departments
    WHERE LOWER(TRIM(name)) = LOWER('Basic Education Department')
    ORDER BY id
    LIMIT 1
  ) AS basic_ed
);

-- Query 4: Insert only FAQs that are not already present for this department.
INSERT INTO faqs (department_id, question, answer, keywords)
SELECT department.id, seed.question, seed.answer, seed.keywords
FROM departments AS department
CROSS JOIN (
  SELECT 'Who is the principal of Basic Education?' AS question, 'The principal of Basic Education is Mr. Dindo C. Punzalan.' AS answer, 'basic education principal dindo c punzalan' AS keywords
  UNION ALL SELECT 'Who is the assistant principal of Basic Education?', 'The assistant principal is Mr. Rodolfo G. Hernandez Jr.', 'basic education assistant principal rodolfo hernandez'
  UNION ALL SELECT 'Where can parents inquire about a student concern?', 'Parents may contact or visit the Office of the Principal about a student concern.', 'basic education parent student concern principal office call visit'
  UNION ALL SELECT 'How can I contact the Basic Education principal?', 'Contact the principal through the TCC Basic Education Department Facebook page, by email at tccelbasiceddepartment10421@gmail.com, or by calling the Office of the Principal hotline at 571-3966.', 'basic education principal contact facebook email hotline phone 571 3966'
  UNION ALL SELECT 'Where can I ask about school activities or announcements?', 'Check the TCC Basic Education Department Facebook page. Announcements may also be shared through the department group chat by the responding coordinator.', 'basic education school activities announcements facebook group chat coordinator'
  UNION ALL SELECT 'Where can parents report attendance concerns?', 'Parents may approach the class adviser or subject teachers about attendance concerns.', 'basic education parent attendance absence class adviser subject teacher'
  UNION ALL SELECT 'Where can parents inquire about a student behavior concern?', 'Parents should first approach the homeroom adviser. In some cases, the Prefect of Discipline may also assist.', 'basic education parent student behavior concern homeroom adviser prefect discipline'
  UNION ALL SELECT 'Where can I inquire about report card release?', 'Ask the student adviser about report card release.', 'basic education report card release adviser grades'
  UNION ALL SELECT 'Who should I approach about a concern with a teacher?', 'Approach the principal first. The principal will speak with the teacher involved.', 'basic education concern complaint teacher principal'
  UNION ALL SELECT 'What should I do if my Basic Education school ID is lost or damaged?', 'Report the lost or damaged ID to the adviser to request a replacement.', 'basic education school id lost damaged replacement adviser'
  UNION ALL SELECT 'Where can parents ask about academic performance?', 'For a concern about a particular subject, approach that subject teacher.', 'basic education parent academic performance grades subject teacher'
  UNION ALL SELECT 'Where can I get a Basic Education uniform or PE uniform?', 'Basic Education uniforms and PE uniforms are available at the Office of the Principal.', 'basic education uniform pe uniform principal office'
  UNION ALL SELECT 'Where can I get Basic Education books?', 'Ask at the Accounting Office or Accounting Department about getting books.', 'basic education books accounting office department textbooks'
  UNION ALL SELECT 'Where can I get my Basic Education school ID?', 'School IDs are taken by section according to the school schedule. The adviser will announce the release date once available.', 'basic education school id photo section schedule release adviser'
  UNION ALL SELECT 'How can I get a library ID in Basic Education?', 'Ask the librarian at the Basic Education Library for a library ID.', 'basic education library id librarian card'
  UNION ALL SELECT 'What are the office hours of the Basic Education Department?', 'The Basic Education Department office hours are 6:30 AM to 2:30 PM.', 'basic education department office hours opening schedule 6 30 am 2 30 pm'
  UNION ALL SELECT 'Where can I get Form 138?', 'Ask the class adviser about Form 138. The adviser can request it from the Registrar Office. After graduation, the adviser will provide the release date.', 'basic education form 138 report card registrar adviser graduate release date'
  UNION ALL SELECT 'Where can I find the Basic Education Library?', 'The Basic Education Library is on the ground floor of the Senior High School Building.', 'basic education library location ground floor senior high school shs building'
  UNION ALL SELECT 'Where is the Basic Education principal''s office located?', 'The Principal''s Office is alongside the CS Building, at the farthest right.', 'basic education principal office location cs building farthest right'
) AS seed
WHERE department.id = (
  SELECT department_id
  FROM (
    SELECT id AS department_id
    FROM departments
    WHERE LOWER(TRIM(name)) = LOWER('Basic Education Department')
    ORDER BY id
    LIMIT 1
  ) AS basic_ed
)
AND NOT EXISTS (
  SELECT 1
  FROM faqs AS existing
  WHERE existing.department_id = department.id
    AND LOWER(TRIM(existing.question)) = LOWER(TRIM(seed.question))
);
