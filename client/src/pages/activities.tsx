import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '../components/shared/data-table';
import { Badge } from '../components/ui/badge';
import { apiRequest } from '../lib/queryClient';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "../components/ui/tabs";
import { Card, CardContent } from "../components/ui/card";
import { 
  Checkbox
} from "../components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "../components/ui/radio-group";
import { Label } from "../components/ui/label";
import { Calendar as CalendarIcon, Plus, ChevronLeft, ChevronRight, Clock, Phone, Mail, CheckSquare, Filter } from 'lucide-react';
import CalendarEventDialog, { CalendarEvent } from '../components/calendar/calendar-event-dialog';
import { Button } from "../components/ui/button";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "../lib/queryClient";
import { useTasks } from '../lib/hooks/useTasks';
import { useLocation } from 'wouter';
import TaskDialog from '../components/dashboard/task-dialog';
import { Task } from '../types';
import { CallLogDisplay } from '../components/activities/CallLogDisplay';

// This will be replaced with the actual Activity types from schema.ts
// when we update the backend
interface Activity {
  id: number;
  title: string;
  type: 'task' | 'event' | 'call' | 'email';
  status: 'completed' | 'pending' | 'in-progress' | 'cancelled';
  dueDate: string;
  relatedTo: string;
  relatedType: 'contact' | 'company' | 'deal';
  assignedTo: string;
  priority?: 'low' | 'medium' | 'high';
}

// Calendar Day Component
interface CalendarDayProps {
  day: Date;
  activities: Activity[];
  isCurrentMonth: boolean;
  isToday: boolean;
  onClick: () => void;
  onDoubleClick: () => void;
}

