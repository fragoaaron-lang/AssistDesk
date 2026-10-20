-- Expand the search keywords for the five CRIM/Criminology FAQs.
-- This is one MySQL UPDATE statement; it does not add or duplicate FAQ rows.
UPDATE faqs AS faq
JOIN departments AS department ON department.id = faq.department_id
SET faq.answer = CASE faq.question
  WHEN 'Who is the dean, secretary, or point person of the CRIM Department?'
    THEN 'Dr. Ma. Charisse B. Vedaña is the dean, and Ms. Ma. Jane B. Gonzaga is the secretary and point person.'
  ELSE faq.answer
END,
faq.keywords = CASE faq.question
  WHEN 'Who is the dean, secretary, or point person of the CRIM Department?'
    THEN 'crim bscrim criminology criminology department college of criminology dean dean name dean charisse charisse vedana vedana vedaña charisse b vedana secretary secretary name jane gonzaga ma jane b gonzaga point person contact person department head chair officer who is the dean who is the secretary'
  WHEN 'Where can I get the modules or books in the CRIM Department?'
    THEN 'crim bscrim criminology criminology department college of criminology module modules book books textbooks text books learning materials study materials jane gonzaga ma jane b gonzaga where to get modules where to get books obtain materials'
  WHEN 'Where can I get CRIM uniforms?'
    THEN 'crim bscrim criminology criminology department college of criminology uniform uniforms criminology uniform attire clothing jane gonzaga ma jane b gonzaga where to get uniform where to buy uniform'
  WHEN 'Where can I get the CRIM class schedule?'
    THEN 'crim bscrim criminology criminology department college of criminology class schedule class schedules timetable subjects classes jane gonzaga ma jane b gonzaga where to get schedule where is schedule schedule inquiry'
  WHEN 'Where is the CRIM Department building?'
    THEN 'crim bscrim criminology criminology department college of criminology building location address campus where is crim where is criminology building gymnasium tcc gym charm building after passing through gymnasium directions'
  ELSE faq.keywords
END
WHERE LOWER(department.name) IN ('crim', 'crim department', 'criminology', 'criminology department', 'college of criminology', 'bscrim department')
  AND faq.question IN (
    'Who is the dean, secretary, or point person of the CRIM Department?',
    'Where can I get the modules or books in the CRIM Department?',
    'Where can I get CRIM uniforms?',
    'Where can I get the CRIM class schedule?',
    'Where is the CRIM Department building?'
  );
