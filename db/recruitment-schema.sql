-- Recruitment Module Schema
-- Job Openings and Candidates Tables

-- Job Openings Table
CREATE TABLE IF NOT EXISTS job_openings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    department_id INTEGER,
    location TEXT,
    type TEXT CHECK(type IN ('full-time', 'part-time', 'contract', 'intern')) DEFAULT 'full-time',
    experience TEXT,
    openings INTEGER DEFAULT 1,
    salary_range TEXT,
    description TEXT,
    requirements TEXT,
    status TEXT CHECK(status IN ('active', 'closed', 'draft')) DEFAULT 'active',
    posted_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    closed_date DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL
);

-- Job Candidates Table
CREATE TABLE IF NOT EXISTS job_candidates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    job_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    location TEXT,
    experience TEXT,
    skills TEXT,
    resume_url TEXT,
    linkedin_url TEXT,
    status TEXT CHECK(status IN ('applied', 'screening', 'interview', 'offered', 'rejected', 'hired')) DEFAULT 'applied',
    rating DECIMAL(2,1),
    notes TEXT,
    applied_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (job_id) REFERENCES job_openings(id) ON DELETE CASCADE
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_job_openings_status ON job_openings(status);
CREATE INDEX IF NOT EXISTS idx_job_openings_department ON job_openings(department_id);
CREATE INDEX IF NOT EXISTS idx_job_candidates_job ON job_candidates(job_id);
CREATE INDEX IF NOT EXISTS idx_job_candidates_status ON job_candidates(status);
CREATE INDEX IF NOT EXISTS idx_job_candidates_email ON job_candidates(email);

-- Sample job openings (commented out to avoid UNIQUE constraint errors)
-- INSERT INTO job_openings (title, department_id, location, type, experience, openings, salary_range, description, requirements, status) VALUES
-- ('Senior Full Stack Developer', 1, 'Remote', 'full-time', '5+ years', 2, '$90k - $120k', 
--  'We are looking for an experienced Full Stack Developer to join our engineering team.', 
--  'Strong experience with React, Node.js, TypeScript, and AWS. Excellent problem-solving skills.', 'active'),
--
-- ('Product Marketing Manager', 2, 'New York, NY', 'full-time', '3-5 years', 1, '$70k - $90k',
--  'Lead our product marketing initiatives and drive growth.',
--  'Experience in B2B SaaS marketing, data analytics, and content strategy.', 'active'),
--
-- ('Data Analyst', 1, 'Hybrid', 'full-time', '2-4 years', 2, '$60k - $80k',
--  'Analyze data and provide insights to drive business decisions.',
--  'Proficiency in Python, SQL, and data visualization tools like Tableau.', 'active');
