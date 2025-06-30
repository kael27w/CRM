import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '../components/ui/badge';
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
import { Calendar as CalendarIcon, Plus, ChevronLeft, ChevronRight, Clock, Phone, Mail, CheckSquare, Edit, Trash2, MapPin, User, Building, ArrowLeft } from 'lucide-react';
import CalendarEventDialog, { CalendarEvent } from '../components/calendar/calendar-event-dialog';
import { Button } from "../components/ui/button";
import { useTasks } from '../lib/hooks/useTasks';
import { useLocation } from 'wouter';
import TaskDialog from '../components/dashboard/task-dialog';
import { Task } from '../types';
import { AddEventDialog } from '../components/activities/AddEventDialog';
import { EditEventDialog } from '../components/activities/EditEventDialog';
import { CallLogDisplay } from '../components/activities/CallLogDisplay';
import { useAuth } from '../lib/context/AuthContext';
import { 
  fetchEvents, 
  fetchActivities,
  fetchCallLogs,
  deleteEvent, 
  type ActivityEntry,
  updateActivity
} from '../lib/api';
import { toast } from 'sonner';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/ui/alert-dialog';
import { format } from 'date-fns';

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
  description?: string;
  location?: string;
  // Multi-day event properties
  isMultiDay?: boolean;
  eventStartDate?: string;
  eventEndDate?: string;
  currentDisplayDate?: string;
}

// Helper function to check if an activity should be included on a specific day
const isActivityOnDay = (activity: Activity, day: Date): boolean => {
  if (activity.type === 'task') {
    // For tasks, use date-only comparison to avoid timezone issues
    const activityDateStr = activity.dueDate.split('T')[0];
    const dayDateStr = day.toISOString().split('T')[0];
    return activityDateStr === dayDateStr;
  } else if ((activity as any).isMultiDay) {
    // For multi-day events, check if this day falls within the event's date range
    const eventStartDate = new Date((activity as any).eventStartDate);
    const eventEndDate = new Date((activity as any).eventEndDate);
    const dayStart = new Date(day);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(day);
    dayEnd.setHours(23, 59, 59, 999);
    
    return dayStart <= eventEndDate && dayEnd >= eventStartDate;
  } else {
    // For single-day events and calls, use standard date comparison
    const activityDate = new Date(activity.dueDate);
    return activityDate.toDateString() === day.toDateString();
  }
};

// Activity Detail View Component
interface ActivityDetailViewProps {
  activity: Activity;
  onBack: () => void;
  onEdit: () => void;
}

