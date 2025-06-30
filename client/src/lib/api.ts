/**
 * API call related functions and type definitions
 */

import { supabase } from './supabaseClient';

// Base API URL configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002';

// Add this for debugging purposes
console.log("API base URL:", API_BASE_URL);

/**
 * Interface for Twilio Access Token response
 */
export interface TwilioTokenResponse {
  token: string;
}

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
 * Interface representing a task entry from the API
 */
export interface TaskEntry {
  id: number;
  title: string;
  description?: string;
  due_date: string; // ISO date string
  completed: boolean;
  status: string; // e.g., 'pending', 'completed'
  type: 'task' | 'call' | 'event'; // Clarify that activities can have different types
  priority?: string; // Added priority field
  // Add other relevant fields if your API returns more for tasks
  // For example:
  // created_at: string;
  // updated_at: string;
}

/**
 * Interface representing a contact entry from the API
 */
export interface ContactEntry {
  id: number;
  first_name: string;
  last_name: string;
  phone: string;
  email?: string;
  company?: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
}

/**
 * Interface representing a unified activity entry
 */
export interface UnifiedActivityEntry {
  id: string; // Format: 'call-123' or 'task-456'
  type: 'call' | 'task' | 'note'; // Type of activity
  timestamp: string; // ISO date string
  summary: string; // Brief description
  details: any; // Original call or task data
}

/**
 * Interface representing a comprehensive activity/event entry from the API
 */
export interface ActivityEntry {
  id: number;
  type: 'task' | 'event' | 'note' | 'call';
  title: string;
  description?: string;
  status: string; // 'pending', 'completed', 'in-progress', 'cancelled'
  created_at: string;
  updated_at: string;
  
  // Task-specific fields
  due_date?: string;
  completed?: boolean;
  priority?: string;
  
  // Event-specific fields
  start_datetime?: string; // ISO date string
  end_datetime?: string; // ISO date string
  location?: string;
  
  // Relationship fields
  contact_id?: number;
  company_id?: number;
  user_id?: number;
  
  // Related data (populated by joins)
  contacts?: {
    id: number;
    first_name: string;
    last_name: string;
    phone: string;
    email: string;
  };
  companies?: {
    id: number;
    company_name: string;
    industry: string;
  };
}

/**
 * Interface representing a product entry from the API
 */
export interface Product {
  id: number;
  product_name: string;
  sku_code: string | null;
  category: string;
  price: number;
  status: string; // 'active' or 'inactive'
  description: string | null;
  created_at: string; // ISO date string
  updated_at: string; // ISO date string
}

/**
 * Type for the data expected when creating a new product
 */
export type NewProductData = {
  product_name: string;
  sku_code?: string;
  category: string;
  price: number;
  status: string; // 'active' or 'inactive'
  description?: string;
};

/**
 * Type for the data expected by createContactManually.
 */
export type NewContactData = {
  first_name: string;
  last_name: string;
  phone: string;
  email?: string;
  company?: string;
  status: string; // Status field is required
  // Add other client-side originated fields here
};

/**
 * Type for the data expected when updating a contact.
 */
export type ContactFormData = {
  first_name: string;
  last_name: string;
  phone: string;
  email?: string;
  company?: string;
};

/**
 * Type for activity data (notes, tasks, etc.)
 */
export interface ActivityData {
  id: number;
  title?: string;
  description?: string;
  type: 'note' | 'task' | 'call';
  contact_id: number;
  created_at: string;
  updated_at: string;
  // Include other fields as needed
  completed?: boolean;
  status?: string;
  due_date?: string;
}

/**
 * Type for updating an activity
 */
export type ActivityUpdateData = {
  title?: string;
  description?: string;
  completed?: boolean;
  status?: string;
  due_date?: string;
};

/**
 * Pipeline-related types for backend integration
 */
