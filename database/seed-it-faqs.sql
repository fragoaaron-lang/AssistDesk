-- Railway MySQL SQL editor accepts one statement per execution.
-- Run Query 1, then Query 2, then Query 3, then Query 4 separately.

-- Query 1: Create an IT department if no known name variant exists.
INSERT INTO departments (name, description, office_hours, created_at)
SELECT
  'IT department',
  'Provides computer laboratory, Internet Room, CCTV, and IT technical support.',
  'Monday-Friday 8:00 AM to 5:00 PM; closed Saturday',
  CURRENT_TIMESTAMP
WHERE NOT EXISTS (
  SELECT 1
  FROM departments
  WHERE LOWER(TRIM(name)) IN (
    'it department',
    'information technology department',
    'information and technology department',
    'information technology',
    'information and technology'
  )
);

-- Query 2: Set the IT department office hours.
UPDATE departments
SET office_hours = 'Monday-Friday 8:00 AM to 5:00 PM; closed Saturday'
WHERE id = (
  SELECT department_id
  FROM (
    SELECT id AS department_id
    FROM departments
    WHERE LOWER(TRIM(name)) IN (
      'it department',
      'information technology department',
      'information and technology department',
      'information technology',
      'information and technology'
    )
    ORDER BY id
    LIMIT 1
  ) AS it_dept
);

-- Query 3: Update matching existing IT FAQs.
UPDATE faqs AS faq
JOIN (
  SELECT 'What IT services are available to students?' AS question, 'The available services are the Computer Labs and Internet Room.' AS answer, 'it department services student computer labs internet room' AS keywords
  UNION ALL SELECT 'Where can students get IT-related technical support?', 'Approach or visit the IT Department room to ask for technical support.', 'it department technical support help room student concern'
  UNION ALL SELECT 'Who are the IT department contact persons?', 'For CCTV concerns, approach Sir Ton Sto Domingo or Sir Julius Puserio. For computer laboratory concerns, approach Sir Julius Puserio or Sir Rhommel Pascual.', 'it department contact cctv camera ton sto domingo julius puserio computer lab comlab rhommel pascual'
  UNION ALL SELECT 'Who should I contact about internet-related issues?', 'Approach Sir Julius Puserio or Sir Rhommel Pascual for internet-related issues.', 'it department internet wifi connection network issue julius puserio rhommel pascual'
  UNION ALL SELECT 'How does the IT department handle concerns?', 'After an issue or concern is reported, IT employees respond quickly.', 'it department process response concern issue technical support'
  UNION ALL SELECT 'What are the IT department office hours?', 'The IT Department is open Monday to Friday from 8:00 AM to 5:00 PM and is closed on Saturday.', 'it department office hours schedule monday friday 8 am 5 pm closed saturday'
) AS seed
  ON LOWER(TRIM(faq.question)) = LOWER(TRIM(seed.question))
SET faq.answer = seed.answer,
    faq.keywords = seed.keywords
WHERE faq.department_id = (
  SELECT department_id
  FROM (
    SELECT id AS department_id
    FROM departments
    WHERE LOWER(TRIM(name)) IN (
      'it department',
      'information technology department',
      'information and technology department',
      'information technology',
      'information and technology'
    )
    ORDER BY id
    LIMIT 1
  ) AS it_dept
);

-- Query 4: Insert only missing IT FAQs.
INSERT INTO faqs (department_id, question, answer, keywords)
SELECT department.id, seed.question, seed.answer, seed.keywords
FROM departments AS department
CROSS JOIN (
  SELECT 'What IT services are available to students?' AS question, 'The available services are the Computer Labs and Internet Room.' AS answer, 'it department services student computer labs internet room' AS keywords
  UNION ALL SELECT 'Where can students get IT-related technical support?', 'Approach or visit the IT Department room to ask for technical support.', 'it department technical support help room student concern'
  UNION ALL SELECT 'Who are the IT department contact persons?', 'For CCTV concerns, approach Sir Ton Sto Domingo or Sir Julius Puserio. For computer laboratory concerns, approach Sir Julius Puserio or Sir Rhommel Pascual.', 'it department contact cctv camera ton sto domingo julius puserio computer lab comlab rhommel pascual'
  UNION ALL SELECT 'Who should I contact about internet-related issues?', 'Approach Sir Julius Puserio or Sir Rhommel Pascual for internet-related issues.', 'it department internet wifi connection network issue julius puserio rhommel pascual'
  UNION ALL SELECT 'How does the IT department handle concerns?', 'After an issue or concern is reported, IT employees respond quickly.', 'it department process response concern issue technical support'
  UNION ALL SELECT 'What are the IT department office hours?', 'The IT Department is open Monday to Friday from 8:00 AM to 5:00 PM and is closed on Saturday.', 'it department office hours schedule monday friday 8 am 5 pm closed saturday'
) AS seed
WHERE department.id = (
  SELECT department_id
  FROM (
    SELECT id AS department_id
    FROM departments
    WHERE LOWER(TRIM(name)) IN (
      'it department',
      'information technology department',
      'information and technology department',
      'information technology',
      'information and technology'
    )
    ORDER BY id
    LIMIT 1
  ) AS it_dept
)
AND NOT EXISTS (
  SELECT 1
  FROM faqs AS existing
  WHERE existing.department_id = department.id
    AND LOWER(TRIM(existing.question)) = LOWER(TRIM(seed.question))
);
