// User types
export interface User {
  id: number;
  username: string;
  name: string;
  email: string;
  role: string;
  profileImage?: string;
  createdAt: string;
}

// Client types
export interface Client {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  dateOfBirth?: string;
  occupation?: string;
  profileImage?: string;
  status: string;
  assignedAgentId?: number;
  createdAt: string;
}

// Policy types
export interface Policy {
  id: number;
  policyNumber: string;
  clientId: number;
  type: string;
  status: string;
  coverageAmount: number;
  premium: number;
  startDate: string;
  endDate?: string;
  renewalDate?: string;
  stage: string;
  underwritingStatus?: string;
  createdAt: string;
  client?: Client;
}

// Task types
export interface Task {
  id: number;
  title: string;
  description?: string;
  dueDate?: string;
  completed: boolean;
  assignedToId?: number;
  clientId?: number;
  policyId?: number;
  createdAt: string;
  client?: Client;
  policy?: Policy;
  assignedTo?: User;
}

// Activity types
export interface Activity {
  id: number;
  type: string;
  description: string;
  clientId?: number;
  policyId?: number;
  userId: number;
  date: string;
  client?: Client;
  policy?: Policy;
  user?: User;
}

// Pipeline types
export interface PipelineStage {
  id: string;
  name: string;
  policies: Policy[];
}

// Dashboard stat types
export interface StatCard {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  change: number;
  changeLabel: string;
  changeType: 'positive' | 'negative';
  bgColor: string;
  iconColor: string;
}

export interface PremiumRevenueData {
  month: string;
  revenue: number;
}

export interface PolicyStatusData {
  status: string;
  count: number;
  percentage: number;
  color: string;
}

export interface UpcomingRenewal {
  id: number;
  client: Client;
  policy: Policy;
}

export interface AgentPerformance {
  id: number;
  agent: User;
  policiesSold: number;
  premiumVolume: number;
  conversionRate: number;
  clientRetention: number;
  trend: 'up' | 'down' | 'stable';
}

export interface DashboardStats {
  revenueMTD: number;
  revenueChange: number;
  activePolicies: number;
  activePoliciesChange: number;
  pendingClaims: number;
  pendingClaimsChange: number;
  activeClients: number;
  activeClientsChange: number;
  premiumRevenue: PremiumRevenueData[];
  policyStatus: PolicyStatusData[];
  upcomingRenewals: UpcomingRenewal[];
  agentPerformance: AgentPerformance[];
}
