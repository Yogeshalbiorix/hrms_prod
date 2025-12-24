import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ locals }) => {
    try {
        const db = locals.runtime.env.DB;
        const result = await db.prepare('SELECT value FROM system_settings WHERE key = ?').bind('leave_policy_text').first();
        return new Response(JSON.stringify({ text: result?.value || '' }), { status: 200 });
    } catch (err) {
        return new Response(JSON.stringify({ error: 'Failed to fetch policy' }), { status: 500 });
    }
};

export const POST: APIRoute = async ({ request, locals }) => {
    try {
        const { text } = await request.json() as any;
        const db = locals.runtime.env.DB;
        await db.prepare('INSERT OR REPLACE INTO system_settings (key, value) VALUES (?, ?)').bind('leave_policy_text', text).run();
        return new Response(JSON.stringify({ success: true }), { status: 200 });
    } catch (err) {
        return new Response(JSON.stringify({ error: 'Failed to update policy' }), { status: 500 });
    }
};
