/**
 * API call related functions and type definitions
 */

// Base API URL configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://crm-2lmw.onrender.com';

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
  created_at: string; // ISO date string
  updated_at: string; // ISO date string
  // Add other fields as needed
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
 * Type for the data expected by createContactManually.
 */
export type NewContactData = {
  first_name: string;
  last_name: string;
  phone: string;
  email?: string;
  company?: string;
  // Add other client-side originated fields here
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
 * @returns Promise containing an array of task entries
 */
export async function fetchTasks(): Promise<TaskEntry[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/tasks`);
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data as TaskEntry[];
  } catch (error) {
    console.error('Error fetching tasks:', error);
    // It's good practice to re-throw the error or handle it appropriately
    // For TanStack Query, re-throwing allows it to manage the error state
    throw error instanceof Error ? error : new Error('Unknown error fetching tasks');
  }
}

/**
 * Updates the status of a task
 * @param taskId - The ID of the task to update
 * @param updates - An object containing the fields to update (e.g., { completed: boolean; status: string })
 * @returns Promise containing the updated task entry
 */
export async function updateTaskStatus(taskId: number, updates: { completed: boolean; status: string }): Promise<TaskEntry> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/activities/${taskId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
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
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data as TaskEntry;
  } catch (error) {
    console.error(`Error updating task ${taskId}:`, error);
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
        },
        body: JSON.stringify(payload),
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
        console.error("Error details for createTask:", errorMessage, "Payload sent:", payload);
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
      console.error('Error creating task:', error, "Payload attempted:", payload);
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
  console.log("Creating contact:", contactData);
  const url = `${API_BASE_URL}/api/contacts`;
  console.log("Creating contact at URL:", url);

  try {
    // Add timeout handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(contactData),
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
    console.log("Contact created successfully:", data);
    return data as ContactEntry;
  } catch (error) {
    console.error('Error creating contact:', error);
    
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
    // Add timeout handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const response = await fetch(url, {
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
};

/**
 * Creates a new note activity for a contact
 * @param noteData - The data for the new note activity
 * @returns Promise containing the newly created note activity
 */
export async function createNoteActivity(noteData: NewNoteData): Promise<UnifiedActivityEntry> {
  console.log("createNoteActivity API function called with payload:", noteData);
  
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