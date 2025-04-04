import { pgTable, text, serial, integer, boolean, json, timestamp, uuid, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User model
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  role: text("role").notNull().default("agent"),
  profileImage: text("profile_image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Client model
export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  dateOfBirth: date("date_of_birth"),
  occupation: text("occupation"),
  profileImage: text("profile_image"),
  status: text("status").notNull().default("active"),
  assignedAgentId: integer("assigned_agent_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Policy model
export const policies = pgTable("policies", {
  id: serial("id").primaryKey(),
  policyNumber: text("policy_number").notNull().unique(),
  clientId: integer("client_id").references(() => clients.id).notNull(),
  type: text("type").notNull(), // e.g., 'term', 'whole', 'universal', 'variable'
  status: text("status").notNull(), // e.g., 'active', 'pending', 'lapsed', 'paid-up'
  coverageAmount: integer("coverage_amount").notNull(),
  premium: integer("premium").notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date"),
  renewalDate: date("renewal_date"),
  stage: text("stage").default("active"), // For pipeline view
  underwritingStatus: text("underwriting_status"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Task model
export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  dueDate: date("due_date"),
  completed: boolean("completed").default(false),
  assignedToId: integer("assigned_to_id").references(() => users.id),
  clientId: integer("client_id").references(() => clients.id),
  policyId: integer("policy_id").references(() => policies.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Activity model (for tracking communications and actions)
export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // e.g., 'call', 'email', 'meeting', 'note'
  description: text("description").notNull(),
  clientId: integer("client_id").references(() => clients.id),
  policyId: integer("policy_id").references(() => policies.id),
  userId: integer("user_id").references(() => users.id).notNull(),
  date: timestamp("date").defaultNow().notNull(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users);
export const insertClientSchema = createInsertSchema(clients);
export const insertPolicySchema = createInsertSchema(policies);
export const insertTaskSchema = createInsertSchema(tasks);
export const insertActivitySchema = createInsertSchema(activities);

// Select types
export type User = typeof users.$inferSelect;
export type Client = typeof clients.$inferSelect;
export type Policy = typeof policies.$inferSelect;
export type Task = typeof tasks.$inferSelect;
export type Activity = typeof activities.$inferSelect;

// Insert types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertClient = z.infer<typeof insertClientSchema>;
export type InsertPolicy = z.infer<typeof insertPolicySchema>;
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type InsertActivity = z.infer<typeof insertActivitySchema>;
