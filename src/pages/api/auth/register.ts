import type { APIRoute } from 'astro';
import bcrypt from 'bcryptjs';
import {
  createUser,
  getUserByUsername,
  getUserByEmail,
  createEmployee,
  createAuditLog
} from '../../../lib/db';

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const db = locals.runtime.env.DB as any;
    const body = await request.json() as any;

    const { username, password, email, full_name, phone, position, department_id } = body;

    // Validate required fields
    if (!username || !password || !email || !full_name) {
      return new Response(
        JSON.stringify({
          error: 'Username, password, email, and full name are required'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email format' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate password strength (minimum 8 characters, at least one letter and one number)
    if (password.length < 8) {
      return new Response(
        JSON.stringify({ error: 'Password must be at least 8 characters long' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)/;
    if (!passwordRegex.test(password)) {
      return new Response(
        JSON.stringify({
          error: 'Password must contain at least one letter and one number'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check if username already exists
    const existingUser = await getUserByUsername(db, username);
    if (existingUser) {
      return new Response(
        JSON.stringify({ error: 'Username already exists' }),
        { status: 409, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check if email already exists
    const existingEmail = await getUserByEmail(db, email);
    if (existingEmail) {
      return new Response(
        JSON.stringify({ error: 'Email already registered' }),
        { status: 409, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);

    // Create employee record first
    const nameParts = full_name.split(' ');
    const first_name = nameParts[0];
    const last_name = nameParts.slice(1).join(' ') || nameParts[0];

    // Get employee count for generating employee ID
    const countResult = await db.prepare('SELECT COUNT(*) as count FROM employees').first() as any;
    const employeeId = `EMP${String((countResult?.count || 0) + 1).padStart(3, '0')}`;

    const employeeData = {
      employee_id: employeeId,
      first_name,
      last_name,
      email,
      phone: phone || null,
      position: position || 'Employee',
      department_id: department_id || null,
      employment_type: 'full-time' as const,
      status: 'active' as const,
      join_date: new Date().toISOString().split('T')[0],
      country: 'USA',
      created_by: 'system'
    };

    let newEmployee;
    try {
      newEmployee = await createEmployee(db, employeeData);
    } catch (empError: any) {
      // Check if it's a unique constraint error on email
      if (empError?.message?.includes('UNIQUE constraint') && empError?.message?.includes('email')) {
        return new Response(
          JSON.stringify({ error: 'Email already registered' }),
          { status: 409, headers: { 'Content-Type': 'application/json' } }
        );
      }
      throw empError; // Re-throw other errors
    }

    if (!newEmployee || !newEmployee.id) {
      return new Response(
        JSON.stringify({ error: 'Failed to create employee record' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Create user account
    const userData = {
      username,
      password_hash,
      email,
      full_name,
      role: 'employee',
      employee_id: newEmployee.id  // Use the numeric ID, not the object
    };

    const newUserId = await createUser(db, userData);

    if (!newUserId) {
      return new Response(
        JSON.stringify({ error: 'Failed to create user account' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get client IP
    const clientIP = request.headers.get('cf-connecting-ip') ||
      request.headers.get('x-forwarded-for') ||
      'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Create audit log
    await createAuditLog(db, {
      user_id: newUserId,
      action: 'USER_REGISTERED',
      description: `User ${username} registered successfully`,
      ip_address: clientIP,
      user_agent: userAgent
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Registration successful',
        user: {
          id: newUserId,
          username,
          email,
          full_name,
          role: 'employee',
          employee_id: newEmployee.id
        }
      }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Registration error:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error during registration',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