export interface DBPipeline {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface DBPipelineStage {
  id: string;
  name: string;
  order: number;
  deals: DBDeal[];
}

export interface DBDeal {
  id: number;
  name: string;
  amount: number;
  company: string;
  contact: string;
  closingDate: string;
  stageId: string;
  probability: number;
  status: 'open' | 'won' | 'lost';
}

export interface Pipeline {
  id: string;
  name: string;
  stages: DBPipelineStage[];
}

export type NewDealData = {
  name: string;
  amount: number;
  company_id?: number | null;
  contact_id?: number | null;
  closing_date?: string;
  stage_id: string;
  pipeline_id: string;
  probability: number;
  status?: 'open' | 'won' | 'lost';
};

/**
 * Fetches call logs from the API
 * @returns Promise containing an array of call log entries
 */
export async function fetchCallLogs(): Promise<CallLogEntry[]> {
  const fullUrl = `${API_BASE_URL}/api/calls`;
  console.log("Fetching call logs from:", fullUrl);
  
  try {
    const response = await fetch(fullUrl);
    
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

/**
 * Fetches tasks from the API
 * @param view - 'mine' to show only user's tasks, 'all' to show all tasks (admin only)
 * @returns Promise containing an array of task entries
 */
export async function fetchTasks(view: 'mine' | 'all' = 'mine'): Promise<TaskEntry[]> {
  try {
    // Get authentication headers
    const authHeaders = await getAuthHeaders();
    if (!('Authorization' in authHeaders)) {
      console.error('fetchTasks: No authorization token found.');
      throw new Error('Unauthorized: No token available for API request.');
    }
    
    const url = view === 'all' ? '/api/tasks?view=all' : '/api/tasks?view=mine';
    const response = await fetch(`${API_BASE_URL}${url}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
      },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("fetchTasks - HTTP error:", response.status, errorText);
      
      if (response.status === 403) {
        throw new Error('Access denied: You do not have permission to view tasks');
      }
      
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    
    const data = await response.json();
    console.log(`fetchTasks - Success: ${data.length} tasks fetched with view ${view}`);
    return data as TaskEntry[];
  } catch (error) {
    console.error('fetchTasks - Error:', error);
    // It's good practice to re-throw the error or handle it appropriately
    // For TanStack Query, re-throwing allows it to manage the error state
    throw error instanceof Error ? error : new Error('Unknown error fetching tasks');
  }
}

/**
 * Updates the status of a task
 * @param taskId - The ID of the task to update
 * @param completed - Boolean indicating if the task is completed
 * @returns Promise containing the updated task entry
 */
export async function updateTaskStatus(taskId: number, completed: boolean): Promise<TaskEntry> {
  const updates = { completed, status: completed ? 'completed' : 'pending' };
  try {
    // Get authentication headers
    const authHeaders = await getAuthHeaders();
    if (!('Authorization' in authHeaders)) {
      console.error('updateTaskStatus: No authorization token found.');
      throw new Error('Unauthorized: No token available for API request.');
    }
    
    const response = await fetch(`${API_BASE_URL}/api/activities/${taskId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      // Attempt to parse error response from the API if available
      let errorMessage = `API error: ${response.status} ${response.statusText}`;
      try {
        const errorData = await response.json();
        if (errorData && errorData.message) {
          errorMessage = errorData.message;
        }
      } catch (parseError) {
        // Ignore if response is not JSON or empty
      }
      
      if (response.status === 403) {
        throw new Error('Access denied: You can only update your own tasks');
      }
      
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log(`updateTaskStatus - Success: Task ${taskId} updated`);
    return data as TaskEntry;
  } catch (error) {
    console.error(`updateTaskStatus - Error updating task ${taskId}:`, error);
    throw error instanceof Error ? error : new Error('Unknown error updating task');
  }
}

/**
 * Type for the data expected by createTask.
 * `title` is required. Other fields are optional and will have defaults if not provided.
 */
export type NewTaskData = {
  title: string;
  description?: string;
  due_date?: string; // Client should send as ISO string or parsable date string.
  priority?: string; // Added priority field: 'low', 'medium', 'high'
  // type, completed, and status will be defaulted if not provided.
  type?: 'task';
  completed?: boolean;
  status?: string;
  // Add other client-side originated fields here.
  // Fields like id, created_at, updated_at are handled by backend.
};

/**
 * Creates a new task via the API.
 * @param newTaskData - The data for the new task (e.g., { title, description, due_date }).
 *                      `type` defaults to 'task', `completed` to `false`, `status` to `pending`,
 *                      `priority` defaults to 'medium' if not provided.
 * @returns Promise containing the newly created task entry from the backend.
 */
export async function createTask(newTaskData: NewTaskData): Promise<TaskEntry> {
  // Log the API base URL for debugging
  console.log("API_BASE_URL:", API_BASE_URL);

  // Get authentication headers
  const authHeaders = await getAuthHeaders();
  if (!('Authorization' in authHeaders)) {
    console.error('createTask: No authorization token found.');
    throw new Error('Unauthorized: No token available for API request.');
  }

  const payload = {
    type: 'task' as const, // Ensure 'type' is 'task'
    completed: false,
    status: 'pending',
    priority: 'medium', // Default priority
    ...newTaskData, // User-provided data overrides defaults
  };

  // Log the payload being sent, this should be the first operational line.
  console.log("createTask API function called with payload:", payload);

  // If due_date is an empty string, treat it as not provided (backend might set to null or handle it)
  // Ensure this check happens *after* spreading newTaskData so it uses the potentially overridden value
  if (payload.due_date === '') {
    delete payload.due_date;
  }

  // Ensure proper date formatting for ISO string
  if (payload.due_date && typeof payload.due_date === 'string' && !payload.due_date.includes('T')) {
    // Convert YYYY-MM-DD to YYYY-MM-DDT00:00:00Z
    try {
      payload.due_date = new Date(payload.due_date).toISOString();
      console.log("Formatted due_date:", payload.due_date);
    } catch (error) {
      console.error("Error formatting date:", error);
      // Keep the original format if there's an error
    }
  }

  // For tasks, ensure event-specific fields are not included
  // This prevents database errors with start_datetime constraint
  const taskPayload = {
    type: payload.type,
    title: payload.title,
    description: payload.description,
    due_date: payload.due_date,
    completed: payload.completed,
    status: payload.status,
    priority: payload.priority,
    // Explicitly exclude start_datetime, end_datetime, location for tasks
    // Only include fields that are relevant for tasks
  };

  // Remove undefined fields to keep payload clean
  Object.keys(taskPayload).forEach(key => {
    if (taskPayload[key as keyof typeof taskPayload] === undefined) {
      delete taskPayload[key as keyof typeof taskPayload];
    }
  });

  console.log("Final task payload (cleaned):", taskPayload);

  // The API URL to call
  const apiUrl = `${API_BASE_URL}/api/activities`;
  console.log("Making API request to:", apiUrl);
  
  // Setup for retries
  const maxRetries = 3;
  const timeout = 5000; // 5 seconds
  let retryCount = 0;
  
  // Retry loop
  while (retryCount < maxRetries) {
    try {
      console.log(`Attempt ${retryCount + 1}/${maxRetries}: Sending POST request to: ${apiUrl}`);
      
      // Use AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
        body: JSON.stringify(taskPayload),
        signal: controller.signal,
      });
      
      // Clear the timeout
      clearTimeout(timeoutId);
      
      console.log("API response received:", response.status, response.statusText);

      if (!response.ok) {
        let errorMessage = `API error: ${response.status} ${response.statusText}`;
        try {
          const errorData = await response.json();
          console.log("Error response body:", errorData);
          if (errorData && errorData.message) {
            errorMessage = `${errorMessage} - ${errorData.message}`;
          }
          if (errorData && errorData.details) {
            errorMessage = `${errorMessage} (Details: ${JSON.stringify(errorData.details)})`;
          }
        } catch (parseError) {
          // Try to get the raw text if JSON parsing fails
          try {
            const textError = await response.text();
            console.error("Raw error response:", textError);
            errorMessage = `${errorMessage} - Raw response: ${textError}`;
          } catch (textError) {
            console.warn("Could not get error response text either");
          }
          
          console.warn("Could not parse error response from API or error structure was unexpected:", parseError);
        }
        
        // Only retry on server errors (5xx) or network issues
        if (response.status >= 500) {
          console.error(`Server error (${response.status}), will retry...`);
          retryCount++;
          // Wait before retrying (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
          continue;
        }
        
        // For client errors (4xx), don't retry
        console.error("Error details for createTask:", errorMessage, "Payload sent:", taskPayload);
        throw new Error(errorMessage);
      }

      const createdTask = await response.json();
      console.log("Task created successfully:", createdTask);
      return createdTask as TaskEntry;
      
    } catch (error) {
      // Check if it's a timeout or network error
      if (
        error instanceof Error && 
        (error.name === 'AbortError' || 
         error.message.includes('Failed to fetch') ||
         error.message.includes('NetworkError') ||
         error.message.includes('ECONNREFUSED') ||
         error.message.includes('Connection refused'))
      ) {
        console.error(`Network error on attempt ${retryCount + 1}:`, error.message);
        retryCount++;
        if (retryCount < maxRetries) {
          // Wait before retrying (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
          continue;
        }
      }
      
      // For other errors or if we've exhausted retries
      console.error('Error creating task:', error, "Payload attempted:", taskPayload);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Unknown error creating task');
    }
  }
  
  // If we get here, we've exhausted all retries
  throw new Error(`Failed to create task after ${maxRetries} attempts. Please check your network connection and server status.`);
}

/**
 * Creates a new contact via the API.
 * @param contactData - The data for the new contact.
 * @returns Promise containing the newly created contact entry from the backend.
 */
export async function createContactManually(contactData: NewContactData): Promise<ContactEntry> {
  console.log('[API_CLIENT_CREATE_CONTACT] Received contactData:', JSON.stringify(contactData, null, 2));
  console.log(`[API_CLIENT_CREATE_CONTACT] Status field: "${contactData.status}", Type: ${typeof contactData.status}`);
  
  // Create a copy of the data to avoid mutating the original
  const contactDataToSend = { ...contactData };
  
  // Only set a default if the status is missing or empty
  if (!contactDataToSend.status || 
      contactDataToSend.status === 'undefined' || 
      contactDataToSend.status === '') {
    console.log(`[API_CLIENT_CREATE_CONTACT] Invalid status detected: "${contactDataToSend.status}", defaulting to 'Lead'`);
    contactDataToSend.status = "Lead";
  }
  
  const url = `${API_BASE_URL}/api/contacts`;
  console.log(`[API_CLIENT_CREATE_CONTACT] Sending to URL: ${url}`);
  console.log('[API_CLIENT_CREATE_CONTACT] Final payload being sent to server:', JSON.stringify(contactDataToSend, null, 2));
  console.log(`[API_CLIENT_CREATE_CONTACT] Final status value: "${contactDataToSend.status}", Type: ${typeof contactDataToSend.status}`);

  try {
    // Add timeout handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(contactDataToSend),
      signal: controller.signal
    });
    
    // Clear the timeout
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      let errorMessage = `API error: ${response.status} ${response.statusText}`;
      try {
        const errorData = await response.json();
        console.log("[API_CLIENT_CREATE_CONTACT] Error response body:", errorData);
        if (errorData && errorData.message) {
          errorMessage = `${errorMessage} - ${errorData.message}`;
        }
      } catch (parseError) {
        // Try to get raw text if JSON parsing fails
        try {
          const textError = await response.text();
          console.error("[API_CLIENT_CREATE_CONTACT] Raw error response:", textError);
          errorMessage = `${errorMessage} - Raw response: ${textError}`;
        } catch (textError) {
          console.warn("[API_CLIENT_CREATE_CONTACT] Could not get error response text either");
        }
      }
      throw new Error(errorMessage);
    }
    
    const data = await response.json();
    console.log("[API_CLIENT_CREATE_CONTACT] Response data received:", JSON.stringify(data, null, 2));
    console.log(`[API_CLIENT_CREATE_CONTACT] Status in response: "${data.status}", Type: ${typeof data.status}`);
    return data as ContactEntry;
  } catch (error) {
    console.error('[API_CLIENT_CREATE_CONTACT] Error creating contact:', error);
    
    // Check if this is an AbortError (timeout)
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timed out. The server might be overloaded or unreachable.');
    }
    
