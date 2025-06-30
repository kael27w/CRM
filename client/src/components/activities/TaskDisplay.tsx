import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchTasks, updateTaskStatus, TaskEntry } from '../../lib/api';
import { Checkbox } from '../ui/checkbox'; // Assuming shadcn/ui Checkbox path
import { Card, CardContent, CardFooter, CardHeader } from '../ui/card'; // Assuming shadcn/ui Card path
import { Button } from '../ui/button'; // Added Button import
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog'; // Added Dialog imports
import { AddTaskForm } from './AddTaskForm'; // Added AddTaskForm import
import { format } from 'date-fns'; // For date formatting

/**
 * TaskDisplay component fetches and displays a list of tasks,
 * allowing users to mark them as complete or pending,
 * and provides a way to add new tasks via the API.
 */
export function TaskDisplay() {
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false); // State for Add Task Dialog

  const {
    data: tasks,
    isLoading,
    isError,
    error,
  } = useQuery<TaskEntry[], Error>({
    queryKey: ['tasks'],
    queryFn: fetchTasks,
  });

  const updateTaskMutation = useMutation<TaskEntry, Error, { taskId: number; completed: boolean; status: string }>({
    mutationFn: ({ taskId, completed, status }) => updateTaskStatus(taskId, { completed, status }),
    onSuccess: () => {
      // Invalidate and refetch the tasks query to update the list
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
    // Optional: onError for mutation-specific error handling
    // onError: (mutationError) => {
    //   console.error('Error updating task:', mutationError);
    //   // Potentially show a toast notification to the user
    // },
  });

  const handleCheckboxChange = (taskId: number, currentCompletedStatus: boolean) => {
    const newCompletedStatus = !currentCompletedStatus;
    const newStatus = newCompletedStatus ? 'completed' : 'pending';
    updateTaskMutation.mutate({ taskId, completed: newCompletedStatus, status: newStatus });
  };

  if (isLoading) {
    return <p>Loading tasks...</p>;
  }

  if (isError) {
    return <p>Error loading tasks: {error?.message || 'Unknown error'}</p>;
  }

  if (!tasks || tasks.length === 0) {
    return (
      <div>
        <div className="flex justify-end mb-4">
          <Dialog
            open={isAddDialogOpen}
            onOpenChange={setIsAddDialogOpen}
          >
            <DialogTrigger asChild>
              <Button>Add New Task</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add New Task</DialogTitle>
                <DialogDescription>
                  Fill in the details below to create a new task.
                </DialogDescription>
              </DialogHeader>
              <AddTaskForm setOpen={setIsAddDialogOpen} />
            </DialogContent>
          </Dialog>
        </div>
        <p>No tasks found. Click "Add New Task" to create one.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end mb-4">
        <Dialog
          open={isAddDialogOpen}
          onOpenChange={setIsAddDialogOpen}
        >
          <DialogTrigger asChild>
            <Button>Add New Task</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add New Task</DialogTitle>
              <DialogDescription>
                Fill in the details below to create a new task.
              </DialogDescription>
            </DialogHeader>
            <AddTaskForm setOpen={setIsAddDialogOpen} />
          </DialogContent>
        </Dialog>
      </div>

      {tasks.map((task) => (
        <Card key={task.id} className={task.completed ? 'opacity-60' : ''}>
          <CardHeader>
            <div className="flex items-center space-x-3">
              <Checkbox
                id={`task-${task.id}`}
                checked={task.completed}
                onCheckedChange={() => handleCheckboxChange(task.id, task.completed)}
                disabled={updateTaskMutation.isPending && updateTaskMutation.variables?.taskId === task.id}
              />
              <label htmlFor={`task-${task.id}`} className={`text-lg font-semibold ${task.completed ? 'line-through' : ''}`}>
                {task.title}
              </label>
            </div>
          </CardHeader>
          {task.description && (
            <CardContent>
              <p className="text-sm text-muted-foreground">{task.description}</p>
            </CardContent>
          )}
          <CardFooter className="text-xs flex justify-between text-muted-foreground">
            <p>Due: {task.due_date ? format(new Date(task.due_date), 'PPP') : 'Not set'}</p>
            {task.priority && <p>Priority: {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}</p>}
            <p>Status: {task.status}</p>
          </CardFooter>
        </Card>
      ))}
      {updateTaskMutation.isPending && <p>Updating task...</p>}
      {updateTaskMutation.isError && <p>Error updating task: {updateTaskMutation.error?.message || 'Unknown error'}</p>}
    </div>
  );
} 