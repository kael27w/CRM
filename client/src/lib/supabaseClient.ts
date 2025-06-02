import { createClient } from '@supabase/supabase-js';

// TODO: Move these to environment variables (.env file) in production
// VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://jsgdcnvoargsjozhzvso.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpzZ2RjbnZvYXJnc2pvemh6dnNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM5ODQ2NjEsImV4cCI6MjA1OTU2MDY2MX0.8fQeosEUTh7DGaVeGJkWH8l9jzRH5oXaNAJWuimHnV8';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL or Anon Key is missing. Check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey); 