    // Check if this is a network error
    if (error instanceof Error && 
        (error.message.includes('Failed to fetch') ||
         error.message.includes('NetworkError') ||
         error.message.includes('network'))) {
      throw new Error('Network error. Please check your internet connection and try again.');
    }
    
    throw error instanceof Error ? error : new Error('Unknown error creating contact');
  }
}

/**
 * Links a call to a contact by updating the call record.
 * @param callId - The ID of the call to update.
 * @param contactId - The ID of the contact to link the call to.
 * @returns Promise containing the updated call log entry.
 */
export async function linkCallToContact(callId: number, contactId: number): Promise<CallLogEntry> {
  console.log(`Linking call ${callId} to contact ${contactId}`);
  const url = `${API_BASE_URL}/api/calls/${callId}/link-contact`;
  console.log("Linking call to contact at URL:", url);

  try {
    // Add timeout handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ contact_id: contactId }),
      signal: controller.signal
    });
    
    // Clear the timeout
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      let errorMessage = `API error: ${response.status} ${response.statusText}`;
      try {
        const errorData = await response.json();
        console.log("Error response body:", errorData);
        if (errorData && errorData.message) {
          errorMessage = `${errorMessage} - ${errorData.message}`;
        }
      } catch (parseError) {
        // Try to get raw text if JSON parsing fails
        try {
          const textError = await response.text();
          console.error("Raw error response:", textError);
          errorMessage = `${errorMessage} - Raw response: ${textError}`;
        } catch (textError) {
          console.warn("Could not get error response text either");
        }
      }
      throw new Error(errorMessage);
    }
    
    const data = await response.json();
    console.log("Call linked to contact successfully:", data);
    return data as CallLogEntry;
  } catch (error) {
    console.error('Error linking call to contact:', error);
    
    // Check if this is an AbortError (timeout)
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timed out. The server might be overloaded or unreachable.');
    }
    
    // Check if this is a network error
    if (error instanceof Error && 
        (error.message.includes('Failed to fetch') ||
         error.message.includes('NetworkError') ||
         error.message.includes('network'))) {
      throw new Error('Network error. Please check your internet connection and try again.');
    }
    
    throw error instanceof Error ? error : new Error('Unknown error linking call to contact');
  }
}

/**
 * Fetches all activities (calls and tasks) for a specific contact
 * @param contactId - The ID of the contact to fetch activities for
 * @returns Promise containing an array of unified activity entries
 */
export async function fetchContactActivities(contactId: string | number): Promise<UnifiedActivityEntry[]> {
  console.log(`Fetching activities for contact ${contactId}`);
  const url = `${API_BASE_URL}/api/contacts/${contactId}/all-activities`;
  console.log("Fetching contact activities from URL:", url);

  try {
    // Get authentication headers
    const authHeaders = await getAuthHeaders();
    if (!('Authorization' in authHeaders)) {
      console.error('fetchContactActivities: No authorization token found.');
      throw new Error('Unauthorized: No token available for API request.');
    }
    
    // Add timeout handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
      },
      signal: controller.signal
    });
    
    // Clear the timeout
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      let errorMessage = `API error: ${response.status} ${response.statusText}`;
      try {
        const errorData = await response.json();
        console.log("Error response body:", errorData);
        if (errorData && errorData.message) {
          errorMessage = `${errorMessage} - ${errorData.message}`;
        }
      } catch (parseError) {
        // Try to get raw text if JSON parsing fails
        try {
          const textError = await response.text();
          console.error("Raw error response:", textError);
          errorMessage = `${errorMessage} - Raw response: ${textError}`;
        } catch (textError) {
          console.warn("Could not get error response text either");
        }
      }
      
      if (response.status === 403) {
        throw new Error('Access denied: You do not have permission to view activities for this contact');
      }
      
      throw new Error(errorMessage);
    }
    
    const data = await response.json();
    console.log(`Fetched ${data.length} activities for contact ${contactId}`, data);
    return data as UnifiedActivityEntry[];
  } catch (error) {
    console.error(`Error fetching activities for contact ${contactId}:`, error);
    
    // Check if this is an AbortError (timeout)
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timed out. The server might be overloaded or unreachable.');
    }
    
    // Check if this is a network error
    if (error instanceof Error && 
        (error.message.includes('Failed to fetch') ||
         error.message.includes('NetworkError') ||
         error.message.includes('network'))) {
      throw new Error('Network error. Please check your internet connection and try again.');
    }
    
    throw error instanceof Error ? error : new Error(`Unknown error fetching contact activities: ${error}`);
  }
}

/**
 * Type for the data required to create a note activity
 */
export type NewNoteData = {
  contact_id: number;
  type: 'note';
  title?: string;
  description: string;
  // Removed owner_id since it's causing database errors and may not be required
};

/**
 * Creates a new note activity for a contact (will be owned by the authenticated user)
 * @param noteData - The data for the new note activity
 * @returns Promise containing the newly created note activity
 */
export async function createNoteActivity(noteData: NewNoteData): Promise<UnifiedActivityEntry> {
  console.log("createNoteActivity API function called with payload:", noteData);
  
  // Get authentication headers
  const authHeaders = await getAuthHeaders();
  if (!('Authorization' in authHeaders)) {
    console.error('createNoteActivity: No authorization token found.');
    throw new Error('Unauthorized: No token available for API request.');
  }
  
  // The payload is the noteData directly since we don't need defaults like tasks
  const payload = noteData;
  
  // The API URL to call (same as createTask)
  const apiUrl = `${API_BASE_URL}/api/activities`;
  console.log("Making API request to:", apiUrl);
  
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
      },
      body: JSON.stringify(payload),
    });
    
    console.log("API response received:", response.status, response.statusText);

    if (!response.ok) {
      let errorMessage = `API error: ${response.status} ${response.statusText}`;
      try {
        const errorData = await response.json();
        console.log("Error response body:", errorData);
        if (errorData && errorData.message) {
          errorMessage = `${errorMessage} - ${errorData.message}`;
        }
      } catch (parseError) {
        console.warn("Could not parse error response from API:", parseError);
      }
      throw new Error(errorMessage);
    }

    const createdNote = await response.json();
    console.log("Note created successfully:", createdNote);
    
    // Format the created note as a UnifiedActivityEntry
    const unifiedNote: UnifiedActivityEntry = {
      id: `note-${createdNote.id}`,
      type: 'note',
      timestamp: createdNote.created_at,
      summary: createdNote.title || 'Note', 
      details: createdNote
    };
    
    return unifiedNote;
  } catch (error) {
    console.error('Error creating note activity:', error);
    throw error instanceof Error ? error : new Error('Unknown error creating note activity');
  }
}

