import React, { useState, useEffect } from 'react';
import { useLocation, useRoute } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { queryClient } from '@/lib/queryClient';
import { DashboardStats, Task } from '@/types';
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
  RefreshCw
} from 'lucide-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { formatCurrency } from '@/lib/utils/format-currency';
import StatCard from '@/components/dashboard/stat-card';
import PremiumRevenueChart from '@/components/dashboard/premium-revenue-chart';
import PolicyStatusChart from '@/components/dashboard/policy-status-chart';
import UpcomingRenewals from '@/components/dashboard/upcoming-renewals';
import TasksWidget from '@/components/dashboard/tasks-widget';
import AgentPerformance from '@/components/dashboard/agent-performance';

// Types for dashboard views
type DashboardType = 'overview' | 'pipelines' | 'tasks' | 'events' | 'calls' | 'emails';

// Type for target meter component
interface TargetMeterProps {
  current: number;
  target: number;
  title: string;
  unit?: string;
}

// Target Meter Component
const TargetMeter: React.FC<TargetMeterProps> = ({ current, target, title, unit = '' }) => {
  const percentage = Math.min(Math.round((current / target) * 100), 100);
  const remaining = target - current;
  
  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-5">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h3>
        <Target className="h-5 w-5 text-slate-400" />
      </div>
      
      <div className="relative h-28 w-full flex justify-center items-center">
        {/* The semi-circular gauge oriented upwards */}
        <div className="absolute w-40 h-40 -top-20 overflow-hidden">
          {/* Background arc */}
          <div 
            className="absolute w-40 h-40 rounded-full border-[16px] border-slate-100 dark:border-slate-700"
            style={{ 
              clipPath: 'polygon(0 50%, 100% 50%, 100% 0, 0 0)',
              transform: 'rotate(180deg)'
            }}
          ></div>
          {/* Progress arc */}
          <div 
            className="absolute w-40 h-40 rounded-full border-[16px] border-blue-500 dark:border-blue-600"
            style={{ 
              clipPath: `polygon(0 50%, 100% 50%, 100% ${50 - percentage/2}%, 0% ${50 - percentage/2}%)`,
              transform: 'rotate(180deg)'
            }}
          ></div>
        </div>
        
        {/* Central text display */}
        <div className="text-center mt-2">
          <div className="text-3xl font-bold text-slate-900 dark:text-white">{current}</div>
          <div className="text-sm text-slate-500">/ {target} Target</div>
          <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            <span className="font-medium text-blue-600 dark:text-blue-400">{remaining}</span> remaining to target
          </div>
        </div>
      </div>
    </div>
  );
};

