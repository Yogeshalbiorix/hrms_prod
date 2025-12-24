import type { APIRoute } from 'astro';
import { getDB, getUserByCredential, verifyOTP } from '../../../lib/db';
import crypto from 'crypto';

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
        const body = await request.json() as { email: string; otp: string };
        const { email, otp } = body;

        // Validation
        if (!email || !otp) {
            return new Response(
                JSON.stringify({ error: 'Email and OTP are required' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // 1. Verify OTP
        const verification = await verifyOTP(db, email, otp);
        if (!verification.valid) {
            return new Response(
                JSON.stringify({ error: verification.message || 'Invalid OTP' }),
                { status: 401, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // 2. Get User (to create session)
        // We search by email now since they are authenticated via OTP
        const user = await db.prepare('SELECT * FROM users WHERE email = ? AND is_active = 1').bind(email).first();

        if (!user) {
            return new Response(
                JSON.stringify({ error: 'User account not found' }),
                { status: 404, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // 3. Create Session (Logic moved from login.ts)
        const sessionToken = generateSessionToken();
        const expiresAt = getExpirationDate();
        const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('cf-connecting-ip') || 'unknown';
        const userAgent = request.headers.get('user-agent') || 'unknown';

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

        // 4. Return Success
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
            { status: 200, headers: { 'Content-Type': 'application/json' } }
        );

    } catch (error) {
        console.error('2FA Verification Error:', error);
        return new Response(
            JSON.stringify({ error: 'Internal server error' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
};