/**
 * Fetches a Twilio Access Token from the API for client-side calling
 * @returns Promise containing the Twilio token response
 */
export async function fetchTwilioToken(): Promise<TwilioTokenResponse> {
  const fullUrl = `${API_BASE_URL}/api/twilio/token`;
  console.log("Fetching Twilio token from:", fullUrl);
  
  try {
    const response = await fetch(fullUrl);
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log("Twilio token fetched successfully");
    return data as TwilioTokenResponse;
  } catch (error) {
    console.error('Error fetching Twilio token:', error);
    throw error instanceof Error ? error : new Error('Unknown error fetching Twilio token');
  }
}

/**
 * Fetches a contact by phone number from the backend.
 * @param phoneNumber - The phone number to look up.
 * @returns The contact entry if found, or null.
 */
export async function fetchContactByPhone(phoneNumber: string): Promise<ContactEntry | null> {
  try {
    console.log(`Fetching contact by phone: ${phoneNumber}`);
    
    // Use the dedicated endpoint for phone number lookups
    const response = await fetch(`${API_BASE_URL}/api/contacts/lookup-by-phone?phone=${encodeURIComponent(phoneNumber)}`);
    
    if (response.status === 404) {
      console.log('No contact found with this phone number');
      return null;
    }
    
    if (!response.ok) {
      console.warn('fetchContactByPhone: Non-200 response', response.status);
      return null;
    }
    
    const data = await response.json();
    return data as ContactEntry;
  } catch (err) {
    console.error('fetchContactByPhone: Error fetching contact:', err);
    return null;
  }
}

/**
 * Fetches a contact by ID from the API
 * @param contactId - The ID of the contact to fetch
 * @returns Promise containing the contact entry
 */
export async function fetchContactById(contactId: string | number): Promise<ContactEntry> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/contacts/${contactId}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Contact with ID ${contactId} not found`);
      }
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data as ContactEntry;
  } catch (error) {
    console.error(`Error fetching contact ${contactId}:`, error);
    throw error instanceof Error ? error : new Error(`Unknown error fetching contact ${contactId}`);
  }
}

/**
 * Updates a contact via the API
 * @param contactId - The ID of the contact to update
 * @param contactData - The partial data to update
 * @returns Promise containing the updated contact entry
 */
export async function updateContact(contactId: string | number, contactData: Partial<ContactFormData>): Promise<ContactEntry> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/contacts/${contactId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(contactData),
    });

    if (!response.ok) {
      // Attempt to parse error response from the API if available
      let errorMessage = `API error: ${response.status} ${response.statusText}`;
      try {
        const errorData = await response.json();
        if (errorData && errorData.message) {
          errorMessage = errorData.message;
        }
      } catch (parseError) {
        // Ignore if response is not JSON or empty
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data as ContactEntry;
  } catch (error) {
    console.error(`Error updating contact ${contactId}:`, error);
    throw error instanceof Error ? error : new Error(`Unknown error updating contact ${contactId}`);
  }
}

/**
 * Updates an activity (note, task, etc.) - only allowed for the owner
 * @param activityId - The ID of the activity to update
 * @param updateData - The data to update
 * @returns Promise containing the updated activity
 */
export async function updateActivity(activityId: string | number, updateData: ActivityUpdateData): Promise<ActivityData> {
  try {
    // Get authentication headers
    const authHeaders = await getAuthHeaders();
    if (!('Authorization' in authHeaders)) {
      console.error('updateActivity: No authorization token found.');
      throw new Error('Unauthorized: No token available for API request.');
    }
    
    const response = await fetch(`${API_BASE_URL}/api/activities/${activityId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
      },
      body: JSON.stringify(updateData),
    });

    if (!response.ok) {
      let errorMessage = `API error: ${response.status} ${response.statusText}`;
      try {
        const errorData = await response.json();
        if (errorData && errorData.message) {
          errorMessage = errorData.message;
        }
      } catch (parseError) {
        // Ignore if response is not JSON or empty
      }
      
      if (response.status === 403) {
        throw new Error('Access denied: You can only update your own activities');
      }
      if (response.status === 404) {
        throw new Error(`Activity with ID ${activityId} not found`);
      }
      
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data as ActivityData;
  } catch (error) {
    console.error(`Error updating activity ${activityId}:`, error);
    throw error instanceof Error ? error : new Error(`Unknown error updating activity ${activityId}`);
  }
}

/**
 * Deletes an activity (note, task, etc.) - only allowed for the owner
 * @param activityId - The ID of the activity to delete
 * @returns Promise containing a success message
 */
export async function deleteActivity(activityId: string | number): Promise<{ message: string }> {
  try {
    // Get authentication headers
    const authHeaders = await getAuthHeaders();
    if (!('Authorization' in authHeaders)) {
      console.error('deleteActivity: No authorization token found.');
      throw new Error('Unauthorized: No token available for API request.');
    }
    
    const response = await fetch(`${API_BASE_URL}/api/activities/${activityId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
      },
    });

    if (!response.ok) {
      let errorMessage = `API error: ${response.status} ${response.statusText}`;
      try {
        const errorData = await response.json();
        if (errorData && errorData.message) {
          errorMessage = errorData.message;
        }
      } catch (parseError) {
        // Ignore if response is not JSON or empty
      }
      
      if (response.status === 403) {
        throw new Error('Access denied: You can only delete your own activities');
      }
      if (response.status === 404) {
        throw new Error(`Activity with ID ${activityId} not found`);
      }
      
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data as { message: string };
  } catch (error) {
    console.error(`Error deleting activity ${activityId}:`, error);
    throw error instanceof Error ? error : new Error(`Unknown error deleting activity ${activityId}`);
  }
}

/**
 * Fetches products from the API
 * @returns Promise containing an array of product entries
 */
export async function fetchProducts(): Promise<Product[]> {
  const fullUrl = `${API_BASE_URL}/api/products`;
  console.log("Fetching products from:", fullUrl);
  
  try {
    const authHeaders = await getAuthHeaders();
    
    const response = await fetch(fullUrl, {
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders
      }
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data as Product[];
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error instanceof Error ? error : new Error('Unknown error fetching products');
  }
}

/**
 * Fetches a single product by ID via the API
 * @param productId - The ID of the product to fetch
 * @returns Promise containing the product entry
 */
export async function fetchProductById(productId: string | number): Promise<Product> {
  const fullUrl = `${API_BASE_URL}/api/products/${productId}`;
  console.log("Fetching product from:", fullUrl);
  
  try {
    const authHeaders = await getAuthHeaders();
    
    const response = await fetch(fullUrl, {
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders
      }
    });
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Product with ID ${productId} not found`);
      }
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data as Product;
  } catch (error) {
    console.error('Error fetching product:', error);
    throw error instanceof Error ? error : new Error('Unknown error fetching product');
  }
}

/**
 * Creates a new product via the API
 * @param productData - The data for the new product
 * @returns Promise containing the newly created product entry
 */
