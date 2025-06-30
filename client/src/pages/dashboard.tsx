import React, { useState, useEffect } from 'react';
import { useLocation, useRoute } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../lib/queryClient';
import { queryClient } from '../lib/queryClient';
import { DashboardStats, Task, UpcomingRenewal } from '../types';
import { 
  CircleDollarSign, 
  ShieldCheck, 
  Wallet, 
  Users,
  CheckCircle2,
  Calendar,
  Target,
  PhoneCall,
  Mail,
  ChevronDown,
  BarChart2,
  Plus,
  RefreshCw,
  LayoutGrid,
  LineChart,
  Gauge,
  AlertCircle
} from 'lucide-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem
} from "../components/ui/dropdown-menu";
import { Button } from "../components/ui/button";
import { formatCurrency } from '../lib/utils/format-currency';
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import TasksWidget from '../components/dashboard/tasks-widget';
import SimpleCounter from '../components/dashboard/simple-counter';
import TargetMeter from '../components/dashboard/target-meter';
import StatCard from '../components/dashboard/stat-card';
import AddComponentDialog, { ComponentConfig, DashboardType } from '../components/dashboard/add-component-dialog';
import ComponentOptionsMenu from '../components/dashboard/component-options-menu';
import { useTasks } from '../lib/hooks/useTasks';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../components/ui/tooltip';

// Define default components for each dashboard type
const DEFAULT_DASHBOARD_COMPONENTS: Record<DashboardType, ComponentConfig[]> = {
  overview: [
    { type: 'stat', title: 'Contacts Created', dashboardType: 'overview', metric: 'contacts_created_this_month' },
    { type: 'stat', title: 'Pipelines Won - This Month', dashboardType: 'overview', metric: 'pipelines_won_this_month' },
    { type: 'stat', title: 'Pipelines Lost - This Month', dashboardType: 'overview', metric: 'pipelines_lost_this_month' },
    { type: 'stat', title: 'Tasks Closed - This Month', dashboardType: 'overview', metric: 'tasks_closed_this_month' },
    { type: 'chart', title: 'Open Pipelines by Stage', dashboardType: 'overview', metric: 'open_pipelines_by_stage_this_month' },
    { type: 'chart', title: 'Revenue Won by Month', dashboardType: 'overview', metric: 'revenue_won_by_month' },
    { type: 'targetMeter', title: 'Number of Calls', dashboardType: 'overview', metric: 'calls_completed_count_this_month' }
  ],
  pipelines: [
    { type: 'stat', title: 'Open Pipelines - This Month', dashboardType: 'pipelines', metric: 'pipelines_open_this_month' },
    { type: 'stat', title: 'Pipelines Won - This Month', dashboardType: 'pipelines', metric: 'pipelines_won_this_month' },
    { type: 'stat', title: 'Pipelines Lost - This Month', dashboardType: 'pipelines', metric: 'pipelines_lost_this_month' },
    { type: 'stat', title: 'Revenue Won - This Month', dashboardType: 'pipelines', metric: 'revenue_won_this_month' },
    { type: 'chart', title: 'Open Pipelines Amount by Stage', dashboardType: 'pipelines', metric: 'open_pipelines_amount_by_stage' },
    { type: 'chart', title: 'Monthly Revenue by Users', dashboardType: 'pipelines', metric: 'monthly_revenue_by_user' }
  ],
  events: [
    { type: 'stat', title: 'Events Created - This Month', dashboardType: 'events', metric: 'events_created_this_month' },
    { type: 'stat', title: 'Events Completed - This Month', dashboardType: 'events', metric: 'events_completed_this_month' },
    { type: 'stat', title: 'Upcoming Events - This Month', dashboardType: 'events', metric: 'events_upcoming_this_month' },
    { type: 'chart', title: 'Completed Events by Month', dashboardType: 'events', metric: 'events_completed_by_month' }
  ],
  tasks: [
    { type: 'stat', title: 'Tasks Created - This Month', dashboardType: 'tasks', metric: 'tasks_created_this_month' },
    { type: 'stat', title: 'Open Tasks - This Month', dashboardType: 'tasks', metric: 'tasks_open_this_month' },
    { type: 'stat', title: 'Completed Tasks - This Month', dashboardType: 'tasks', metric: 'tasks_completed_this_month' },
    { type: 'stat', title: 'Overdue Tasks - This Month', dashboardType: 'tasks', metric: 'tasks_overdue_this_month' },
    { type: 'chart', title: 'Tasks by Priority', dashboardType: 'tasks', metric: 'tasks_by_priority' }
  ],
  calls: [
    { type: 'stat', title: 'Calls Completed - This Month', dashboardType: 'calls', metric: 'calls_completed_this_month' },
    { type: 'stat', title: 'Upcoming Calls - This Month', dashboardType: 'calls', metric: 'calls_upcoming_this_month' },
    { type: 'stat', title: 'Inbound Calls - This Month', dashboardType: 'calls', metric: 'calls_inbound_this_month' },
    { type: 'stat', title: 'Outbound Calls - This Month', dashboardType: 'calls', metric: 'calls_outbound_this_month' },
    { type: 'stat', title: 'Average Call Duration', dashboardType: 'calls', metric: 'calls_average_duration_this_month' }
  ],
  emails: [
    { type: 'stat', title: 'Emails Sent - This Month', dashboardType: 'emails', metric: 'emails_sent_this_month' },
    { type: 'stat', title: 'Emails Opened - This Month', dashboardType: 'emails', metric: 'emails_opened_this_month' },
    { type: 'stat', title: 'Emails Clicked - This Month', dashboardType: 'emails', metric: 'emails_clicked_this_month' },
    { type: 'chart', title: 'Users vs Emails Sent', dashboardType: 'emails', metric: 'users_vs_emails_sent' }
  ]
};

