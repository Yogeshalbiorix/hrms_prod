-- Fix admin user passwords with correct bcrypt hashes
-- Password for all admin users: admin123

-- Update admin user
UPDATE users 
SET password_hash = '$2b$10$Mn9SIcSaxMvr98A0V2KQF.2PjS.qdJ8HYdcTwc5hCMAJQB4VAAgN.'
WHERE username = 'admin';

-- Update hrmanager1
UPDATE users 
SET password_hash = '$2b$10$Mn9SIcSaxMvr98A0V2KQF.2PjS.qdJ8HYdcTwc5hCMAJQB4VAAgN.'
WHERE username = 'hrmanager1';

-- Update hrmanager2
UPDATE users 
SET password_hash = '$2b$10$Mn9SIcSaxMvr98A0V2KQF.2PjS.qdJ8HYdcTwc5hCMAJQB4VAAgN.'
WHERE username = 'hrmanager2';

-- Verify updates
SELECT username, email, role, employee_id, substr(password_hash, 1, 15) as hash_prefix 
FROM users 
WHERE username IN ('admin', 'hrmanager1', 'hrmanager2');