export async function createProduct(productData: NewProductData): Promise<Product> {
  console.log("createProduct API function called with payload:", productData);
  
  const apiUrl = `${API_BASE_URL}/api/products`;
  console.log("Making API request to:", apiUrl);
  
  // Setup for retries
  const maxRetries = 3;
  const timeout = 5000; // 5 seconds
  let retryCount = 0;
  
  // Retry loop
  while (retryCount < maxRetries) {
    try {
      console.log(`Attempt ${retryCount + 1}/${maxRetries}: Sending POST request to: ${apiUrl}`);
      
      const authHeaders = await getAuthHeaders();
      
      // Use AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders
        },
        body: JSON.stringify(productData),
        signal: controller.signal,
      });
      
      // Clear the timeout
      clearTimeout(timeoutId);
      
      console.log("API response received:", response.status, response.statusText);

      if (!response.ok) {
        let errorMessage = `API error: ${response.status} ${response.statusText}`;
        try {
          const errorData = await response.json();
          console.log("Error response body:", errorData);
          if (errorData && errorData.message) {
            errorMessage = `${errorMessage} - ${errorData.message}`;
          }
          if (errorData && errorData.details) {
            errorMessage = `${errorMessage} (Details: ${JSON.stringify(errorData.details)})`;
          }
        } catch (parseError) {
          // Try to get the raw text if JSON parsing fails
          try {
            const textError = await response.text();
            console.error("Raw error response:", textError);
            errorMessage = `${errorMessage} - Raw response: ${textError}`;
          } catch (textError) {
            console.warn("Could not get error response text either");
          }
          
          console.warn("Could not parse error response from API or error structure was unexpected:", parseError);
        }
        
        // Only retry on server errors (5xx) or network issues
        if (response.status >= 500) {
          console.error(`Server error (${response.status}), will retry...`);
          retryCount++;
          // Wait before retrying (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
          continue;
        }
        
        // For client errors (4xx), don't retry
        console.error("Error details for createProduct:", errorMessage, "Payload sent:", productData);
        throw new Error(errorMessage);
      }

      const createdProduct = await response.json();
      console.log("Product created successfully:", createdProduct);
      return createdProduct as Product;
      
    } catch (error) {
      // Check if it's a timeout or network error
      if (
        error instanceof Error && 
        (error.name === 'AbortError' || 
         error.message.includes('Failed to fetch') ||
         error.message.includes('NetworkError') ||
         error.message.includes('ECONNREFUSED') ||
         error.message.includes('Connection refused'))
      ) {
        console.error(`Network error on attempt ${retryCount + 1}:`, error.message);
        retryCount++;
        if (retryCount < maxRetries) {
          // Wait before retrying (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
          continue;
        }
      }
      
      // For other errors or if we've exhausted retries
      console.error('Error creating product:', error, "Payload attempted:", productData);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Unknown error creating product');
    }
  }
  
  // If we get here, we've exhausted all retries
  throw new Error(`Failed to create product after ${maxRetries} attempts. Please check your network connection and server status.`);
}

/**
 * Updates an existing product via the API
 * @param productId - The ID of the product to update
 * @param productData - The partial data to update
 * @returns Promise containing the updated product entry
 */
export async function updateProduct(productId: string | number, productData: Partial<NewProductData>): Promise<Product> {
  console.log("updateProduct API function called with ID:", productId, "and payload:", productData);
  
  const apiUrl = `${API_BASE_URL}/api/products/${productId}`;
  console.log("Making API request to:", apiUrl);
  
  // Setup for retries
  const maxRetries = 3;
  const timeout = 5000; // 5 seconds
  let retryCount = 0;
  
  // Retry loop
  while (retryCount < maxRetries) {
    try {
      console.log(`Attempt ${retryCount + 1}/${maxRetries}: Sending PATCH request to: ${apiUrl}`);
      
      const authHeaders = await getAuthHeaders();
      
      // Use AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      const response = await fetch(apiUrl, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders
        },
        body: JSON.stringify(productData),
        signal: controller.signal,
      });
      
      // Clear the timeout
      clearTimeout(timeoutId);
      
      console.log("API response received:", response.status, response.statusText);

      if (!response.ok) {
        let errorMessage = `API error: ${response.status} ${response.statusText}`;
        try {
          const errorData = await response.json();
          console.log("Error response body:", errorData);
          if (errorData && errorData.message) {
            errorMessage = `${errorMessage} - ${errorData.message}`;
          }
        } catch (parseError) {
          // Try to get the raw text if JSON parsing fails
          try {
            const textError = await response.text();
            console.error("Raw error response:", textError);
            errorMessage = `${errorMessage} - Raw response: ${textError}`;
          } catch (textError) {
            console.warn("Could not get error response text either");
          }
        }
        
        // Only retry on server errors (5xx) or network issues
        if (response.status >= 500) {
          console.error(`Server error (${response.status}), will retry...`);
          retryCount++;
          // Wait before retrying (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
          continue;
        }
        
        // For client errors (4xx), don't retry
        console.error("Error details for updateProduct:", errorMessage, "ID:", productId, "Payload sent:", productData);
        throw new Error(errorMessage);
      }

      const updatedProduct = await response.json();
      console.log("Product updated successfully:", updatedProduct);
      return updatedProduct as Product;
      
    } catch (error) {
      // Check if it's a timeout or network error
      if (
        error instanceof Error && 
        (error.name === 'AbortError' || 
         error.message.includes('Failed to fetch') ||
         error.message.includes('NetworkError') ||
         error.message.includes('ECONNREFUSED') ||
         error.message.includes('Connection refused'))
      ) {
        console.error(`Network error on attempt ${retryCount + 1}:`, error.message);
        retryCount++;
        if (retryCount < maxRetries) {
          // Wait before retrying (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
          continue;
        }
      }
      
      // For other errors or if we've exhausted retries
      console.error('Error updating product:', error, "ID:", productId, "Payload attempted:", productData);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Unknown error updating product');
    }
  }
  
  // If we get here, we've exhausted all retries
  throw new Error(`Failed to update product after ${maxRetries} attempts. Please check your network connection and server status.`);
}

/**
 * Deletes a product via the API
 * @param productId - The ID of the product to delete
 * @returns Promise containing a success message
 */
export async function deleteProduct(productId: string | number): Promise<{ message: string }> {
  console.log("deleteProduct API function called with ID:", productId);
  
  const apiUrl = `${API_BASE_URL}/api/products/${productId}`;
  console.log("Making API request to:", apiUrl);
  
  try {
    const authHeaders = await getAuthHeaders();
    
    // Use AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const response = await fetch(apiUrl, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders
      },
      signal: controller.signal,
    });
    
    // Clear the timeout
    clearTimeout(timeoutId);
    
    console.log("API response received:", response.status, response.statusText);

    if (!response.ok) {
      let errorMessage = `API error: ${response.status} ${response.statusText}`;
      try {
        const errorData = await response.json();
        console.log("Error response body:", errorData);
        if (errorData && errorData.message) {
          errorMessage = `${errorMessage} - ${errorData.message}`;
        }
      } catch (parseError) {
        // Try to get the raw text if JSON parsing fails
        try {
          const textError = await response.text();
          console.error("Raw error response:", textError);
          errorMessage = `${errorMessage} - Raw response: ${textError}`;
        } catch (textError) {
          console.warn("Could not get error response text either");
        }
      }
      
      console.error("Error details for deleteProduct:", errorMessage);
      throw new Error(errorMessage);
    }

    const result = await response.json();
    console.log("Product deleted successfully:", result);
    return result as { message: string };
    
  } catch (error) {
    console.error('Error deleting product:', error);
    
    // Check if this is an AbortError (timeout)
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timed out. The server might be overloaded or unreachable.');
    }
    
    // Check if this is a network error
    if (error instanceof Error && 
        (error.message.includes('Failed to fetch') ||
         error.message.includes('NetworkError') ||
         error.message.includes('network'))) {
      throw new Error('Network error. Please check your internet connection and try again.');
    }
    
    throw error instanceof Error ? error : new Error('Unknown error deleting product');
  }
}

/**
 * Interface representing a company entry from the API
 */
