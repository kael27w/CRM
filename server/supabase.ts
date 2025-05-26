import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = 'https://jsgdcnvoargsjozhzvso.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpzZ2RjbnZvYXJnc2pvemh6dnNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM5ODQ2NjEsImV4cCI6MjA1OTU2MDY2MX0.8fQeosEUTh7DGaVeGJkWH8l9jzRH5oXaNAJWuimHnV8';

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Normalizes a phone number by removing all non-digit characters
 */
export function normalizePhone(phone: string | null | undefined): string {
  if (!phone) return '';
  return phone.replace(/\D/g, '');
}

/**
 * Contact type matching the database schema
 */
export interface Contact {
  id: number;
  first_name: string;
  last_name: string;
  phone: string;
  email?: string | null;
  job_title?: string | null;
  company?: string | null;
  status: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Call type matching the database schema
 */
export interface Call {
  id: number;
  contact_id: number;
  call_type: string;
  duration: number;
  notes?: string | null;
  agent?: string | null;
  phone?: string | null;
  created_at?: string;
  updated_at?: string;
} 