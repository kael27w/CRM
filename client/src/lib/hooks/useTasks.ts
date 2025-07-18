import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Task } from '../../types';
import { fetchTasks, updateTaskStatus, createTask as apiCreateTask, TaskEntry } from '../api';

// Local storage key for tasks
const TASKS_STORAGE_KEY = 'insurance-tracker-tasks';

// Helper type for creating a new task
export type CreateTaskInput = {
  title: string;
  description?: string;
  dueDate: string;
  clientId?: number;
  policyId?: number;
};

// Helper function to convert TaskEntry to Task
function convertTaskEntryToTask(taskEntry: TaskEntry): Task {
  return {
    id: taskEntry.id,
    title: taskEntry.title,
    description: taskEntry.description || '',
    dueDate: taskEntry.due_date,
    completed: taskEntry.completed,
    assignedToId: 1, // Default user assignment
    clientId: undefined, // TaskEntry doesn't have this field
    policyId: undefined, // TaskEntry doesn't have this field
    createdAt: new Date().toISOString(), // TaskEntry doesn't have this field, use current time
    client: undefined, // TaskEntry doesn't have this field
  };
}

/**
 * Custom hook for fetching and managing tasks
 * This provides a centralized way to access tasks data across different components
 * @param view - 'mine' to show only user's tasks, 'all' to show all tasks (admin only)
 */
export function useTasks(view: 'mine' | 'all' = 'mine') {
  const queryClient = useQueryClient();

  // Fetch all tasks with proper authentication and view filtering
  const { 
    data: tasks, 
    isLoading, 
    isError, 
    error, 
    refetch 
  } = useQuery<Task[], Error>({
    queryKey: ['tasks', view],
    queryFn: async () => {
      try {
        console.log(`[useTasks] Fetching tasks with view: ${view}`);
        const data = await fetchTasks(view);
        
        // Convert TaskEntry[] to Task[]
        const convertedTasks = data.map(convertTaskEntryToTask);
        
        // Save to localStorage (only for 'mine' view to avoid admin data leakage)
        if (view === 'mine') {
          localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(convertedTasks));
        }
        
        return convertedTasks;
      } catch (err) {
        console.error('Error fetching tasks:', err);
        
        // Only try localStorage fallback for 'mine' view and if not an auth error
        if (view === 'mine' && !(err instanceof Error && err.message.includes('403'))) {
          const storedTasks = localStorage.getItem(TASKS_STORAGE_KEY);
          if (storedTasks) {
            return JSON.parse(storedTasks) as Task[];
          }
          
          // If no stored tasks, return mock data for development
          const mockTasks = getMockTasks();
          localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(mockTasks));
          return mockTasks;
        }
        
        // For 'all' view or auth errors, don't fall back to localStorage/mock
        throw err;
      }
    },
    refetchOnWindowFocus: false, // Disable automatic refetch on window focus
  });

  // Toggle task completion status
  const toggleTaskMutation = useMutation({
    mutationFn: async ({ id, completed }: { id: number, completed: boolean }) => {
      try {
        console.log(`[useTasks] Toggling task ${id} completion to: ${completed}`);
        return await updateTaskStatus(id, completed);
      } catch (err) {
        console.error('Error toggling task completion:', err);
        
        // For development, update task in localStorage (only for 'mine' view)
        if (view === 'mine' && tasks) {
          const updatedTasks = tasks.map(task => 
            task.id === id ? { ...task, completed } : task
          );
          localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(updatedTasks));
        }
        
        // Return a successful mock response for development
        return { id, completed };
      }
    },
    onSuccess: (data) => {
      // Update local cache with the updated task
      queryClient.setQueryData(['tasks', view], (oldTasks: Task[] | undefined) => {
        if (!oldTasks) return oldTasks;
        const updatedTasks = oldTasks.map(task => 
          task.id === data.id ? { ...task, completed: data.completed } : task
        );
        
        // Update localStorage with the updated tasks (only for 'mine' view)
        if (view === 'mine') {
          localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(updatedTasks));
        }
        
        return updatedTasks;
      });
      
      // Invalidate related queries to keep them in sync
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      queryClient.invalidateQueries({ queryKey: ['activities'] });
    },
  });

  // Create a new task
  const createTaskMutation = useMutation({
    mutationFn: async (newTask: CreateTaskInput) => {
      try {
        const taskData = {
          title: newTask.title,
          description: newTask.description,
          due_date: newTask.dueDate,
          // Don't include clientId and policyId as they're not part of the activities schema
          // These would need to be mapped to contact_id and company_id if needed
        };
        
        console.log('[useTasks] Creating task with data:', taskData);
        const createdTaskEntry = await apiCreateTask(taskData);
        
        // Convert TaskEntry to Task for consistency
        return convertTaskEntryToTask(createdTaskEntry);
      } catch (err) {
        console.error('Error creating task:', err);
        
        // For development, create a mock task with a unique ID (only for 'mine' view)
        if (view === 'mine') {
          const mockTask: Task = {
            id: Date.now(), // Use timestamp as a unique ID
            title: newTask.title,
            description: newTask.description || '',
            dueDate: newTask.dueDate,
            completed: false,
            assignedToId: 1, // Current user
            clientId: newTask.clientId,
            policyId: newTask.policyId,
            createdAt: new Date().toISOString(),
            client: newTask.clientId 
              ? { 
                  id: newTask.clientId, 
                  name: 'Client Name', // This would be fetched in a real app
                  status: 'Active',
                  createdAt: new Date().toISOString() 
                } 
              : undefined,
          };
          
          return mockTask;
        }
        
        throw err;
      }
    },
    onSuccess: (newTask) => {
      // Update the tasks cache
      queryClient.setQueryData(['tasks', view], (oldTasks: Task[] | undefined) => {
        if (!oldTasks) return [newTask];
        const updatedTasks = [...oldTasks, newTask];
        
        // Update localStorage with the updated tasks (only for 'mine' view)
        if (view === 'mine') {
          localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(updatedTasks));
        }
        
        return updatedTasks;
      });
      
      // Invalidate related queries to keep them in sync
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      queryClient.invalidateQueries({ queryKey: ['activities'] });
    },
  });

  // Helper function to toggle a task's completion status
  const toggleTask = (id: number, completed: boolean) => {
    toggleTaskMutation.mutate({ id, completed });
  };

  // Helper function to create a new task
  const createTask = (newTask: CreateTaskInput) => {
    return createTaskMutation.mutateAsync(newTask);
  };

  return {
    tasks,
    isLoading,
    isError,
    error,
    refetch,
    toggleTask,
    createTask,
  };
}