export interface Company {
  id: number;
  company_name: string;
  industry: string | null;
  phone: string | null;
  website: string | null;
  status: string; // 'active' or 'inactive'
  company_owner: string | null;
  tags: string | null;
  created_at: string; // ISO date string
  updated_at: string; // ISO date string
}

/**
 * Type for the data expected when creating a new company
 */
export type NewCompanyData = {
  company_name: string;
  industry?: string;
  phone?: string;
  website?: string;
  status: string; // 'active' or 'inactive'
  company_owner?: string;
  tags?: string;
};

/**
 * Fetches companies from the API with optional view parameter
 * @param view - Whether to fetch 'mine' (user's own) or 'all' companies (admin only)
 * @returns Promise containing an array of company entries
 */
export async function fetchCompanies(view: 'mine' | 'all' = 'mine'): Promise<Company[]> {
  const url = new URL(`${API_BASE_URL}/api/companies`);
  if (view) {
    url.searchParams.append('view', view);
  }
  
  console.log("Fetching companies from:", url.toString(), "with view:", view);
  
  try {
    const headers = await getAuthHeaders();
    
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API error fetching companies: ${response.status} ${response.statusText}`, errorText);
      throw new Error(`Failed to fetch companies: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log(`Successfully fetched ${data.length} companies (view: ${view})`);
    return data as Company[];
  } catch (error) {
    console.error('Error fetching companies:', error);
    
    // Check if it's a network error
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Network error: Unable to connect to the server. Please check your internet connection.');
    }
    
    throw error instanceof Error ? error : new Error('Unknown error fetching companies');
  }
}

/**
 * Creates a new company
 * @param companyData - The company data to create
 * @returns Promise containing the created company
 */
export async function createCompany(companyData: NewCompanyData): Promise<Company> {
  const fullUrl = `${API_BASE_URL}/api/companies`;
  console.log("Creating company at:", fullUrl, "with data:", companyData);
  
  try {
    const headers = await getAuthHeaders();
    
    const response = await fetch(fullUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: JSON.stringify(companyData),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API error creating company: ${response.status} ${response.statusText}`, errorText);
      
      // Try to parse error message from response
      try {
        const errorData = JSON.parse(errorText);
        throw new Error(errorData.message || `Failed to create company: ${response.status} ${response.statusText}`);
      } catch {
        throw new Error(`Failed to create company: ${response.status} ${response.statusText}`);
      }
    }
    
    const data = await response.json();
    console.log("Successfully created company:", data);
    return data as Company;
  } catch (error) {
    console.error('Error creating company:', error);
    
    // Check if it's a network error
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Network error: Unable to connect to the server. Please check your internet connection.');
    }
    
    throw error instanceof Error ? error : new Error('Unknown error creating company');
  }
}

/**
 * Fetches a single company by ID
 * @param companyId - The ID of the company to fetch
 * @returns Promise containing the company data
 */
export async function fetchCompanyById(companyId: string | number): Promise<Company> {
  const fullUrl = `${API_BASE_URL}/api/companies/${companyId}`;
  console.log("Fetching company by ID from:", fullUrl);
  
  try {
    const headers = await getAuthHeaders();
    
    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API error fetching company: ${response.status} ${response.statusText}`, errorText);
      
      if (response.status === 404) {
        throw new Error(`Company with ID ${companyId} not found`);
      }
      
      throw new Error(`Failed to fetch company: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log("Successfully fetched company:", data);
    return data as Company;
  } catch (error) {
    console.error('Error fetching company by ID:', error);
    
    // Check if it's a network error
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Network error: Unable to connect to the server. Please check your internet connection.');
    }
    
    throw error instanceof Error ? error : new Error('Unknown error fetching company');
  }
}

/**
 * Updates a company by ID
 * @param companyId - The ID of the company to update
 * @param companyData - The partial company data to update
 * @returns Promise containing the updated company
 */
export async function updateCompany(companyId: string | number, companyData: Partial<NewCompanyData>): Promise<Company> {
  const fullUrl = `${API_BASE_URL}/api/companies/${companyId}`;
  console.log("Updating company at:", fullUrl, "with data:", companyData);
  
  try {
    const headers = await getAuthHeaders();
    
    const response = await fetch(fullUrl, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: JSON.stringify(companyData),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API error updating company: ${response.status} ${response.statusText}`, errorText);
      
      // Try to parse error message from response
      try {
        const errorData = JSON.parse(errorText);
        throw new Error(errorData.message || `Failed to update company: ${response.status} ${response.statusText}`);
      } catch {
        if (response.status === 404) {
          throw new Error(`Company with ID ${companyId} not found`);
        }
        throw new Error(`Failed to update company: ${response.status} ${response.statusText}`);
      }
    }
    
    const data = await response.json();
    console.log("Successfully updated company:", data);
    return data as Company;
  } catch (error) {
    console.error('Error updating company:', error);
    
    // Check if it's a network error
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Network error: Unable to connect to the server. Please check your internet connection.');
    }
    
    throw error instanceof Error ? error : new Error('Unknown error updating company');
  }
}

/**
 * Deletes a company by ID
 * @param companyId - The ID of the company to delete
 * @returns Promise containing the deletion confirmation message
 */
export async function deleteCompany(companyId: string | number): Promise<{ message: string }> {
  const fullUrl = `${API_BASE_URL}/api/companies/${companyId}`;
  console.log("Deleting company at:", fullUrl);
  
  try {
    const headers = await getAuthHeaders();
    
    const response = await fetch(fullUrl, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API error deleting company: ${response.status} ${response.statusText}`, errorText);
      
      // Try to parse error message from response
      try {
        const errorData = JSON.parse(errorText);
        throw new Error(errorData.message || `Failed to delete company: ${response.status} ${response.statusText}`);
      } catch {
        if (response.status === 404) {
          throw new Error(`Company with ID ${companyId} not found`);
        }
        throw new Error(`Failed to delete company: ${response.status} ${response.statusText}`);
      }
    }
    
    const data = await response.json();
    console.log("Successfully deleted company:", data);
    return data as { message: string };
  } catch (error) {
    console.error('Error deleting company:', error);
    
    // Check if it's a network error
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Network error: Unable to connect to the server. Please check your internet connection.');
    }
    
    throw error instanceof Error ? error : new Error('Unknown error deleting company');
  }
}

/**
 * Pipeline API Functions
 */

/**
 * Fetches all pipelines (for sidebar)
 * @returns Promise containing an array of pipeline summaries
 */
export async function fetchPipelines(): Promise<DBPipeline[]> {
  const fullUrl = `${API_BASE_URL}/api/pipelines`;
  console.log("Fetching pipelines from:", fullUrl);
  
  try {
    const response = await fetch(fullUrl);
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log(`Successfully fetched ${data.length} pipelines`);
    return data as DBPipeline[];
  } catch (error) {
    console.error('Error fetching pipelines:', error);
    throw error instanceof Error ? error : new Error('Unknown error fetching pipelines');
  }
}

/**
 * Fetches a single pipeline with all its stages and deals
 * @param pipelineId - The ID of the pipeline to fetch
 * @param view - View parameter: 'mine' for user's own deals, 'all' for admin to see all deals
 * @returns Promise containing the complete pipeline data
 */
export async function fetchPipelineData(pipelineId: string, view: 'mine' | 'all' = 'mine'): Promise<Pipeline> {
  try {
    const authHeaders = await getAuthHeaders();
    if (!('Authorization' in authHeaders)) {
      console.error('fetchPipelineData: No authorization token found.');
      throw new Error('Unauthorized: No token available for API request.');
    }

    const fullUrl = `${API_BASE_URL}/api/pipelines/${pipelineId}?view=${view}`;
    console.log("Fetching pipeline data from:", fullUrl, "with view:", view);
    
    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
      },
    });
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Pipeline with ID ${pipelineId} not found`);
      }
      if (response.status === 403) {
        throw new Error('Access denied: You do not have permission to view this data');
      }
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log(`Successfully fetched pipeline data for ${pipelineId} with view ${view}:`, data);
    return data as Pipeline;
  } catch (error) {
    console.error('Error fetching pipeline data:', error);
    throw error instanceof Error ? error : new Error('Unknown error fetching pipeline data');
  }
}

