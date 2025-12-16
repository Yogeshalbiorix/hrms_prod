// API endpoint to sync data to remote database
import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = await request.json();
    const { query, params = [] } = body;

    if (!query) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Query is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get remote database binding
    const remoteDB = locals?.runtime?.env?.DB;

    if (!remoteDB) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Remote database not configured'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Execute query on remote database
    const stmt = remoteDB.prepare(query);
    const boundStmt = params.length > 0 ? stmt.bind(...params) : stmt;
    const result = await boundStmt.run();

    return new Response(JSON.stringify({
      success: true,
      result
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Remote sync error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to sync to remote database',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
