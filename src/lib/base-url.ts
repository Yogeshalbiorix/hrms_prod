// Base URL for API calls
// In development: use localhost
// In production: use relative URLs (empty string) so it works on any domain
export const baseUrl = import.meta.env.DEV
  ? 'http://localhost:3000'
  : '';
