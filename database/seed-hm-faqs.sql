-- Safe to rerun: matching questions for the HM/BSHM/CHARM department are skipped.
-- This query prefers the canonical CHARM department if multiple aliases exist.
INSERT INTO faqs (department_id, question, answer, keywords)
SELECT department.id, faq.question, faq.answer, faq.keywords
FROM departments AS department
JOIN (
  SELECT 'Who is the dean, secretary, or point person of the HM Department?' AS question,
    'Dean Rachel Ann Dumlao is the dean, and Maam Melanie Valencia is the secretary and point person.' AS answer,
    'hm bshm charm hospitality management dean secretary point person department head contact Rachel Ann Dumlao Melanie Valencia who is the dean who is the secretary who is the point person' AS keywords
  UNION ALL SELECT
    'Where can I get the modules or books in the HM Department?',
    'HM modules and books can be obtained from the respective professors.',
    'hm bshm charm hospitality management modules module books book learning materials professor professors instructor faculty where to get modules where to get books'
  UNION ALL SELECT
    'Where can I get BSHM uniforms?',
    'BSHM uniforms can be obtained at the front desk of the CHARM Building.',
    'hm bshm charm hospitality management uniform uniforms attire clothing front desk CHARM Building where to get uniform where to buy uniform'
  UNION ALL SELECT
    'Where can I get the HM class schedule?',
    'The HM class schedule is available at the front desk.',
    'hm bshm charm hospitality management class schedule timetable schedule subjects classes front desk where to get schedule'
  UNION ALL SELECT
    'Where is the HM Department building?',
    'The HM Department Building is near the TCC Gymnasium.',
    'hm bshm charm hospitality management department building location campus TCC Gymnasium gym where is the HM building'
) AS faq
  ON 1 = 1
LEFT JOIN faqs AS existing
  ON existing.department_id = department.id
  AND LOWER(TRIM(existing.question)) = LOWER(TRIM(faq.question))
WHERE LOWER(TRIM(department.name)) IN (
  'charm', 'hm', 'hm department', 'bshm', 'bshm department',
  'college of hospitality management', 'college of hospitality and restaurant management'
)
AND department.id = (
  SELECT selected.id
  FROM departments AS selected
  WHERE LOWER(TRIM(selected.name)) IN (
    'charm', 'hm', 'hm department', 'bshm', 'bshm department',
    'college of hospitality management', 'college of hospitality and restaurant management'
  )
  ORDER BY CASE LOWER(TRIM(selected.name))
    WHEN 'charm' THEN 1
    WHEN 'hm' THEN 2
    WHEN 'hm department' THEN 3
    WHEN 'bshm' THEN 4
    WHEN 'bshm department' THEN 5
    WHEN 'college of hospitality management' THEN 6
    WHEN 'college of hospitality and restaurant management' THEN 7
    ELSE 8
  END, selected.id
  LIMIT 1
)
AND existing.id IS NULL;
