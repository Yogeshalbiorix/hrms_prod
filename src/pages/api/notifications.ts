import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ request }) => {
  try {
    // Mock notifications for now
    const notifications = [
      {
        id: 1,
        type: 'leave_request',
        message: 'New leave request from John Doe',
        read: false,
        created_at: new Date().toISOString(),
      },
      {
        id: 2,
        type: 'attendance_alert',
        message: '5 employees late today',
        read: false,
        created_at: new Date().toISOString(),
      },
    ];

    return new Response(
      JSON.stringify({
        success: true,
        data: notifications,
        unread_count: notifications.filter(n => !n.read).length,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error: any) {
    console.error('Error fetching notifications:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to fetch notifications',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
};
