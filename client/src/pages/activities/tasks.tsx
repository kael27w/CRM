import React from 'react';
import { useTasks } from '../../lib/hooks/useTasks';
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Checkbox } from "../../components/ui/checkbox";
import { Badge } from "../../components/ui/badge";
import { Calendar, Clock, Plus, ArrowLeft, Search, Filter } from 'lucide-react';
import { format, isToday, isTomorrow } from 'date-fns';
import { Link } from 'wouter';
import { Task } from '../../types';
import { Input } from '../../components/ui/input';

// Add a custom interface extending Task to include dueTime
interface ExtendedTask extends Task {
  dueTime?: string;
}

/**
 * Tasks Page Component
 * Displays a list of tasks with filtering and sorting capabilities
 */
const TasksPage: React.FC = () => {
  const { tasks, isLoading, isError, error, toggleTask } = useTasks();
  const [searchTerm, setSearchTerm] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<'all' | 'open' | 'completed'>('all');

  // Filter tasks based on search term and status filter
  const filteredTasks = React.useMemo(() => {
    if (!tasks) return [];
    
    return tasks.filter(task => {
      // Apply status filter
      if (statusFilter === 'open' && task.completed) return false;
      if (statusFilter === 'completed' && !task.completed) return false;
      
      // Apply search filter (if any)
      if (searchTerm.trim() === '') return true;
      
      const searchLower = searchTerm.toLowerCase();
      return (
        (task.title && task.title.toLowerCase().includes(searchLower)) ||
        (task.description && task.description.toLowerCase().includes(searchLower)) ||
        (task.client && task.client.name.toLowerCase().includes(searchLower))
      );
    });
  }, [tasks, searchTerm, statusFilter]);

  // Get badge color and label for due date
  const getDueDateBadge = (dueDate: string) => {
    if (!dueDate) return { variant: "secondary", label: "No date" };
    
    const date = new Date(dueDate);
    
    if (isToday(date)) {
      return { variant: "destructive", label: "Today" };
    } else if (isTomorrow(date)) {
      return { variant: "warning", label: "Tomorrow" };
    } else if (date < new Date()) {
      return { variant: "destructive", label: "Overdue" };
    }
    
    return { variant: "secondary", label: format(date, 'MMM dd') };
  };

  // Render task item
  const renderTaskItem = (task: Task) => {
    // Cast to ExtendedTask to handle optional dueTime property
    const extTask = task as ExtendedTask;
    
    return (
      <Card key={task.id} className={`mb-4 ${task.completed ? 'bg-slate-50 dark:bg-slate-800/50' : ''}`}>
        <CardContent className="p-4">
          <div className="flex items-start">
            <Checkbox
              id={`task-${task.id}`}
              checked={task.completed}
              onCheckedChange={(checked) => toggleTask(task.id, checked as boolean)}
              className="mt-1 mr-3"
            />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className={`text-base font-medium ${task.completed ? 'line-through text-slate-400 dark:text-slate-500' : ''}`}>
                  {task.title}
                </h3>
                {task.dueDate && (
                  <Badge variant={getDueDateBadge(task.dueDate).variant as any}>
                    {getDueDateBadge(task.dueDate).label}
                  </Badge>
                )}
              </div>
              {task.description && (
                <p className={`text-sm text-slate-500 dark:text-slate-400 mt-1 ${task.completed ? 'line-through' : ''}`}>
                  {task.description}
                </p>
              )}
              {task.client && (
                <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                  {task.client.name}
                </p>
              )}
              <div className="flex items-center mt-2 text-xs text-slate-500 dark:text-slate-400">
                <Calendar className="h-3 w-3 mr-1" />
                <span className="mr-3">
                  {task.dueDate ? format(new Date(task.dueDate), 'MMM d, yyyy') : 'No due date'}
                </span>
                {extTask.dueTime && (
                  <>
                    <Clock className="h-3 w-3 mr-1" />
                    <span>{extTask.dueTime}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 w-56 bg-slate-200 dark:bg-slate-700 rounded mb-6"></div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-24 bg-slate-200 dark:bg-slate-700 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Error Loading Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          <p>There was an error loading your tasks: {error?.message}</p>
          <Button className="mt-4" onClick={() => window.location.reload()}>Retry</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Link href="/activities">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-3xl font-bold">Tasks</h1>
          </div>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Manage your tasks and to-dos
          </p>
        </div>
        <Button className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Add Task
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500 dark:text-slate-400" />
          <Input
            type="search"
            placeholder="Search tasks..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={statusFilter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('all')}
          >
            All
          </Button>
          <Button
            variant={statusFilter === 'open' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('open')}
          >
            Open
          </Button>
          <Button
            variant={statusFilter === 'completed' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('completed')}
          >
            Completed
          </Button>
          <Button variant="outline" size="icon" className="ml-2">
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-2">
        {filteredTasks.length > 0 ? (
          filteredTasks.map(renderTaskItem)
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-slate-500 dark:text-slate-400 mb-4">
                {searchTerm ? 'No tasks match your search' : 'No tasks found'}
              </p>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Task
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default TasksPage; 