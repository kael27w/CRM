import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { CalendarIcon } from "lucide-react";
import { Calendar as CalendarComponent } from "../ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { format } from "date-fns";
import { cn } from "../../lib/utils";
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createTask, TaskEntry, NewTaskData } from "../../lib/api";
import { toast } from 'sonner';

interface TaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTaskAdded?: (task: TaskEntry) => void;
  existingTask?: Partial<TaskEntry>;
}

/**
 * Dialog for adding or editing a task using API integration
 */
const TaskDialog: React.FC<TaskDialogProps> = ({
  open,
  onOpenChange,
  onTaskAdded,
  existingTask
}) => {
  const [title, setTitle] = useState(existingTask?.title || '');
  const [description, setDescription] = useState(existingTask?.description || '');
  const [dueDate, setDueDate] = useState<Date | undefined>(
    existingTask?.due_date ? new Date(existingTask.due_date) : undefined
  );
  const [priority, setPriority] = useState(existingTask?.priority || 'medium');

  const queryClient = useQueryClient();

  const createTaskMutation = useMutation({
    mutationFn: createTask,
    onSuccess: (data) => {
      console.log("Task created successfully, refetching tasks.", data);
      toast.success("Task created successfully!");
      
      // Invalidate necessary queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      
      // Call the callback if provided
      if (onTaskAdded) {
        onTaskAdded(data);
      }
      
      // Reset form and close dialog
      resetForm();
      onOpenChange(false);
    },
    onError: (error: Error) => {
      console.error("Error creating task:", error);
      toast.error(`Error creating task: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    console.log("Add Task form submission triggered!");
    e.preventDefault();
    
    if (!title.trim()) {
      toast.error("Title is required to create a task.");
      return;
    }
    
    const taskDataToSubmit: NewTaskData = {
      title: title.trim(),
      description: description.trim() || undefined,
      due_date: dueDate ? format(dueDate, 'yyyy-MM-dd') : undefined,
      priority,
    };
    
    console.log("Form data to be sent:", taskDataToSubmit);
    createTaskMutation.mutate(taskDataToSubmit);
  };
  
  const resetForm = () => {
    setTitle('');
    setDescription('');
    setDueDate(undefined);
    setPriority('medium');
  };
  
  const handleCancel = () => {
    resetForm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{existingTask ? 'Edit Task' : 'Add New Task'}</DialogTitle>
            <DialogDescription>
              {existingTask 
                ? 'Update the details for this task.' 
                : 'Fill in the details to create a new task.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="taskTitle" className="text-right">
                Title
              </Label>
              <Input
                id="taskTitle"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="col-span-3"
                placeholder="e.g., Call client about policy renewal"
                required
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="taskDescription" className="text-right">
                Description
              </Label>
              <Textarea
                id="taskDescription"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="col-span-3"
                placeholder="Add any details about this task"
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="taskDueDate" className="text-right">
                Due Date
              </Label>
              <div className="col-span-3">
                <div className="border rounded-md p-3">
                  <CalendarComponent
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
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="taskPriority" className="text-right">
                Priority
              </Label>
              <Select
                value={priority}
                onValueChange={setPriority}
              >
                <SelectTrigger id="taskPriority" className="col-span-3">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={createTaskMutation.isPending}
            >
              {createTaskMutation.isPending 
                ? 'Adding Task...' 
                : existingTask ? 'Save Changes' : 'Add Task'
              }
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TaskDialog; 