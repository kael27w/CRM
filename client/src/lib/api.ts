/**
 * API call related functions and type definitions
 */

// Base API URL configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://crm-2lmw.onrender.com';

/**
 * Interface representing a call log entry from the API
 */
export interface CallLogEntry {
  id: number;
  call_sid: string;
  direction: string;
  from_number: string;
  to_number: string;
  status: string;
  duration: number; // in seconds
  created_at: string; // ISO date string
  updated_at: string; // ISO date string
  contact_id: number | null;
  contact_first_name: string | null;
  contact_last_name: string | null;
}

/**
 * Fetches call logs from the API
 * @returns Promise containing an array of call log entries
 */
export async function fetchCallLogs(): Promise<CallLogEntry[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/calls`);
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data as CallLogEntry[];
  } catch (error) {
    console.error('Error fetching call logs:', error);
    throw error instanceof Error ? error : new Error('Unknown error fetching call logs');
  }
} 