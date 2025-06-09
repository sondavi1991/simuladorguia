import { 
  users, 
  formSubmissions, 
  formSteps, 
  healthPlans,
  type User, 
  type InsertUser,
  type FormSubmission,
  type InsertFormSubmission,
  type FormStep,
  type InsertFormStep,
  type HealthPlan,
  type InsertHealthPlan
} from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Form submission methods
  createFormSubmission(submission: InsertFormSubmission): Promise<FormSubmission>;
  getFormSubmissions(): Promise<FormSubmission[]>;
  getFormSubmission(id: number): Promise<FormSubmission | undefined>;
  
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
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private formSubmissions: Map<number, FormSubmission>;
  private formSteps: Map<number, FormStep>;
  private healthPlans: Map<number, HealthPlan>;
  private currentUserId: number;
  private currentSubmissionId: number;
  private currentStepId: number;
  private currentPlanId: number;

  constructor() {
    this.users = new Map();
    this.formSubmissions = new Map();
    this.formSteps = new Map();
    this.healthPlans = new Map();
    this.currentUserId = 1;
    this.currentSubmissionId = 1;
    this.currentStepId = 1;
    this.currentPlanId = 1;
    
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
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
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

  // Form step methods
  async getFormSteps(): Promise<FormStep[]> {
    return Array.from(this.formSteps.values()).sort((a, b) => a.stepNumber - b.stepNumber);
  }

  async createFormStep(insertStep: InsertFormStep): Promise<FormStep> {
    const id = this.currentStepId++;
    const step: FormStep = { 
      ...insertStep, 
      id,
      fields: insertStep.fields ? (insertStep.fields as FormField[]) : [],
      conditionalRules: insertStep.conditionalRules ? (insertStep.conditionalRules as ConditionalRule[]) : [],
      isActive: insertStep.isActive ?? true
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
        plan.features.some(feature => 
          feature.toLowerCase().includes(service.toLowerCase())
        )
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
}

export const storage = new MemStorage();
