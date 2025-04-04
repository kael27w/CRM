import { 
  users, 
  clients, 
  policies, 
  tasks, 
  activities, 
  type User, 
  type InsertUser, 
  type Client, 
  type InsertClient, 
  type Policy, 
  type InsertPolicy, 
  type Task, 
  type InsertTask, 
  type Activity, 
  type InsertActivity 
} from "@shared/schema";
import { format, addDays } from 'date-fns';

// Sample data
const sampleUsers: User[] = [
  {
    id: 1,
    username: "a.davis",
    password: "password123",
    name: "Alex Davis",
    email: "a.davis@example.com",
    role: "administrator",
    profileImage: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
    createdAt: new Date().toISOString(),
  },
  {
    id: 2,
    username: "s.johnson",
    password: "password123",
    name: "Sarah Johnson",
    email: "s.johnson@example.com",
    role: "senior_agent",
    profileImage: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
    createdAt: new Date().toISOString(),
  },
  {
    id: 3,
    username: "m.rodriguez",
    password: "password123",
    name: "Michael Rodriguez",
    email: "m.rodriguez@example.com",
    role: "senior_agent",
    profileImage: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=4&w=256&h=256&q=60",
    createdAt: new Date().toISOString(),
  },
  {
    id: 4,
    username: "e.chen",
    password: "password123",
    name: "Emily Chen",
    email: "e.chen@example.com",
    role: "agent",
    profileImage: "https://images.unsplash.com/photo-1504703395950-b89145a5425b?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=4&w=256&h=256&q=60",
    createdAt: new Date().toISOString(),
  },
  {
    id: 5,
    username: "d.wilson",
    password: "password123",
    name: "David Wilson",
    email: "d.wilson@example.com",
    role: "agent",
    profileImage: "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=4&w=256&h=256&q=60",
    createdAt: new Date().toISOString(),
  },
];

const sampleClients: Client[] = [
  {
    id: 1,
    name: "Sarah Johnson",
    email: "sarah.j@example.com",
    phone: "(555) 123-4567",
    address: "123 Main St, Anytown, USA",
    dateOfBirth: new Date("1980-05-15").toISOString().split('T')[0],
    occupation: "Software Engineer",
    profileImage: "https://images.unsplash.com/photo-1494790108377-be9c29b29330",
    status: "active",
    assignedAgentId: 2,
    createdAt: new Date().toISOString(),
  },
  {
    id: 2,
    name: "Michael Rodriguez",
    email: "michael.r@example.com",
    phone: "(555) 234-5678",
    address: "456 Oak Ave, Somewhere, USA",
    dateOfBirth: new Date("1975-08-22").toISOString().split('T')[0],
    occupation: "Doctor",
    profileImage: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e",
    status: "active",
    assignedAgentId: 3,
    createdAt: new Date().toISOString(),
  },
  {
    id: 3,
    name: "Emily Chen",
    email: "emily.c@example.com",
    phone: "(555) 345-6789",
    address: "789 Pine Rd, Elsewhere, USA",
    dateOfBirth: new Date("1990-02-10").toISOString().split('T')[0],
    occupation: "Architect",
    profileImage: "https://images.unsplash.com/photo-1504703395950-b89145a5425b",
    status: "active",
    assignedAgentId: 4,
    createdAt: new Date().toISOString(),
  },
  {
    id: 4,
    name: "David Wilson",
    email: "david.w@example.com",
    phone: "(555) 456-7890",
    address: "101 Cedar Ln, Nowhere, USA",
    dateOfBirth: new Date("1985-11-30").toISOString().split('T')[0],
    occupation: "Financial Analyst",
    profileImage: "https://images.unsplash.com/photo-1519345182560-3f2917c472ef",
    status: "active",
    assignedAgentId: 5,
    createdAt: new Date().toISOString(),
  },
  {
    id: 5,
    name: "Jennifer Martinez",
    email: "jennifer.m@example.com",
    phone: "(555) 567-8901",
    address: "222 Elm Blvd, Anyplace, USA",
    dateOfBirth: new Date("1982-04-18").toISOString().split('T')[0],
    occupation: "Teacher",
    profileImage: "",
    status: "active",
    assignedAgentId: 2,
    createdAt: new Date().toISOString(),
  },
];

const futureDate = addDays(new Date(), 7);

