// API endpoint for job posting operations
import type { APIRoute } from 'astro';

interface JobOpening {
  id?: string;
  title: string;
  department: string;
  location: string;
  type: 'full-time' | 'part-time' | 'contract';
  experience: string;
  openings: number;
  salary_range?: string;
  description?: string;
  requirements?: string;
  status: 'active' | 'closed' | 'draft';
  posted_date?: string;
  applicants?: number;
}

// Temporary in-memory storage (replace with database in production)
const jobs: JobOpening[] = [
  {
    id: '1',
    title: 'Senior Full Stack Developer',
    department: 'Engineering',
    location: 'San Francisco, CA',
    type: 'full-time',
    experience: '5+ years',
    openings: 2,
    applicants: 45,
    posted_date: '2024-01-15',
    status: 'active',
    salary_range: '$120,000 - $150,000',
    description: 'We are looking for an experienced Full Stack Developer...',
    requirements: '5+ years of experience with React, Node.js, TypeScript...'
  },
  {
    id: '2',
    title: 'Product Marketing Manager',
    department: 'Sales & Marketing',
    location: 'New York, NY',
    type: 'full-time',
    experience: '3-5 years',
    openings: 1,
    applicants: 32,
    posted_date: '2024-01-18',
    status: 'active',
    salary_range: '$90,000 - $110,000'
  },
  {
    id: '3',
    title: 'HR Business Partner',
    department: 'Human Resources',
    location: 'Remote',
    type: 'full-time',
    experience: '4+ years',
    openings: 1,
    applicants: 28,
    posted_date: '2024-01-20',
    status: 'active',
    salary_range: '$80,000 - $95,000'
  },
  {
    id: '4',
    title: 'Data Analyst',
    department: 'Finance',
    location: 'Chicago, IL',
    type: 'full-time',
    experience: '2-4 years',
    openings: 2,
    applicants: 56,
    posted_date: '2024-01-12',
    status: 'active',
    salary_range: '$70,000 - $90,000'
  },
];

export const GET: APIRoute = async () => {
  try {
    return new Response(JSON.stringify({
      success: true,
      data: jobs
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Error fetching jobs:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Failed to fetch jobs'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { title, department, location, type, experience, openings, salary_range, description, requirements, status } = body;

    if (!title || !department || !location || !type || !experience || !openings) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing required fields'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const newJob: JobOpening = {
      id: String(jobs.length + 1),
      title,
      department,
      location,
      type,
      experience,
      openings: Number(openings),
      salary_range,
      description,
      requirements,
      status: status || 'active',
      posted_date: new Date().toISOString().split('T')[0],
      applicants: 0
    };

    jobs.push(newJob);

    return new Response(JSON.stringify({
      success: true,
      message: 'Job posted successfully',
      data: newJob
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Error creating job:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Failed to create job'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const DELETE: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Job ID is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const index = jobs.findIndex(job => job.id === id);
    if (index === -1) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Job not found'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    jobs.splice(index, 1);

    return new Response(JSON.stringify({
      success: true,
      message: 'Job deleted successfully'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Error deleting job:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Failed to delete job'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
