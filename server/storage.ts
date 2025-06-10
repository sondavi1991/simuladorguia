import { 
  users, 
  sessions,
  formSubmissions, 
  formSteps, 
  healthPlans,
  smtpSettings,
  whatsappAttendants,
  type User, 
  type Session,
  type InsertUser,
  type InsertSession,
  type FormSubmission,
  type InsertFormSubmission,
  type FormStep,
  type InsertFormStep,
  type HealthPlan,
  type InsertHealthPlan,
  type SmtpSettings,
  type InsertSmtpSettings,
  type WhatsappAttendant,
  type InsertWhatsappAttendant,
  type FormField,
  type ConditionalRule,
  type StepNavigation
} from "@shared/schema";
import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import pg from "pg";
import { eq, and, inArray } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  deleteUser(id: number): Promise<boolean>;
  
  // Session methods
  createSession(session: InsertSession): Promise<Session>;
  getSession(id: string): Promise<Session | undefined>;
  deleteSession(id: string): Promise<boolean>;
  
  // Form submission methods
  createFormSubmission(submission: InsertFormSubmission): Promise<FormSubmission>;
  getFormSubmissions(): Promise<FormSubmission[]>;
  getFormSubmission(id: number): Promise<FormSubmission | undefined>;
  deleteFormSubmission(id: number): Promise<boolean>;
  
  // Form step methods
  getFormSteps(): Promise<FormStep[]>;
  createFormStep(step: InsertFormStep): Promise<FormStep>;
  updateFormStep(id: number, step: Partial<InsertFormStep>): Promise<FormStep | undefined>;
  deleteFormStep(id: number): Promise<boolean>;
  
  // Health plan methods
  getHealthPlans(): Promise<HealthPlan[]>;
  createHealthPlan(plan: InsertHealthPlan): Promise<HealthPlan>;
  updateHealthPlan(id: number, plan: Partial<InsertHealthPlan>): Promise<HealthPlan | undefined>;
  deleteHealthPlan(id: number): Promise<boolean>;
  getRecommendedPlans(priceRange: string, services: string[]): Promise<HealthPlan[]>;
  
  // SMTP settings methods (placeholder for future implementation)
  getSmtpSettings?(): Promise<any>;
  createSmtpSettings?(settings: any): Promise<any>;
  updateSmtpSettings?(id: number, settings: any): Promise<any>;
  
  // WhatsApp attendant methods (placeholder for future implementation)
  getWhatsappAttendants?(): Promise<any[]>;
  createWhatsappAttendant?(attendant: any): Promise<any>;
  updateWhatsappAttendant?(id: number, attendant: any): Promise<any>;
  deleteWhatsappAttendant?(id: number): Promise<boolean>;
  getNextWhatsappAttendant?(): Promise<any>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private sessions: Map<string, Session>;
  private formSubmissions: Map<number, FormSubmission>;
  private formSteps: Map<number, FormStep>;
  private healthPlans: Map<number, HealthPlan>;
  private smtpSettings: Map<number, SmtpSettings>;
  private whatsappAttendants: Map<number, WhatsappAttendant>;
  private currentUserId: number;
  private currentSubmissionId: number;
  private currentStepId: number;
  private currentPlanId: number;
  private currentSmtpId: number;
  private currentWhatsappId: number;

  constructor() {
    this.users = new Map();
    this.sessions = new Map();
    this.formSubmissions = new Map();
    this.formSteps = new Map();
    this.healthPlans = new Map();
    this.smtpSettings = new Map();
    this.whatsappAttendants = new Map();
    this.currentUserId = 1;
    this.currentSubmissionId = 1;
    this.currentStepId = 1;
    this.currentPlanId = 1;
    this.currentSmtpId = 1;
    this.currentWhatsappId = 1;
    
    this.initializeDefaultData();
  }

  private initializeDefaultData() {
    // Initialize default health plans
    const defaultPlans: InsertHealthPlan[] = [
      {
        name: "Plano Saúde Premium",
        description: "Cobertura completa com rede credenciada nacional",
        monthlyPrice: 485,
        features: ["Cobertura Nacional", "Telemedicina", "Obstetrícia", "Odontologia"],
        coverage: "nacional",
        isRecommended: true,
        targetPriceRange: "premium"
      },
      {
        name: "Plano Saúde Essencial",
        description: "Plano básico com boa cobertura regional",
        monthlyPrice: 285,
        features: ["Cobertura Regional", "Telemedicina"],
        coverage: "regional",
        isRecommended: false,
        targetPriceRange: "intermediate"
      },
      {
        name: "Plano Saúde Executivo",
        description: "Premium com cobertura internacional",
        monthlyPrice: 890,
        features: ["Cobertura Internacional", "Telemedicina", "Obstetrícia", "Odontologia", "Check-ups VIP"],
        coverage: "internacional",
        isRecommended: false,
        targetPriceRange: "executive"
      }
    ];

    defaultPlans.forEach(plan => this.createHealthPlan(plan));
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

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { 
      id,
      username: insertUser.username,
      password: insertUser.password,
      email: insertUser.email ?? null,
      firstName: insertUser.firstName ?? null,
      lastName: insertUser.lastName ?? null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.users.set(id, user);
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async deleteUser(id: number): Promise<boolean> {
    return this.users.delete(id);
  }

  async createSession(insertSession: InsertSession): Promise<Session> {
    const session: Session = {
      ...insertSession,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.sessions.set(session.id, session);
    return session;
  }

  async getSession(id: string): Promise<Session | undefined> {
    return this.sessions.get(id);
  }

  async deleteSession(id: string): Promise<boolean> {
    return this.sessions.delete(id);
  }

  // Form submission methods
  async createFormSubmission(insertSubmission: InsertFormSubmission): Promise<FormSubmission> {
    const id = this.currentSubmissionId++;
    const submission: FormSubmission = { 
      ...insertSubmission, 
      id,
      submittedAt: new Date().toISOString(),
      services: insertSubmission.services ? [...insertSubmission.services] : [],
      dependents: insertSubmission.dependents ? [...insertSubmission.dependents] : []
    };
    this.formSubmissions.set(id, submission);
    return submission;
  }

  async getFormSubmissions(): Promise<FormSubmission[]> {
    return Array.from(this.formSubmissions.values());
  }

  async getFormSubmission(id: number): Promise<FormSubmission | undefined> {
    return this.formSubmissions.get(id);
  }

  async deleteFormSubmission(id: number): Promise<boolean> {
    return this.formSubmissions.delete(id);
  }

  // Form step methods
  async getFormSteps(): Promise<FormStep[]> {
    return Array.from(this.formSteps.values()).sort((a, b) => a.stepNumber - b.stepNumber);
  }

  async createFormStep(insertStep: InsertFormStep): Promise<FormStep> {
    const id = this.currentStepId++;
    const now = new Date().toISOString();
    const step: FormStep = { 
      ...insertStep, 
      id,
      description: insertStep.description || null,
      fields: insertStep.fields || null,
      conditionalRules: insertStep.conditionalRules || null,
      navigationRules: insertStep.navigationRules || null,
      isActive: insertStep.isActive ?? true,
      createdAt: now,
      updatedAt: now
    };
    this.formSteps.set(id, step);
    return step;
  }

  async updateFormStep(id: number, updateData: Partial<InsertFormStep>): Promise<FormStep | undefined> {
    const existingStep = this.formSteps.get(id);
    if (!existingStep) return undefined;
    
    const updatedStep: FormStep = { 
      ...existingStep, 
      ...updateData,
      fields: updateData.fields || existingStep.fields,
      conditionalRules: updateData.conditionalRules || existingStep.conditionalRules
    };
    this.formSteps.set(id, updatedStep);
    return updatedStep;
  }

  async deleteFormStep(id: number): Promise<boolean> {
    return this.formSteps.delete(id);
  }

  // Health plan methods
  async getHealthPlans(): Promise<HealthPlan[]> {
    return Array.from(this.healthPlans.values());
  }

  async createHealthPlan(insertPlan: InsertHealthPlan): Promise<HealthPlan> {
    const id = this.currentPlanId++;
    const plan: HealthPlan = { 
      ...insertPlan, 
      id,
      features: insertPlan.features ? [...insertPlan.features] : [],
      isRecommended: insertPlan.isRecommended ?? false
    };
    this.healthPlans.set(id, plan);
    return plan;
  }

  async updateHealthPlan(id: number, updateData: Partial<InsertHealthPlan>): Promise<HealthPlan | undefined> {
    const existingPlan = this.healthPlans.get(id);
    if (!existingPlan) return undefined;
    
    const updatedPlan: HealthPlan = { 
      ...existingPlan, 
      ...updateData,
      features: updateData.features ? [...updateData.features] : existingPlan.features
    };
    this.healthPlans.set(id, updatedPlan);
    return updatedPlan;
  }

  async deleteHealthPlan(id: number): Promise<boolean> {
    return this.healthPlans.delete(id);
  }

  async getRecommendedPlans(priceRange: string, services: string[]): Promise<HealthPlan[]> {
    const allPlans = Array.from(this.healthPlans.values());
    
    // Filter by price range and features
    const filteredPlans = allPlans.filter(plan => {
      const matchesPriceRange = plan.targetPriceRange === priceRange || 
        (priceRange === "basic" && plan.monthlyPrice <= 300) ||
        (priceRange === "intermediate" && plan.monthlyPrice <= 500) ||
        (priceRange === "premium" && plan.monthlyPrice <= 800) ||
        (priceRange === "executive" && plan.monthlyPrice > 800);
      
      const hasRequestedServices = services.some(service => 
        plan.features?.some(feature => 
          feature.toLowerCase().includes(service.toLowerCase())
        ) || false
      );
      
      return matchesPriceRange || hasRequestedServices;
    });

    // Sort by recommendation status and price
    return filteredPlans.sort((a, b) => {
      if (a.isRecommended && !b.isRecommended) return -1;
      if (!a.isRecommended && b.isRecommended) return 1;
      return a.monthlyPrice - b.monthlyPrice;
    });
  }

  // SMTP settings methods
  async getSmtpSettings(): Promise<SmtpSettings | undefined> {
    const settings = Array.from(this.smtpSettings.values());
    return settings[0]; // Return first SMTP settings
  }

  async createSmtpSettings(insertSettings: InsertSmtpSettings): Promise<SmtpSettings> {
    const settings: SmtpSettings = { 
      id: this.currentSmtpId++, 
      ...insertSettings,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.smtpSettings.set(settings.id, settings);
    return settings;
  }

  async updateSmtpSettings(id: number, updateData: Partial<InsertSmtpSettings>): Promise<SmtpSettings | undefined> {
    const existing = this.smtpSettings.get(id);
    if (!existing) return undefined;
    
    const updated: SmtpSettings = { 
      ...existing, 
      ...updateData, 
      updatedAt: new Date()
    };
    this.smtpSettings.set(id, updated);
    return updated;
  }

  // WhatsApp attendant methods
  async getWhatsappAttendants(): Promise<WhatsappAttendant[]> {
    return Array.from(this.whatsappAttendants.values());
  }

  async createWhatsappAttendant(insertAttendant: InsertWhatsappAttendant): Promise<WhatsappAttendant> {
    const attendant: WhatsappAttendant = { 
      id: this.currentWhatsappId++, 
      ...insertAttendant,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.whatsappAttendants.set(attendant.id, attendant);
    return attendant;
  }

  async updateWhatsappAttendant(id: number, updateData: Partial<InsertWhatsappAttendant>): Promise<WhatsappAttendant | undefined> {
    const existing = this.whatsappAttendants.get(id);
    if (!existing) return undefined;
    
    const updated: WhatsappAttendant = { 
      ...existing, 
      ...updateData, 
      updatedAt: new Date()
    };
    this.whatsappAttendants.set(id, updated);
    return updated;
  }

  async deleteWhatsappAttendant(id: number): Promise<boolean> {
    return this.whatsappAttendants.delete(id);
  }

  async getNextWhatsappAttendant(): Promise<WhatsappAttendant | undefined> {
    const attendants = Array.from(this.whatsappAttendants.values());
    return attendants.find(a => a.isActive) || attendants[0];
  }
}

// PostgreSQL implementation for Supabase
export class PostgreSQLStorage implements IStorage {
  private db: ReturnType<typeof drizzlePg>;
  private client: pg.Client;

  constructor() {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error("DATABASE_URL environment variable is required");
    }
    
    // Use connection pool for better reliability with Supabase
    this.client = new pg.Client({
      connectionString: databaseUrl,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 10000,
      query_timeout: 10000,
    });
    
    this.db = drizzlePg(this.client, {
      schema: {
        users,
        formSubmissions,
        formSteps,
        healthPlans
      }
    });
  }

  async connect() {
    await this.client.connect();
  }

  async disconnect() {
    await this.client.end();
  }

  async getUser(id: number): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.username, username));
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await this.db.insert(users).values(insertUser).returning();
    return result[0];
  }

  async createFormSubmission(insertSubmission: InsertFormSubmission): Promise<FormSubmission> {
    const result = await this.db.insert(formSubmissions).values(insertSubmission).returning();
    return result[0];
  }

  async getFormSubmissions(): Promise<FormSubmission[]> {
    return await this.db.select().from(formSubmissions);
  }

  async getFormSubmission(id: number): Promise<FormSubmission | undefined> {
    const result = await this.db.select().from(formSubmissions).where(eq(formSubmissions.id, id));
    return result[0];
  }

  async deleteFormSubmission(id: number): Promise<boolean> {
    const result = await this.db.delete(formSubmissions).where(eq(formSubmissions.id, id)).returning();
    return result.length > 0;
  }

  async getFormSteps(): Promise<FormStep[]> {
    return await this.db.select().from(formSteps).orderBy(formSteps.stepNumber);
  }

  async createFormStep(insertStep: InsertFormStep): Promise<FormStep> {
    const result = await this.db.insert(formSteps).values(insertStep).returning();
    return result[0];
  }

  async updateFormStep(id: number, updateData: Partial<InsertFormStep>): Promise<FormStep | undefined> {
    const result = await this.db.update(formSteps)
      .set(updateData)
      .where(eq(formSteps.id, id))
      .returning();
    return result[0];
  }

  async deleteFormStep(id: number): Promise<boolean> {
    const result = await this.db.delete(formSteps).where(eq(formSteps.id, id)).returning();
    return result.length > 0;
  }

  async getHealthPlans(): Promise<HealthPlan[]> {
    return await this.db.select().from(healthPlans);
  }

  async createHealthPlan(insertPlan: InsertHealthPlan): Promise<HealthPlan> {
    const result = await this.db.insert(healthPlans).values(insertPlan).returning();
    return result[0];
  }

  async updateHealthPlan(id: number, updateData: Partial<InsertHealthPlan>): Promise<HealthPlan | undefined> {
    const result = await this.db.update(healthPlans)
      .set(updateData)
      .where(eq(healthPlans.id, id))
      .returning();
    return result[0];
  }

  async deleteHealthPlan(id: number): Promise<boolean> {
    const result = await this.db.delete(healthPlans).where(eq(healthPlans.id, id)).returning();
    return result.length > 0;
  }

  async getRecommendedPlans(priceRange: string, services: string[]): Promise<HealthPlan[]> {
    const allPlans = await this.db.select().from(healthPlans);
    
    return allPlans.filter(plan => {
      // Filter by price range
      let priceMatch = false;
      switch (priceRange) {
        case 'low':
          priceMatch = plan.monthlyPrice <= 200;
          break;
        case 'medium':
          priceMatch = plan.monthlyPrice > 200 && plan.monthlyPrice <= 500;
          break;
        case 'high':
          priceMatch = plan.monthlyPrice > 500;
          break;
        default:
          priceMatch = true;
      }

      // Filter by services
      const planServices = plan.services || [];
      const serviceMatch = services.length === 0 || 
        services.some(service => planServices.includes(service));

      return priceMatch && serviceMatch;
    }).sort((a, b) => {
      if (a.isRecommended && !b.isRecommended) return -1;
      if (!a.isRecommended && b.isRecommended) return 1;
      return a.monthlyPrice - b.monthlyPrice;
    });
  }
}

// Initialize storage with connection testing
async function initializeStorage(): Promise<IStorage> {
  if (!process.env.DATABASE_URL) {
    console.log('DATABASE_URL not found, using memory storage');
    return new MemStorage();
  }

  try {
    console.log('Testing PostgreSQL connection...');
    const pgStorage = new PostgreSQLStorage();
    
    // Connect to database
    await pgStorage.connect();
    
    // Test connection by trying to get health plans
    await pgStorage.getHealthPlans();
    console.log('✓ PostgreSQL connection successful');
    return pgStorage;
  } catch (error) {
    console.error('✗ PostgreSQL connection failed:', (error as Error).message);
    console.log('Falling back to memory storage');
    return new MemStorage();
  }
}

// Initialize storage (will be replaced with actual instance)
let storage: IStorage = new MemStorage();

// Initialize storage asynchronously
initializeStorage().then(storageInstance => {
  storage = storageInstance;
}).catch(error => {
  console.error('Storage initialization failed:', error);
  storage = new MemStorage();
});

export { storage };
