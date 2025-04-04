import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/shared/data-table';
import { Badge } from '@/components/ui/badge';
import { apiRequest } from '@/lib/queryClient';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Calendar, Clock, Phone, Mail, CheckSquare } from 'lucide-react';

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

const ActivitiesPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>("all");
  
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
          event: <Calendar className="h-4 w-4 mr-2 text-green-500" />,
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Activities</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Manage tasks, events, calls, and other activities
        </p>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-5 w-full max-w-3xl">
          <TabsTrigger value="all" className="flex items-center">
            All Activities
          </TabsTrigger>
          <TabsTrigger value="task" className="flex items-center">
            <CheckSquare className="h-4 w-4 mr-2" />
            Tasks
          </TabsTrigger>
          <TabsTrigger value="event" className="flex items-center">
            <Calendar className="h-4 w-4 mr-2" />
            Events
          </TabsTrigger>
          <TabsTrigger value="call" className="flex items-center">
            <Phone className="h-4 w-4 mr-2" />
            Calls
          </TabsTrigger>
          <TabsTrigger value="email" className="flex items-center">
            <Mail className="h-4 w-4 mr-2" />
            Emails
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value={activeTab}>
          <DataTable
            columns={columns}
            data={filteredActivities}
            title=""
            searchPlaceholder="Search activities..."
            onRowClick={handleRowClick}
            onAddField={handleAddField}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ActivitiesPage;