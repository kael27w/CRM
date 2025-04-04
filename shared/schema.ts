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
  role: text("role").notNull().default("user"),  // admin or user
  profileImage: text("profile_image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Company model
export const companies = pgTable("companies", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone"),
  address: text("address"),
  website: text("website"),
  industry: text("industry"),
  status: text("status").notNull().default("active"),
  ownerId: integer("owner_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Contact model (previously clients)
export const contacts = pgTable("contacts", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  title: text("title"), // job title
  address: text("address"),
  status: text("status").notNull().default("active"),
  companyId: integer("company_id").references(() => companies.id),
  ownerId: integer("owner_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Product model
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  description: text("description"),
  price: integer("price").notNull(),
  active: boolean("active").default(true),
  category: text("category"),
  ownerId: integer("owner_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Deal model (replaces policy model)
export const deals = pgTable("deals", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  contactId: integer("contact_id").references(() => contacts.id),
  companyId: integer("company_id").references(() => companies.id),
  amount: integer("amount").notNull().default(0),
  closeDate: date("close_date"),
  stage: text("stage").notNull(), // e.g., 'qualification', 'proposal', 'negotiation', 'closed_won', 'closed_lost'
  pipelineId: text("pipeline_id").notNull(), // associates deal with particular pipeline type
  probability: integer("probability").default(0), // 0-100%
  productId: integer("product_id").references(() => products.id),
  ownerId: integer("owner_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Pipeline model
export const pipelines = pgTable("pipelines", {
  id: text("id").primaryKey(), // e.g., 'sales', 'support', 'living_trust', 'index_universal_life'
  name: text("name").notNull(), // e.g., 'Sales Pipeline', 'Support Pipeline'
  category: text("category").notNull().default("team"), // 'team' or 'industry'
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Pipeline Stage model
export const pipelineStages = pgTable("pipeline_stages", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // e.g., 'Qualification', 'Proposal'
  pipelineId: text("pipeline_id").references(() => pipelines.id).notNull(),
  order: integer("order").notNull(), // order of stages
  color: text("color").notNull().default("#3b82f6"), // stage color
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Activity model (for tracking communications and actions)
export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // 'task', 'event', 'call', 'email', 'note'
  title: text("title").notNull(),
  description: text("description"),
  dueDate: date("due_date"),
  dueTime: text("due_time"), // stored as string like "10:00 AM"
  completed: boolean("completed").default(false),
  contactId: integer("contact_id").references(() => contacts.id),
  companyId: integer("company_id").references(() => companies.id),
  dealId: integer("deal_id").references(() => deals.id),
  ownerId: integer("owner_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Dashboard model
export const dashboards = pgTable("dashboards", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // e.g., 'Overview', 'Pipelines', 'Tasks', 'Events'
  widgets: json("widgets"), // Store widget configuration
  ownerId: integer("owner_id").references(() => users.id).notNull(),
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users);
export const insertContactSchema = createInsertSchema(contacts);
export const insertCompanySchema = createInsertSchema(companies);
export const insertProductSchema = createInsertSchema(products);
export const insertDealSchema = createInsertSchema(deals);
export const insertPipelineSchema = createInsertSchema(pipelines);
export const insertPipelineStageSchema = createInsertSchema(pipelineStages);
export const insertActivitySchema = createInsertSchema(activities);
export const insertDashboardSchema = createInsertSchema(dashboards);

// Select types
export type User = typeof users.$inferSelect;
export type Contact = typeof contacts.$inferSelect;
export type Company = typeof companies.$inferSelect;
export type Product = typeof products.$inferSelect;
export type Deal = typeof deals.$inferSelect;
export type Pipeline = typeof pipelines.$inferSelect;
export type PipelineStage = typeof pipelineStages.$inferSelect;
export type Activity = typeof activities.$inferSelect;
export type Dashboard = typeof dashboards.$inferSelect;

// Insert types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertContact = z.infer<typeof insertContactSchema>;
export type InsertCompany = z.infer<typeof insertCompanySchema>;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type InsertDeal = z.infer<typeof insertDealSchema>;
export type InsertPipeline = z.infer<typeof insertPipelineSchema>;
export type InsertPipelineStage = z.infer<typeof insertPipelineStageSchema>;
export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type InsertDashboard = z.infer<typeof insertDashboardSchema>;