const samplePolicies: Policy[] = [
  {
    id: 1,
    policyNumber: "TL-29845",
    clientId: 1,
    type: "term",
    status: "active",
    coverageAmount: 250000,
    premium: 450,
    startDate: new Date("2023-01-10").toISOString().split('T')[0],
    endDate: new Date("2038-01-10").toISOString().split('T')[0],
    renewalDate: futureDate.toISOString().split('T')[0],
    stage: "active",
    createdAt: new Date().toISOString(),
  },
  {
    id: 2,
    policyNumber: "UL-48762",
    clientId: 2,
    type: "universal",
    status: "active",
    coverageAmount: 500000,
    premium: 850,
    startDate: new Date("2022-09-20").toISOString().split('T')[0],
    renewalDate: addDays(futureDate, 2).toISOString().split('T')[0],
    stage: "active",
    createdAt: new Date().toISOString(),
  },
  {
    id: 3,
    policyNumber: "WL-67523",
    clientId: 3,
    type: "whole",
    status: "active",
    coverageAmount: 750000,
    premium: 1200,
    startDate: new Date("2022-06-15").toISOString().split('T')[0],
    renewalDate: addDays(futureDate, 3).toISOString().split('T')[0],
    stage: "active",
    createdAt: new Date().toISOString(),
  },
  {
    id: 4,
    policyNumber: "VL-39481",
    clientId: 4,
    type: "variable",
    status: "active",
    coverageAmount: 400000,
    premium: 650,
    startDate: new Date("2023-03-05").toISOString().split('T')[0],
    renewalDate: addDays(futureDate, 4).toISOString().split('T')[0],
    stage: "active",
    createdAt: new Date().toISOString(),
  },
  {
    id: 5,
    policyNumber: "TL-53297",
    clientId: 5,
    type: "term",
    status: "active",
    coverageAmount: 300000,
    premium: 520,
    startDate: new Date("2022-11-12").toISOString().split('T')[0],
    endDate: new Date("2037-11-12").toISOString().split('T')[0],
    renewalDate: addDays(futureDate, 5).toISOString().split('T')[0],
    stage: "active",
    createdAt: new Date().toISOString(),
  },
  {
    id: 6,
    policyNumber: "WL-61834",
    clientId: 1,
    type: "whole",
    status: "pending",
    coverageAmount: 200000,
    premium: 380,
    startDate: new Date().toISOString().split('T')[0],
    stage: "application",
    underwritingStatus: "pending_review",
    createdAt: new Date().toISOString(),
  },
  {
    id: 7,
    policyNumber: "TL-75208",
    clientId: 3,
    type: "term",
    status: "pending",
    coverageAmount: 350000,
    premium: 570,
    startDate: new Date().toISOString().split('T')[0],
    stage: "underwriting",
    underwritingStatus: "in_progress",
    createdAt: new Date().toISOString(),
  },
  {
    id: 8,
    policyNumber: "UL-92745",
    clientId: 4,
    type: "universal",
    status: "lapsed",
    coverageAmount: 450000,
    premium: 720,
    startDate: new Date("2021-07-25").toISOString().split('T')[0],
    endDate: new Date("2023-07-25").toISOString().split('T')[0],
    stage: "inactive",
    createdAt: new Date().toISOString(),
  },
];

const sampleTasks: Task[] = [
  {
    id: 1,
    title: "Call Jennifer about policy renewal",
    description: "Term Life Policy #TL-53297",
    dueDate: new Date().toISOString().split('T')[0],
    completed: false,
    assignedToId: 1,
    clientId: 5,
    policyId: 5,
    createdAt: new Date().toISOString(),
  },
  {
    id: 2,
    title: "Review underwriting report for Robert Thompson",
    description: "Application #APP-76523",
    dueDate: addDays(new Date(), 1).toISOString().split('T')[0],
    completed: false,
    assignedToId: 1,
    createdAt: new Date().toISOString(),
  },
  {
    id: 3,
    title: "Submit policy change forms for Williams family",
    description: "Whole Life Policy #WL-58219",
    dueDate: addDays(new Date(), 3).toISOString().split('T')[0],
    completed: false,
    assignedToId: 1,
    createdAt: new Date().toISOString(),
  },
  {
    id: 4,
    title: "Schedule annual review with Garcia family",
    description: "Multiple policies",
    dueDate: addDays(new Date(), 5).toISOString().split('T')[0],
    completed: false,
    assignedToId: 1,
    createdAt: new Date().toISOString(),
  },
  {
    id: 5,
    title: "Follow up on missing medical records",
    description: "Application #APP-89317",
    dueDate: addDays(new Date(), 7).toISOString().split('T')[0],
    completed: false,
    assignedToId: 1,
    createdAt: new Date().toISOString(),
  },
];

