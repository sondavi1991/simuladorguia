import { pgTable, text, serial, integer, boolean, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const formSubmissions = pgTable("form_submissions", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  birthDate: text("birth_date").notNull(),
  zipCode: text("zip_code").notNull(),
  planType: text("plan_type").notNull(),
  priceRange: text("price_range").notNull(),
  services: json("services").$type<string[]>().default([]),
  dependents: json("dependents").$type<Dependent[]>().default([]),
  submittedAt: text("submitted_at").notNull(),
});

export const formSteps = pgTable("form_steps", {
  id: serial("id").primaryKey(),
  stepNumber: integer("step_number").notNull(),
  title: text("title").notNull(),
  fields: json("fields").$type<FormField[]>().default([]),
  conditionalRules: json("conditional_rules").$type<ConditionalRule[]>().default([]),
  isActive: boolean("is_active").default(true),
});

export const healthPlans = pgTable("health_plans", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  monthlyPrice: integer("monthly_price").notNull(),
  features: json("features").$type<string[]>().default([]),
  coverage: text("coverage").notNull(),
  isRecommended: boolean("is_recommended").default(false),
  targetPriceRange: text("target_price_range").notNull(),
});

// Types for form builder
export type FormField = {
  id: string;
  type: 'text' | 'radio' | 'checkbox' | 'select' | 'date' | 'tel' | 'email' | 'heading' | 'paragraph' | 'image';
  label: string;
  required: boolean;
  options?: string[];
  placeholder?: string;
  content?: string; // For heading, paragraph content
  imageUrl?: string; // For image fields
  headingLevel?: 'h1' | 'h2' | 'h3'; // For heading type
  style?: Record<string, string>; // For custom styling
};

export type ConditionalRule = {
  id: string;
  condition: {
    field: string;
    operator: 'equals' | 'not_equals' | 'contains';
    value: string;
  };
  action: {
    type: 'show' | 'hide';
    targetField: string;
  };
};

export type Dependent = {
  name: string;
  birthDate: string;
  relationship: string;
};

// Zod schemas
export const insertFormSubmissionSchema = createInsertSchema(formSubmissions).omit({
  id: true,
  submittedAt: true,
});

export const insertFormStepSchema = createInsertSchema(formSteps).omit({
  id: true,
});

export const insertHealthPlanSchema = createInsertSchema(healthPlans).omit({
  id: true,
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
});

// Infer types
export type InsertFormSubmission = z.infer<typeof insertFormSubmissionSchema>;
export type InsertFormStep = z.infer<typeof insertFormStepSchema>;
export type InsertHealthPlan = z.infer<typeof insertHealthPlanSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type FormSubmission = typeof formSubmissions.$inferSelect;
export type FormStep = typeof formSteps.$inferSelect;
export type HealthPlan = typeof healthPlans.$inferSelect;
export type User = typeof users.$inferSelect;
