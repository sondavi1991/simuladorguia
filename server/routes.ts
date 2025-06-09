import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertFormSubmissionSchema, 
  insertFormStepSchema, 
  insertHealthPlanSchema 
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Form submission routes
  app.post("/api/form-submissions", async (req, res) => {
    try {
      const validatedData = insertFormSubmissionSchema.parse(req.body);
      const submission = await storage.createFormSubmission(validatedData);
      res.json(submission);
    } catch (error) {
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