const sampleActivities: Activity[] = [
  {
    id: 1,
    type: "email",
    description: "Sent policy renewal reminder",
    clientId: 1,
    policyId: 1,
    userId: 2,
    date: new Date("2023-11-01T09:30:00").toISOString(),
  },
  {
    id: 2,
    type: "call",
    description: "Discussed coverage options",
    clientId: 2,
    policyId: 2,
    userId: 3,
    date: new Date("2023-10-28T14:15:00").toISOString(),
  },
  {
    id: 3,
    type: "meeting",
    description: "Annual policy review",
    clientId: 3,
    policyId: 3,
    userId: 4,
    date: new Date("2023-10-25T10:00:00").toISOString(),
  },
  {
    id: 4,
    type: "note",
    description: "Updated beneficiary information",
    clientId: 4,
    policyId: 4,
    userId: 5,
    date: new Date("2023-11-02T11:45:00").toISOString(),
  },
  {
    id: 5,
    type: "email",
    description: "Sent premium payment reminder",
    clientId: 5,
    policyId: 5,
    userId: 2,
    date: new Date("2023-10-30T16:20:00").toISOString(),
  },
];

// Storage interface with expanded methods
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  
  // Client methods
  getClient(id: number): Promise<Client | undefined>;
  getClients(): Promise<Client[]>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: number, data: Partial<Client>): Promise<Client | undefined>;
  
  // Policy methods
  getPolicy(id: number): Promise<Policy | undefined>;
  getPolicies(): Promise<Policy[]>;
  getPoliciesByClientId(clientId: number): Promise<Policy[]>;
  createPolicy(policy: InsertPolicy): Promise<Policy>;
  updatePolicy(id: number, data: Partial<Policy>): Promise<Policy | undefined>;
  updatePolicyStage(id: number, stage: string): Promise<Policy | undefined>;
  
  // Task methods
  getTask(id: number): Promise<Task | undefined>;
  getTasks(): Promise<Task[]>;
  getTasksByAssignedToId(userId: number): Promise<Task[]>;
  createTask(task: InsertTask): Promise<Task>;
  completeTask(id: number): Promise<Task | undefined>;
  
  // Activity methods
  getActivity(id: number): Promise<Activity | undefined>;
  getActivities(): Promise<Activity[]>;
  getActivitiesByClientId(clientId: number): Promise<Activity[]>;
  createActivity(activity: InsertActivity): Promise<Activity>;
  
  // Dashboard stats
  getDashboardStats(): Promise<any>;
  
  // Pipeline methods
  getPipelineStages(): Promise<any[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private clients: Map<number, Client>;
  private policies: Map<number, Policy>;
  private tasks: Map<number, Task>;
  private activities: Map<number, Activity>;
  private currentIds: {
    user: number;
    client: number;
    policy: number;
    task: number;
    activity: number;
  };

  constructor() {
    this.users = new Map();
    this.clients = new Map();
    this.policies = new Map();
    this.tasks = new Map();
    this.activities = new Map();
    
    this.currentIds = {
      user: 1,
      client: 1,
      policy: 1,
      task: 1,
      activity: 1,
    };
    
    // Initialize with sample data
    this.initializeSampleData();
  }

  private initializeSampleData() {
    // Add sample users
    sampleUsers.forEach(user => {
      this.users.set(user.id, user);
      this.currentIds.user = Math.max(this.currentIds.user, user.id + 1);
    });
    
    // Add sample clients
    sampleClients.forEach(client => {
      this.clients.set(client.id, client);
      this.currentIds.client = Math.max(this.currentIds.client, client.id + 1);
    });
    
    // Add sample policies
    samplePolicies.forEach(policy => {
      this.policies.set(policy.id, policy);
      this.currentIds.policy = Math.max(this.currentIds.policy, policy.id + 1);
    });
    
    // Add sample tasks
    sampleTasks.forEach(task => {
      this.tasks.set(task.id, task);
      this.currentIds.task = Math.max(this.currentIds.task, task.id + 1);
    });
    
    // Add sample activities
    sampleActivities.forEach(activity => {
      this.activities.set(activity.id, activity);
      this.currentIds.activity = Math.max(this.currentIds.activity, activity.id + 1);
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async getUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentIds.user++;
    const user: User = { ...insertUser, id, createdAt: new Date().toISOString() };
    this.users.set(id, user);
    return user;
  }
  
  // Client methods
  async getClient(id: number): Promise<Client | undefined> {
    return this.clients.get(id);
  }

  async getClients(): Promise<Client[]> {
    return Array.from(this.clients.values());
  }

  async createClient(insertClient: InsertClient): Promise<Client> {
    const id = this.currentIds.client++;
    const client: Client = { ...insertClient, id, createdAt: new Date().toISOString() };
    this.clients.set(id, client);
    return client;
  }

  async updateClient(id: number, data: Partial<Client>): Promise<Client | undefined> {
    const client = this.clients.get(id);
    if (!client) return undefined;
    
    const updatedClient = { ...client, ...data };
    this.clients.set(id, updatedClient);
    return updatedClient;
  }
  
  // Policy methods
  async getPolicy(id: number): Promise<Policy | undefined> {
    return this.policies.get(id);
  }

  async getPolicies(): Promise<Policy[]> {
    return Array.from(this.policies.values());
  }

  async getPoliciesByClientId(clientId: number): Promise<Policy[]> {
    return Array.from(this.policies.values()).filter(
      policy => policy.clientId === clientId
    );
  }

  async createPolicy(insertPolicy: InsertPolicy): Promise<Policy> {
    const id = this.currentIds.policy++;
    const policy: Policy = { ...insertPolicy, id, createdAt: new Date().toISOString() };
    this.policies.set(id, policy);
    return policy;
  }

  async updatePolicy(id: number, data: Partial<Policy>): Promise<Policy | undefined> {
    const policy = this.policies.get(id);
    if (!policy) return undefined;
    
    const updatedPolicy = { ...policy, ...data };
    this.policies.set(id, updatedPolicy);
    return updatedPolicy;
  }

  async updatePolicyStage(id: number, stage: string): Promise<Policy | undefined> {
    const policy = this.policies.get(id);
    if (!policy) return undefined;
    
    const updatedPolicy = { ...policy, stage };
    this.policies.set(id, updatedPolicy);
    return updatedPolicy;
  }
  
  // Task methods
  async getTask(id: number): Promise<Task | undefined> {
    return this.tasks.get(id);
  }

  async getTasks(): Promise<Task[]> {
    return Array.from(this.tasks.values());
  }

  async getTasksByAssignedToId(userId: number): Promise<Task[]> {
    return Array.from(this.tasks.values()).filter(
      task => task.assignedToId === userId
    );
  }

  async createTask(insertTask: InsertTask): Promise<Task> {
    const id = this.currentIds.task++;
    const task: Task = { ...insertTask, id, createdAt: new Date().toISOString() };
    this.tasks.set(id, task);
    return task;
  }

  async completeTask(id: number): Promise<Task | undefined> {
    const task = this.tasks.get(id);
    if (!task) return undefined;
    
    const updatedTask = { ...task, completed: true };
    this.tasks.set(id, updatedTask);
    return updatedTask;
  }
  
  // Activity methods
  async getActivity(id: number): Promise<Activity | undefined> {
    return this.activities.get(id);
  }

  async getActivities(): Promise<Activity[]> {
    return Array.from(this.activities.values());
  }

  async getActivitiesByClientId(clientId: number): Promise<Activity[]> {
    return Array.from(this.activities.values()).filter(
      activity => activity.clientId === clientId
    );
  }

  async createActivity(insertActivity: InsertActivity): Promise<Activity> {
    const id = this.currentIds.activity++;
    const activity: Activity = { ...insertActivity, id };
    this.activities.set(id, activity);
    return activity;
  }
  
  // Dashboard stats
  async getDashboardStats(): Promise<any> {
    const policies = Array.from(this.policies.values());
    const totalPolicies = policies.length;
    const activePolicies = policies.filter(p => p.status === 'active').length;
    const premiumRevenue = [
      { month: 'Jan', revenue: 120000 },
      { month: 'Feb', revenue: 140000 },
      { month: 'Mar', revenue: 130000 },
      { month: 'Apr', revenue: 170000 },
      { month: 'May', revenue: 190000 },
      { month: 'Jun', revenue: 210000 },
      { month: 'Jul', revenue: 230000 },
      { month: 'Aug', revenue: 200000 },
      { month: 'Sep', revenue: 240000 },
      { month: 'Oct', revenue: 250000 },
      { month: 'Nov', revenue: 270000 },
      { month: 'Dec', revenue: 290000 },
    ];
    
    const policyStatus = [
      { status: 'Active', count: activePolicies, percentage: Math.round((activePolicies / totalPolicies) * 100), color: '#3B82F6' },
      { status: 'Paid-up', count: Math.floor(totalPolicies * 0.21), percentage: 21, color: '#10B981' },
      { status: 'Pending', count: Math.floor(totalPolicies * 0.14), percentage: 14, color: '#F59E0B' },
      { status: 'Lapsed', count: Math.floor(totalPolicies * 0.08), percentage: 8, color: '#EF4444' },
      { status: 'Other', count: Math.floor(totalPolicies * 0.03), percentage: 3, color: '#8B5CF6' },
    ];
    
    // Get upcoming renewals
    const upcomingRenewals = await this.getUpcomingRenewals();
    
    // Get agent performance data
    const agentPerformance = await this.getAgentPerformance();
    
    return {
      revenueMTD: 542897,
      revenueChange: 18.2,
      activePolicies: 2874,
      activePoliciesChange: 7.4,
      pendingClaims: 43,
      pendingClaimsChange: 12.5,
      activeClients: 1429,
      activeClientsChange: 4.1,
      premiumRevenue,
      policyStatus,
      upcomingRenewals,
      agentPerformance,
    };
  }
  
  // Helper methods for dashboard stats
  private async getUpcomingRenewals(): Promise<any[]> {
    const policies = Array.from(this.policies.values());
    const renewals = policies
      .filter(policy => policy.renewalDate)
      .sort((a, b) => {
        const dateA = new Date(a.renewalDate!).getTime();
        const dateB = new Date(b.renewalDate!).getTime();
        return dateA - dateB;
      })
      .slice(0, 4);
    
    // Add client data to each renewal
    const result = [];
    for (const policy of renewals) {
      const client = await this.getClient(policy.clientId);
      if (client) {
        result.push({
          id: policy.id,
          client,
          policy
        });
      }
    }
    
    return result;
  }
  
  private async getAgentPerformance(): Promise<any[]> {
    const agents = [
      {
        id: 1,
        agent: sampleUsers[1], // Sarah Johnson
        policiesSold: 42,
        premiumVolume: 1245300,
        conversionRate: 68,
        clientRetention: 97,
        trend: 'up'
      },
      {
        id: 2,
        agent: sampleUsers[2], // Michael Rodriguez
        policiesSold: 38,
        premiumVolume: 1087650,
        conversionRate: 62,
        clientRetention: 94,
        trend: 'stable'
      },
      {
        id: 3,
        agent: sampleUsers[3], // Emily Chen
        policiesSold: 31,
        premiumVolume: 876200,
        conversionRate: 59,
        clientRetention: 91,
        trend: 'up'
      },
      {
        id: 4,
        agent: sampleUsers[4], // David Wilson
        policiesSold: 27,
        premiumVolume: 754800,
        conversionRate: 53,
        clientRetention: 86,
        trend: 'down'
      }
    ];
    
    return agents;
  }
  
  // Pipeline methods
  async getPipelineStages(): Promise<any[]> {
    const policies = Array.from(this.policies.values());
    
    // Define pipeline stages
    const stages = [
      { id: 'lead', name: 'Lead', policies: [] },
      { id: 'application', name: 'Application', policies: [] },
      { id: 'underwriting', name: 'Underwriting', policies: [] },
      { id: 'approved', name: 'Approved', policies: [] },
      { id: 'active', name: 'Active', policies: [] },
      { id: 'inactive', name: 'Inactive', policies: [] },
    ];
    
    // Populate stages with policies
    for (const policy of policies) {
      const stageIndex = stages.findIndex(stage => stage.id === policy.stage);
      if (stageIndex !== -1) {
        // Get client data for each policy
        const client = await this.getClient(policy.clientId);
        if (client) {
          stages[stageIndex].policies.push({
            ...policy,
            client
          });
        } else {
          stages[stageIndex].policies.push(policy);
        }
      } else {
        // Default to 'lead' stage if not specified
        const client = await this.getClient(policy.clientId);
        if (client) {
          stages[0].policies.push({
            ...policy,
            client
          });
        } else {
          stages[0].policies.push(policy);
        }
      }
    }
    
    return stages;
  }
}

export const storage = new MemStorage();
