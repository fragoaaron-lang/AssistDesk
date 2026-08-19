USE assistdesk;

INSERT INTO departments (name, description, point_person, contact_number, location, office_hours) VALUES
('Registrar Office', 'Handles enrollment, records, and student academic documents.', 'Ms. Elena Cruz', '02-1234-5678', 'Main Building, Room 101', '8:00 AM - 5:00 PM'),
('Student Affairs', 'Supports student welfare, guidance, and campus activities.', 'Mr. Rafael Santos', '02-1234-5679', 'Student Center, Room 205', '9:00 AM - 4:00 PM'),
('IT Helpdesk', 'Provides technical support for student and faculty systems.', 'Ms. Carla Mendoza', '02-1234-5680', 'ICT Building, Room 302', '8:00 AM - 6:00 PM');

INSERT INTO faqs (department_id, question, answer, keywords) VALUES
(1, 'How do I enroll in a subject?', 'Visit the registrar office with your student ID and course plan. You may also submit your request through the online helpdesk.', 'enroll, subject, registration'),
(1, 'How can I request a transcript?', 'Submit a transcript request form at the Registrar Office and wait for confirmation from the staff.', 'transcript, records, request'),
(2, 'Where can I report a student concern?', 'Please contact the Student Affairs Office or submit a ticket with your concern details.', 'student concern, guidance, issue'),
(3, 'How do I reset my school email password?', 'Use the password reset option on the portal or contact the IT Helpdesk for assistance.', 'password reset, email, login'),
(3, 'What should I do if my account is locked?', 'Contact the IT Helpdesk with your student ID and a brief description of the issue.', 'account locked, login issue, access');

INSERT INTO users (name, email, password_hash, role) VALUES
('Admin User', 'admin@tcc.edu', '$2a$10$uMFlVMdNB5m23wY9W/LrNOv1z9Ew9gW7r/2UYhOq6cjU9iQfYl4Pu', 'admin'),
('Student User', 'student@tcc.edu', '$2a$10$DijrQ0R0f2j0ePmi8n2yTeO6lyqE3Sg7rzsY9E1MFRYkRaW9hZ3Qa', 'student');
