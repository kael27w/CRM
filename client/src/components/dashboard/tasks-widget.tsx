import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Task } from '@/types';
import { format, isToday, isTomorrow } from 'date-fns';

interface TasksWidgetProps {
  tasks: Task[];
  onToggleTask: (id: number, completed: boolean) => void;
}

const TasksWidget: React.FC<TasksWidgetProps> = ({ tasks, onToggleTask }) => {
  const getBadgeVariant = (dueDate: string) => {
    if (!dueDate) return "secondary";
    
    if (isToday(new Date(dueDate))) {
      return "destructive";
    } else if (isTomorrow(new Date(dueDate))) {
      return "warning";
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

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-medium text-slate-900 dark:text-white">My Tasks</h2>
          <Button variant="ghost" size="icon" className="rounded-full bg-slate-50 dark:bg-slate-800">
            <Plus className="h-5 w-5" />
          </Button>
        </div>
        <div className="mt-4 space-y-2">
          {tasks.map((task) => (
            <div key={task.id} className="flex items-start py-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex-shrink-0 mt-1">
                <Checkbox 
                  id={`task-${task.id}`} 
                  checked={task.completed}
                  onCheckedChange={(checked) => onToggleTask(task.id, !!checked)}
                />
              </div>
              <div className="ml-3 flex-1">
                <div className="flex items-center justify-between">
                  <label 
                    htmlFor={`task-${task.id}`} 
                    className={`block text-sm font-medium ${
                      task.completed 
                        ? 'text-slate-400 dark:text-slate-500 line-through' 
                        : 'text-slate-900 dark:text-white'
                    }`}
                  >
                    {task.title}
                  </label>
                  {task.dueDate && (
                    <Badge variant={getBadgeVariant(task.dueDate)}>
                      {getBadgeText(task.dueDate)}
                    </Badge>
                  )}
                </div>
                {task.description && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{task.description}</p>
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4">
          <Button variant="link" className="p-0">View all tasks &rarr;</Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default TasksWidget;