// --- Mock Data Generation ---
// Helper function to create mock DashboardStats
const createMockDashboardStats = (): DashboardStats => ({
  revenueMTD: 55200.75,
  revenueChange: 12.5,
  activePolicies: 1240,
  activePoliciesChange: 5.2,
  pendingClaims: 35,
  pendingClaimsChange: -2,
  activeClients: 850,
  activeClientsChange: 18,
  premiumRevenue: [
    { month: 'Jan', revenue: 45000 },
    { month: 'Feb', revenue: 48000 },
    { month: 'Mar', revenue: 52000 },
    { month: 'Apr', revenue: 50000 },
    { month: 'May', revenue: 55200 },
    { month: 'Jun', revenue: 58000 },
  ],
  policyStatus: [
    { status: 'Active', count: 1240, percentage: 80, color: '#3b82f6' }, // blue
    { status: 'Pending', count: 155, percentage: 10, color: '#f59e0b' }, // amber
    { status: 'Expired', count: 77, percentage: 5, color: '#ef4444' }, // red
    { status: 'Cancelled', count: 78, percentage: 5, color: '#6b7280' }, // gray
  ],
  upcomingRenewals: [
    { 
      id: 1, 
      client: { id: 101, name: 'Client A', status: 'Active', createdAt: '' }, 
      policy: { id: 201, policyNumber: 'POL-001', type: 'Auto', status: 'Active', coverageAmount: 50000, premium: 500, startDate: '', renewalDate: '2024-08-15', stage: '', createdAt: '' , clientId: 101}
    },
    { 
      id: 2, 
      client: { id: 102, name: 'Client B', status: 'Active', createdAt: '' }, 
      policy: { id: 202, policyNumber: 'POL-002', type: 'Home', status: 'Active', coverageAmount: 250000, premium: 1200, startDate: '', renewalDate: '2024-08-20', stage: '', createdAt: '' , clientId: 102}
    },
    // Add more mock renewals if needed
  ],
  agentPerformance: [
    { 
      id: 1, 
      agent: { id: 1, username: 'agent1', name: 'Agent Smith', email: '', role: '', createdAt: '' }, 
      policiesSold: 25, 
      premiumVolume: 75000, 
      conversionRate: 60, 
      clientRetention: 85, 
      trend: 'up'
    },
    // Add more mock agents if needed
  ],
  // Add other potential fields with default mock values if needed by other views
  // callsCompleted: 42, // Example if needed later, but not in current type
});

// Placeholder for future component
const PlaceholderComponent: React.FC<{ title: string }> = ({ title }) => (
  <Card>
    <CardHeader>
      <CardTitle title={title}>{title}</CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-muted-foreground">Component data will load here.</p>
    </CardContent>
  </Card>
);

