import type { APIRoute } from 'astro';
import { getDB, getUserByUsername } from '../../../lib/db';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

// Password verification using bcrypt
async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    return await bcrypt.compare(password, hash);
  } catch (error) {
    console.error('Error verifying password:', error);
    return false;
  }
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
    const db = getDB(locals.runtime?.env || locals.env);
    const body = await request.json() as { username: string; password: string };
    const { username, password } = body;

    console.log('Login attempt:', { username });

    // Validation
    if (!username || !password) {
      return new Response(
        JSON.stringify({ error: 'Username and password are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get user
    const user = await getUserByUsername(db, username);
    console.log('User found:', user ? { id: user.id, username: user.username, has_password: !!user.password_hash } : 'Not found');

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Invalid username or password' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verify password
    // Verify password
    const isPasswordValid = await verifyPassword(password, user.password_hash || '');

    console.log(
      'DEBUG bcrypt test:',
      await bcrypt.compare('admin123', user.password_hash || '')
    );

    console.log('Password valid:', isPasswordValid);

    if (!isPasswordValid) {
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

