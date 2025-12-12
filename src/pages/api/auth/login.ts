import type { APIRoute } from 'astro';
import { getDB, getUserByUsername } from '../../../lib/db';
import crypto from 'crypto';

// Simple password comparison (in production, use bcrypt)
function verifyPassword(password: string, hash: string): boolean {
  // For demo purposes, we'll use a simple check
  // In production, use bcrypt.compare(password, hash)
  // The default admin password is 'admin123'
  if (hash === '$2a$10$ZKzN/fJQqPYqE3P3JXj3DeVGJhM1LKz7x/x5xZ.vYXF6XJ9h6qPRm') {
    return password === 'admin123';
  }
  return false;
}

// Generate session token
function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Get expiration date (24 hours from now)
function getExpirationDate(): string {
  const expiration = new Date();
  expiration.setHours(expiration.getHours() + 24);
  return expiration.toISOString();
}

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const db = getDB(locals.runtime.env);
    const body = await request.json();
    const { username, password } = body;

    // Validation
    if (!username || !password) {
      return new Response(
        JSON.stringify({ error: 'Username and password are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get user
    const user = await getUserByUsername(db, username);
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Invalid username or password' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verify password
    if (!verifyPassword(password, user.password_hash || '')) {
      return new Response(
        JSON.stringify({ error: 'Invalid username or password' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is active
    if (!user.is_active) {
      return new Response(
        JSON.stringify({ error: 'Account is inactive' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Generate session token
    const sessionToken = generateSessionToken();
    const expiresAt = getExpirationDate();

    // Get IP and User-Agent
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('cf-connecting-ip') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Create session
    await db
      .prepare(
        'INSERT INTO sessions (user_id, session_token, expires_at, ip_address, user_agent) VALUES (?, ?, ?, ?, ?)'
      )
      .bind(user.id, sessionToken, expiresAt, ipAddress, userAgent)
      .run();

    // Update last login
    await db
      .prepare('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?')
      .bind(user.id)
      .run();

    // Return user data (without password hash) and session token
    const userData = {
      id: user.id,
      username: user.username,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      employee_id: user.employee_id,
    };

    return new Response(
      JSON.stringify({
        success: true,
        user: userData,
        sessionToken,
        expiresAt,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Login error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