const Dashboard: React.FC = () => {
  // Get current dashboard type from route or default to overview
  const [, params] = useRoute('/dashboard/:type');
  const [, setLocation] = useLocation();
  const [dashboardType, setDashboardType] = useState<DashboardType>(
    (params?.type as DashboardType) || 'overview'
  );
  
  // State for the Add Component dialog
  const [isAddingComponent, setIsAddingComponent] = useState(false);
  
  // State for custom components added by the user
  const [customComponents, setCustomComponents] = useState<ComponentConfig[]>([]);
  
  // Load saved components from localStorage on initial render
  useEffect(() => {
    const savedComponents = localStorage.getItem(`dashboard_components_${dashboardType}`);
    if (savedComponents) {
      try {
        setCustomComponents(JSON.parse(savedComponents));
      } catch (error) {
        console.error('Failed to parse saved components:', error);
      }
    }
  }, [dashboardType]);

  // Save components to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(`dashboard_components_${dashboardType}`, JSON.stringify(
      customComponents.filter(component => component.dashboardType === dashboardType)
    ));
  }, [customComponents, dashboardType]);
  
  // Update URL when dashboard type changes
  useEffect(() => {
    // Only update URL if it doesn't match the current state
    if (params?.type !== dashboardType) {
       setLocation(`/dashboard/${dashboardType}`, { replace: true });
    }
  }, [dashboardType, setLocation, params?.type]);
  
  // Handle dashboard type change from dropdown
  const handleDashboardChange = (type: string) => {
    // Type assertion needed as DropdownMenuRadioItem value is string
    setDashboardType(type as DashboardType);
  };
  
  const { data: dashboardData, isLoading, isError, error, refetch } = useQuery<DashboardStats, Error>({
    queryKey: ['dashboardStats', dashboardType],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', `/api/stats/${dashboardType}`);
        if (!response.ok) {
          console.error(`API error for ${dashboardType}: ${response.status} ${response.statusText}`);
          // Return mock data on HTTP error
          return createMockDashboardStats();
        }
        // Check content type before parsing
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          return response.json() as Promise<DashboardStats>;
        } else {
          console.error(`Unexpected content type for ${dashboardType}: ${contentType}`);
          // Return mock data on non-JSON response (like HTML error pages)
          return createMockDashboardStats();
        }
      } catch (err) {
        console.error(`Fetch error for ${dashboardType}:`, err);
        // Return mock data on network/fetch error
        return createMockDashboardStats();
      }
    },
    // Prevent automatic retries on error for now, as endpoints might be broken
    retry: false,
    // Keep data from previous successful fetch while loading new view?
    // placeholderData: keepPreviousData, // Or use a stale mock
  });

  // Get tasks from the useTasks hook
  const { tasks, toggleTask } = useTasks('mine');
  
  // Update the handleToggleTask function to use the toggleTask from useTasks hook
  const handleToggleTask = (id: number, completed: boolean) => {
    toggleTask(id, completed);
  };
  
  // Handle adding a new component to the dashboard
  const handleAddComponent = (component: ComponentConfig) => {
    // Generate a unique ID for the component
    const newComponent = {
      ...component,
      id: `component-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
    };
    setCustomComponents(prev => [...prev, newComponent]);
  };

  // Handle deleting a component from the dashboard
  const handleDeleteComponent = (componentId: string) => {
    setCustomComponents(prev => prev.filter(component => component.id !== componentId));
  };

  // Load default components for a new dashboard type
  const loadDefaultComponents = () => {
    // This function could be used to initialize dashboards with default components
    // For now, we'll just return the appropriate default components based on dashboard type
    return DEFAULT_DASHBOARD_COMPONENTS[dashboardType] || [];
  };
  
  // Dashboard Type to Display Name mapping
  const dashboardNames: Record<DashboardType, string> = {
    'overview': 'Overview',
    'pipelines': 'Pipelines',
    'tasks': 'Tasks',
    'events': 'Events',
    'calls': 'Call Analytics',
    'emails': 'Email Analytics'
  };

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="mb-6">
          <div className="h-8 w-48 bg-slate-200 dark:bg-slate-700 rounded mb-2"></div>
          <div className="h-4 w-64 bg-slate-200 dark:bg-slate-700 rounded"></div>
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="col-span-1 lg:col-span-3 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-slate-800 overflow-hidden shadow-sm rounded-lg p-5 h-40"></div>
            ))}
          </div>
          <div className="col-span-1 lg:col-span-2 bg-white dark:bg-slate-800 overflow-hidden shadow-sm rounded-lg p-5 h-80"></div>
          <div className="bg-white dark:bg-slate-800 overflow-hidden shadow-sm rounded-lg p-5 h-80"></div>
          <div className="bg-white dark:bg-slate-800 overflow-hidden shadow-sm rounded-lg p-5 h-80"></div>
          <div className="bg-white dark:bg-slate-800 overflow-hidden shadow-sm rounded-lg p-5 h-80"></div>
          <div className="col-span-1 lg:col-span-3 bg-white dark:bg-slate-800 overflow-hidden shadow-sm rounded-lg p-5 h-80"></div>
        </div>
      </div>
    );
  }

  if (isError || !dashboardData) {
    return (
      <Card className="col-span-full">
        <CardHeader>
          <CardTitle className="flex items-center text-destructive">
            <AlertCircle className="mr-2 h-5 w-5"/>
            Error Loading Dashboard Data
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            There was an issue fetching the data for the {dashboardNames[dashboardType]} dashboard. Please try again later.
          </p>
          <pre className="text-xs bg-muted p-2 rounded overflow-x-auto mb-4">
            {error instanceof Error ? error.message : 'An unknown error occurred.'}
          </pre>
          <Button onClick={() => refetch()} variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4"/>
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

    // --- Reusable Stat Card Data Generation ---
    // Moved this logic here to be reused across views
    const overviewStats = [
        { 
          title: "Revenue MTD", 
          value: formatCurrency(dashboardData.revenueMTD), 
          icon: <CircleDollarSign className="h-6 w-6 text-blue-600 dark:text-blue-400" />,
          change: dashboardData.revenueChange, changeLabel: "vs last month", 
          changeType: dashboardData.revenueChange >= 0 ? 'positive' as const : 'negative' as const,
          bgColor: "bg-blue-50 dark:bg-blue-900/20",
          iconColor: "text-blue-600 dark:text-blue-400"
        },
        { 
          title: "Active Policies", 
          value: dashboardData.activePolicies, 
          icon: <ShieldCheck className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />,
          change: dashboardData.activePoliciesChange, changeLabel: "vs last month", 
          changeType: dashboardData.activePoliciesChange >= 0 ? 'positive' as const : 'negative' as const,
          bgColor: "bg-emerald-50 dark:bg-emerald-900/20",
          iconColor: "text-emerald-600 dark:text-emerald-400"
        },
        { 
          title: "Pending Claims", 
          value: dashboardData.pendingClaims, 
          icon: <Wallet className="h-6 w-6 text-amber-600 dark:text-amber-400" />,
          change: Math.abs(dashboardData.pendingClaimsChange), changeLabel: "vs last month", 
          changeType: dashboardData.pendingClaimsChange <= 0 ? 'positive' as const : 'negative' as const,
          bgColor: "bg-amber-50 dark:bg-amber-900/20",
          iconColor: "text-amber-600 dark:text-amber-400"
        },
        { 
          title: "Active Clients", 
          value: dashboardData.activeClients, 
          icon: <Users className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />,
          change: dashboardData.activeClientsChange, changeLabel: "vs last month", 
          changeType: dashboardData.activeClientsChange >= 0 ? 'positive' as const : 'negative' as const,
          bgColor: "bg-indigo-50 dark:bg-indigo-900/20",
          iconColor: "text-indigo-600 dark:text-indigo-400"
        }
      ];

    const pipelineStats = [
        { 
          title: "Open Deals Value", 
          value: formatCurrency(485000), // Using mock value 
          icon: <CircleDollarSign className="h-6 w-6 text-blue-600 dark:text-blue-400" />,
          change: 12, changeLabel: "vs last month", changeType: 'positive' as const,
          bgColor: "bg-blue-50 dark:bg-blue-900/20", iconColor: "text-blue-600"
        },
        { 
          title: "Avg Deal Size", 
          value: formatCurrency(48500), // Using mock value
          icon: <BarChart2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />,
          change: 8, changeLabel: "vs last month", changeType: 'positive' as const,
          bgColor: "bg-emerald-50 dark:bg-emerald-900/20", iconColor: "text-emerald-600"
        },
        { 
          title: "Win Rate", value: "32%", // Using mock value
          icon: <Target className="h-6 w-6 text-amber-600 dark:text-amber-400" />,
          change: -2, changeLabel: "vs last month", changeType: 'negative' as const,
          bgColor: "bg-amber-50 dark:bg-amber-900/20", iconColor: "text-amber-600"
        },
        { 
          title: "Deals Won MTD", value: 15, // Mock value
          icon: <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />,
          change: 3, changeLabel: "vs last month", changeType: 'positive' as const,
          bgColor: "bg-green-50 dark:bg-green-900/20", iconColor: "text-green-600"
        },
      ];
      
    const taskStats = [
        { 
          title: "Open Tasks", value: 24, // Mock value
          icon: <CheckCircle2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />,
          change: -5, changeLabel: "vs last month", changeType: 'negative' as const,
          bgColor: "bg-blue-50 dark:bg-blue-900/20", iconColor: "text-blue-600"
        },
        { 
          title: "Overdue Tasks", value: 8, // Mock value
          icon: <CheckCircle2 className="h-6 w-6 text-red-600 dark:text-red-400" />,
          change: 2, changeLabel: "vs last month", changeType: 'negative' as const,
          bgColor: "bg-red-50 dark:bg-red-900/20", iconColor: "text-red-600"
        },
        { 
          title: "Completed Today", value: 7, // Mock value
          icon: <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />,
          change: 3, changeLabel: "vs yesterday", changeType: 'positive' as const,
          bgColor: "bg-emerald-50 dark:bg-emerald-900/20", iconColor: "text-emerald-600"
        },
        { 
          title: "Due This Week", value: 12, // Mock value
          icon: <Calendar className="h-6 w-6 text-amber-600 dark:text-amber-400" />,
          change: 1, changeLabel: "vs last week", changeType: 'positive' as const,
          bgColor: "bg-amber-50 dark:bg-amber-900/20", iconColor: "text-amber-600"
        },
    ];

    const eventStats = [
      { 
        title: "Upcoming Events", value: 15, // Mock value
        icon: <Calendar className="h-6 w-6 text-blue-600 dark:text-blue-400" />,
        change: 5, changeLabel: "vs last month", changeType: 'positive' as const,
        bgColor: "bg-blue-50 dark:bg-blue-900/20", iconColor: "text-blue-600"
      },
      { 
        title: "Events This Week", value: 8, // Mock value
        icon: <Calendar className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />,
        change: 2, changeLabel: "vs last week", changeType: 'positive' as const,
        bgColor: "bg-emerald-50 dark:bg-emerald-900/20", iconColor: "text-emerald-600"
      },
      { 
        title: "Completed Events", value: 16, // Mock value
        icon: <Calendar className="h-6 w-6 text-amber-600 dark:text-amber-400" />,
        change: 4, changeLabel: "vs last month", changeType: 'positive' as const,
        bgColor: "bg-amber-50 dark:bg-amber-900/20", iconColor: "text-amber-600"
      },
      { 
        title: "No Shows", value: 3, // Mock value
        icon: <Calendar className="h-6 w-6 text-red-600 dark:text-red-400" />,
        change: 1, changeLabel: "vs last month", changeType: 'negative' as const,
        bgColor: "bg-red-50 dark:bg-red-900/20", iconColor: "text-red-600"
      },
    ];

    const emailStats = [
      { 
        title: "Emails Sent", value: 145, // Mock value
        icon: <Mail className="h-6 w-6 text-blue-600 dark:text-blue-400" />,
        change: 18, changeLabel: "vs last month", changeType: 'positive' as const,
        bgColor: "bg-blue-50 dark:bg-blue-900/20", iconColor: "text-blue-600"
      },
      { 
        title: "Open Rate", value: "28%", // Mock value
        icon: <Mail className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />,
        change: 5, changeLabel: "vs last month", changeType: 'positive' as const,
        bgColor: "bg-emerald-50 dark:bg-emerald-900/20", iconColor: "text-emerald-600"
      },
      { 
        title: "Click Rate", value: "12%", // Mock value
        icon: <Mail className="h-6 w-6 text-amber-600 dark:text-amber-400" />,
        change: -2, changeLabel: "vs last month", changeType: 'negative' as const,
        bgColor: "bg-amber-50 dark:bg-amber-900/20", iconColor: "text-amber-600"
      },
      { 
        title: "Bounce Rate", value: "3%", // Mock value
        icon: <Mail className="h-6 w-6 text-red-600 dark:text-red-400" />,
        change: 1, changeLabel: "vs last month", changeType: 'negative' as const,
        bgColor: "bg-red-50 dark:bg-red-900/20", iconColor: "text-red-600"
      },
    ];

  // Render a component based on its configuration
  const renderCustomComponent = (component: ComponentConfig, index: number) => {
    // Only render components associated with the current dashboard type
    if (component.dashboardType !== dashboardType) {
      return null;
    }

    // Need component ID to delete it
    if (!component.id) {
      console.warn('Component without ID detected', component);
      return null;
    }

    // Decide what data to display based on the component's metric
    const metricData = getMetricData(component.metric);
    
    // Helper function to handle deleting this specific component
    const handleDelete = () => handleDeleteComponent(component.id!);
    
    // Wrapper div with relative positioning for the options menu
    const ComponentWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
      <div className="relative group" key={`custom-component-${component.id}`}>
        {children}
        <ComponentOptionsMenu onDelete={handleDelete} />
      </div>
    );
    
    switch (component.type) {
      case 'stat':
        // For stats, create a stat card using the metric data
        return (
          <ComponentWrapper>
            <StatCard 
              stat={{
                title: component.title,
                value: typeof metricData === 'number' ? metricData.toString() : metricData || '0',
                icon: <CircleDollarSign className="h-6 w-6 text-blue-600 dark:text-blue-400" />,
                change: 0,
                changeLabel: 'vs last period',
                changeType: 'positive' as const,
                bgColor: "bg-blue-50 dark:bg-blue-900/20",
                iconColor: "text-blue-600 dark:text-blue-400"
              }} 
            />
          </ComponentWrapper>
        );
        
      case 'chart':
        // For charts, show a chart component with the appropriate data
        return (
          <ComponentWrapper>
            <Card>
              <CardHeader>
                <CardTitle>{component.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[200px] flex items-center justify-center">
                  <LineChart className="h-16 w-16 text-slate-300" />
                  <span className="ml-2 text-slate-500">Chart data from {component.metric}</span>
                </div>
              </CardContent>
            </Card>
          </ComponentWrapper>
        );
        
      case 'targetMeter':
        // For target meters, show a target meter with appropriate data
        const current = typeof metricData === 'number' ? metricData : 0;
        return (
          <ComponentWrapper>
            <TargetMeter 
              current={current} 
              target={100} // This could be customizable in the future
              title={component.title} 
            />
          </ComponentWrapper>
        );
        
      default:
        return null;
    }
  };

  // Helper function to get data for a specific metric
  const getMetricData = (metricKey: string): any => {
    // This would typically fetch actual data from dashboardData or an API
    // For now, return a mock value based on the metric key
    if (metricKey.includes('this_month')) {
      return Math.floor(Math.random() * 100);
    }
    return '0';
  };

  const renderDashboardContent = () => {
    // Ensure data exists (mock or real)
    if (!dashboardData) return null; // Should be handled by loading/error states

    // Define standard dashboard components first
    let standardComponents;
    
    switch(dashboardType) {
      case 'overview':
        standardComponents = (
          <>
            {overviewStats.map((stat, index) => (
              <StatCard key={`overview-stat-${index}`} stat={stat} />
            ))}
            {/* Placeholder Charts - Replace with actual chart components when ready */}
            <PlaceholderComponent title="Premium Revenue" />
            <PlaceholderComponent title="Policy Status" />
            {/* Tasks Widget */}
            <Card className="col-span-1 lg:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Upcoming Renewals / Tasks</CardTitle>
              </CardHeader>
              <CardContent>
                <TasksWidget
                    tasks={tasks || []}
                    onToggleTask={handleToggleTask}
                    showViewAllLink={true}
                />
              </CardContent>
            </Card>
            {/* Placeholder Agent Performance Widget */}
            <PlaceholderComponent title="Agent Performance" />
          </>
        );
        break;
        
      case 'pipelines':
        standardComponents = (
          <>
            {pipelineStats.map((stat, index) => (
              <StatCard key={`pipeline-stat-${index}`} stat={stat} />
            ))}
            {/* Placeholder charts and widgets for Pipelines */}
            <PlaceholderComponent title="Deals Won vs Lost" />
            <PlaceholderComponent title="Pipeline Conversion" />
            <PlaceholderComponent title="Pipeline Overview Table" />
            <PlaceholderComponent title="Sales Cycle Length" />
          </>
        );
        break;
        
      case 'tasks':
        standardComponents = (
          <>
            {taskStats.map((stat, index) => (
              <StatCard key={`task-stat-${index}`} stat={stat} />
            ))}
             {/* Placeholder charts and widgets for Tasks */}
            <PlaceholderComponent title="Task Status Distribution" />
            <PlaceholderComponent title="Task Due Date Distribution" />
            <Card className="col-span-1 md:col-span-2 lg:col-span-2"> 
              <CardHeader><CardTitle>My Open Tasks</CardTitle></CardHeader>
              <CardContent>
                 {/* Use real tasks data from useTasks hook */}
                <TasksWidget tasks={tasks || []} onToggleTask={handleToggleTask} /> 
              </CardContent>
            </Card>
          </>
        );
        break;
        
      case 'events':
        standardComponents = (
          <>
            {eventStats.map((stat, index) => (
              <StatCard key={`event-stat-${index}`} stat={stat} />
            ))}
            {/* Placeholder calendar and charts for Events */}
            <PlaceholderComponent title="Upcoming Events Calendar" />
            <PlaceholderComponent title="Events By Type Chart" />
            <PlaceholderComponent title="Event Attendance Rate" />
            <PlaceholderComponent title="Event Feedback Summary" />
          </>
        );
        break;
        
      case 'calls':
        const mockCallsCompleted = 42; // Mock value
        const mockCallTarget = 100;  // Mock value
         standardComponents = (
            <>
             <SimpleCounter value={mockCallsCompleted} title="Total Calls" />
             <TargetMeter current={mockCallsCompleted} target={mockCallTarget} title="Call Target" />
             {/* Placeholder stats/charts for Calls */}
             <PlaceholderComponent title="Avg Call Duration" />
             <PlaceholderComponent title="Calls By Outcome" />
             <PlaceholderComponent title="Call Volume Over Time" />
             <PlaceholderComponent title="Busiest Call Times" />
            </>
         );
         break;
        
      case 'emails':
        standardComponents = (
          <>
            {emailStats.map((stat, index) => (
              <StatCard key={`email-stat-${index}`} stat={stat} />
            ))}
            {/* Placeholder charts and lists for Emails */}
            <PlaceholderComponent title="Email Performance (Open/Click)" />
            <PlaceholderComponent title="Top Performing Templates" />
            <PlaceholderComponent title="Unsubscribe Rate" />
            <PlaceholderComponent title="Reply Rate" />
          </>
        );
        break;
        
      default:
        standardComponents = <PlaceholderComponent title={`Content for ${dashboardNames[dashboardType]}`} />;
    }
    
    // Get only components associated with the current dashboard
    const currentDashboardComponents = customComponents.filter(
      component => component.dashboardType === dashboardType
    );
    
    // Return both standard and custom components
    return (
      <>
        {standardComponents}
        {currentDashboardComponents.map(renderCustomComponent)}
      </>
    );
  };
  
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="text-2xl font-bold p-0 h-auto">
              {dashboardNames[dashboardType]}
              <ChevronDown className="ml-2 h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuLabel>Select Dashboard View</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuRadioGroup value={dashboardType} onValueChange={handleDashboardChange}>
               {Object.entries(dashboardNames).map(([key, name]) => (
                <DropdownMenuRadioItem key={key} value={key}>
                  {name}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="flex items-center space-x-2">
          <Button onClick={() => setIsAddingComponent(true)}>
            <Plus className="mr-2 h-4 w-4" /> Component
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 flex-grow">
        {renderDashboardContent()}
      </div>
      
      <AddComponentDialog
        open={isAddingComponent}
        onOpenChange={setIsAddingComponent}
        onAddComponent={handleAddComponent}
        currentDashboard={dashboardType}
      />
    </div>
  );
};

export default Dashboard;