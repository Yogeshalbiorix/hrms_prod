// API endpoint for settings operations
import type { APIRoute } from 'astro';

interface Settings {
  company_name?: string;
  industry?: string;
  company_size?: string;
  address?: string;
  profile_first_name?: string;
  profile_last_name?: string;
  profile_email?: string;
  profile_job_title?: string;
  notifications?: {
    leave_requests?: boolean;
    attendance_alerts?: boolean;
    performance_reviews?: boolean;
    payroll_processing?: boolean;
    new_applications?: boolean;
  };
  theme_mode?: string;
  primary_color?: string;
}

// In-memory storage for demo (replace with database in production)
let settingsStore: Settings = {
  company_name: 'TechCorp Inc.',
  industry: 'Technology',
  company_size: '51-200',
  address: '123 Business St, San Francisco, CA 94105',
  profile_first_name: 'John',
  profile_last_name: 'Doe',
  profile_email: 'john.doe@company.com',
  profile_job_title: 'HR Manager',
  notifications: {
    leave_requests: true,
    attendance_alerts: true,
    performance_reviews: true,
    payroll_processing: true,
    new_applications: true,
  },
  theme_mode: 'light',
  primary_color: '#3b82f6',
};

export const GET: APIRoute = async () => {
  try {
    return new Response(JSON.stringify({
      success: true,
      data: settingsStore
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to fetch settings'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const PUT: APIRoute = async ({ request }) => {
  try {
    const updates = await request.json();
    
    // Merge updates with existing settings
    settingsStore = {
      ...settingsStore,
      ...updates,
      notifications: {
        ...settingsStore.notifications,
        ...updates.notifications
      }
    };
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Settings updated successfully',
      data: settingsStore
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to update settings'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