const ActivityDetailView: React.FC<ActivityDetailViewProps> = ({ activity, onBack, onEdit }) => {
  const isCompleted = activity.status === 'completed';
  
  const iconMap = {
    task: <CheckSquare className="h-5 w-5 text-orange-500" />,
    event: <CalendarIcon className="h-5 w-5 text-green-500" />,
    call: <Phone className="h-5 w-5 text-blue-500" />,
    email: <Mail className="h-5 w-5 text-purple-500" />
  };

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" size="sm" onClick={onBack} className="p-1">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={onEdit}>
          <Edit className="h-4 w-4 mr-1" />
          Edit
        </Button>
      </div>
      
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          {iconMap[activity.type]}
          <div className="flex-1">
            <h3 className={`text-lg font-semibold ${isCompleted ? 'line-through text-slate-500' : 'text-slate-900 dark:text-white'}`}>
              {activity.title}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={
                activity.status === 'completed' ? 'default' :
                activity.status === 'in-progress' ? 'secondary' :
                activity.status === 'cancelled' ? 'destructive' : 'outline'
              }>
                {activity.status}
              </Badge>
              {activity.priority && activity.type === 'task' && (
                <Badge variant={
                  activity.priority === 'high' ? 'destructive' :
                  activity.priority === 'medium' ? 'secondary' : 'outline'
                }>
                  {activity.priority} priority
                </Badge>
              )}
            </div>
          </div>
        </div>

        {activity.description && (
          <div>
            <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description</h4>
            <p className="text-sm text-slate-600 dark:text-slate-400">{activity.description}</p>
          </div>
        )}

        {activity.type === 'task' && (
          <div className="space-y-2">
            <div>
              <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Due Date</h4>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {new Date(activity.dueDate).toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
          </div>
        )}

        {activity.type === 'event' && (
          <div className="space-y-2">
            {(activity as any).isMultiDay ? (
              <div>
                <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Event Period</h4>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {new Date((activity as any).eventStartDate).toLocaleDateString()} - {new Date((activity as any).eventEndDate).toLocaleDateString()}
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Starts: {new Date((activity as any).eventStartDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            ) : (
              <div>
                <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Date & Time</h4>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {new Date(activity.dueDate).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })} at {new Date(activity.dueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            )}
            {activity.location && (
              <div>
                <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Location</h4>
                <p className="text-sm text-slate-600 dark:text-slate-400 flex items-center">
                  <MapPin className="h-3 w-3 mr-1" />
                  {activity.location}
                </p>
              </div>
            )}
          </div>
        )}

        {activity.type === 'call' && (
          <div>
            <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Call Date & Time</h4>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {new Date(activity.dueDate).toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })} at {new Date(activity.dueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        )}

        {activity.relatedTo !== 'No relation' && (
          <div>
            <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Related To</h4>
            <p className="text-sm text-slate-600 dark:text-slate-400 flex items-center">
              {activity.relatedType === 'contact' ? <User className="h-3 w-3 mr-1" /> : <Building className="h-3 w-3 mr-1" />}
              {activity.relatedTo} ({activity.relatedType})
            </p>
          </div>
        )}

        <div>
          <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Assigned To</h4>
          <p className="text-sm text-slate-600 dark:text-slate-400">{activity.assignedTo}</p>
        </div>
      </div>
    </div>
  );
};

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
    if (isActivityOnDay(activity, day)) {
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
  onItemClick: (activity: Activity) => void;
}

const ActivityItem: React.FC<ActivityItemProps> = ({ activity, onStatusChange, onItemClick }) => {
  const isCompleted = activity.status === 'completed';
  
  // For tasks, don't show a specific time (they're all-day)
  // For events and calls, show the actual time
  const timeDisplay = activity.type === 'task' 
    ? 'All day' 
    : new Date(activity.dueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
  const iconMap = {
    task: <CheckSquare className="h-4 w-4 text-orange-500" />,
    event: <CalendarIcon className="h-4 w-4 text-green-500" />,
    call: <Phone className="h-4 w-4 text-blue-500" />,
    email: <Mail className="h-4 w-4 text-purple-500" />
  };

  const handleCheckboxChange = (checked: boolean) => {
    // Only allow checkbox interaction for tasks
    if (activity.type === 'task') {
      onStatusChange(activity.id, checked);
    }
  };

  const handleItemClick = () => {
    onItemClick(activity);
  };

  return (
    <div className={`
      p-3 border-b border-slate-100 dark:border-slate-800 last:border-0
      ${isCompleted ? 'opacity-60' : ''}
    `}>
      <div className="flex items-start gap-3">
        {/* Only show checkbox for tasks */}
        {activity.type === 'task' && (
          <Checkbox 
            checked={isCompleted} 
            onCheckedChange={handleCheckboxChange}
            className="mt-1"
            onClick={(e) => e.stopPropagation()} // Prevent triggering item click
          />
        )}
        <div 
          className="flex-1 min-w-0 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded p-1 -m-1"
          onClick={handleItemClick}
        >
          <div className="flex items-center gap-2">
            {iconMap[activity.type]}
            <span className="text-xs text-slate-500">{timeDisplay}</span>
            {activity.priority && activity.type === 'task' && (
              <span className={`text-xs px-1.5 py-0.5 rounded ${
                activity.priority === 'high' ? 'bg-red-100 text-red-700' :
                activity.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                {activity.priority}
              </span>
            )}
          </div>
          <p className={`text-sm mt-1 font-medium ${isCompleted ? 'line-through text-slate-500' : 'text-slate-900 dark:text-white'}`}>
            {activity.title}
          </p>
          
          {/* Enhanced detail display based on activity type */}
          {activity.type === 'task' && (
            <div className="text-xs text-slate-500 mt-1">
              <div>Due: {new Date(activity.dueDate).toLocaleDateString()}</div>
              {activity.relatedTo !== 'No relation' && (
                <div className="truncate">Related to: {activity.relatedTo} ({activity.relatedType})</div>
              )}
            </div>
          )}
          
          {activity.type === 'event' && (
            <div className="text-xs text-slate-500 mt-1">
              {(activity as any).isMultiDay ? (
                <div>
                  {new Date((activity as any).eventStartDate).toLocaleDateString()} - {new Date((activity as any).eventEndDate).toLocaleDateString()}
                  <br />
                  Starts: {new Date((activity as any).eventStartDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              ) : (
                <div>
                  {new Date(activity.dueDate).toLocaleDateString()} at {new Date(activity.dueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              )}
              {activity.relatedTo !== 'No relation' && (
                <div className="truncate">With: {activity.relatedTo} ({activity.relatedType})</div>
              )}
            </div>
          )}
          
          {activity.type === 'call' && (
            <div className="text-xs text-slate-500 mt-1">
              <div>
                {new Date(activity.dueDate).toLocaleDateString()} at {new Date(activity.dueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
              <div className="truncate">{activity.relatedTo}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ActivitiesPage: React.FC = () => {
  // Get admin status and user info from auth context
  const { profile, user, isLoadingProfile } = useAuth();
  const isConfirmedAdmin = !isLoadingProfile && !!profile && profile.is_admin === true;
  const currentUserId = user?.id;
  
  // Debug logging for admin status
  console.log('[ACTIVITIES_PAGE] isLoadingProfile:', isLoadingProfile, 'Profile:', profile ? { is_admin: profile.is_admin } : null, 'isConfirmedAdmin:', isConfirmedAdmin);
  
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
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null); // New state for activity details
  const [filterTypes, setFilterTypes] = useState<Record<string, boolean>>({
    task: true,
    event: true,
    call: true,
    email: true
  });
  const [filterOwnership, setFilterOwnership] = useState<string>("mine"); // mine, all (updated to match API)
  const [filterStatus, setFilterStatus] = useState<string>("open"); // open, closed, all
  
  // Add dialog state for event and task dialogs
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false);
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [currentEditEvent] = useState<Activity | null>(null);
  
  // Event-related state
  const [isAddEventDialogOpen, setIsAddEventDialogOpen] = useState(false);
  const [isEditEventDialogOpen, setIsEditEventDialogOpen] = useState(false);
  const [isDeleteEventDialogOpen, setIsDeleteEventDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<ActivityEntry | null>(null);
  const [eventToDelete, setEventToDelete] = useState<ActivityEntry | null>(null);
  
  // Query client for invalidating queries
  const queryClient = useQueryClient();
  
  // Use the tasks hook to access and manage tasks with proper view filtering
  const { tasks, toggleTask, refetch: refetchTasks } = useTasks(filterOwnership as 'mine' | 'all');
  
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

  // Fetch all activities for calendar integration with data ownership support
  const { data: allActivities = [], isLoading: activitiesLoading } = useQuery({
    queryKey: ['activities', filterOwnership, isConfirmedAdmin, currentUserId],
    queryFn: () => fetchActivities({ 
      view: filterOwnership as 'mine' | 'all' 
    }),
    enabled: !!currentUserId && !isLoadingProfile, // Wait for user and profile to be loaded
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Fetch call logs for calendar integration
  const { data: callLogs = [], isLoading: callLogsLoading } = useQuery({
    queryKey: ['call-logs', currentUserId],
    queryFn: fetchCallLogs,
    enabled: !!currentUserId && !isLoadingProfile, // Wait for user and profile to be loaded
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Convert API data to calendar activities format
  const getCalendarActivities = (): Activity[] => {
    const activities: Activity[] = [];

    // Add events from activities API
    allActivities.forEach(activity => {
      if (activity.type === 'event' && activity.start_datetime) {
        const startDate = new Date(activity.start_datetime);
        const endDate = activity.end_datetime ? new Date(activity.end_datetime) : null;
        
        // If event has an end date and spans multiple days, create entries for each day
        if (endDate && endDate.toDateString() !== startDate.toDateString()) {
          const currentDate = new Date(startDate);
          currentDate.setHours(0, 0, 0, 0); // Start at beginning of day
          
          while (currentDate <= endDate) {
            activities.push({
              id: activity.id,
              title: activity.title,
              type: 'event',
              status: activity.status as any,
              dueDate: activity.start_datetime, // Keep original start time for sorting
              relatedTo: activity.contacts ? `${activity.contacts.first_name} ${activity.contacts.last_name}` : 
                         activity.companies ? activity.companies.company_name : 'No relation',
              relatedType: activity.contacts ? 'contact' : activity.companies ? 'company' : 'deal',
              assignedTo: 'Current User',
              description: activity.description,
              location: activity.location,
              // Add metadata to identify multi-day events
              isMultiDay: true,
              eventStartDate: activity.start_datetime,
              eventEndDate: activity.end_datetime,
              currentDisplayDate: currentDate.toISOString(),
            } as Activity & { isMultiDay?: boolean; eventStartDate?: string; eventEndDate?: string; currentDisplayDate?: string });
            
            // Move to next day
            currentDate.setDate(currentDate.getDate() + 1);
          }
        } else {
          // Single day event
          activities.push({
            id: activity.id,
            title: activity.title,
            type: 'event',
            status: activity.status as any,
            dueDate: activity.start_datetime,
            relatedTo: activity.contacts ? `${activity.contacts.first_name} ${activity.contacts.last_name}` : 
                       activity.companies ? activity.companies.company_name : 'No relation',
            relatedType: activity.contacts ? 'contact' : activity.companies ? 'company' : 'deal',
            assignedTo: 'Current User',
            description: activity.description,
            location: activity.location,
          });
        }
      }
    });

    // Add tasks from activities API
    allActivities.forEach(activity => {
      if (activity.type === 'task' && activity.due_date) {
        activities.push({
          id: activity.id,
          title: activity.title,
          type: 'task',
          status: activity.status as any,
          dueDate: activity.due_date,
          relatedTo: activity.contacts ? `${activity.contacts.first_name} ${activity.contacts.last_name}` : 
                     activity.companies ? activity.companies.company_name : 'No relation',
          relatedType: activity.contacts ? 'contact' : activity.companies ? 'company' : 'deal',
          assignedTo: 'Current User',
          priority: activity.priority as any,
          description: activity.description,
        });
      }
    });

    // Add calls from call logs
    callLogs.forEach(call => {
      activities.push({
        id: call.id,
        title: `Call ${call.direction === 'inbound' ? 'from' : 'to'} ${call.contact_first_name ? `${call.contact_first_name} ${call.contact_last_name}` : call.from_number}`,
        type: 'call',
        status: call.status === 'completed' ? 'completed' : 'pending',
        dueDate: call.created_at,
        relatedTo: call.contact_first_name ? `${call.contact_first_name} ${call.contact_last_name}` : call.from_number,
        relatedType: 'contact',
        assignedTo: 'Current User',
      });
    });

    return activities;
  };

  const calendarActivities = getCalendarActivities();

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

  // Fetch events
  const { data: events = [], isLoading: eventsLoading, error: eventsError } = useQuery({
    queryKey: ['events'],
    queryFn: () => fetchEvents(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Delete event mutation
  const deleteEventMutation = useMutation({
    mutationFn: deleteEvent,
    onSuccess: () => {
      toast.success('Event deleted successfully!');
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      setIsDeleteEventDialogOpen(false);
      setEventToDelete(null);
    },
    onError: (error: Error) => {
      toast.error(`Error deleting event: ${error.message}`);
    },
  });

  // Event handlers
  const handleAddEventNew = (defaultDate?: Date) => {
    if (defaultDate) {
      setSelectedDate(defaultDate);
    }
    setIsAddEventDialogOpen(true);
  };

  const handleEditEventNew = (event: ActivityEntry) => {
    setSelectedEvent(event);
    setIsEditEventDialogOpen(true);
  };

  const handleDeleteEventNew = (event: ActivityEntry) => {
    setEventToDelete(event);
    setIsDeleteEventDialogOpen(true);
  };

  const confirmDeleteEvent = () => {
    if (eventToDelete) {
      deleteEventMutation.mutate(eventToDelete.id);
    }
  };

  // Helper function to convert Activity to ActivityEntry
  const convertActivityToActivityEntry = (activity: Activity): ActivityEntry => {
    return {
      id: activity.id,
      type: activity.type as any,
      title: activity.title,
      description: '',
      status: activity.status,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      start_datetime: activity.type === 'event' ? activity.dueDate : undefined,
      due_date: activity.type === 'task' ? activity.dueDate : undefined,
      priority: activity.priority,
    };
  };

  // Handle editing an activity from the calendar
  const handleEditActivity = (activity: Activity) => {
    const activityEntry = convertActivityToActivityEntry(activity);
    handleEditEventNew(activityEntry);
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
    return calendarActivities.filter(activity => {
      // Use the helper function to check if activity should be on this day
      if (!isActivityOnDay(activity, selectedDate)) return false;
      
      // Apply filters
      if (!filterTypes[activity.type]) return false;
      
      // Apply ownership filter (assumption: current user is Current User)
      if (filterOwnership === "mine" && activity.assignedTo !== "Current User") return false;
      
      // Apply status filter
      if (filterStatus === "open" && activity.status === "completed") return false;
      if (filterStatus === "closed" && activity.status !== "completed") return false;
      
      return true;
    }).sort((a, b) => {
      // Sort activities by time within the day (earliest first)
      if (a.type === 'task' && b.type === 'task') {
        // For tasks, sort by creation time or title since they don't have specific times
        return a.title.localeCompare(b.title);
      } else if (a.type === 'task') {
        // Tasks come first (all-day items)
        return -1;
      } else if (b.type === 'task') {
        // Tasks come first (all-day items)
        return 1;
      } else {
        // For events and calls, sort by actual time
        const timeA = new Date(a.dueDate).getTime();
        const timeB = new Date(b.dueDate).getTime();
        return timeA - timeB;
      }
    });
  };
  
  // Toggle activity type filter
  const toggleActivityTypeFilter = (type: string) => {
    setFilterTypes({
      ...filterTypes,
      [type]: !filterTypes[type]
    });
  };

  // Handle ownership filter change (with admin verification)
  const handleOwnershipFilterChange = (value: string) => {
    // Only allow 'all' view for admins
    if (value === 'all' && !isConfirmedAdmin) {
      toast.error('Access denied: Admin privileges required to view all activities');
      return;
    }
    setFilterOwnership(value);
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
    // Also refresh activities for calendar integration
    queryClient.invalidateQueries({ queryKey: ['activities'] });
    setIsTaskDialogOpen(false);
  };
  
  // Get month name and year
  const monthYearStr = currentDate.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric'
  });
  
  const calendarDays = generateCalendarDays();
  const today = new Date();
  const activitiesForSelectedDate = getActivitiesForSelectedDate();
  
  // Check if calendar data is loading
  const isCalendarLoading = activitiesLoading || callLogsLoading;
  
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
  
  // Update activity status
  const handleActivityStatusChange = async (id: number, completed: boolean) => {
    console.log(`Activity ${id} status changed to ${completed ? 'completed' : 'pending'}`);
    
    try {
      // Update the activity status via API
      await updateActivity(id, {
        completed,
        status: completed ? 'completed' : 'pending'
      });
      
      // Show success feedback
      toast.success(`Task ${completed ? 'completed' : 'reopened'} successfully!`);
      
      // Refresh the activities to get updated data
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    } catch (error: any) {
      console.error('Error updating activity status:', error);
      toast.error(`Error updating task: ${error.message}`);
    }
  };

  // Add function to save new/edited events (for old calendar dialog compatibility)
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
    
    // Refresh activities for calendar integration
    queryClient.invalidateQueries({ queryKey: ['activities'] });
    queryClient.invalidateQueries({ queryKey: ['events'] });
    
    // Close the dialog
    setIsEventDialogOpen(false);
  };
  
  // Show loading state while profile is loading
  if (isLoadingProfile) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg">Loading user permissions...</p>
        </div>
      </div>
    );
  }

  // Show error if no user authenticated
  if (!currentUserId) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-lg text-red-600">
            Authentication required to access activities
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Activities</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Manage tasks, events, calls, and other activities
          {isConfirmedAdmin && (
            <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
              Admin View Available
            </span>
          )}
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
          {isCalendarLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-slate-500 dark:text-slate-400">Loading calendar data...</p>
            </div>
          ) : (
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
                      onClick={() => handleAddEventNew()} 
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
                      const filteredActivitiesForDay = calendarActivities.filter(activity => {
                        // Use the helper function to check if activity should be on this day
                        if (!isActivityOnDay(activity, day)) return false;
                        
                        // Apply type filters
                        if (!filterTypes[activity.type]) return false;
                        
                              // Apply ownership filter (assumption: current user is Current User)
      if (filterOwnership === "mine" && activity.assignedTo !== "Current User") return false;
                        
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
                            setSelectedActivity(null); // Clear activity details when selecting a new date
                          }}
                          onDoubleClick={() => handleAddEventNew(day)}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>
              
              {/* Right Panel */}
              <div className="w-full md:w-80 shrink-0">
                <Card className="overflow-hidden">
                  {selectedActivity ? (
                    // Show activity details
                    <ActivityDetailView
                      activity={selectedActivity}
                      onBack={() => setSelectedActivity(null)}
                      onEdit={() => handleEditActivity(selectedActivity)}
                    />
                  ) : (
                    // Show activities list for selected date
                    <>
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
                          onClick={() => handleAddEventNew(selectedDate)}
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
                            <ActivityItem 
                              key={activity.id}
                              activity={activity}
                              onStatusChange={handleActivityStatusChange}
                              onItemClick={(a) => setSelectedActivity(a)}
                            />
                          ))
                        ) : (
                          <div className="p-4 text-center text-slate-500 dark:text-slate-400">
                            No activities for this date
                          </div>
                        )}
                      </div>
                    </>
                  )}
                  
                  {/* Filter Controls - only show when not viewing activity details */}
                  {!selectedActivity && (
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
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                          Ownership
                          {isConfirmedAdmin && (
                            <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                              Admin
                            </span>
                          )}
                        </p>
                        <RadioGroup 
                          value={filterOwnership}
                          onValueChange={handleOwnershipFilterChange}
                          className="flex gap-4"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="mine" id="ownership-mine" />
                            <Label htmlFor="ownership-mine" className="text-sm">My Activities</Label>
                          </div>
                          {isConfirmedAdmin && (
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="all" id="ownership-all" />
                              <Label htmlFor="ownership-all" className="text-sm">All Activities</Label>
                            </div>
                          )}
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
                  )}
                </Card>
              </div>
            </div>
          )}
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
            <Button onClick={() => handleAddEventNew()}>
              <Plus className="mr-2 h-4 w-4" />
              Add Event
            </Button>
          </div>
          
          {eventsLoading ? (
            <div className="text-center py-8">
              <p className="text-slate-500 dark:text-slate-400">Loading events...</p>
            </div>
          ) : eventsError ? (
            <div className="text-center py-8">
              <p className="text-red-500 mb-4">Error loading events: {eventsError.message}</p>
              <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['events'] })}>
                Try Again
              </Button>
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-8">
              <CalendarIcon className="mx-auto h-12 w-12 text-slate-400 mb-4" />
              <p className="text-slate-500 dark:text-slate-400 mb-4">No events found</p>
              <Button onClick={() => handleAddEventNew()}>
                <Plus className="mr-2 h-4 w-4" />
                Create your first event
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {events.map((event) => (
                <Card key={event.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <CalendarIcon className="h-5 w-5 text-green-600" />
                          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                            {event.title}
                          </h3>
                          <Badge 
                            variant={
                              event.status === 'completed' ? 'default' :
                              event.status === 'in-progress' ? 'secondary' :
                              event.status === 'cancelled' ? 'destructive' : 'outline'
                            }
                          >
                            {event.status}
                          </Badge>
                        </div>
                        
                        {event.description && (
                          <p className="text-slate-600 dark:text-slate-300 mb-3">
                            {event.description}
                          </p>
                        )}
                        
                        <div className="flex flex-wrap gap-4 text-sm text-slate-500 dark:text-slate-400">
                          {event.start_datetime && (
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              <span>
                                {format(new Date(event.start_datetime), 'MMM d, yyyy h:mm a')}
                                {event.end_datetime && (
                                  <span> - {format(new Date(event.end_datetime), 'h:mm a')}</span>
                                )}
                              </span>
                            </div>
                          )}
                          
                          {event.location && (
                            <div className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              <span>{event.location}</span>
                            </div>
                          )}
                          
                          {event.contacts && (
                            <div className="flex items-center gap-1">
                              <User className="h-4 w-4" />
                              <span>{event.contacts.first_name} {event.contacts.last_name}</span>
                            </div>
                          )}
                          
                          {event.companies && (
                            <div className="flex items-center gap-1">
                              <Building className="h-4 w-4" />
                              <span>{event.companies.company_name}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditEventNew(event)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteEventNew(event)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
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

      {/* Add Event Dialog */}
      <AddEventDialog
        open={isAddEventDialogOpen}
        onOpenChange={setIsAddEventDialogOpen}
        defaultDate={selectedDate}
      />

      {/* Edit Event Dialog */}
      {selectedEvent && (
        <EditEventDialog
          open={isEditEventDialogOpen}
          onOpenChange={setIsEditEventDialogOpen}
          event={selectedEvent}
        />
      )}

      {/* Delete Event Confirmation Dialog */}
      <AlertDialog open={isDeleteEventDialogOpen} onOpenChange={setIsDeleteEventDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Event</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{eventToDelete?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteEvent}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteEventMutation.isPending}
            >
              {deleteEventMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ActivitiesPage;