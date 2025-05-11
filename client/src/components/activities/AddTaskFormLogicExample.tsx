import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createTask, NewTaskData } from '../../lib/api'; // Adjust path as needed
// import { Button } from '../ui/button'; // Example shadcn/ui components
// import { Input } from '../ui/input';
// import { Textarea } from '../ui/textarea';
// import { Label } from '../ui/label';

/**
 * Example component demonstrating the logic for an Add Task form
 * using useMutation to call the createTask API function.
 */
export function AddTaskFormLogicExample() {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState(''); // Store as string, API expects ISO string or parsable

  const createTaskMutation = useMutation<unknown, Error, NewTaskData>({
    mutationFn: createTask,
    onSuccess: () => {
      console.log('Task created successfully!');
      queryClient.invalidateQueries({ queryKey: ['tasks'] }); // Refetch tasks list
      // Clear the form
      setTitle('');
      setDescription('');
      setDueDate('');
      // Optionally, close a modal if the form is in one
    },
    onError: (error) => {
      console.error('Error creating task:', error.message);
      // Display error message to the user (e.g., using a toast notification)
    },
  });

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!title.trim()) {
      alert('Task title is required.'); // Simple validation
      return;
    }

    const taskData: NewTaskData = {
      title: title.trim(),
      type: 'task', // Crucial: ensure type is 'task'
    };

    if (description.trim()) {
      taskData.description = description.trim();
    }
    if (dueDate) {
      // Ensure dueDate is in a format your backend/Supabase expects (e.g., YYYY-MM-DD or ISO string)
      // Basic conversion to ISO string for date input. For datetime-local, it might be already ISO-like.
      try {
        taskData.due_date = new Date(dueDate).toISOString();
      } catch (e) {
        console.warn('Invalid date for due_date, sending as is or consider validation', dueDate);
        taskData.due_date = dueDate; // Or handle error, or clear if invalid
      }
    }
    
    // The backend will set default status: 'pending' and completed: false
    // as per the updated server/routes.ts logic for type: 'task'
    createTaskMutation.mutate(taskData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-lg">
      <h3 className="text-lg font-medium">Add New Task</h3>
      <div>
        {/* <Label htmlFor="task-title">Title</Label> */}
        <input
          id="task-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Task title (required)"
          className="w-full p-2 border rounded"
          // required // HTML5 validation
        />
      </div>
      <div>
        {/* <Label htmlFor="task-description">Description (Optional)</Label> */}
        <textarea
          id="task-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Task description"
          className="w-full p-2 border rounded"
        />
      </div>
      <div>
        {/* <Label htmlFor="task-due-date">Due Date (Optional)</Label> */}
        <input
          id="task-due-date"
          type="date" // HTML5 date picker
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="w-full p-2 border rounded"
        />
      </div>
      <button type="submit" disabled={createTaskMutation.isPending} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50">
        {createTaskMutation.isPending ? 'Adding Task...' : 'Add Task'}
      </button>
      {createTaskMutation.isError && (
        <p className="text-red-500">Error: {createTaskMutation.error?.message}</p>
      )}
    </form>
  );
} 