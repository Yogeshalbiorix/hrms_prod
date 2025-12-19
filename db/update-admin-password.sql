-- Update admin password with properly hashed password
-- Password: admin123
-- Hash generated with bcrypt (10 rounds)

UPDATE users 
SET password_hash = '$2b$10$fAQgVFyC/9b1.v2TU9yn5OQ0DFnXwWJRMBdN3ON0dUdB8XbH5yPzm'
WHERE username = 'admin';

SELECT 'Admin password updated successfully' as message;
