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
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
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
  
  // SMTP settings methods
  getSmtpSettings(): Promise<SmtpSettings[]>;
  createSmtpSettings(settings: InsertSmtpSettings): Promise<SmtpSettings>;
  updateSmtpSettings(id: number, settings: Partial<InsertSmtpSettings>): Promise<SmtpSettings | undefined>;
  
  // WhatsApp attendant methods
  getWhatsappAttendants(): Promise<WhatsappAttendant[]>;
  createWhatsappAttendant(attendant: InsertWhatsappAttendant): Promise<WhatsappAttendant>;
  updateWhatsappAttendant(id: number, attendant: Partial<InsertWhatsappAttendant>): Promise<WhatsappAttendant | undefined>;
  deleteWhatsappAttendant(id: number): Promise<boolean>;
  getNextWhatsappAttendant(): Promise<WhatsappAttendant | undefined>;
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
  private attendantRotationIndex: number;

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
    this.attendantRotationIndex = 0;
    
    this.initializeDefaultData();
  }

  private initializeDefaultData() {
    // Initialize default admin user
    this.createUser({
      username: "admin",
      password: "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj5QJxfHvjve", // senha: "admin123"
      email: "admin@guiaunico.com.br",
      firstName: "Administrador",
      lastName: "Sistema"
    });

    // Initialize additional test users
    this.createUser({
      username: "gerente",
      password: "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj5QJxfHvjve", // senha: "admin123"
      email: "gerente@guiaunico.com.br",
      firstName: "Gerente",
      lastName: "Operacional"
    });

    // Initialize default health plans
    const defaultPlans: InsertHealthPlan[] = [
      {
        name: "Plano Saúde Premium",
        description: "Cobertura completa com rede credenciada nacional",
        monthlyPrice: 485,
        features: ["Cobertura Nacional", "Telemedicina", "Obstetrícia", "Odontologia"],
        coverage: "nacional",
        isRecommended: true,
        targetPriceRange: "premium",
        logoUrl: null
      },
      {
        name: "Plano Saúde Essencial",
        description: "Plano básico com boa cobertura regional",
        monthlyPrice: 285,
        features: ["Cobertura Regional", "Telemedicina"],
        coverage: "regional",
        isRecommended: false,
        targetPriceRange: "intermediate",
        logoUrl: null
      },
      {
        name: "Plano Saúde Executivo",
        description: "Premium com cobertura internacional",
        monthlyPrice: 890,
        features: ["Cobertura Internacional", "Telemedicina", "Obstetrícia", "Odontologia", "Check-ups VIP"],
        coverage: "internacional",
        isRecommended: false,
        targetPriceRange: "executive",
        logoUrl: null
      }
    ];

    defaultPlans.forEach(plan => this.createHealthPlan(plan));

    // Initialize default form steps
    const defaultSteps: InsertFormStep[] = [
      {
        stepNumber: 1,
        title: "Informações Pessoais",
        description: "Vamos começar coletando suas informações básicas",
        fields: [
          {
            id: "name",
            type: "text",
            label: "Nome Completo",
            required: true,
            placeholder: "Digite seu nome completo"
          },
          {
            id: "email",
            type: "email",
            label: "E-mail",
            required: true,
            placeholder: "seu@email.com"
          },
          {
            id: "phone",
            type: "tel",
            label: "Telefone",
            required: true,
            placeholder: "(11) 99999-9999"
          },
          {
            id: "birthDate",
            type: "date",
            label: "Data de Nascimento",
            required: true
          }
        ],
        conditionalRules: [],
        navigationRules: [
          {
            id: "next-step",
            stepId: 1,
            condition: {
              field: "name",
              operator: "is_not_empty",
              value: ""
            },
            target: {
              type: "step",
              stepNumber: 2
            },
            priority: 1
          }
        ],
        recommendedPlanIds: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        stepNumber: 2,
        title: "Localização",
        description: "Informe seu CEP para encontrarmos os melhores planos da sua região",
        fields: [
          {
            id: "zipCode",
            type: "text",
            label: "CEP",
            required: true,
            placeholder: "00000-000"
          }
        ],
        conditionalRules: [],
        navigationRules: [
          {
            id: "next-step-2",
            stepId: 2,
            condition: {
              field: "zipCode",
              operator: "is_not_empty",
              value: ""
            },
            target: {
              type: "step",
              stepNumber: 3
            },
            priority: 1
          }
        ],
        recommendedPlanIds: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        stepNumber: 3,
        title: "Tipo de Plano",
        description: "Que tipo de plano você está procurando?",
        fields: [
          {
            id: "planType",
            type: "radio",
            label: "Tipo de Plano",
            required: true,
            options: ["Individual", "Familiar", "Empresarial"]
          }
        ],
        conditionalRules: [],
        navigationRules: [
          {
            id: "next-step-3",
            stepId: 3,
            condition: {
              field: "planType",
              operator: "is_not_empty",
              value: ""
            },
            target: {
              type: "step",
              stepNumber: 4
            },
            priority: 1
          }
        ],
        recommendedPlanIds: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        stepNumber: 4,
        title: "Faixa de Preço",
        description: "Qual faixa de preço se adequa ao seu orçamento?",
        fields: [
          {
            id: "priceRange",
            type: "radio",
            label: "Faixa de Preço Mensal",
            required: true,
            options: ["Até R$ 300", "R$ 300 - R$ 500", "R$ 500 - R$ 800", "Acima de R$ 800"]
          }
        ],
        conditionalRules: [],
        navigationRules: [
          {
            id: "next-step-4",
            stepId: 4,
            condition: {
              field: "priceRange",
              operator: "is_not_empty",
              value: ""
            },
            target: {
              type: "step",
              stepNumber: 5
            },
            priority: 1
          }
        ],
        recommendedPlanIds: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        stepNumber: 5,
        title: "Serviços Desejados",
        description: "Quais serviços são importantes para você?",
        fields: [
          {
            id: "services",
            type: "checkbox",
            label: "Serviços Desejados",
            required: false,
            options: ["Telemedicina", "Obstetrícia", "Odontologia", "Cobertura Nacional", "Cobertura Internacional"]
          }
        ],
        conditionalRules: [],
        navigationRules: [
          {
            id: "finish-form",
            stepId: 5,
            condition: {
              field: "services",
              operator: "is_not_empty",
              value: ""
            },
            target: {
              type: "end"
            },
            priority: 1
          }
        ],
        recommendedPlanIds: [1, 2, 3],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    defaultSteps.forEach(step => this.createFormStep(step));
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

  async updateUser(id: number, updateData: Partial<InsertUser>): Promise<User | undefined> {
    const existingUser = this.users.get(id);
    if (!existingUser) {
      return undefined;
    }

    // Hash password if provided
    let hashedPassword = existingUser.password;
    if (updateData.password) {
      const bcrypt = await import('bcrypt');
      hashedPassword = await bcrypt.hash(updateData.password, 12);
    }

    const updatedUser: User = {
      ...existingUser,
      ...updateData,
      password: hashedPassword,
      id, // Ensure ID remains the same
      createdAt: existingUser.createdAt, // Preserve creation time
      updatedAt: new Date() // Update modification time
    };

    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async deleteUser(id: number): Promise<boolean> {
    return this.users.delete(id);
  }

  async createSession(insertSession: InsertSession): Promise<Session> {
    const session: Session = {
      id: insertSession.id,
      userId: insertSession.userId,
      expiresAt: insertSession.expiresAt,
      createdAt: new Date()
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

  // SMTP Settings methods
  async getSmtpSettings(): Promise<SmtpSettings[]> {
    return Array.from(this.smtpSettings.values());
  }

  async createSmtpSettings(insertSettings: InsertSmtpSettings): Promise<SmtpSettings> {
    const settings: SmtpSettings = {
      id: this.currentSmtpId++,
      ...insertSettings,
      port: insertSettings.port || 587,
      protocol: insertSettings.protocol || 'TLS',
      isActive: insertSettings.isActive || true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
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
      updatedAt: new Date().toISOString()
    };
    this.smtpSettings.set(id, updated);
    return updated;
  }

  // WhatsApp Attendant methods
  async getWhatsappAttendants(): Promise<WhatsappAttendant[]> {
    return Array.from(this.whatsappAttendants.values());
  }

  async createWhatsappAttendant(insertAttendant: InsertWhatsappAttendant): Promise<WhatsappAttendant> {
    const attendant: WhatsappAttendant = {
      id: this.currentWhatsappId++,
      ...insertAttendant,
      priority: insertAttendant.priority || 1,
      isActive: insertAttendant.isActive ?? true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
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
      updatedAt: new Date().toISOString()
    };
    this.whatsappAttendants.set(id, updated);
    return updated;
  }

  async deleteWhatsappAttendant(id: number): Promise<boolean> {
    return this.whatsappAttendants.delete(id);
  }

  async getNextWhatsappAttendant(): Promise<WhatsappAttendant | undefined> {
    const activeAttendants = Array.from(this.whatsappAttendants.values())
      .filter(attendant => attendant.isActive)
      .sort((a, b) => (a.priority || 1) - (b.priority || 1));
    
    if (activeAttendants.length === 0) {
      return undefined;
    }

    // Simple round-robin: cycle through attendants by index using global counter
    const selectedAttendant = activeAttendants[globalAttendantRotationIndex % activeAttendants.length];
    
    // Increment global rotation index for next selection
    globalAttendantRotationIndex = (globalAttendantRotationIndex + 1) % activeAttendants.length;
    
    return selectedAttendant;
  }

}

// PostgreSQL implementation for Supabase
export class PostgreSQLStorage implements IStorage {
  private db: ReturnType<typeof drizzlePg>;
  private client: pg.Client;
  private attendantRotationIndex: number = 0;

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
        sessions,
        formSubmissions,
        formSteps,
        healthPlans,
        smtpSettings,
        whatsappAttendants
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

  async updateUser(id: number, updateData: Partial<InsertUser>): Promise<User | undefined> {
    const result = await this.db.update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning();
    return result[0];
  }

  async getAllUsers(): Promise<User[]> {
    return await this.db.select().from(users);
  }

  async deleteUser(id: number): Promise<boolean> {
    const result = await this.db.delete(users).where(eq(users.id, id)).returning();
    return result.length > 0;
  }

  async createSession(insertSession: InsertSession): Promise<Session> {
    const result = await this.db.insert(sessions).values(insertSession).returning();
    return result[0];
  }

  async getSession(id: string): Promise<Session | undefined> {
    const result = await this.db.select().from(sessions).where(eq(sessions.id, id));
    return result[0];
  }

  async deleteSession(id: string): Promise<boolean> {
    const result = await this.db.delete(sessions).where(eq(sessions.id, id)).returning();
    return result.length > 0;
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

  // SMTP Settings methods
  async getSmtpSettings(): Promise<SmtpSettings[]> {
    return await this.db.select().from(smtpSettings);
  }

  async createSmtpSettings(insertSettings: InsertSmtpSettings): Promise<SmtpSettings> {
    const result = await this.db.insert(smtpSettings).values(insertSettings).returning();
    return result[0];
  }

  async updateSmtpSettings(id: number, updateData: Partial<InsertSmtpSettings>): Promise<SmtpSettings | undefined> {
    const result = await this.db.update(smtpSettings)
      .set(updateData)
      .where(eq(smtpSettings.id, id))
      .returning();
    return result[0];
  }

  // WhatsApp Attendant methods
  async getWhatsappAttendants(): Promise<WhatsappAttendant[]> {
    return await this.db.select().from(whatsappAttendants).orderBy(whatsappAttendants.priority);
  }

  async createWhatsappAttendant(insertAttendant: InsertWhatsappAttendant): Promise<WhatsappAttendant> {
    const result = await this.db.insert(whatsappAttendants).values(insertAttendant).returning();
    return result[0];
  }

  async updateWhatsappAttendant(id: number, updateData: Partial<InsertWhatsappAttendant>): Promise<WhatsappAttendant | undefined> {
    const result = await this.db.update(whatsappAttendants)
      .set(updateData)
      .where(eq(whatsappAttendants.id, id))
      .returning();
    return result[0];
  }

  async deleteWhatsappAttendant(id: number): Promise<boolean> {
    const result = await this.db.delete(whatsappAttendants).where(eq(whatsappAttendants.id, id)).returning();
    return result.length > 0;
  }

  async getNextWhatsappAttendant(): Promise<WhatsappAttendant | undefined> {
    const attendants = await this.db.select()
      .from(whatsappAttendants)
      .where(eq(whatsappAttendants.isActive, true))
      .orderBy(whatsappAttendants.priority);
    
    if (attendants.length === 0) {
      return undefined;
    }

    // Simple round-robin: cycle through attendants by index using global counter
    const selectedAttendant = attendants[globalAttendantRotationIndex % attendants.length];
    
    // Increment global rotation index for next selection
    globalAttendantRotationIndex = (globalAttendantRotationIndex + 1) % attendants.length;
    
    return selectedAttendant;
  }
}

// Global rotation counter to persist across requests
let globalAttendantRotationIndex = 0;

// Initialize storage with connection testing
async function initializeStorage(): Promise<IStorage> {
  try {
    const pgStorage = new PostgreSQLStorage();
    await pgStorage.connect();
    console.log('Using PostgreSQL storage for data persistence');
    return pgStorage;
  } catch (error) {
    console.error('PostgreSQL connection failed, falling back to memory storage:', error);
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