/**
 * Creates a new deal
 * @param dealData - The deal data to create
 * @returns Promise containing the created deal
 */
export async function createDeal(dealData: NewDealData): Promise<DBDeal> {
  try {
    const authHeaders = await getAuthHeaders();
    if (!('Authorization' in authHeaders)) {
      console.error('createDeal: No authorization token found.');
      throw new Error('Unauthorized: No token available for API request.');
    }

    const fullUrl = `${API_BASE_URL}/api/deals`;
    console.log("Creating deal at:", fullUrl, "with data:", dealData);
    
    const response = await fetch(fullUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
      },
      body: JSON.stringify(dealData),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API error creating deal: ${response.status} ${response.statusText}`, errorText);
      
      try {
        const errorData = JSON.parse(errorText);
        throw new Error(errorData.message || `Failed to create deal: ${response.status} ${response.statusText}`);
      } catch {
        throw new Error(`Failed to create deal: ${response.status} ${response.statusText}`);
      }
    }
    
    const data = await response.json();
    console.log("Successfully created deal:", data);
    return data as DBDeal;
  } catch (error) {
    console.error('Error creating deal:', error);
    throw error instanceof Error ? error : new Error('Unknown error creating deal');
  }
}

/**
 * Updates an existing deal
 * @param dealId - The ID of the deal to update
 * @param dealData - The partial deal data to update
 * @returns Promise containing the updated deal
 */
export async function updateDeal(dealId: string | number, dealData: Partial<DBDeal>): Promise<DBDeal> {
  try {
    const authHeaders = await getAuthHeaders();
    if (!('Authorization' in authHeaders)) {
      console.error('updateDeal: No authorization token found.');
      throw new Error('Unauthorized: No token available for API request.');
    }

    const fullUrl = `${API_BASE_URL}/api/deals/${dealId}`;
    console.log("Updating deal at:", fullUrl, "with data:", dealData);
    
    const response = await fetch(fullUrl, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
      },
      body: JSON.stringify(dealData),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API error updating deal: ${response.status} ${response.statusText}`, errorText);
      
      try {
        const errorData = JSON.parse(errorText);
        throw new Error(errorData.message || `Failed to update deal: ${response.status} ${response.statusText}`);
      } catch {
        if (response.status === 404) {
          throw new Error(`Deal with ID ${dealId} not found`);
        }
        throw new Error(`Failed to update deal: ${response.status} ${response.statusText}`);
      }
    }
    
    const data = await response.json();
    console.log("Successfully updated deal:", data);
    return data as DBDeal;
  } catch (error) {
    console.error('Error updating deal:', error);
    throw error instanceof Error ? error : new Error('Unknown error updating deal');
  }
}

/**
 * Deletes a deal
 * @param dealId - The ID of the deal to delete
 * @returns Promise that resolves when the deal is deleted
 */
