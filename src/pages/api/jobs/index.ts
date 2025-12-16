// API endpoint for job posting operations
import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ locals }) => {
  try {
    const db = locals?.runtime?.env?.DB || (import.meta as any).env?.DB;

    if (!db) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Database not configured'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get all job openings with department names and applicant counts
    const jobs = await db.prepare(`
      SELECT 
        j.id,
        j.title,
        COALESCE(d.name, j.department_id) as department,
        j.location,
        j.type,
        j.experience,
        j.openings,
        j.salary_range,
        j.description,
        j.requirements,
        j.status,
        DATE(j.posted_date) as posted_date,
        COUNT(DISTINCT c.id) as applicants
      FROM job_openings j
      LEFT JOIN departments d ON j.department_id = d.id
      LEFT JOIN job_candidates c ON j.id = c.job_id
      GROUP BY j.id
      ORDER BY j.posted_date DESC
    `).all();

    return new Response(JSON.stringify({
      success: true,
      data: jobs.results || []
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

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const db = locals?.runtime?.env?.DB || (import.meta as any).env?.DB;

    if (!db) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Database not configured'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await request.json() as any;
    const { title, department, location, type, experience, openings, salary_range, description, requirements, status } = body;

    if (!title || !location || !type || !experience) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing required fields: title, location, type, experience'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get department_id from department name
    let department_id = null;
    if (department) {
      const dept = await db.prepare(`SELECT id FROM departments WHERE name = ?`).bind(department).first();
      department_id = dept?.id || null;
    }

    // Check for duplicate job posting (same title and location)
    const existingJob = await db.prepare(`
      SELECT id FROM job_openings 
      WHERE title = ? AND location = ? AND status != 'closed'
    `).bind(title, location).first();

    if (existingJob) {
      return new Response(JSON.stringify({
        success: false,
        error: 'A job with this title and location already exists. Please edit the existing job or use a different title/location.'
      }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const query = `
      INSERT INTO job_openings (
        title, department_id, location, type, experience, 
        openings, salary_range, description, requirements, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      title,
      department_id,
      location,
      type,
      experience,
      openings || 1,
      salary_range || null,
      description || null,
      requirements || null,
      status || 'active'
    ];

    // Insert into local database
    const result = await db.prepare(query).bind(...params).run();

    // Sync to remote database
    try {
      const { syncToRemote } = await import('../../../lib/db-sync');
      await syncToRemote(query, params);
    } catch (syncError) {
      console.warn('Remote sync failed:', syncError);
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Job posted successfully (synced to both databases)',
      data: { id: result.meta.last_row_id }
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

export const PUT: APIRoute = async ({ request, locals }) => {
  try {
    const db = locals?.runtime?.env?.DB || (import.meta as any).env?.DB;

    if (!db) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Database not configured'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await request.json() as any;
    const { id, title, department, location, type, experience, openings, salary_range, description, requirements, status } = body;

    if (!id) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Job ID is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get department_id from department name
    let department_id = null;
    if (department) {
      const dept = await db.prepare(`SELECT id FROM departments WHERE name = ?`).bind(department).first();
      department_id = dept?.id || null;
    }

    const query = `
      UPDATE job_openings SET
        title = ?,
        department_id = ?,
        location = ?,
        type = ?,
        experience = ?,
        openings = ?,
        salary_range = ?,
        description = ?,
        requirements = ?,
        status = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    const params = [
      title,
      department_id,
      location,
      type,
      experience,
      openings || 1,
      salary_range || null,
      description || null,
      requirements || null,
      status || 'active',
      id
    ];

    // Update local database
    const result = await db.prepare(query).bind(...params).run();

    if (result.meta.changes === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Job opening not found'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Sync to remote database
    try {
      const { syncToRemote } = await import('../../../lib/db-sync');
      await syncToRemote(query, params);
    } catch (syncError) {
      console.warn('Remote sync failed:', syncError);
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Job opening updated successfully (synced to both databases)'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Error updating job:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Failed to update job'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const DELETE: APIRoute = async ({ request, locals }) => {
  try {
    const db = locals?.runtime?.env?.DB || (import.meta as any).env?.DB;

    if (!db) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Database not configured'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get ID from request body (as sent by frontend)
    const body = await request.json() as any;
    const { id } = body;

    if (!id) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Job ID is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const query = `DELETE FROM job_openings WHERE id = ?`;
    const params = [id];

    // Delete from local database (candidates will be cascade deleted)
    const result = await db.prepare(query).bind(id).run();

    if (result.meta.changes === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Job opening not found'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Sync to remote database
    try {
      const { syncToRemote } = await import('../../../lib/db-sync');
      await syncToRemote(query, params);
    } catch (syncError) {
      console.warn('Remote sync failed:', syncError);
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Job opening deleted successfully (synced to both databases)'
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