const Dashboard: React.FC = () => {
  // Get current dashboard type from route or default to overview
  const [, params] = useRoute('/dashboard/:type');
  const [, setLocation] = useLocation();
  const [dashboardType, setDashboardType] = useState<DashboardType>(
    (params?.type as DashboardType) || 'overview'
  );
  
  // Update URL when dashboard type changes
  useEffect(() => {
    setLocation(`/dashboard/${dashboardType}`);
  }, [dashboardType, setLocation]);
  
  // Handle dashboard type change from dropdown
  const handleDashboardChange = (type: DashboardType) => {
    setDashboardType(type);
  };
  
  const { data: dashboardData, isLoading } = useQuery<DashboardStats>({
    queryKey: ['/api/stats/dashboard'],
  });

  const completeTaskMutation = useMutation({
    mutationFn: async ({ id, completed }: { id: number, completed: boolean }) => {
      if (completed) {
        const response = await apiRequest('PATCH', `/api/tasks/${id}/complete`, {});
        return response.json();
      }
      return null;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/stats/dashboard'] });
    }
  });

  const handleToggleTask = (id: number, completed: boolean) => {
    completeTaskMutation.mutate({ id, completed });
  };
  
  // Dashboard Type to Display Name mapping
  const dashboardNames: Record<DashboardType, string> = {
    'overview': 'Overview',
    'pipelines': 'Pipelines Dashboard',
    'tasks': 'Tasks Dashboard',
    'events': 'Events Dashboard',
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

  if (!dashboardData) {
    return <div>Error loading dashboard data</div>;
  }

  const statCards = [
    {
      title: "Revenue MTD",
      value: formatCurrency(dashboardData.revenueMTD),
      icon: <CircleDollarSign className="h-6 w-6 text-blue-600" />,
      change: dashboardData.revenueChange,
      changeLabel: "vs last month",
      changeType: dashboardData.revenueChange >= 0 ? 'positive' as const : 'negative' as const,
      bgColor: "bg-blue-50 dark:bg-blue-900/20",
      iconColor: "text-blue-600 dark:text-blue-400"
    },
    {
      title: "Active Policies",
      value: dashboardData.activePolicies,
      icon: <ShieldCheck className="h-6 w-6 text-emerald-600" />,
      change: dashboardData.activePoliciesChange,
      changeLabel: "vs last month",
      changeType: dashboardData.activePoliciesChange >= 0 ? 'positive' as const : 'negative' as const,
      bgColor: "bg-emerald-50 dark:bg-emerald-900/20",
      iconColor: "text-emerald-600 dark:text-emerald-400"
    },
    {
      title: "Pending Claims",
      value: dashboardData.pendingClaims,
      icon: <Wallet className="h-6 w-6 text-amber-600" />,
      change: Math.abs(dashboardData.pendingClaimsChange),
      changeLabel: "vs last month",
      changeType: dashboardData.pendingClaimsChange <= 0 ? 'positive' as const : 'negative' as const,
      bgColor: "bg-amber-50 dark:bg-amber-900/20",
      iconColor: "text-amber-600 dark:text-amber-400"
    },
    {
      title: "Active Clients",
      value: dashboardData.activeClients,
      icon: <Users className="h-6 w-6 text-indigo-600" />,
      change: dashboardData.activeClientsChange,
      changeLabel: "vs last month",
      changeType: dashboardData.activeClientsChange >= 0 ? 'positive' as const : 'negative' as const,
      bgColor: "bg-indigo-50 dark:bg-indigo-900/20",
      iconColor: "text-indigo-600 dark:text-indigo-400"
    }
  ];

  // Mock data for different dashboard types
  const contactsCreated = 28;
  const pipelinesWon = 12;
  const pipelinesLost = 5;
  const tasksCompleted = 34;
  const eventsCompleted = 16;
  const callsCompleted = 42;
  
  // Define dashboard components based on current dashboard type
  const renderDashboardContent = () => {
    // Define stat cards for each dashboard type
    const getStatCards = () => {
      switch(dashboardType) {
        case 'overview':
          return [
            {
              title: "Contacts Created",
              value: contactsCreated,
              icon: <Users className="h-6 w-6 text-blue-600" />,
              change: 15,
              changeLabel: "vs last month",
              changeType: 'positive' as const,
              bgColor: "bg-blue-50 dark:bg-blue-900/20",
              iconColor: "text-blue-600 dark:text-blue-400"
            },
            {
              title: "Pipelines Won/Lost",
              value: `${pipelinesWon}/${pipelinesLost}`,
              icon: <BarChart2 className="h-6 w-6 text-emerald-600" />,
              change: 8,
              changeLabel: "vs last month",
              changeType: 'positive' as const,
              bgColor: "bg-emerald-50 dark:bg-emerald-900/20",
              iconColor: "text-emerald-600 dark:text-emerald-400"
            },
            {
              title: "Tasks Closed",
              value: tasksCompleted,
              icon: <CheckCircle2 className="h-6 w-6 text-amber-600" />,
              change: 5,
              changeLabel: "vs last month",
              changeType: 'positive' as const,
              bgColor: "bg-amber-50 dark:bg-amber-900/20",
              iconColor: "text-amber-600 dark:text-amber-400"
            },
            {
              title: "Events Completed",
              value: eventsCompleted,
              icon: <Calendar className="h-6 w-6 text-indigo-600" />,
              change: -3,
              changeLabel: "vs last month",
              changeType: 'negative' as const,
              bgColor: "bg-indigo-50 dark:bg-indigo-900/20",
              iconColor: "text-indigo-600 dark:text-indigo-400"
            }
          ];
          
        case 'pipelines':
          return [
            {
              title: "Open Deals Value",
              value: formatCurrency(485000),
              icon: <CircleDollarSign className="h-6 w-6 text-blue-600" />,
              change: 12,
              changeLabel: "vs last month",
              changeType: 'positive' as const,
              bgColor: "bg-blue-50 dark:bg-blue-900/20",
              iconColor: "text-blue-600 dark:text-blue-400"
            },
            {
              title: "Avg Deal Size",
              value: formatCurrency(48500),
              icon: <BarChart2 className="h-6 w-6 text-emerald-600" />,
              change: 8,
              changeLabel: "vs last month",
              changeType: 'positive' as const,
              bgColor: "bg-emerald-50 dark:bg-emerald-900/20",
              iconColor: "text-emerald-600 dark:text-emerald-400"
            },
            {
              title: "Win Rate",
              value: "32%",
              icon: <Target className="h-6 w-6 text-amber-600" />,
              change: -2,
              changeLabel: "vs last month",
              changeType: 'negative' as const,
              bgColor: "bg-amber-50 dark:bg-amber-900/20",
              iconColor: "text-amber-600 dark:text-amber-400"
            }
          ];
          
        case 'tasks':
          return [
            {
              title: "Open Tasks",
              value: 24,
              icon: <CheckCircle2 className="h-6 w-6 text-blue-600" />,
              change: -5,
              changeLabel: "vs last month",
              changeType: 'negative' as const,
              bgColor: "bg-blue-50 dark:bg-blue-900/20",
              iconColor: "text-blue-600 dark:text-blue-400"
            },
            {
              title: "Overdue Tasks",
              value: 8,
              icon: <CheckCircle2 className="h-6 w-6 text-red-600" />,
              change: 2,
              changeLabel: "vs last month",
              changeType: 'negative' as const,
              bgColor: "bg-red-50 dark:bg-red-900/20",
              iconColor: "text-red-600 dark:text-red-400"
            },
            {
              title: "Completed Today",
              value: 7,
              icon: <CheckCircle2 className="h-6 w-6 text-emerald-600" />,
              change: 3,
              changeLabel: "vs yesterday",
              changeType: 'positive' as const,
              bgColor: "bg-emerald-50 dark:bg-emerald-900/20",
              iconColor: "text-emerald-600 dark:text-emerald-400"
            },
            {
              title: "Completed This Week",
              value: 34,
              icon: <CheckCircle2 className="h-6 w-6 text-amber-600" />,
              change: 12,
              changeLabel: "vs last week",
              changeType: 'positive' as const,
              bgColor: "bg-amber-50 dark:bg-amber-900/20",
              iconColor: "text-amber-600 dark:text-amber-400"
            }
          ];
          
        case 'events':
          return [
            {
              title: "Upcoming Events",
              value: 15,
              icon: <Calendar className="h-6 w-6 text-blue-600" />,
              change: 5,
              changeLabel: "vs last month",
              changeType: 'positive' as const,
              bgColor: "bg-blue-50 dark:bg-blue-900/20",
              iconColor: "text-blue-600 dark:text-blue-400"
            },
            {
              title: "Events This Week",
              value: 8,
              icon: <Calendar className="h-6 w-6 text-emerald-600" />,
              change: 2,
              changeLabel: "vs last week",
              changeType: 'positive' as const,
              bgColor: "bg-emerald-50 dark:bg-emerald-900/20",
              iconColor: "text-emerald-600 dark:text-emerald-400"
            },
            {
              title: "Completed Events",
              value: 16,
              icon: <Calendar className="h-6 w-6 text-amber-600" />,
              change: 4,
              changeLabel: "vs last month",
              changeType: 'positive' as const,
              bgColor: "bg-amber-50 dark:bg-amber-900/20",
              iconColor: "text-amber-600 dark:text-amber-400"
            }
          ];
          
        case 'calls':
          return [
            {
              title: "Calls Made Today",
              value: 18,
              icon: <PhoneCall className="h-6 w-6 text-blue-600" />,
              change: 8,
              changeLabel: "vs yesterday",
              changeType: 'positive' as const,
              bgColor: "bg-blue-50 dark:bg-blue-900/20",
              iconColor: "text-blue-600 dark:text-blue-400"
            },
            {
              title: "Calls Made This Week",
              value: 78,
              icon: <PhoneCall className="h-6 w-6 text-emerald-600" />,
              change: 15,
              changeLabel: "vs last week",
              changeType: 'positive' as const,
              bgColor: "bg-emerald-50 dark:bg-emerald-900/20",
              iconColor: "text-emerald-600 dark:text-emerald-400"
            },
            {
              title: "Avg Call Duration",
              value: "12:24",
              icon: <PhoneCall className="h-6 w-6 text-amber-600" />,
              change: -2,
              changeLabel: "vs last month",
              changeType: 'positive' as const,
              bgColor: "bg-amber-50 dark:bg-amber-900/20",
              iconColor: "text-amber-600 dark:text-amber-400"
            }
          ];
          
        case 'emails':
          return [
            {
              title: "Emails Sent",
              value: 145,
              icon: <Mail className="h-6 w-6 text-blue-600" />,
              change: 32,
              changeLabel: "vs last month",
              changeType: 'positive' as const,
              bgColor: "bg-blue-50 dark:bg-blue-900/20",
              iconColor: "text-blue-600 dark:text-blue-400"
            },
            {
              title: "Open Rate",
              value: "68%",
              icon: <Mail className="h-6 w-6 text-emerald-600" />,
              change: 5,
              changeLabel: "vs last month",
              changeType: 'positive' as const,
              bgColor: "bg-emerald-50 dark:bg-emerald-900/20",
              iconColor: "text-emerald-600 dark:text-emerald-400"
            },
            {
              title: "Click-Through Rate",
              value: "24%",
              icon: <Mail className="h-6 w-6 text-amber-600" />,
              change: 3,
              changeLabel: "vs last month",
              changeType: 'positive' as const,
              bgColor: "bg-amber-50 dark:bg-amber-900/20",
              iconColor: "text-amber-600 dark:text-amber-400"
            }
          ];
          
        default:
          return statCards;
      }
    };
    
    // Get charts and widgets for each dashboard type
    switch(dashboardType) {
      case 'overview':
        return (
          <>
            <div className="col-span-1 lg:col-span-3 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {getStatCards().map((stat, index) => (
                <StatCard key={index} stat={stat} />
              ))}
            </div>
            
            <div className="col-span-1 lg:col-span-2">
              <PremiumRevenueChart data={dashboardData.premiumRevenue} />
            </div>
            
            <div className="col-span-1">
              <PolicyStatusChart 
                data={dashboardData.policyStatus} 
                totalPolicies={dashboardData.activePolicies} 
              />
            </div>
            
            <div className="col-span-1 lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6">
              <TasksWidget 
                tasks={dashboardData.upcomingRenewals.map(renewal => ({
                  id: renewal.id,
                  title: `Call ${renewal.client.name} about policy renewal`,
                  description: `${renewal.policy.type} Policy #${renewal.policy.policyNumber}`,
                  dueDate: renewal.policy.renewalDate!,
                  completed: false,
                  assignedToId: 1, // Current user
                  clientId: renewal.client.id,
                  policyId: renewal.policy.id,
                  createdAt: new Date().toISOString(),
                } as Task))} 
                onToggleTask={handleToggleTask}
              />
              <TargetMeter 
                current={callsCompleted} 
                target={50} 
                title="Number of Calls" 
              />
            </div>
          </>
        );
        
      case 'pipelines':
        return (
          <>
            <div className="col-span-1 lg:col-span-3 grid grid-cols-1 gap-6 sm:grid-cols-3 lg:grid-cols-3">
              {getStatCards().map((stat, index) => (
                <StatCard key={index} stat={stat} />
              ))}
            </div>
            
            <div className="col-span-1 lg:col-span-2">
              <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-5">
                <h3 className="text-lg font-semibold mb-4">Deals Won vs Lost</h3>
                <div className="h-60 flex items-center justify-center">
                  <div className="text-center text-slate-500">
                    Chart: Deals Won vs Lost visualization
                  </div>
                </div>
              </div>
            </div>
            
            <div className="col-span-1">
              <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-5">
                <h3 className="text-lg font-semibold mb-4">Pipeline Conversion</h3>
                <div className="h-60 flex items-center justify-center">
                  <div className="text-center text-slate-500">
                    Chart: Pipeline Conversion visualization
                  </div>
                </div>
              </div>
            </div>
            
            <div className="col-span-1 lg:col-span-3">
              <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-5">
                <h3 className="text-lg font-semibold mb-4">Open Deals Value by Stage</h3>
                <div className="h-60 flex items-center justify-center">
                  <div className="text-center text-slate-500">
                    Chart: Open Deals Value by Stage visualization
                  </div>
                </div>
              </div>
            </div>
          </>
        );
        
      case 'tasks':
        return (
          <>
            <div className="col-span-1 lg:col-span-3 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {getStatCards().map((stat, index) => (
                <StatCard key={index} stat={stat} />
              ))}
            </div>
            
            <div className="col-span-1 lg:col-span-2">
              <TasksWidget 
                tasks={dashboardData.upcomingRenewals.map(renewal => ({
                  id: renewal.id,
                  title: `Call ${renewal.client.name} about policy renewal`,
                  description: `${renewal.policy.type} Policy #${renewal.policy.policyNumber}`,
                  dueDate: renewal.policy.renewalDate!,
                  completed: false,
                  assignedToId: 1, // Current user
                  clientId: renewal.client.id,
                  policyId: renewal.policy.id,
                  createdAt: new Date().toISOString(),
                } as Task))} 
                onToggleTask={handleToggleTask}
              />
            </div>
            
            <div className="col-span-1">
              <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-5">
                <h3 className="text-lg font-semibold mb-4">Tasks by Priority</h3>
                <div className="h-60 flex items-center justify-center">
                  <div className="text-center text-slate-500">
                    Chart: Tasks by Priority visualization
                  </div>
                </div>
              </div>
            </div>
          </>
        );
        
      case 'events':
        return (
          <>
            <div className="col-span-1 lg:col-span-3 grid grid-cols-1 gap-6 sm:grid-cols-3 lg:grid-cols-3">
              {getStatCards().map((stat, index) => (
                <StatCard key={index} stat={stat} />
              ))}
            </div>
            
            <div className="col-span-1 lg:col-span-2">
              <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-5">
                <h3 className="text-lg font-semibold mb-4">My Upcoming Events</h3>
                <div className="h-60 flex items-center justify-center">
                  <div className="text-center text-slate-500">
                    List: Upcoming Events
                  </div>
                </div>
              </div>
            </div>
            
            <div className="col-span-1">
              <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-5">
                <h3 className="text-lg font-semibold mb-4">Events by Type</h3>
                <div className="h-60 flex items-center justify-center">
                  <div className="text-center text-slate-500">
                    Chart: Events by Type visualization
                  </div>
                </div>
              </div>
            </div>
          </>
        );
        
      case 'calls':
        return (
          <>
            <div className="col-span-1 lg:col-span-3 grid grid-cols-1 gap-6 sm:grid-cols-3 lg:grid-cols-3">
              {getStatCards().map((stat, index) => (
                <StatCard key={index} stat={stat} />
              ))}
            </div>
            
            <div className="col-span-1">
              <TargetMeter 
                current={42} 
                target={50} 
                title="Number of Calls" 
              />
            </div>
            
            <div className="col-span-1 lg:col-span-2">
              <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-5">
                <h3 className="text-lg font-semibold mb-4">Call Volume</h3>
                <div className="h-60 flex items-center justify-center">
                  <div className="text-center text-slate-500">
                    Chart: Call Volume Over Time
                  </div>
                </div>
              </div>
            </div>
            
            <div className="col-span-1 lg:col-span-3">
              <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-5">
                <h3 className="text-lg font-semibold mb-4">Calls by Outcome</h3>
                <div className="h-60 flex items-center justify-center">
                  <div className="text-center text-slate-500">
                    Chart: Calls by Outcome visualization
                  </div>
                </div>
              </div>
            </div>
          </>
        );
        
      case 'emails':
        return (
          <>
            <div className="col-span-1 lg:col-span-3 grid grid-cols-1 gap-6 sm:grid-cols-3 lg:grid-cols-3">
              {getStatCards().map((stat, index) => (
                <StatCard key={index} stat={stat} />
              ))}
            </div>
            
            <div className="col-span-1 lg:col-span-2">
              <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-5">
                <h3 className="text-lg font-semibold mb-4">Emails Sent Over Time</h3>
                <div className="h-60 flex items-center justify-center">
                  <div className="text-center text-slate-500">
                    Chart: Emails Over Time visualization
                  </div>
                </div>
              </div>
            </div>
            
            <div className="col-span-1">
              <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-5">
                <h3 className="text-lg font-semibold mb-4">Top Performing Templates</h3>
                <div className="h-60 flex items-center justify-center">
                  <div className="text-center text-slate-500">
                    List: Top Performing Email Templates
                  </div>
                </div>
              </div>
            </div>
          </>
        );
        
      default:
        return null;
    }
  };
  
  return (
    <div>
      <div className="mb-6 flex flex-wrap justify-between items-center">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
          
          {/* Dashboard Selector Dropdown - Moved to header */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="min-w-[150px] justify-between">
                {dashboardNames[dashboardType]}
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuLabel>Dashboard Views</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleDashboardChange('overview')}>
                Overview
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDashboardChange('pipelines')}>
                Pipelines Dashboard
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDashboardChange('tasks')}>
                Tasks Dashboard
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDashboardChange('events')}>
                Events Dashboard
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDashboardChange('calls')}>
                Call Analytics
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDashboardChange('emails')}>
                Email Analytics
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-blue-600 flex items-center">
                <Plus className="mr-2 h-4 w-4" /> New Dashboard
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <p className="hidden md:block mt-1 text-sm text-slate-500 dark:text-slate-400">
            {dashboardType === 'overview' ? 'Overview of your business performance' : 
             `View your ${dashboardType} performance metrics`}
          </p>
        </div>
        
        <div className="flex items-center space-x-2 mt-4 sm:mt-0">
          {/* Reload Button */}
          <Button variant="outline" size="icon">
            <RefreshCw className="h-4 w-4" />
          </Button>
          
          {/* Add Component Button with Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Plus className="mr-2 h-4 w-4" /> Component
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Add Component</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="flex items-center cursor-pointer">
                <BarChart2 className="mr-2 h-4 w-4 text-blue-500" />
                <span>KPI Box</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex items-center cursor-pointer">
                <Target className="mr-2 h-4 w-4 text-emerald-500" />
                <span>Target Meter</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex items-center cursor-pointer">
                <BarChart2 className="mr-2 h-4 w-4 text-purple-500" />
                <span>Chart</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex items-center cursor-pointer">
                <CheckCircle2 className="mr-2 h-4 w-4 text-amber-500" />
                <span>List Widget</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {renderDashboardContent()}
      </div>
    </div>
  );
};

export default Dashboard;
