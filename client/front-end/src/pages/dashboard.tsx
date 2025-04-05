import React, { useState, useEffect } from 'react';
import { useLocation, useRoute } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { queryClient } from '@/lib/queryClient';
import { DashboardStats, Task, UpcomingRenewal } from '@/types';
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
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { formatCurrency } from '@/lib/utils/format-currency';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import TasksWidget from '@/components/dashboard/tasks-widget';
import SimpleCounter from '@/components/dashboard/simple-counter';
import TargetMeter from '@/components/dashboard/target-meter';
import StatCard from '@/components/dashboard/stat-card';

// Types for dashboard views
type DashboardType = 'overview' | 'pipelines' | 'tasks' | 'events' | 'calls' | 'emails';

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
      <CardTitle>{title}</CardTitle>
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

  const completeTaskMutation = useMutation({
    mutationFn: async ({ id, completed }: { id: number, completed: boolean }) => {
      if (completed) {
        // Assuming a generic task completion endpoint, adjust if needed
        const response = await apiRequest('PATCH', `/api/tasks/${id}/complete`, {});
        return response.json();
      }
      return null;
    },
    onSuccess: () => {
      // Invalidate queries related to tasks or the specific dashboard view
      queryClient.invalidateQueries({ queryKey: ['dashboardStats', dashboardType] });
      // Might need to invalidate other queries if tasks appear elsewhere
      // queryClient.invalidateQueries({ queryKey: ['tasks'] });
    }
  });

  const handleToggleTask = (id: number, completed: boolean) => {
    completeTaskMutation.mutate({ id, completed });
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

  const renderDashboardContent = () => {
    // Ensure data exists (mock or real)
    if (!dashboardData) return null; // Should be handled by loading/error states

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

    // --- View Specific Rendering --- 
    switch(dashboardType) {
      case 'overview':
        return (
          <>
            {overviewStats.map((stat, index) => (
              <StatCard key={`overview-stat-${index}`} stat={stat} />
            ))}
            {/* Placeholder Charts - Replace with actual chart components when ready */}
            <PlaceholderComponent title="Premium Revenue" />
            <PlaceholderComponent title="Policy Status" />
            {/* Tasks Widget */}
            <Card className="col-span-1 lg:col-span-2">
              <CardHeader><CardTitle>Upcoming Renewals / Tasks</CardTitle></CardHeader>
              <CardContent>
                <TasksWidget
                    tasks={dashboardData?.upcomingRenewals?.map((renewal: UpcomingRenewal): Task => ({
                        id: renewal.policy.id, // Use policy ID for task linkage? Adjust as needed.
                        title: `Call ${renewal.client.name} about policy renewal`,
                        description: `${renewal.policy.type} Policy #${renewal.policy.policyNumber}`,
                        dueDate: renewal.policy.renewalDate!,
                        completed: false,
                        assignedToId: 1, // Placeholder: Get current user ID
                        clientId: renewal.client.id,
                        policyId: renewal.policy.id,
                        createdAt: new Date().toISOString(), // Placeholder
                        client: renewal.client,
                        policy: renewal.policy,
                    })) || []}
                    onToggleTask={handleToggleTask}
                />
              </CardContent>
            </Card>
            {/* Placeholder Agent Performance Widget */}
            <PlaceholderComponent title="Agent Performance" />
          </>
        );
        
      case 'pipelines':
        return (
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
        
      case 'tasks':
        return (
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
                 {/* Assuming TasksWidget can be used here too, maybe filter data? */}
                <TasksWidget tasks={[]} onToggleTask={handleToggleTask} /> 
              </CardContent>
            </Card>
          </>
        );
        
      case 'events':
        return (
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
        
      case 'calls':
        const mockCallsCompleted = 42; // Mock value
        const mockCallTarget = 100;  // Mock value
         return (
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
        
      case 'emails':
        return (
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
        
      default:
        return <PlaceholderComponent title={`Content for ${dashboardNames[dashboardType]}`} />;
    }
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
          <Button variant="outline" size="icon" onClick={() => refetch()} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Component
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Add New Component</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => alert('Adding KPI (not implemented)')}>
                <LayoutGrid className="mr-2 h-4 w-4" />
                <span>KPI / Stat</span>
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => alert('Adding Chart (not implemented)')}>
                <LineChart className="mr-2 h-4 w-4" />
                <span>Chart</span>
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => alert('Adding Target Meter (not implemented)')}>
                <Gauge className="mr-2 h-4 w-4" />
                <span>Target Meter</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 flex-grow">
        {renderDashboardContent()}
      </div>
    </div>
  );
};

export default Dashboard;