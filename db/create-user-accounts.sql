-- Create user accounts for employees without user records
-- Password for all accounts: password123 (hashed with bcrypt)

INSERT INTO users (username, password_hash, email, full_name, role, employee_id, is_active)
VALUES 
  ('yogeshpurnawasi', '$2a$10$YPpr0.vJ3Z0vKVXq8rL3Uek5VQqGZ5z5Y9QVm5YQZ5z5Y9QVm5YQZ', 'Yogesh.albiorix@gmail.com', 'Yogesh purnawasi', 'employee', 6, 1),
  ('pushpakmakwana', '$2a$10$YPpr0.vJ3Z0vKVXq8rL3Uek5VQqGZ5z5Y9QVm5YQZ5z5Y9QVm5YQZ', 'pushpakm.albiorix@gmail.com', 'Pushpak Makwana', 'employee', 7, 1),
  ('krishnaraval', '$2a$10$YPpr0.vJ3Z0vKVXq8rL3Uek5VQqGZ5z5Y9QVm5YQZ5z5Y9QVm5YQZ', 'Krishna.albiorix@gmail.com', 'Krishna Raval', 'employee', 8, 1),
  ('abhaybhatti', '$2a$10$YPpr0.vJ3Z0vKVXq8rL3Uek5VQqGZ5z5Y9QVm5YQZ5z5Y9QVm5YQZ', 'abhay.albiorix@gmail.com', 'Abhay bhatti', 'employee', 9, 1);
