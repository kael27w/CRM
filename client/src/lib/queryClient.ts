import { QueryClient, QueryFunction } from "@tanstack/react-query";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002';
const API_TIMEOUT = 10000; // 10 seconds

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  path: string,
  data?: unknown | undefined,
): Promise<Response> {
  const fullUrl = `${API_BASE_URL}${path}`;
  console.log(`Fetching: ${method} ${fullUrl}`);
  
  // Use AbortController for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);
  
  try {
    const res = await fetch(fullUrl, {
      method,
      headers: data ? { "Content-Type": "application/json" } : {},
      body: data ? JSON.stringify(data) : undefined,
      signal: controller.signal,
    });
    
    // Clear the timeout since the request has completed
    clearTimeout(timeoutId);
    
    await throwIfResNotOk(res);
    return res;
  } catch (error) {
    clearTimeout(timeoutId);
    
    // Enhance error message for connection issues
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error(`Request to ${path} timed out after ${API_TIMEOUT/1000} seconds`);
      }
      if (error.message.includes('Failed to fetch') || 
          error.message.includes('NetworkError') || 
          error.message.includes('ECONNREFUSED') ||
          error.message.includes('Connection refused')) {
        console.error(`Network error connecting to ${fullUrl}:`, error.message);
        throw new Error(`Cannot connect to API server at ${API_BASE_URL}. Please ensure the server is running.`);
      }
    }
    
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const path = queryKey[0] as string;
    const fullUrl = `${API_BASE_URL}${path}`;
    console.log(`Fetching query: ${fullUrl}`);
    
    // Use AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);
    
    try {
      const res = await fetch(fullUrl, {
        signal: controller.signal,
      });
      
      // Clear the timeout since the request has completed
      clearTimeout(timeoutId);

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return null;
      }

      await throwIfResNotOk(res);
      return await res.json();
    } catch (error) {
      clearTimeout(timeoutId);
      
      // Enhance error message for connection issues
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error(`Query to ${path} timed out after ${API_TIMEOUT/1000} seconds`);
        }
        if (error.message.includes('Failed to fetch') || 
            error.message.includes('NetworkError') || 
            error.message.includes('ECONNREFUSED') ||
            error.message.includes('Connection refused')) {
          console.error(`Network error connecting to ${fullUrl}:`, error.message);
          throw new Error(`Cannot connect to API server at ${API_BASE_URL}. Please ensure the server is running.`);
        }
      }
      
      throw error;
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: 3, // Add retries for failed queries
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
    },
    mutations: {
      retry: 2, // Add retries for failed mutations
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 10000), // Exponential backoff
    },
  },
});
