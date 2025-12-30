ALTER TABLE work_from_home_requests ADD COLUMN request_type TEXT DEFAULT 'full';
ALTER TABLE work_from_home_requests ADD COLUMN start_time TEXT;
ALTER TABLE work_from_home_requests ADD COLUMN end_time TEXT;
