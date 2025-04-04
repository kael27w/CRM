import React from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { queryClient } from '@/lib/queryClient';
import { DashboardStats, Task } from '@/types';
import { 
  CircleDollarSign, 
  ShieldCheck, 
  Wallet, 
  Users 
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils/format-currency';
import StatCard from '@/components/dashboard/stat-card';
import PremiumRevenueChart from '@/components/dashboard/premium-revenue-chart';
import PolicyStatusChart from '@/components/dashboard/policy-status-chart';
import UpcomingRenewals from '@/components/dashboard/upcoming-renewals';
import TasksWidget from '@/components/dashboard/tasks-widget';
import AgentPerformance from '@/components/dashboard/agent-performance';

const Dashboard: React.FC = () => {
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

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Overview of your insurance business performance</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="col-span-1 lg:col-span-3 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat, index) => (
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

        <div className="col-span-1">
          <UpcomingRenewals renewals={dashboardData.upcomingRenewals} />
        </div>

        <div className="col-span-1">
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

        <div className="col-span-1 lg:col-span-3">
          <AgentPerformance agents={dashboardData.agentPerformance} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
