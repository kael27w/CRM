import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Checkbox } from "../ui/checkbox";
import { Button } from "../ui/button";
import { Calendar, Clock, Plus } from 'lucide-react';
import { Badge } from "../ui/badge";
import { Task } from '../../types';
import { format, isToday, isTomorrow } from 'date-fns';
import { Link } from 'wouter';
import TaskDialog from './task-dialog';
import { useTasks } from '../../lib/hooks/useTasks';

interface TasksWidgetProps {
  tasks: Task[];
  onToggleTask: (id: number, completed: boolean) => void;
  showViewAllLink?: boolean;
}

const TasksWidget: React.FC<TasksWidgetProps> = ({ tasks, onToggleTask, showViewAllLink = true }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [displayTasks, setDisplayTasks] = useState<Task[]>([]);
  const { refetch } = useTasks('mine');

  // On initial load, show only incomplete tasks
  useEffect(() => {
    // Only filter out completed tasks on the initial load
    if (tasks && tasks.length > 0) {
      setDisplayTasks(tasks.filter(task => !task.completed));
    } else {
      setDisplayTasks([]);
    }
  }, [tasks]);

  const handleTaskToggle = (id: number, completed: boolean) => {
    // Call the external handler to update the backend/global state
    onToggleTask(id, completed);
    
    // If the task is marked as completed, remove it from the display list
    if (completed) {
      setDisplayTasks(prevTasks => prevTasks.filter(task => task.id !== id));
    } else {
      // Only update the local state if marking as incomplete
      setDisplayTasks(prevTasks => 
        prevTasks.map(task => 
          task.id === id ? { ...task, completed } : task
        )
      );
    }
  };

  const handleTaskAdded = async (newTask: any) => {
    // In a real implementation, this would call an API to save the task
    console.log('Adding new task:', newTask);
    
    // Map API response (which uses snake_case) to our client model (which uses camelCase)
    const formattedTask: Task = {
      id: newTask.id,
      title: newTask.title,
      description: newTask.description,
      dueDate: newTask.dueDate || newTask.due_date,
      completed: newTask.completed || false,
      createdAt: newTask.created_at || new Date().toISOString(),
      // Add any other required fields with sensible defaults
      assignedToId: 1, // Default value
    };
    
    // Add the newly created task to our display list
    setDisplayTasks(prev => [formattedTask, ...prev]);
    
    // Refresh data from the server (or mock data in this case)
    await refetch();
  };

  const getBadgeVariant = (dueDate: string) => {
    if (!dueDate) return "secondary";
    
    if (isToday(new Date(dueDate))) {
      return "destructive";
    } else if (isTomorrow(new Date(dueDate))) {
      return "outline"; // Changed from "warning" to "outline" since "warning" is not in the variant options
    }
    
    return "secondary";
  };

  const getBadgeText = (dueDate: string) => {
    if (!dueDate) return "No date";
    
    if (isToday(new Date(dueDate))) {
      return "Today";
    } else if (isTomorrow(new Date(dueDate))) {
      return "Tomorrow";
    }
    
    return format(new Date(dueDate), 'MMM dd');
  };

  if (!displayTasks || displayTasks.length === 0) {
    return (
      <div className="p-4 text-center text-slate-500 dark:text-slate-400">
        <p>No upcoming tasks</p>
        <div className="flex flex-col items-center mt-4 space-y-3">
          <Button variant="outline" size="sm" onClick={() => setIsDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Task
          </Button>
          {showViewAllLink && (
            <Link href="/activities?tab=task" className="text-blue-600 dark:text-blue-400 text-sm hover:underline">
              View all tasks →
            </Link>
          )}
        </div>
        <TaskDialog 
          open={isDialogOpen} 
          onOpenChange={setIsDialogOpen} 
          onTaskAdded={handleTaskAdded}
        />
      </div>
    );
  }

  return (
    <Card className="overflow-hidden h-full">
      <CardContent className="p-5 flex flex-col h-full">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-medium text-slate-900 dark:text-white">My Tasks</h2>
          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-full bg-slate-50 dark:bg-slate-800"
            onClick={() => setIsDialogOpen(true)}
          >
            <Plus className="h-5 w-5" />
          </Button>
        </div>
        <div className="mt-4 space-y-2 flex-grow overflow-auto">
          {displayTasks.map((task) => (
            <div key={task.id} className="flex items-start p-3 bg-slate-50 dark:bg-slate-800 rounded-lg mb-2">
              <div className="flex-shrink-0 mt-1">
                <Checkbox 
                  id={`task-${task.id}`} 
                  checked={task.completed}
                  onCheckedChange={(checked) => handleTaskToggle(task.id, !!checked)}
                />
              </div>
              <div className="ml-3 flex-1">
                <div className="flex items-center justify-between">
                  <label 
                    htmlFor={`task-${task.id}`} 
                    className={`block text-sm font-medium text-slate-900 dark:text-white`}
                  >
                    {task.title}
                  </label>
                  {task.dueDate && (
                    <Badge variant={getBadgeVariant(task.dueDate)}>
                      {getBadgeText(task.dueDate)}
                    </Badge>
                  )}
                  {/* Also support due_date property from API */}
                  {!task.dueDate && (task as any).due_date && (
                    <Badge variant={getBadgeVariant((task as any).due_date)}>
                      {getBadgeText((task as any).due_date)}
                    </Badge>
                  )}
                </div>
                {task.description && (
                  <p className={`text-xs text-slate-500 dark:text-slate-400 mt-0.5`}>
                    {task.description}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-2 border-t border-slate-100 dark:border-slate-800">
          {showViewAllLink && (
            <Link href="/activities?tab=task" className="text-blue-600 dark:text-blue-400 text-sm hover:underline">
              View all tasks →
            </Link>
          )}
        </div>
      </CardContent>
      
      <TaskDialog 
        open={isDialogOpen} 
        onOpenChange={setIsDialogOpen} 
        onTaskAdded={handleTaskAdded}
      />
    </Card>
  );
};

export default TasksWidget;
