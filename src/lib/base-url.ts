// Base URL for API calls
// Always use relative URLs in production (works on any domain)
// Only use localhost:3000 when explicitly in development mode
export const baseUrl = typeof window !== 'undefined' && window.location.hostname === 'localhost'
  ? 'http://localhost:3000'
  : '';
