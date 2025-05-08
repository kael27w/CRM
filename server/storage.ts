// This file intentionally left empty per build requirements
// Storage functionality is now handled by Supabase

// Dummy storage object to prevent import errors
export const storage = {
  // User methods
  getUser: async (id: number) => undefined,
  getUserByUsername: async (username: string) => undefined,
  getUsers: async () => [],
  createUser: async (user: any) => ({ ...user, id: 1 }),
  
  // Client methods
  getClient: async (id: number) => undefined,
  getClients: async () => [],
  createClient: async (client: any) => ({ ...client, id: 1 }),
  updateClient: async (id: number, data: any) => undefined,
  
  // Policy methods
  getPolicy: async (id: number) => undefined,
  getPolicies: async () => [],
  getPoliciesByClientId: async (clientId: number) => [],
  createPolicy: async (policy: any) => ({ ...policy, id: 1 }),
  updatePolicy: async (id: number, data: any) => undefined,
  updatePolicyStage: async (id: number, stage: string) => undefined,
  
  // Task methods
  getTask: async (id: number) => undefined,
  getTasks: async () => [],
  getTasksByAssignedToId: async (userId: number) => [],
  createTask: async (task: any) => ({ ...task, id: 1 }),
  completeTask: async (id: number) => undefined,
  
  // Activity methods
  getActivity: async (id: number) => undefined,
  getActivities: async () => [],
  getActivitiesByClientId: async (clientId: number) => [],
  createActivity: async (activity: any) => ({ ...activity, id: 1 }),
  
  // Dashboard stats
  getDashboardStats: async () => ({}),
  
  // Pipeline methods
  getPipelineStages: async () => []
};
