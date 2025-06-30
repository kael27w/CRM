import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createTask, NewTaskData } from '../../lib/api'; // Adjusted path
import { Button } from '../ui/button'; // Adjusted path
import { Input } from '../ui/input'; // Adjusted path
import { Textarea } from '../ui/textarea'; // Adjusted path
import { Label } from '../ui/label'; // Adjusted path

import { format } from "date-fns";
import { Calendar } from "../ui/calendar";


import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { toast } from 'sonner'; // For displaying success/error messages

interface AddTaskFormProps {
  onTaskAdded?: () => void; // Optional callback for when a task is successfully added
  // If this form is used in a Dialog, you might pass a function to close the dialog
  setOpen?: (open: boolean) => void;
}

export function AddTaskForm({ onTaskAdded, setOpen }: AddTaskFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [priority, setPriority] = useState('medium'); // Default to medium priority

  const queryClient = useQueryClient();

  const createTaskMutation = useMutation({
    mutationFn: createTask,
    onSuccess: (data) => {
      console.log("Task created successfully, refetching tasks.", data);
      toast.success("Task created successfully!");
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['activities'] }); // Also invalidate general activities if tasks are a subset
      setTitle('');
      setDescription('');
      setDueDate(undefined);
      setPriority('medium');
      if (onTaskAdded) {
        onTaskAdded();
      }
      if (setOpen) { // Close dialog if setOpen is provided
        setOpen(false);
      }
    },
    onError: (error: Error) => {
      console.error("Error creating task:", error);
      toast.error(`Error creating task: ${error.message}`);
    },
  });

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    console.log("Add Task form submission triggered!");
    event.preventDefault();

    if (!title.trim()) {
      toast.error("Title is required to create a task.");
      return;
    }

    const taskDataToSubmit: NewTaskData = {
      title,
      description: description.trim() || undefined, // Send undefined if empty, backend might handle it as null
      due_date: dueDate ? format(dueDate, 'yyyy-MM-dd') : undefined, // Convert Date to string
      priority, // Include priority
      // type, completed, and status are handled by the createTask API default
    };
    
    console.log("Form data to be sent:", taskDataToSubmit);
    createTaskMutation.mutate(taskDataToSubmit);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter task title"
          required
        />
      </div>
      <div>
        <Label htmlFor="description">Description (Optional)</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Enter task description"
        />
      </div>
      <div>
        <Label htmlFor="due_date">Due Date (Optional)</Label>
        <div className="border rounded-md p-3">
          <Calendar
            mode="single"
            selected={dueDate}
            onSelect={setDueDate}
            disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
            initialFocus={false}
            className="rounded-md"
          />
        </div>
        {dueDate && (
          <div className="flex justify-between items-center mt-2">
            <p className="text-sm text-muted-foreground">
              Selected: {format(dueDate, "PPP")}
            </p>
            <Button 
              type="button" 
              variant="ghost" 
              size="sm"
              onClick={() => setDueDate(undefined)}
              className="h-8 px-2"
            >
              Clear
            </Button>
          </div>
        )}
      </div>
      <div>
        <Label htmlFor="priority">Priority</Label>
        <Select 
          value={priority} 
          onValueChange={setPriority}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button 
        type="submit" 
        disabled={createTaskMutation.isPending}
        className="w-full"
      >
        {createTaskMutation.isPending ? 'Adding Task...' : 'Add Task'}
      </Button>
    </form>
  );
} 