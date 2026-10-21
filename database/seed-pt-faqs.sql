-- Safe to rerun: matching questions for the PT/BSPT department are skipped.
-- Uses the first matching PT/Physical Therapy alias, preferring the canonical name.
INSERT INTO faqs (department_id, question, answer, keywords)
SELECT department.id, faq.question, faq.answer, faq.keywords
FROM departments AS department
JOIN (
  SELECT
    'Who is the dean, secretary, or point person of the PT Department?' AS question,
    'Dean Everly Ann L. Mata is the dean and point person of the PT Department. The secretary was not specified.' AS answer,
    'pt bspt physical therapy dean secretary point person department head contact Everly Ann L Mata who is the dean who is the secretary who is the point person' AS keywords
  UNION ALL SELECT
    'Where can I get the modules or books in the PT Department?',
    'Books are not available in the PT Department.',
    'pt bspt physical therapy modules module books book textbooks learning materials not available unavailable'
  UNION ALL SELECT
    'Where can I get PT uniforms?',
    'Uniforms are not available in the PT Department.',
    'pt bspt physical therapy uniform uniforms attire clothing not available unavailable'
  UNION ALL SELECT
    'Where can I get the PT class schedule?',
    'PT class schedules are given by Ms. Everly Ann Mata.',
    'pt bspt physical therapy class schedule timetable schedule subjects classes Everly Ann Mata'
  UNION ALL SELECT
    'Where is the PT Department building?',
    'The PT Department Building is between the CBA Building and the SHS Building.',
    'pt bspt physical therapy department building location campus CBA building SHS building between where is PT building'
) AS faq
  ON 1 = 1
LEFT JOIN faqs AS existing
  ON existing.department_id = department.id
  AND LOWER(TRIM(existing.question)) = LOWER(TRIM(faq.question))
WHERE LOWER(TRIM(department.name)) IN (
  'pt', 'pt department', 'physical therapy', 'physical therapy department',
  'college of physical therapy', 'bspt', 'bspt department'
)
AND department.id = (
  SELECT selected.id
  FROM departments AS selected
  WHERE LOWER(TRIM(selected.name)) IN (
    'pt', 'pt department', 'physical therapy', 'physical therapy department',
    'college of physical therapy', 'bspt', 'bspt department'
  )
  ORDER BY CASE LOWER(TRIM(selected.name))
    WHEN 'college of physical therapy' THEN 1
    WHEN 'physical therapy department' THEN 2
    WHEN 'physical therapy' THEN 3
    WHEN 'pt department' THEN 4
    WHEN 'pt' THEN 5
    WHEN 'bspt department' THEN 6
    WHEN 'bspt' THEN 7
    ELSE 8
  END, selected.id
  LIMIT 1
)
AND existing.id IS NULL;