const CalendarDay: React.FC<CalendarDayProps> = ({ day, activities, isCurrentMonth, isToday, onClick, onDoubleClick }) => {
  // Count activities by type for the day
  const activityCounts = {
    task: 0,
    event: 0,
    call: 0,
    email: 0
  };
  
  activities.forEach(activity => {
    const activityDate = new Date(activity.dueDate);
    if (activityDate.toDateString() === day.toDateString()) {
      activityCounts[activity.type]++;
    }
  });
  
  const hasActivities = Object.values(activityCounts).some(count => count > 0);
  
  return (
    <div 
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      className={`
        min-h-[90px] p-1 border border-slate-200 dark:border-slate-700 
        ${isCurrentMonth ? 'bg-white dark:bg-slate-800' : 'bg-slate-50 dark:bg-slate-900'}
        ${isToday ? 'ring-2 ring-blue-500 dark:ring-blue-400' : ''}
        hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer
      `}
    >
      <div className="flex justify-between items-start">
        <span className={`
          text-sm font-medium rounded-full h-6 w-6 flex items-center justify-center
          ${isToday ? 'bg-blue-500 text-white' : 
            !isCurrentMonth ? 'text-slate-400 dark:text-slate-500' : 
            'text-slate-900 dark:text-white'}
        `}>
          {day.getDate()}
        </span>
        
        {hasActivities && (
          <div className="flex gap-1">
            {activityCounts.task > 0 && (
              <span className="flex items-center justify-center h-5 w-5 bg-orange-100 dark:bg-orange-900/30 rounded-full">
                <CheckSquare className="h-3 w-3 text-orange-600 dark:text-orange-400" />
              </span>
            )}
            {activityCounts.event > 0 && (
              <span className="flex items-center justify-center h-5 w-5 bg-green-100 dark:bg-green-900/30 rounded-full">
                <CalendarIcon className="h-3 w-3 text-green-600 dark:text-green-400" />
              </span>
            )}
            {activityCounts.call > 0 && (
              <span className="flex items-center justify-center h-5 w-5 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                <Phone className="h-3 w-3 text-blue-600 dark:text-blue-400" />
              </span>
            )}
          </div>
        )}
      </div>
      
      {hasActivities && (
        <div className="mt-1 space-y-1">
          {activityCounts.task > 0 && (
            <div className="text-xs text-slate-600 dark:text-slate-300 truncate">
              <span className="font-medium">{activityCounts.task}</span> {activityCounts.task === 1 ? 'task' : 'tasks'}
            </div>
          )}
          {activityCounts.event > 0 && (
            <div className="text-xs text-slate-600 dark:text-slate-300 truncate">
              <span className="font-medium">{activityCounts.event}</span> {activityCounts.event === 1 ? 'event' : 'events'}
            </div>
          )}
          {activityCounts.call > 0 && (
            <div className="text-xs text-slate-600 dark:text-slate-300 truncate">
              <span className="font-medium">{activityCounts.call}</span> {activityCounts.call === 1 ? 'call' : 'calls'}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Activity item in the side panel
interface ActivityItemProps {
  activity: Activity;
  onStatusChange: (id: number, completed: boolean) => void;
}

const ActivityItem: React.FC<ActivityItemProps> = ({ activity, onStatusChange }) => {
  const isCompleted = activity.status === 'completed';
  const time = new Date(activity.dueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
  const iconMap = {
    task: <CheckSquare className="h-4 w-4 text-orange-500" />,
    event: <CalendarIcon className="h-4 w-4 text-green-500" />,
    call: <Phone className="h-4 w-4 text-blue-500" />,
    email: <Mail className="h-4 w-4 text-purple-500" />
  };

  return (
    <div className={`
      p-3 border-b border-slate-100 dark:border-slate-800 last:border-0
      ${isCompleted ? 'opacity-60' : ''}
    `}>
      <div className="flex items-start gap-3">
        <Checkbox 
          checked={isCompleted} 
          onCheckedChange={(checked) => onStatusChange(activity.id, checked === true)}
          className="mt-1"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {iconMap[activity.type]}
            <span className="text-xs text-slate-500">{time}</span>
          </div>
          <p className={`text-sm mt-1 ${isCompleted ? 'line-through text-slate-500' : 'text-slate-900 dark:text-white'}`}>
            {activity.title}
          </p>
          <div className="text-xs text-slate-500 mt-1 truncate">
            {activity.relatedTo} ({activity.relatedType})
          </div>
        </div>
      </div>
    </div>
  );
};

const ActivitiesPage: React.FC = () => {
  // Parse URL params to get initial tab
  const [location] = useLocation();
  const getInitialTab = () => {
    const params = new URLSearchParams(location.split('?')[1] || '');
    const tab = params.get('tab');
    return tab === 'task' || tab === 'event' || tab === 'call' ? tab : 'calendar';
  };

  const [activeTab, setActiveTab] = useState<string>(getInitialTab());
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [filterTypes, setFilterTypes] = useState<Record<string, boolean>>({
    task: true,
    event: true,
    call: true,
    email: true
  });
  const [filterOwnership, setFilterOwnership] = useState<string>("my"); // my, all
  const [filterStatus, setFilterStatus] = useState<string>("open"); // open, closed, all
  
  // Add dialog state for event and task dialogs
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false);
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [currentEditEvent, setCurrentEditEvent] = useState<Activity | null>(null);
  
  // Use the tasks hook to access and manage tasks
  const { tasks, toggleTask, refetch: refetchTasks } = useTasks();
  
  // State for tasks displayed in the Tasks tab
  const [displayedTasks, setDisplayedTasks] = useState<Task[]>([]);
  
  // Initialize the displayed tasks based on filter whenever tasks or filter changes
  useEffect(() => {
    if (tasks && tasks.length > 0) {
      // Apply the filter and exclude completed tasks unless we're viewing completed tasks
      if (filterStatus === 'completed') {
        setDisplayedTasks(tasks.filter(task => task.completed));
      } else if (filterStatus === 'open') {
        setDisplayedTasks(tasks.filter(task => !task.completed));
      } else {
        setDisplayedTasks(tasks);
      }
    } else {
      setDisplayedTasks([]);
    }
  }, [tasks, filterStatus]);
  
  // Handler for toggling task completion in the Tasks tab
  const handleTaskStatusToggle = (id: number, completed: boolean) => {
    // Call the hook function to update the backend
    toggleTask(id, completed);
    
    // If marking as completed, remove from the display list unless we're showing completed tasks
    if (completed && filterStatus !== 'completed') {
      setDisplayedTasks(prevTasks => prevTasks.filter(task => task.id !== id));
    } else if (!completed && filterStatus === 'completed') {
      // If un-checking a completed task while viewing completed tasks, remove it
      setDisplayedTasks(prevTasks => prevTasks.filter(task => task.id !== id));
    } else {
      // Otherwise just update the task's state
      setDisplayedTasks(prevTasks => 
        prevTasks.map(task => 
          task.id === id ? { ...task, completed } : task
        )
      );
    }
  };
  
  // Update URL when tab changes
  useEffect(() => {
    const [pathWithoutQuery] = location.split('?');
    if (activeTab === 'calendar') {
      window.history.replaceState(null, '', pathWithoutQuery);
    } else {
      window.history.replaceState(null, '', `${pathWithoutQuery}?tab=${activeTab}`);
    }
  }, [activeTab, location]);
  
  // Sample data - this will be replaced with actual API data
  const sampleActivities: Activity[] = [
    {
      id: 1,
      title: "Follow-up call with Sarah Johnson",
      type: "call",
      status: "pending",
      dueDate: "2025-04-10T14:00:00",
      relatedTo: "Sarah Johnson",
      relatedType: "contact",
      assignedTo: "Alex Davis",
      priority: "high"
    },
    {
      id: 2,
      title: "Send proposal to TechStart Inc",
      type: "task",
      status: "in-progress",
      dueDate: "2025-04-07T12:00:00",
      relatedTo: "TechStart Inc",
      relatedType: "company",
      assignedTo: "Sarah Johnson"
    },
    {
      id: 3,
      title: "Quarterly review meeting",
      type: "event",
      status: "pending",
      dueDate: "2025-04-15T10:00:00",
      relatedTo: "Acme Corp Deal",
      relatedType: "deal",
      assignedTo: "Michael Rodriguez"
    },
    {
      id: 4,
      title: "Send onboarding materials",
      type: "email",
      status: "completed",
      dueDate: "2025-04-02T09:00:00",
      relatedTo: "Brown Enterprises",
      relatedType: "company",
      assignedTo: "Emily Chen"
    },
    {
      id: 5,
      title: "Prepare contract documents",
      type: "task",
      status: "pending",
      dueDate: "2025-04-09T16:00:00",
      relatedTo: "Medical Solutions Deal",
      relatedType: "deal",
      assignedTo: "Alex Davis",
      priority: "medium"
    }
  ];

  // Define columns for the data table
  const columns: ColumnDef<Activity>[] = [
    {
      accessorKey: "title",
      header: "Activity",
      cell: ({ row }) => {
        const type = row.original.type;
        const iconMap = {
          task: <CheckSquare className="h-4 w-4 mr-2 text-orange-500" />,
          event: <CalendarIcon className="h-4 w-4 mr-2 text-green-500" />,
          call: <Phone className="h-4 w-4 mr-2 text-blue-500" />,
          email: <Mail className="h-4 w-4 mr-2 text-purple-500" />
        };
        
        return (
          <div className="flex items-center">
            {iconMap[type]}
            <div className="font-medium">{row.getValue("title")}</div>
          </div>
        );
      },
    },
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => {
        const type = row.getValue("type") as 'task' | 'event' | 'call' | 'email';
        const typeColorMap: Record<string, string> = {
          task: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
          event: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
          call: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
          email: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300"
        };
        
        return (
          <span className={`px-2 py-1 rounded-md text-xs font-medium ${typeColorMap[type] || ''}`}>
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </span>
        );
      },
    },
    {
      accessorKey: "dueDate",
      header: "Due Date",
      cell: ({ row }) => {
        const date = new Date(row.getValue("dueDate"));
        const formattedDate = new Intl.DateTimeFormat('en-US', {
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: 'numeric',
          hour12: true
        }).format(date);
        
        return <div className="whitespace-nowrap">{formattedDate}</div>;
      },
    },
    {
      accessorKey: "relatedTo",
      header: "Related To",
      cell: ({ row }) => {
        const relatedType = row.original.relatedType;
        const prefix = relatedType === 'deal' ? '' : '';
        
        return (
          <div className="flex items-center">
            <div>{row.getValue("relatedTo")}</div>
            <div className="ml-2 text-xs text-muted-foreground">({relatedType})</div>
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as 'completed' | 'pending' | 'in-progress' | 'cancelled';
        
        // Define color scheme based on status
        const statusColorMap: Record<string, string> = {
          'completed': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
          'pending': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
          'in-progress': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
          'cancelled': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
        };
        
        return (
          <span className={`px-2 py-1 rounded-md text-xs font-medium ${statusColorMap[status] || ''}`}>
            {status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
          </span>
        );
      },
    },
    {
      accessorKey: "assignedTo",
      header: "Assigned To",
    },
    {
      accessorKey: "priority",
      header: "Priority",
      cell: ({ row }) => {
        const priority = row.getValue("priority") as 'low' | 'medium' | 'high' | undefined;
        if (!priority) return null;
        
        const priorityColorMap: Record<string, string> = {
          'low': 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300',
          'medium': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
          'high': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
        };
        
        return (
          <span className={`px-2 py-1 rounded-md text-xs font-medium ${priorityColorMap[priority] || ''}`}>
            {priority.charAt(0).toUpperCase() + priority.slice(1)}
          </span>
        );
      },
    },
  ];

  // Filter activities based on active tab
  const filteredActivities = sampleActivities.filter(activity => {
    if (activeTab === 'all') return true;
    return activity.type === activeTab;
  });

  // For now we'll use the sample data. Later this will be replaced with actual API data
  // const { data: activities = [], isLoading, error } = useQuery({
  //   queryKey: ['/api/activities'],
  //   queryFn: () => apiRequest('/api/activities'),
  // });

  const handleRowClick = (row: any) => {
    console.log('Activity clicked:', row.original);
    // This will be expanded to show activity details or edit activity
  };

  const handleAddField = () => {
    console.log('Add field clicked');
    // This will be expanded to allow adding custom fields
  };

  // Helper functions for calendar
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };
  
  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };
  
  // Get days for calendar
  const generateCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDayOfMonth = getFirstDayOfMonth(year, month);
    
    // Get days from previous month to fill the first week
    const daysFromPrevMonth = firstDayOfMonth;
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevMonthYear = month === 0 ? year - 1 : year;
    const daysInPrevMonth = getDaysInMonth(prevMonthYear, prevMonth);
    
    const days: Date[] = [];
    
    // Add days from previous month
    for (let i = daysInPrevMonth - daysFromPrevMonth + 1; i <= daysInPrevMonth; i++) {
      days.push(new Date(prevMonthYear, prevMonth, i));
    }
    
    // Add days from current month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    
    // Add days from next month to complete 6 rows (42 days)
    const nextMonth = month === 11 ? 0 : month + 1;
    const nextMonthYear = month === 11 ? year + 1 : year;
    const remainingDays = 42 - days.length;
    
    for (let i = 1; i <= remainingDays; i++) {
      days.push(new Date(nextMonthYear, nextMonth, i));
    }
    
    return days;
  };
  
  // Navigate to previous month
  const goToPrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };
  
  // Navigate to next month
  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };
  
  // Go to today
  const goToToday = () => {
    const today = new Date();
    setCurrentDate(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDate(today);
  };
  
  // Get activities for selected date
  const getActivitiesForSelectedDate = () => {
    return sampleActivities.filter(activity => {
      // Match date
      const activityDate = new Date(activity.dueDate);
      if (activityDate.toDateString() !== selectedDate.toDateString()) return false;
      
      // Apply filters
      if (!filterTypes[activity.type]) return false;
      
      // Apply ownership filter (assumption: current user is Alex Davis)
      if (filterOwnership === "my" && activity.assignedTo !== "Alex Davis") return false;
      
      // Apply status filter
      if (filterStatus === "open" && activity.status === "completed") return false;
      if (filterStatus === "closed" && activity.status !== "completed") return false;
      
      return true;
    });
  };
  
  // Toggle activity type filter
  const toggleActivityTypeFilter = (type: string) => {
    setFilterTypes({
      ...filterTypes,
      [type]: !filterTypes[type]
    });
  };
  
  // Handle task dialog
  const handleAddTask = () => {
    setIsTaskDialogOpen(true);
  };
  
  // Handle adding a new task
  const handleTaskAdded = async (newTask: any) => {
    console.log('New task created:', newTask);
    // Add the newly created task to the displayed tasks list for immediate UI update
    setDisplayedTasks(prev => [newTask, ...prev]);
    
    // Refresh tasks data from the server or mock
    await refetchTasks();
    setIsTaskDialogOpen(false);
  };
  
  // Add function to handle opening the dialog for new events
  const handleAddEvent = (date?: Date) => {
    setCurrentEditEvent(null);
    setSelectedDate(date || selectedDate);
    setIsEventDialogOpen(true);
  };
  
  // Add function to handle opening the dialog for editing events
  const handleEditEvent = (activity: Activity) => {
    setCurrentEditEvent(activity);
    setIsEventDialogOpen(true);
  };
  
  // Add function to save new/edited events
  const handleSaveEvent = (eventData: CalendarEvent) => {
    // For now, just log the data. In a real app, this would send data to an API
    console.log('Event saved:', eventData);
    
    if (currentEditEvent) {
      // Update existing event logic would go here
      console.log('Updating existing event:', currentEditEvent.id);
    } else {
      // Create new event logic would go here
      console.log('Creating new event');
    }
    
    // Close the dialog
    setIsEventDialogOpen(false);
  };
  
  // Update activity status
  const handleActivityStatusChange = (id: number, completed: boolean) => {
    console.log(`Activity ${id} status changed to ${completed ? 'completed' : 'pending'}`);
    // This would be replaced with a mutation to update the activity status
  };
  
  // Get month name and year
  const monthYearStr = currentDate.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric'
  });
  
  const calendarDays = generateCalendarDays();
  const today = new Date();
  const activitiesForSelectedDate = getActivitiesForSelectedDate();
  
  const renderTasks = () => {
    if (!tasks || tasks.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-slate-500 dark:text-slate-400 mb-4">No tasks found</p>
          <Button onClick={handleAddTask}>
            <Plus className="mr-2 h-4 w-4" />
            Add your first task
          </Button>
        </div>
      );
    }
    
    if (displayedTasks.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-slate-500 dark:text-slate-400 mb-4">
            No {filterStatus === 'completed' ? 'completed' : 'open'} tasks found
          </p>
        </div>
      );
    }
    
    return (
      <div className="space-y-4">
        {displayedTasks.map(task => (
          <Card key={task.id} className="mb-4">
            <CardContent className="p-4">
              <div className="flex items-start">
                <Checkbox
                  id={`task-${task.id}`}
                  checked={task.completed}
                  onCheckedChange={(checked) => handleTaskStatusToggle(task.id, checked as boolean)}
                  className="mt-1 mr-3"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-medium">
                      {task.title}
                    </h3>
                    {task.dueDate && (
                      <Badge variant={task.completed ? "outline" : "destructive"}>
                        {new Date(task.dueDate).toLocaleDateString()}
                      </Badge>
                    )}
                  </div>
                  {task.description && (
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                      {task.description}
                    </p>
                  )}
                  {task.client && (
                    <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                      {task.client.name}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Activities</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Manage tasks, events, calls, and other activities
        </p>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-4 w-full max-w-2xl">
          <TabsTrigger value="calendar">
            <CalendarIcon className="h-4 w-4 mr-2" />
            Calendar
          </TabsTrigger>
          <TabsTrigger value="task">
            <CheckSquare className="h-4 w-4 mr-2" />
            Tasks
          </TabsTrigger>
          <TabsTrigger value="event">
            <CalendarIcon className="h-4 w-4 mr-2" />
            Events
          </TabsTrigger>
          <TabsTrigger value="call">
            <Phone className="h-4 w-4 mr-2" />
            Calls
          </TabsTrigger>
        </TabsList>
        
        {/* Calendar Tab Content */}
        <TabsContent value="calendar" className="mt-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Main Calendar View */}
            <div className="flex-1">
              {/* Calendar Controls */}
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  <button 
                    onClick={goToToday}
                    className="px-3 py-1 text-sm bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-md font-medium"
                  >
                    Today
                  </button>
                  <button 
                    onClick={goToPrevMonth}
                    className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button 
                    onClick={goToNextMonth}
                    className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                  <h2 className="text-lg font-medium">{monthYearStr}</h2>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    onClick={() => handleAddEvent()} 
                    className="flex items-center gap-1"
                    size="sm"
                  >
                    <Plus className="h-4 w-4" />
                    Add Event
                  </Button>
                  <button className="px-3 py-1 text-sm bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-md font-medium">
                    Month
                  </button>
                  <button className="px-3 py-1 text-sm bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-md font-medium">
                    Week
                  </button>
                  <button className="px-3 py-1 text-sm bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-md font-medium">
                    Day
                  </button>
                </div>
              </div>
              
              {/* Calendar Grid */}
              <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm">
                {/* Day names header */}
                <div className="grid grid-cols-7 gap-px border-b border-slate-200 dark:border-slate-700">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => (
                    <div key={i} className="py-2 text-center text-sm font-medium text-slate-500 dark:text-slate-400">
                      {day}
                    </div>
                  ))}
                </div>
                
                {/* Calendar grid */}
                <div className="grid grid-cols-7 gap-px">
                  {calendarDays.map((day, i) => {
                    // Filter activities for this calendar day based on active filters
                    const filteredActivitiesForDay = sampleActivities.filter(activity => {
                      // Match day
                      const activityDate = new Date(activity.dueDate);
                      if (activityDate.toDateString() !== day.toDateString()) return false;
                      
                      // Apply type filters
                      if (!filterTypes[activity.type]) return false;
                      
                      // Apply ownership filter (assumption: current user is Alex Davis)
                      if (filterOwnership === "my" && activity.assignedTo !== "Alex Davis") return false;
                      
                      // Apply status filter
                      if (filterStatus === "open" && activity.status === "completed") return false;
                      if (filterStatus === "closed" && activity.status !== "completed") return false;
                      
                      return true;
                    });
                    
                    return (
                      <CalendarDay
                        key={i}
                        day={day}
                        activities={filteredActivitiesForDay}
                        isCurrentMonth={day.getMonth() === currentDate.getMonth()}
                        isToday={day.toDateString() === today.toDateString()}
                        onClick={() => {
                          setSelectedDate(day);
                          // Double-click detection could be added here
                        }}
                        onDoubleClick={() => handleAddEvent(day)}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
            
            {/* Right Panel */}
            <div className="w-full md:w-80 shrink-0">
              <Card className="overflow-hidden">
                <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold text-lg">
                      {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {activitiesForSelectedDate.length} activities
                    </p>
                  </div>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => handleAddEvent(selectedDate)}
                    className="h-8 w-8 p-0"
                  >
                    <Plus className="h-4 w-4" />
                    <span className="sr-only">Add activity</span>
                  </Button>
                </div>
                
                {/* Activities for selected date */}
                <div className="max-h-80 overflow-y-auto">
                  {activitiesForSelectedDate.length > 0 ? (
                    activitiesForSelectedDate.map(activity => (
                      <div 
                        key={activity.id} 
                        onClick={() => handleEditEvent(activity)} 
                        className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50"
                      >
                        <ActivityItem 
                          activity={activity}
                          onStatusChange={handleActivityStatusChange}
                        />
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-slate-500 dark:text-slate-400">
                      No activities for this date
                    </div>
                  )}
                </div>
                
                {/* Filter Controls */}
                <div className="p-4 border-t border-slate-200 dark:border-slate-700">
                  <h4 className="font-medium text-sm mb-3">Filters</h4>
                  
                  {/* Activity Type Filters */}
                  <div className="mb-4">
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">Activity Types</p>
                    <div className="flex flex-wrap gap-2">
                      <div className="flex items-center">
                        <Checkbox 
                          id="filter-task" 
                          checked={filterTypes.task}
                          onCheckedChange={() => toggleActivityTypeFilter('task')}
                          className="mr-2"
                        />
                        <Label htmlFor="filter-task" className="text-sm flex items-center">
                          <CheckSquare className="h-3 w-3 mr-1 text-orange-500" /> Tasks
                        </Label>
                      </div>
                      <div className="flex items-center">
                        <Checkbox 
                          id="filter-event" 
                          checked={filterTypes.event}
                          onCheckedChange={() => toggleActivityTypeFilter('event')}
                          className="mr-2"
                        />
                        <Label htmlFor="filter-event" className="text-sm flex items-center">
                          <CalendarIcon className="h-3 w-3 mr-1 text-green-500" /> Events
                        </Label>
                      </div>
                      <div className="flex items-center">
                        <Checkbox 
                          id="filter-call" 
                          checked={filterTypes.call}
                          onCheckedChange={() => toggleActivityTypeFilter('call')}
                          className="mr-2"
                        />
                        <Label htmlFor="filter-call" className="text-sm flex items-center">
                          <Phone className="h-3 w-3 mr-1 text-blue-500" /> Calls
                        </Label>
                      </div>
                    </div>
                  </div>
                  
                  {/* Ownership Filter */}
                  <div className="mb-4">
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">Ownership</p>
                    <RadioGroup 
                      value={filterOwnership}
                      onValueChange={setFilterOwnership}
                      className="flex gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="my" id="ownership-my" />
                        <Label htmlFor="ownership-my" className="text-sm">My Activities</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="all" id="ownership-all" />
                        <Label htmlFor="ownership-all" className="text-sm">All Activities</Label>
                      </div>
                    </RadioGroup>
                  </div>
                  
                  {/* Status Filter */}
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">Status</p>
                    <RadioGroup 
                      value={filterStatus}
                      onValueChange={setFilterStatus}
                      className="flex gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="open" id="status-open" />
                        <Label htmlFor="status-open" className="text-sm">Open</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="closed" id="status-closed" />
                        <Label htmlFor="status-closed" className="text-sm">Closed</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="all" id="status-all" />
                        <Label htmlFor="status-all" className="text-sm">All</Label>
                      </div>
                    </RadioGroup>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </TabsContent>
        
        {/* Tasks Tab Content */}
        <TabsContent value="task" className="mt-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold">Tasks</h2>
              <p className="text-slate-500 dark:text-slate-400">Manage your tasks and to-dos</p>
            </div>
            <Button onClick={handleAddTask}>
              <Plus className="mr-2 h-4 w-4" />
              Add Task
            </Button>
          </div>
          
          {renderTasks()}
        </TabsContent>
        
        {/* Events Tab Content */}
        <TabsContent value="event" className="mt-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold">Events</h2>
              <p className="text-slate-500 dark:text-slate-400">Manage your events and meetings</p>
            </div>
            <Button onClick={() => handleAddEvent()}>
              <Plus className="mr-2 h-4 w-4" />
              Add Event
            </Button>
          </div>
          
          <div className="text-center py-8">
            <p className="text-slate-500 dark:text-slate-400 mb-4">Events feature coming soon</p>
          </div>
        </TabsContent>
        
        {/* Calls Tab Content */}
        <TabsContent value="call" className="mt-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold">Calls</h2>
              <p className="text-slate-500 dark:text-slate-400">Manage your call records</p>
            </div>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Log Call
            </Button>
          </div>
          
          <div className="p-4 border rounded-md bg-white shadow-sm">
            <CallLogDisplay />
          </div>
        </TabsContent>
      </Tabs>
      
      {/* Calendar Event Dialog */}
      <CalendarEventDialog
        open={isEventDialogOpen}
        onOpenChange={setIsEventDialogOpen}
        onSave={handleSaveEvent}
        defaultDate={selectedDate}
        event={currentEditEvent ? {
          id: currentEditEvent.id.toString(),
          title: currentEditEvent.title,
          description: '',
          type: currentEditEvent.type,
          status: currentEditEvent.status,
          date: new Date(currentEditEvent.dueDate),
          allDay: false,
          startTime: new Date(currentEditEvent.dueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          endTime: new Date(new Date(currentEditEvent.dueDate).getTime() + 60 * 60 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          relatedEntityType: currentEditEvent.relatedType,
          relatedEntityId: 0,
        } : undefined}
      />
      
      {/* Task Dialog */}
      <TaskDialog
        open={isTaskDialogOpen}
        onOpenChange={setIsTaskDialogOpen}
        onTaskAdded={handleTaskAdded}
      />
    </div>
  );
};

export default ActivitiesPage;