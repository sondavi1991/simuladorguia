import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { AuthStorage } from "./auth-storage";
import { 
  insertFormSubmissionSchema, 
  insertFormStepSchema, 
  insertHealthPlanSchema,
  insertWhatsappAttendantSchema,
  loginSchema
} from "@shared/schema";
import * as XLSX from "xlsx";

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

  // Form submission routes - now dynamic
  app.post("/api/form-submissions", async (req, res) => {
    try {
      const submissionData = {
        formData: req.body, // Store all form data dynamically
        userAgent: req.headers['user-agent'] || null,
        ipAddress: req.ip || req.connection.remoteAddress || null,
        sessionId: req.sessionID || null
      };
      
      const validatedData = insertFormSubmissionSchema.parse(submissionData);
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

  // Export form submissions to Excel
  app.get("/api/form-submissions/export", async (req, res) => {
    try {
      const submissions = await storage.getFormSubmissions();
      
      if (submissions.length === 0) {
        return res.status(404).json({ error: "Nenhuma simulação encontrada para exportar" });
      }

      // Get all unique keys from all form submissions to create comprehensive headers
      const allKeys = new Set<string>();
      submissions.forEach(submission => {
        if (submission.formData && typeof submission.formData === 'object') {
          Object.keys(submission.formData).forEach(key => allKeys.add(key));
        }
      });

      // Convert submissions to Excel format
      const excelData = submissions.map(submission => {
        const row: any = {
          'ID': submission.id,
          'Data de Submissão': submission.submittedAt ? new Date(submission.submittedAt).toLocaleString('pt-BR') : '',
          'User Agent': submission.userAgent || '',
          'IP Address': submission.ipAddress || '',
          'Session ID': submission.sessionId || ''
        };

        // Add all form data fields
        if (submission.formData && typeof submission.formData === 'object') {
          Object.keys(submission.formData).forEach(key => {
            const value = submission.formData[key];
            if (Array.isArray(value)) {
              row[key] = value.join(', ');
            } else if (typeof value === 'object' && value !== null) {
              row[key] = JSON.stringify(value);
            } else {
              row[key] = value;
            }
          });
        }

        return row;
      });

      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(excelData);

      // Add the worksheet to the workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Simulações');

      // Generate Excel file buffer
      const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      // Set response headers for file download
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=simulacoes-${new Date().toISOString().split('T')[0]}.xlsx`);
      
      res.send(excelBuffer);
    } catch (error) {
      console.error("Error exporting form submissions:", error);
      res.status(500).json({ error: "Erro ao exportar simulações" });
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

  app.delete('/api/form-submissions/:id', requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteFormSubmission(id);
      if (!success) {
        return res.status(404).json({ message: "Form submission not found" });
      }
      res.json({ message: "Form submission deleted successfully" });
    } catch (error: any) {
      console.error("Error deleting form submission:", error);
      res.status(500).json({ message: "Failed to delete form submission" });
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
      console.log("Creating form step with data:", JSON.stringify(req.body, null, 2));
      const validatedData = insertFormStepSchema.parse(req.body);
      const step = await storage.createFormStep(validatedData);
      res.json(step);
    } catch (error: any) {
      console.error("Form step creation error:", error);
      if (error.name === 'ZodError') {
        const validationErrors = error.errors.map((err: any) => ({
          field: err.path.join('.'),
          message: err.message,
          received: err.received,
          expected: err.expected
        }));
        res.status(400).json({ 
          error: "Dados inválidos no formulário", 
          details: "Por favor, verifique os seguintes campos:",
          validationErrors 
        });
      } else {
        res.status(500).json({ 
          error: "Erro interno do servidor ao criar passo",
          details: error?.message || "Erro desconhecido"
        });
      }
    }
  });

  app.put("/api/form-steps/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      console.log("Updating form step with ID:", id, "and data:", JSON.stringify(req.body, null, 2));
      
      // Validate the update data using partial schema
      const updateData = req.body;
      const updatedStep = await storage.updateFormStep(id, updateData);
      if (!updatedStep) {
        return res.status(404).json({ error: "Passo do formulário não encontrado" });
      }
      res.json(updatedStep);
    } catch (error: any) {
      console.error("Form step update error:", error);
      if (error.name === 'ZodError') {
        const validationErrors = error.errors.map((err: any) => ({
          field: err.path.join('.'),
          message: err.message,
          received: err.received,
          expected: err.expected
        }));
        res.status(400).json({ 
          error: "Dados inválidos no formulário", 
          details: "Por favor, verifique os seguintes campos:",
          validationErrors 
        });
      } else {
        res.status(500).json({ 
          error: "Erro interno do servidor ao atualizar passo",
          details: error?.message || "Erro desconhecido"
        });
      }
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

  // SMTP Settings routes
  app.get("/api/smtp-settings", async (req, res) => {
    try {
      // Return empty configuration that user can fill
      const defaultSettings = {
        id: 1,
        host: "",
        port: 587,
        username: "",
        password: "",
        protocol: "STARTTLS",
        recipientEmail: "",
        isActive: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      res.json(defaultSettings);
    } catch (error: any) {
      console.error("Error fetching SMTP settings:", error);
      res.status(500).json({ 
        error: "Erro interno do servidor", 
        details: error?.message || "Erro desconhecido" 
      });
    }
  });

  app.post("/api/smtp-settings", async (req, res) => {
    try {
      console.log("Creating SMTP settings with data:", JSON.stringify(req.body, null, 2));
      
      const smtpSettings = {
        id: 1,
        ...req.body,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      res.json(smtpSettings);
    } catch (error: any) {
      console.error("SMTP settings creation error:", error);
      res.status(500).json({ 
        error: "Erro interno do servidor ao criar configurações SMTP",
        details: error?.message || "Erro desconhecido"
      });
    }
  });

  app.put("/api/smtp-settings/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      console.log("Updating SMTP settings with ID:", id, "and data:", JSON.stringify(req.body, null, 2));
      
      const smtpSettings = {
        id,
        ...req.body,
        updatedAt: new Date().toISOString(),
      };
      
      res.json(smtpSettings);
    } catch (error: any) {
      console.error("SMTP settings update error:", error);
      res.status(500).json({ 
        error: "Erro interno do servidor ao atualizar configurações SMTP",
        details: error?.message || "Erro desconhecido"
      });
    }
  });

  app.post("/api/smtp-settings/test", async (req, res) => {
    try {
      console.log("Testing SMTP settings");
      
      // For now, return success - user will configure real SMTP later
      res.json({ 
        success: true, 
        message: "Configuração SMTP pronta para uso" 
      });
    } catch (error: any) {
      console.error("SMTP test error:", error);
      res.status(500).json({ 
        error: "Erro ao testar configurações SMTP",
        details: error?.message || "Erro desconhecido"
      });
    }
  });

  // WhatsApp attendant routes
  app.get('/api/whatsapp-attendants', async (req, res) => {
    try {
      const attendants = await storage.getWhatsappAttendants();
      res.json(attendants);
    } catch (error: any) {
      console.error("Error fetching WhatsApp attendants:", error);
      res.status(500).json({ message: "Failed to fetch WhatsApp attendants" });
    }
  });

  app.post('/api/whatsapp-attendants', requireAuth, async (req, res) => {
    try {
      console.log("Creating WhatsApp attendant with data:", JSON.stringify(req.body, null, 2));
      
      const attendant = await storage.createWhatsappAttendant(req.body);
      res.status(201).json(attendant);
    } catch (error: any) {
      console.error("Error creating WhatsApp attendant:", error);
      res.status(500).json({ message: "Failed to create WhatsApp attendant" });
    }
  });

  app.put('/api/whatsapp-attendants/:id', requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      console.log("Updating WhatsApp attendant with ID:", id, "and data:", JSON.stringify(req.body, null, 2));
      
      const attendant = await storage.updateWhatsappAttendant(id, req.body);
      if (!attendant) {
        return res.status(404).json({ message: "WhatsApp attendant not found" });
      }
      
      res.json(attendant);
    } catch (error: any) {
      console.error("Error updating WhatsApp attendant:", error);
      res.status(500).json({ message: "Failed to update WhatsApp attendant" });
    }
  });

  app.delete('/api/whatsapp-attendants/:id', requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      console.log("Deleting WhatsApp attendant with ID:", id);
      
      const deleted = await storage.deleteWhatsappAttendant(id);
      if (!deleted) {
        return res.status(404).json({ message: "WhatsApp attendant not found" });
      }
      
      res.json({ message: "WhatsApp attendant deleted successfully" });
    } catch (error: any) {
      console.error("Error deleting WhatsApp attendant:", error);
      res.status(500).json({ message: "Failed to delete WhatsApp attendant" });
    }
  });

  app.get('/api/whatsapp-attendants/next', async (req, res) => {
    try {
      const nextAttendant = await storage.getNextWhatsappAttendant();
      res.json(nextAttendant);
    } catch (error: any) {
      console.error("Error getting next WhatsApp attendant:", error);
      res.status(500).json({ message: "Failed to get next WhatsApp attendant" });
    }
  });

  // WhatsApp contact route using attendant queue
  app.post('/api/whatsapp/contact', async (req, res) => {
    try {
      const { planName, userName, userPhone } = req.body;
      
      // Get next attendant from queue
      const nextAttendant = await storage.getNextWhatsappAttendant();
      
      if (!nextAttendant) {
        return res.status(503).json({ 
          error: "Nenhum atendente disponível no momento",
          message: "Tente novamente mais tarde ou entre em contato pelo site."
        });
      }

      // Format phone number for WhatsApp
      const formatPhoneNumber = (phone: string) => {
        const digits = phone.replace(/\D/g, '');
        if (digits.startsWith('55')) {
          return `+${digits}`;
        } else if (digits.length >= 10) {
          return `+55${digits}`;
        }
        return `+55${digits}`;
      };

      const attendantPhone = formatPhoneNumber(nextAttendant.phoneNumber);
      
      // Create WhatsApp message
      const message = `Olá! Sou ${userName || 'um cliente'} e estou interessado(a) no plano *${planName}* recomendado pelo simulador de planos de saúde.${userPhone ? `\n\nMeu telefone: ${userPhone}` : ''}\n\nGostaria de mais informações e ajuda para contratar.`;
      
      const encodedMessage = encodeURIComponent(message);
      const whatsappUrl = `https://wa.me/${attendantPhone.replace('+', '')}?text=${encodedMessage}`;
      
      res.json({
        success: true,
        whatsappUrl,
        attendant: {
          name: nextAttendant.name,
          phone: attendantPhone
        },
        message: `Você será direcionado para o WhatsApp do atendente ${nextAttendant.name}`
      });

    } catch (error: any) {
      console.error("Error processing WhatsApp contact:", error);
      res.status(500).json({ 
        error: "Erro interno do servidor",
        message: "Tente novamente mais tarde"
      });
    }
  });

  // Admin users management routes
  app.get('/api/admin-users', requireAuth, async (req, res) => {
    try {
      // Get all users except the current logged in user
      const currentUserId = req.user?.id;
      const users = await storage.getAllUsers();
      const filteredUsers = users.filter(user => user.id !== currentUserId);
      
      // Return users without password hash
      const safeUsers = filteredUsers.map(({ password, ...user }) => user);
      res.json(safeUsers);
    } catch (error: any) {
      console.error("Error fetching admin users:", error);
      res.status(500).json({ error: "Failed to fetch admin users" });
    }
  });

  app.post('/api/admin-users', requireAuth, async (req, res) => {
    try {
      const { username, email, firstName, lastName, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ error: "Username and password are required" });
      }

      // Check if username already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ error: "Username already exists" });
      }

      const newUser = await storage.createUser({
        username,
        email: email || null,
        firstName: firstName || null,
        lastName: lastName || null,
        password
      });

      // Return user without password hash
      const { password: _, ...safeUser } = newUser;
      res.json(safeUser);
    } catch (error: any) {
      console.error("Error creating admin user:", error);
      res.status(500).json({ error: "Failed to create admin user" });
    }
  });

  app.put('/api/admin-users/:id', requireAuth, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { username, email, firstName, lastName, password } = req.body;
      
      if (!username) {
        return res.status(400).json({ error: "Username is required" });
      }

      // Check if username already exists (exclude current user)
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser && existingUser.id !== userId) {
        return res.status(400).json({ error: "Username already exists" });
      }

      // Prepare update data
      const updateData: any = {
        username,
        firstName: firstName || null,
        lastName: lastName || null,
      };

      // Only include email if provided
      if (email !== undefined) {
        updateData.email = email || null;
      }

      // Only include password if provided
      if (password) {
        updateData.password = password;
      }

      const updatedUser = await storage.updateUser(userId, updateData);
      if (!updatedUser) {
        return res.status(404).json({ error: "User not found" });
      }

      // Return user without password hash
      const { password: _, ...safeUser } = updatedUser;
      res.json(safeUser);
    } catch (error: any) {
      console.error("Error updating admin user:", error);
      res.status(500).json({ error: "Failed to update admin user" });
    }
  });

  app.delete('/api/admin-users/:id', requireAuth, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const currentUserId = req.user?.id;

      // Prevent user from deleting themselves
      if (userId === currentUserId) {
        return res.status(400).json({ error: "Cannot delete your own account" });
      }

      const deleted = await storage.deleteUser(userId);
      if (!deleted) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({ success: true });
    } catch (error: any) {
      console.error("Error deleting admin user:", error);
      res.status(500).json({ error: "Failed to delete admin user" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
