import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ locals }) => {
    try {
        const db = locals.runtime.env.DB;
        const { results } = await db.prepare('SELECT * FROM public_holidays ORDER BY date ASC').all();
        return new Response(JSON.stringify({ holidays: results }), { status: 200 });
    } catch (err) {
        return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Failed to fetch holidays' }), { status: 500 });
    }
};

export const POST: APIRoute = async ({ request, locals }) => {
    try {
        const { date, name, year, is_optional } = await request.json() as any;
        if (!date || !name) {
            return new Response(JSON.stringify({ error: 'Date and Name are required' }), { status: 400 });
        }

        const db = locals.runtime.env.DB;
        await db.prepare('INSERT INTO public_holidays (date, name, year, is_optional) VALUES (?, ?, ?, ?)').bind(date, name, year || new Date(date).getFullYear(), is_optional ? 1 : 0).run();

        return new Response(JSON.stringify({ success: true }), { status: 200 });
    } catch (err) {
        return new Response(JSON.stringify({ error: 'Failed to add holiday' }), { status: 500 });
    }
};


export const DELETE: APIRoute = async ({ request, locals }) => {
    try {
        const url = new URL(request.url);
        const id = url.searchParams.get('id');
        if (!id) return new Response(JSON.stringify({ error: 'ID is required' }), { status: 400 });

        const db = locals.runtime.env.DB;
        await db.prepare('DELETE FROM public_holidays WHERE id = ?').bind(id).run();

        return new Response(JSON.stringify({ success: true }), { status: 200 });
    } catch (err) {
        return new Response(JSON.stringify({ error: 'Failed to delete holiday' }), { status: 500 });
    }
};

export const PUT: APIRoute = async ({ request, locals }) => {
    try {
        const { id, date, name, year, is_optional } = await request.json() as any;
        if (!id || !date || !name) {
            return new Response(JSON.stringify({ error: 'ID, Date and Name are required' }), { status: 400 });
        }

        const db = locals.runtime.env.DB;
        await db.prepare('UPDATE public_holidays SET date = ?, name = ?, year = ?, is_optional = ? WHERE id = ?')
            .bind(date, name, year || new Date(date).getFullYear(), is_optional ? 1 : 0, id)
            .run();

        return new Response(JSON.stringify({ success: true }), { status: 200 });
    } catch (err) {
        return new Response(JSON.stringify({ error: 'Failed to update holiday' }), { status: 500 });
    }
};