// Mock tasks for development
function getMockTasks(): Task[] {
  return [
    {
      id: 1,
      title: 'Call John Doe about auto policy',
      description: 'Review coverage options and discuss premium changes',
      dueDate: '2024-08-10',
      completed: false,
      assignedToId: 1,
      clientId: 101,
      policyId: 201,
      createdAt: '2024-07-30T14:00:00Z',
      client: {
        id: 101,
        name: 'John Doe',
        status: 'Active',
        createdAt: '2023-02-15T10:30:00Z'
      },
      policy: {
        id: 201,
        policyNumber: 'POL-00123',
        type: 'Auto',
        status: 'Active',
        coverageAmount: 100000,
        premium: 1250,
        startDate: '2023-02-20T00:00:00Z',
        renewalDate: '2024-08-10T00:00:00Z',
        stage: 'Active',
        createdAt: '2023-02-15T14:20:00Z',
        clientId: 101
      }
    },
    {
      id: 2,
      title: 'Review Jane Smith\'s home policy claim',
      description: 'Check status of claim #CL-456 for water damage',
      dueDate: '2024-08-05',
      completed: true,
      assignedToId: 1,
      clientId: 102,
      policyId: 202,
      createdAt: '2024-07-28T09:15:00Z',
      client: {
        id: 102,
        name: 'Jane Smith',
        status: 'Active',
        createdAt: '2022-11-05T16:45:00Z'
      },
      policy: {
        id: 202,
        policyNumber: 'POL-00456',
        type: 'Home',
        status: 'Active',
        coverageAmount: 350000,
        premium: 2100,
        startDate: '2022-11-15T00:00:00Z',
        renewalDate: '2024-11-15T00:00:00Z',
        stage: 'Active',
        createdAt: '2022-11-05T17:30:00Z',
        clientId: 102
      }
    },
    {
      id: 3,
      title: 'Send policy documents to Michael Johnson',
      description: 'Email final life insurance documents for signature',
      dueDate: '2024-08-03',
      completed: false,
      assignedToId: 1,
      clientId: 103,
      policyId: 203,
      createdAt: '2024-08-01T11:20:00Z',
      client: {
        id: 103,
        name: 'Michael Johnson',
        status: 'Active',
        createdAt: '2024-07-25T13:10:00Z'
      },
      policy: {
        id: 203,
        policyNumber: 'POL-00789',
        type: 'Life',
        status: 'Pending',
        coverageAmount: 500000,
        premium: 950,
        startDate: '2024-08-15T00:00:00Z',
        renewalDate: '2025-08-15T00:00:00Z',
        stage: 'Documentation',
        createdAt: '2024-07-25T14:05:00Z',
        clientId: 103
      }
    },
    {
      id: 4,
      title: 'Follow up with Sarah Williams on quote',
      description: 'Discuss auto + home bundle discount options',
      dueDate: '2024-08-15',
      completed: false,
      assignedToId: 1,
      clientId: 104,
      policyId: undefined,
      createdAt: '2024-07-29T10:00:00Z',
      client: {
        id: 104,
        name: 'Sarah Williams',
        status: 'Prospect',
        createdAt: '2024-07-20T09:30:00Z'
      }
    },
    {
      id: 5,
      title: 'Update Robert Brown\'s contact information',
      description: 'New phone number and address from recent call',
      dueDate: '2024-08-02',
      completed: false,
      assignedToId: 1,
      clientId: 105,
      policyId: 205,
      createdAt: '2024-08-01T15:45:00Z',
      client: {
        id: 105,
        name: 'Robert Brown',
        status: 'Active',
        createdAt: '2021-05-12T11:20:00Z'
      },
      policy: {
        id: 205,
        policyNumber: 'POL-00234',
        type: 'Auto',
        status: 'Active',
        coverageAmount: 75000,
        premium: 980,
        startDate: '2021-05-20T00:00:00Z',
        renewalDate: '2024-05-20T00:00:00Z',
        stage: 'Active',
        createdAt: '2021-05-12T14:10:00Z',
        clientId: 105
      }
    }
  ];
} 