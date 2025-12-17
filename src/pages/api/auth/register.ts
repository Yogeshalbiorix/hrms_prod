import type { APIRoute } from 'astro';
import bcrypt from 'bcryptjs';
import {
  createUser,
  getUserByUsername,
  getUserByEmail,
  createEmployee,
  createAuditLog,
  getDB
} from '../../../lib/db';

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const db = getDB(locals.runtime?.env || locals.env);
    const body = await request.json() as any;

    let { username, password, email, full_name, phone, position, department_id } = body;

    // Validate required fields (username is optional, will be auto-generated)
    if (!password || !email || !full_name) {
      return new Response(
        JSON.stringify({
          error: 'Password, email, and full name are required'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Auto-generate username if not provided
    if (!username) {
      // Generate username from email (part before @)
      username = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');

      // Check if username already exists, if so, append random number
      const existingUser = await getUserByUsername(db, username);
      if (existingUser) {
        username = `${username}${Math.floor(Math.random() * 9000) + 1000}`;
      }

      console.log('Auto-generated username:', username);
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
      console.log('Employee created successfully:', newEmployee);
    } catch (empError: any) {
      console.error('Error creating employee:', empError);
      // Check if it's a unique constraint error on email
      if (empError?.message?.includes('UNIQUE constraint') && empError?.message?.includes('email')) {
        return new Response(
          JSON.stringify({ error: 'Email already registered in employees' }),
          { status: 409, headers: { 'Content-Type': 'application/json' } }
        );
      }
      // Return more detailed error
      return new Response(
        JSON.stringify({
          error: 'Failed to create employee record',
          details: empError?.message || 'Unknown error'
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!newEmployee || !newEmployee.id) {
      console.error('Employee creation returned invalid result:', newEmployee);
      return new Response(
        JSON.stringify({ error: 'Failed to create employee record - invalid response' }),
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

    console.log('Creating user account with data:', { ...userData, password_hash: '[REDACTED]' });

    let newUserId;
    try {
      newUserId = await createUser(db, userData);
      console.log('User account created successfully with ID:', newUserId);
    } catch (userError: any) {
      console.error('Failed to create user account:', userError);

      // Check if it's a unique constraint error
      if (userError?.message?.includes('UNIQUE constraint')) {
        if (userError?.message?.includes('username')) {
          return new Response(
            JSON.stringify({ error: 'Username already exists' }),
            { status: 409, headers: { 'Content-Type': 'application/json' } }
          );
        } else if (userError?.message?.includes('email')) {
          return new Response(
            JSON.stringify({ error: 'Email already registered' }),
            { status: 409, headers: { 'Content-Type': 'application/json' } }
          );
        }
      }

      return new Response(
        JSON.stringify({
          error: 'Failed to create user account',
          details: userError?.message || 'Unknown error'
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!newUserId) {
      console.error('User creation returned null or undefined');
      return new Response(
        JSON.stringify({ error: 'Failed to create user account - invalid response' }),
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