export async function deleteDeal(dealId: string | number): Promise<void> {
  try {
    const authHeaders = await getAuthHeaders();
    if (!('Authorization' in authHeaders)) {
      console.error('deleteDeal: No authorization token found.');
      throw new Error('Unauthorized: No token available for API request.');
    }

    const fullUrl = `${API_BASE_URL}/api/deals/${dealId}`;
    console.log("Deleting deal at:", fullUrl);
    
    const response = await fetch(fullUrl, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
      },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API error deleting deal: ${response.status} ${response.statusText}`, errorText);
      
      if (response.status === 404) {
        throw new Error(`Deal with ID ${dealId} not found`);
      }
      throw new Error(`Failed to delete deal: ${response.status} ${response.statusText}`);
    }
    
    console.log("Successfully deleted deal");
  } catch (error) {
    console.error('Error deleting deal:', error);
    throw error instanceof Error ? error : new Error('Unknown error deleting deal');
  }
}

/**
 * Fetch all contacts from the API with data ownership support
 * @param view - View parameter: 'mine' for user's own contacts, 'all' for admin to see all contacts
 */
export async function fetchContacts(view: 'mine' | 'all' = 'mine'): Promise<ContactEntry[]> {
  try {
    const authHeaders = await getAuthHeaders();
    if (!('Authorization' in authHeaders)) {
      console.error('fetchContacts: No authorization token found.');
      // Depending on how your app handles this, you might throw an error
      // or return an empty array, but throwing is often better for queryClient error handling.
      throw new Error('Unauthorized: No token available for API request.');
    }

    console.log(`Fetching contacts from API with view: ${view}`);
    
    // Corrected endpoint based on typical backend setup (usually /api/contacts for list)
    // and adding the view parameter
    const response = await fetch(`${API_BASE_URL}/api/contacts?view=${view}`, { 
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders, // <-- ADDED AUTH HEADERS
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: response.statusText }));
      console.error(`Failed to fetch contacts. Status: ${response.status}`, errorData);
      throw new Error(`Failed to fetch contacts: ${response.status} ${errorData.message || response.statusText}`);
    }

    const contacts: ContactEntry[] = await response.json();
    console.log(`Successfully fetched ${contacts.length} contacts with view: ${view}`);
    return contacts;
  } catch (error) {
    console.error("Error fetching contacts:", error);
    // Re-throw the error so React Query or the calling function can handle it
    if (error instanceof Error) {
    throw error;
    }
    throw new Error('Unknown error fetching contacts');
  }
}

/**
 * Type for creating a new event
 */
export type NewEventData = {
  type: 'event';
  title: string;
  description?: string;
  start_datetime: string; // Required for events
  end_datetime?: string;
  location?: string;
  contact_id?: number;
  company_id?: number;
  user_id?: number;
  status?: string; // Defaults to 'pending'
};

/**
 * Type for updating an event
 */
export type EventUpdateData = {
  title?: string;
  description?: string;
  start_datetime?: string;
  end_datetime?: string;
  location?: string;
  contact_id?: number;
  company_id?: number;
  user_id?: number;
  status?: string;
};

/**
 * Query parameters for fetching activities
 */
export interface ActivityQueryParams {
  type?: 'task' | 'event' | 'note' | 'call';
  start_date?: string;
  end_date?: string;
  contact_id?: number;
  company_id?: number;
  user_id?: number;
  view?: 'mine' | 'all'; // Data ownership parameter
}

/**
 * Fetch activities with optional filtering and data ownership support
 * @param params - Query parameters including view for data ownership
 * @returns Promise containing an array of activity entries
 */
export async function fetchActivities(params?: ActivityQueryParams): Promise<ActivityEntry[]> {
  try {
    console.log("fetchActivities - Request params:", params);
    
    // Get authentication headers
    const authHeaders = await getAuthHeaders();
    if (!('Authorization' in authHeaders)) {
      console.error('fetchActivities: No authorization token found.');
      throw new Error('Unauthorized: No token available for API request.');
    }
    
    // Build query string
    const queryParams = new URLSearchParams();
    if (params?.type) queryParams.append('type', params.type);
    if (params?.start_date) queryParams.append('start_date', params.start_date);
    if (params?.end_date) queryParams.append('end_date', params.end_date);
    if (params?.contact_id) queryParams.append('contact_id', params.contact_id.toString());
    if (params?.company_id) queryParams.append('company_id', params.company_id.toString());
    if (params?.user_id) queryParams.append('user_id', params.user_id.toString());
    if (params?.view) queryParams.append('view', params.view);
    
    const queryString = queryParams.toString();
    const url = `${API_BASE_URL}/api/activities${queryString ? `?${queryString}` : ''}`;
    
    console.log("fetchActivities - Making request to:", url, "with view:", params?.view || 'default');
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("fetchActivities - HTTP error:", response.status, errorText);
      
      if (response.status === 403) {
        throw new Error('Access denied: You do not have permission to view this data');
      }
      
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log("fetchActivities - Success:", `${data.length} activities fetched with view: ${params?.view || 'default'}`);
    return data as ActivityEntry[];
  } catch (error) {
    console.error("fetchActivities - Error:", error);
    throw error;
  }
}

/**
 * Create a new event (will be owned by the authenticated user)
 */
export async function createEvent(eventData: NewEventData): Promise<ActivityEntry> {
  try {
    console.log("[CREATE_EVENT_API] Starting createEvent with data:", eventData);
    console.log("[CREATE_EVENT_API] Event data type:", typeof eventData.type, "value:", eventData.type);
    console.log("[CREATE_EVENT_API] Event data title:", eventData.title);
    console.log("[CREATE_EVENT_API] Event data start_datetime:", eventData.start_datetime);
    
    // Get authentication headers
    const authHeaders = await getAuthHeaders();
    if (!('Authorization' in authHeaders)) {
      console.error('createEvent: No authorization token found.');
      throw new Error('Unauthorized: No token available for API request.');
    }
    
    const response = await fetch(`${API_BASE_URL}/api/activities`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
      },
      body: JSON.stringify(eventData),
    });

    console.log("[CREATE_EVENT_API] Response status:", response.status);
    console.log("[CREATE_EVENT_API] Response headers:", Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[CREATE_EVENT_API] HTTP error:", response.status, errorText);
      
      if (response.status === 403) {
        throw new Error('Access denied: You do not have permission to create activities');
      }
      
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log("[CREATE_EVENT_API] Success response:", data);
    return data as ActivityEntry;
  } catch (error) {
    console.error("[CREATE_EVENT_API] Error:", error);
    throw error;
  }
}

/**
 * Update an existing event (only allowed for the owner)
 */
export async function updateEvent(eventId: string | number, updateData: EventUpdateData): Promise<ActivityEntry> {
  try {
    console.log(`updateEvent - Request for ID ${eventId}:`, updateData);
    
    // Get authentication headers
    const authHeaders = await getAuthHeaders();
    if (!('Authorization' in authHeaders)) {
      console.error('updateEvent: No authorization token found.');
      throw new Error('Unauthorized: No token available for API request.');
    }
    
    const response = await fetch(`${API_BASE_URL}/api/activities/${eventId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
      },
      body: JSON.stringify(updateData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("updateEvent - HTTP error:", response.status, errorText);
      
      if (response.status === 403) {
        throw new Error('Access denied: You can only update your own activities');
      }
      if (response.status === 404) {
        throw new Error(`Event with ID ${eventId} not found`);
      }
      
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log("updateEvent - Success:", data);
    return data as ActivityEntry;
  } catch (error) {
    console.error("updateEvent - Error:", error);
    throw error;
  }
}

/**
 * Delete an event (only allowed for the owner)
 */
export async function deleteEvent(eventId: string | number): Promise<{ message: string }> {
  try {
    console.log(`deleteEvent - Request for ID ${eventId}`);
    
    // Get authentication headers
    const authHeaders = await getAuthHeaders();
    if (!('Authorization' in authHeaders)) {
      console.error('deleteEvent: No authorization token found.');
      throw new Error('Unauthorized: No token available for API request.');
    }
    
    const response = await fetch(`${API_BASE_URL}/api/activities/${eventId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("deleteEvent - HTTP error:", response.status, errorText);
      
      if (response.status === 403) {
        throw new Error('Access denied: You can only delete your own activities');
      }
      if (response.status === 404) {
        throw new Error(`Event with ID ${eventId} not found`);
      }
      
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log("deleteEvent - Success:", data);
    return data as { message: string };
  } catch (error) {
    console.error("deleteEvent - Error:", error);
    throw error;
  }
}

/**
 * Fetch events specifically (convenience function)
 */
export async function fetchEvents(params?: Omit<ActivityQueryParams, 'type'>): Promise<ActivityEntry[]> {
  return fetchActivities({ ...params, type: 'event' });
}

/**
 * Interface representing a user profile entry from the API
 */
export interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  job_title: string | null;
  bio: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Type for the data expected when updating a profile
 */
export type ProfileUpdateData = {
  first_name?: string;
  last_name?: string;
  job_title?: string;
  bio?: string;
  phone?: string;
};

/**
 * Helper function to get Authorization header with JWT token
 */
async function getAuthHeaders(): Promise<{ Authorization: string } | {}> {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    return { Authorization: `Bearer ${session.access_token}` };
  }
  return {};
}

/**
 * Fetch the current user's profile data
 */
export async function fetchProfile(): Promise<Profile> {
  try {
    const authHeaders = await getAuthHeaders();
    
    const response = await fetch(`${API_BASE_URL}/api/profile`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const profile = await response.json();
    return profile;
  } catch (error) {
    console.error('Error fetching profile:', error);
    throw error;
  }
}

/**
 * Update the current user's profile data
 */
export async function updateProfile(profileData: ProfileUpdateData): Promise<Profile> {
  try {
    const authHeaders = await getAuthHeaders();
    
    const response = await fetch(`${API_BASE_URL}/api/profile`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
      },
      body: JSON.stringify(profileData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const updatedProfile = await response.json();
    return updatedProfile;
  } catch (error) {
    console.error('Error updating profile:', error);
    throw error;
  }
}

/**
 * Interface representing the CSV import summary response
 */
export interface CsvImportSummary {
  totalRows: number;
  successfulImports: number;
  duplicatesSkipped: number;
  companiesCreated: number;
  errors: number;
  errorDetails?: string[];
}

/**
 * Interface representing the CSV import response
 */
export interface CsvImportResponse {
  message: string;
  summary: CsvImportSummary;
}

/**
 * Import contacts from a CSV file
 */
export async function importContactsCsv(file: File): Promise<CsvImportResponse> {
  try {
    console.log('importContactsCsv - Starting CSV import for file:', file.name);
    
    // Get authentication headers
    const authHeaders = await getAuthHeaders();
    if (!('Authorization' in authHeaders)) {
      console.error('importContactsCsv: No authorization token found.');
      throw new Error('Unauthorized: User is not logged in.');
    }
    
    // Create FormData with the CSV file
    const formData = new FormData();
    formData.append('csv', file); // Field name must match backend expectation
    
    const response = await fetch(`${API_BASE_URL}/api/contacts/import-csv`, {
      method: 'POST',
      headers: {
        // DO NOT set 'Content-Type': 'multipart/form-data' - browser sets this automatically
        ...authHeaders, // Adds Authorization: Bearer <token>
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ 
        message: `Import failed with status: ${response.status}` 
      }));
      console.error("importContactsCsv - HTTP error:", response.status, errorData);
      throw new Error(errorData.message || `Import failed with status: ${response.status}`);
    }

    const data = await response.json();
    console.log("importContactsCsv - Success:", data);
    return data as CsvImportResponse;
  } catch (error) {
    console.error("importContactsCsv - Error:", error);
    throw error;
  }
}