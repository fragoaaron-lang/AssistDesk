export const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || '';
export const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY || '';
export const API_BASE_URL = (process.env.REACT_APP_API_URL || SUPABASE_URL || 'http://localhost:3001').replace(/\/$/, '');
