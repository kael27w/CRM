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
import { Calendar } from "lucide-react";
import { CalendarIcon } from "lucide-react";
import { Calendar as CalendarComponent } from "../ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { format } from "date-fns";
import { cn } from "../../lib/utils";

interface TaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTaskAdded: (task: any) => void;
  existingTask?: any;
}

/**
 * Dialog for adding or editing a task
 */
const TaskDialog: React.FC<TaskDialogProps> = ({
  open,
  onOpenChange,
  onTaskAdded,
  existingTask
}) => {
  const [title, setTitle] = useState(existingTask?.title || '');
  const [description, setDescription] = useState(existingTask?.description || '');
  const [dueDate, setDueDate] = useState<Date | undefined>(existingTask?.dueDate ? new Date(existingTask.dueDate) : undefined);
  const [priority, setPriority] = useState(existingTask?.priority || 'medium');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      return; // Don't submit if title is empty
    }
    
    const newTask = {
      id: existingTask?.id || Date.now(), // Generate a temporary ID if creating new task
      title,
      description,
      dueDate: dueDate ? format(dueDate, 'yyyy-MM-dd') : undefined,
      priority,
      completed: existingTask?.completed || false,
      assignedToId: existingTask?.assignedToId || 1, // Current user ID
      clientId: existingTask?.clientId,
      policyId: existingTask?.policyId,
      createdAt: existingTask?.createdAt || new Date().toISOString()
    };
    
    onTaskAdded(newTask);
    resetForm();
    onOpenChange(false);
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
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="taskDueDate"
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal col-span-3",
                      !dueDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dueDate ? format(dueDate, "PPP") : "Select a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <CalendarComponent
                    mode="single"
                    selected={dueDate}
                    onSelect={setDueDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
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
            <Button type="submit">{existingTask ? 'Save Changes' : 'Add Task'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TaskDialog; 