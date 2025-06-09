import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { AuthStorage } from "./auth-storage";
import { 
  insertFormSubmissionSchema, 
  insertFormStepSchema, 
  insertHealthPlanSchema,
  loginSchema
} from "@shared/schema";

interface AuthenticatedRequest extends Request {
  user?: any;
  session?: any;
}

// Authentication middleware
async function authenticateSession(req: AuthenticatedRequest, res: Response, next: any) {
  const sessionId = req.cookies?.sessionId;
  
  if (!sessionId) {
    return next();
  }

  const result = await AuthStorage.validateSession(sessionId);
  if (result) {
    req.user = result.user;
    req.session = result.session;
  } else {
    res.clearCookie('sessionId');
  }

  next();
}

function requireAuth(req: AuthenticatedRequest, res: Response, next: any) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Apply authentication middleware to all routes
  app.use(authenticateSession);

  // Authentication routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = loginSchema.parse(req.body);
      const result = await AuthStorage.login(username, password);
      
      if (!result) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Set session cookie
      res.cookie('sessionId', result.session.id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
      });

      res.json({
        user: {
          id: result.user.id,
          username: result.user.username,
          email: result.user.email,
          firstName: result.user.firstName,
          lastName: result.user.lastName
        }
      });
    } catch (error) {
      res.status(400).json({ error: "Invalid login data" });
    }
  });

  app.post("/api/auth/logout", async (req: AuthenticatedRequest, res) => {
    const sessionId = req.cookies?.sessionId;
    if (sessionId) {
      await AuthStorage.logout(sessionId);
      res.clearCookie('sessionId');
    }
    res.json({ success: true });
  });

  app.get("/api/auth/me", async (req: AuthenticatedRequest, res) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    res.json({
      user: {
        id: req.user.id,
        username: req.user.username,
        email: req.user.email,
        firstName: req.user.firstName,
        lastName: req.user.lastName
      }
    });
  });

  // Form submission routes
  app.post("/api/form-submissions", async (req, res) => {
    try {
      const dataWithTimestamp = {
        ...req.body,
        submittedAt: new Date().toISOString()
      };
      const validatedData = insertFormSubmissionSchema.parse(dataWithTimestamp);
      const submission = await storage.createFormSubmission(validatedData);
      res.json(submission);
    } catch (error) {
      console.error("Form submission validation error:", error);
      res.status(400).json({ error: "Invalid form submission data" });
    }
  });

  app.get("/api/form-submissions", async (req, res) => {
    try {
      const submissions = await storage.getFormSubmissions();
      res.json(submissions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch form submissions" });
    }
  });

  app.get("/api/form-submissions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const submission = await storage.getFormSubmission(id);
      if (!submission) {
        return res.status(404).json({ error: "Form submission not found" });
      }
      res.json(submission);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch form submission" });
    }
  });

  // Form steps routes (for admin panel)
  app.get("/api/form-steps", async (req, res) => {
    try {
      const steps = await storage.getFormSteps();
      res.json(steps);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch form steps" });
    }
  });

  app.post("/api/form-steps", async (req, res) => {
    try {
      const validatedData = insertFormStepSchema.parse(req.body);
      const step = await storage.createFormStep(validatedData);
      res.json(step);
    } catch (error) {
      res.status(400).json({ error: "Invalid form step data" });
    }
  });

  app.put("/api/form-steps/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updateData = req.body;
      const updatedStep = await storage.updateFormStep(id, updateData);
      if (!updatedStep) {
        return res.status(404).json({ error: "Form step not found" });
      }
      res.json(updatedStep);
    } catch (error) {
      res.status(500).json({ error: "Failed to update form step" });
    }
  });

  app.delete("/api/form-steps/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteFormStep(id);
      if (!deleted) {
        return res.status(404).json({ error: "Form step not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete form step" });
    }
  });

  // Health plans routes
  app.get("/api/health-plans", async (req, res) => {
    try {
      const plans = await storage.getHealthPlans();
      res.json(plans);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch health plans" });
    }
  });

  app.post("/api/health-plans", async (req, res) => {
    try {
      const validatedData = insertHealthPlanSchema.parse(req.body);
      const plan = await storage.createHealthPlan(validatedData);
      res.json(plan);
    } catch (error) {
      res.status(400).json({ error: "Invalid health plan data" });
    }
  });

  app.put("/api/health-plans/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updateData = req.body;
      const updatedPlan = await storage.updateHealthPlan(id, updateData);
      if (!updatedPlan) {
        return res.status(404).json({ error: "Health plan not found" });
      }
      res.json(updatedPlan);
    } catch (error) {
      res.status(500).json({ error: "Failed to update health plan" });
    }
  });

  app.delete("/api/health-plans/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteHealthPlan(id);
      if (!deleted) {
        return res.status(404).json({ error: "Health plan not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete health plan" });
    }
  });

  // Plan recommendations endpoint
  app.post("/api/recommendations", async (req, res) => {
    try {
      const { priceRange, services } = req.body;
      const recommendations = await storage.getRecommendedPlans(priceRange, services || []);
      res.json(recommendations);
    } catch (error) {
      res.status(500).json({ error: "Failed to get plan recommendations" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
