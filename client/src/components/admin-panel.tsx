import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Settings, 
  BarChart3, 
  FileText, 
  Plus, 
  Trash2, 
  Edit,
  Mail,
  MessageCircle,
  Users,
  UserPlus,
  GripHorizontal as Grip
} from "lucide-react";
import FormBuilder from "./form-builder";
import SmtpPanel from "./smtp-panel";
import WhatsappPanel from "./whatsapp-panel";
import AnalyticsPanel from "./analytics-panel";
import { PlanRecommendationRules } from "./plan-recommendation-rules";
import type { FormSubmission, HealthPlan, FormStep, User, PlanRecommendationRule } from "@shared/schema";

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState("form-builder");
  const [editingPlan, setEditingPlan] = useState<HealthPlan | null>(null);
  const [editingStep, setEditingStep] = useState<FormStep | null>(null);
  const [showStepBuilder, setShowStepBuilder] = useState(false);
  const [showUserForm, setShowUserForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const { toast } = useToast();

  // Force refresh users data when component mounts
  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ["/api/admin-users"] });
  }, []);

  // Fetch form submissions
  const { data: submissions = [], isLoading: submissionsLoading } = useQuery<FormSubmission[]>({
    queryKey: ["/api/form-submissions"],
  });

  // Fetch health plans
  const { data: healthPlans = [], isLoading: plansLoading } = useQuery<HealthPlan[]>({
    queryKey: ["/api/health-plans"],
  });

  // Fetch form steps
  const { data: formSteps = [], isLoading: stepsLoading } = useQuery<FormStep[]>({
    queryKey: ["/api/form-steps"],
  });

  // Fetch admin users
  const { data: adminUsers = [], isLoading: usersLoading, refetch: refetchUsers } = useQuery<(User & { isCurrentUser?: boolean })[]>({
    queryKey: ["/api/admin-users"],
    staleTime: 0,
  });

  // Create/Update health plan mutation
  const planMutation = useMutation({
    mutationFn: async (data: { plan: Partial<HealthPlan>; isEdit: boolean; id?: number }) => {
      const { plan, isEdit, id } = data;
      const url = isEdit ? `/api/health-plans/${id}` : "/api/health-plans";
      const method = isEdit ? "PUT" : "POST";
      const response = await apiRequest(method, url, plan);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Sucesso!",
        description: "Plano salvo com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/health-plans"] });
      setEditingPlan(null);
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao salvar plano.",
        variant: "destructive",
      });
    }
  });

  // Delete health plan mutation
  const deletePlanMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/health-plans/${id}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Sucesso!",
        description: "Plano excluído com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/health-plans"] });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao excluir plano.",
        variant: "destructive",
      });
    }
  });

  // Delete form step mutation
  const deleteStepMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/form-steps/${id}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Sucesso!",
        description: "Passo do formulário excluído com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/form-steps"] });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao excluir passo do formulário.",
        variant: "destructive",
      });
    }
  });

  // Create admin user mutation
  const createUserMutation = useMutation({
    mutationFn: async (userData: { username: string; password: string; email?: string; firstName?: string; lastName?: string }) => {
      const response = await apiRequest("POST", "/api/admin-users", userData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin-users"] });
      setShowUserForm(false);
      toast({
        title: "Sucesso!",
        description: "Usuário administrativo criado com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Falha ao criar usuário administrativo.",
        variant: "destructive",
      });
    },
  });

  // Update admin user mutation
  const updateUserMutation = useMutation({
    mutationFn: async (data: { id: number; userData: Partial<{ username: string; password: string; email: string; firstName: string; lastName: string }> }) => {
      const response = await apiRequest("PUT", `/api/admin-users/${data.id}`, data.userData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin-users"] });
      setEditingUser(null);
      toast({
        title: "Sucesso!",
        description: "Usuário administrativo atualizado com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Falha ao atualizar usuário administrativo.",
        variant: "destructive",
      });
    },
  });

  // Delete admin user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/admin-users/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin-users"] });
      toast({
        title: "Sucesso!",
        description: "Usuário administrativo excluído com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Falha ao excluir usuário administrativo.",
        variant: "destructive",
      });
    },
  });

  const handleSavePlan = (planData: Partial<HealthPlan>) => {
    planMutation.mutate({
      plan: planData,
      isEdit: !!editingPlan?.id,
      id: editingPlan?.id
    });
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Painel Administrativo</h1>
        <p className="text-gray-600">Gerencie formulários, planos e analise os dados dos usuários</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="form-builder" className="flex items-center space-x-2">
            <Settings className="w-4 h-4" />
            <span>Construtor de Formulário</span>
          </TabsTrigger>
          <TabsTrigger value="responses" className="flex items-center space-x-2">
            <BarChart3 className="w-4 h-4" />
            <span>Respostas & Analytics</span>
          </TabsTrigger>
          <TabsTrigger value="plans" className="flex items-center space-x-2">
            <FileText className="w-4 h-4" />
            <span>Gerenciar Planos</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center space-x-2">
            <Users className="w-4 h-4" />
            <span>Usuários</span>
          </TabsTrigger>
          <TabsTrigger value="whatsapp" className="flex items-center space-x-2">
            <MessageCircle className="w-4 h-4" />
            <span>Atendimento</span>
          </TabsTrigger>
          <TabsTrigger value="smtp" className="flex items-center space-x-2">
            <Mail className="w-4 h-4" />
            <span>SMTP</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="form-builder" className="space-y-6">
          {showStepBuilder ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">
                  {editingStep ? `Editar Passo ${editingStep.stepNumber}` : 'Criar Novo Passo'}
                </h2>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowStepBuilder(false);
                    setEditingStep(null);
                  }}
                >
                  Voltar à Lista
                </Button>
              </div>
              <FormBuilder 
                step={editingStep || undefined} 
                onSave={(stepData) => {
                  setShowStepBuilder(false);
                  setEditingStep(null);
                }}
              />
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Passos do Formulário</h2>
                <Button 
                  onClick={() => setShowStepBuilder(true)}
                  className="flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Criar Novo Passo</span>
                </Button>
              </div>
              
              <div className="grid gap-4">
                {stepsLoading ? (
                  <div>Carregando passos...</div>
                ) : formSteps.length === 0 ? (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        Nenhum passo criado
                      </h3>
                      <p className="text-gray-500 mb-4">
                        Comece criando o primeiro passo do seu formulário.
                      </p>
                      <Button onClick={() => setShowStepBuilder(true)}>
                        Criar Primeiro Passo
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  formSteps
                    .sort((a, b) => a.stepNumber - b.stepNumber)
                    .map((step) => (
                      <Card key={step.id}>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <div>
                              <CardTitle className="flex items-center space-x-2">
                                <Badge variant="outline">Passo {step.stepNumber}</Badge>
                                <span>{step.title}</span>
                              </CardTitle>
                              {step.description && (
                                <p className="text-sm text-gray-600 mt-1">{step.description}</p>
                              )}
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setEditingStep(step);
                                  setShowStepBuilder(true);
                                }}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  if (step.id && confirm('Tem certeza que deseja excluir este passo?')) {
                                    deleteStepMutation.mutate(step.id);
                                  }
                                }}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div>
                              <h4 className="font-medium text-sm text-gray-700 mb-2">
                                Campos ({step.fields?.length || 0})
                              </h4>
                              <div className="flex flex-wrap gap-2">
                                {step.fields?.map((field, index) => (
                                  <Badge key={index} className="text-xs bg-[#f5f5f5] text-gray-700 hover:bg-gray-200">
                                    {field.label} ({field.type})
                                  </Badge>
                                )) || <span className="text-sm text-gray-500">Nenhum campo</span>}
                              </div>
                            </div>
                            {step.navigationRules && step.navigationRules.length > 0 && (
                              <div>
                                <h4 className="font-medium text-sm text-gray-700 mb-2">
                                  Regras de Navegação ({step.navigationRules.length})
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                  {step.navigationRules.map((rule, index) => (
                                    <Badge key={index} className="text-xs text-[#ffffff] bg-[#4775cc]">
                                      {rule.condition.field} → Passo {rule.target.stepNumber || 'Final'}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))
                )}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="responses" className="space-y-6">
          <AnalyticsPanel />
        </TabsContent>

        <TabsContent value="plans" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Planos de Saúde</h2>
            <Button 
              onClick={() => setEditingPlan({
                name: "",
                description: "",
                monthlyPrice: "",
                features: [],
                coverage: "regional",
                isRecommended: false,
                targetPriceRange: "basic",
                logoUrl: null,
                recommendationRules: []
              } as any)}
              className="bg-gups-teal hover:bg-gups-teal/90"
            >
              <Plus className="w-4 h-4 mr-2" />
              Novo Plano
            </Button>
          </div>

          {/* Plan Form */}
          {editingPlan && (
            <Card>
              <CardHeader>
                <CardTitle>{editingPlan.id ? 'Editar Plano' : 'Novo Plano'}</CardTitle>
              </CardHeader>
              <CardContent>
                <PlanForm 
                  plan={editingPlan} 
                  onSave={handleSavePlan}
                  onCancel={() => setEditingPlan(null)}
                  isLoading={planMutation.isPending}
                />
              </CardContent>
            </Card>
          )}

          {/* Plans List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plansLoading ? (
              <div className="col-span-full text-center py-8">Carregando...</div>
            ) : healthPlans.length === 0 ? (
              <div className="col-span-full text-center py-8 text-gray-500">
                Nenhum plano encontrado
              </div>
            ) : (
              healthPlans.map((plan) => (
                <Card key={plan.id}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-semibold text-lg">{plan.name}</h3>
                        {plan.isRecommended && (
                          <Badge className="bg-green-100 text-green-800 mt-1">Recomendado</Badge>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingPlan(plan)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deletePlanMutation.mutate(plan.id)}
                          disabled={deletePlanMutation.isPending}
                          className="text-red-600 border-red-200 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-gray-600 mb-4">{plan.description}</p>
                    <div className="text-2xl font-bold text-gups-teal mb-2">
                      R$ {plan.monthlyPrice}
                      <span className="text-sm font-normal text-gray-500">/mês</span>
                    </div>
                    <div className="space-y-1">
                      {plan.features?.slice(0, 3).map((feature, index) => (
                        <div key={index} className="text-sm text-gray-600">• {feature}</div>
                      )) || []}
                      {plan.features && plan.features.length > 3 && (
                        <div className="text-sm text-gray-400">+{plan.features.length - 3} mais</div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Gerenciar Usuários Administrativos</h2>
                <p className="text-gray-600">Controle o acesso ao painel administrativo</p>
              </div>
              <Button 
                onClick={() => setShowUserForm(true)}
                className="bg-gups-teal hover:bg-gups-teal/90"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Novo Usuário
              </Button>
            </div>

            {usersLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-gray-500">Carregando usuários...</div>
              </div>
            ) : (
              <div className="space-y-4">
                {adminUsers.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    Nenhum usuário administrativo encontrado
                  </div>
                ) : (
                  adminUsers.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gups-teal rounded-full flex items-center justify-center text-white font-semibold">
                            {user.firstName ? user.firstName[0] : user.username[0]}
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">
                              {user.firstName && user.lastName 
                                ? `${user.firstName} ${user.lastName}` 
                                : user.username}
                            </h3>
                            <p className="text-gray-600">@{user.username}</p>
                            {user.email && (
                              <p className="text-sm text-gray-500">{user.email}</p>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className="bg-blue-100 text-blue-800">
                          Administrador
                        </Badge>
                        {user.isCurrentUser && (
                          <Badge className="bg-green-100 text-green-800">
                            Você
                          </Badge>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingUser(user)}
                          className="text-blue-600 border-blue-200 hover:bg-blue-50"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        {!user.isCurrentUser && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => deleteUserMutation.mutate(user.id)}
                            disabled={deleteUserMutation.isPending}
                            className="text-red-600 border-red-200 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* User Creation Form */}
            {showUserForm && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                  <h3 className="text-lg font-semibold mb-4">Criar Novo Usuário Administrativo</h3>
                  <UserForm 
                    onSave={(userData: { username: string; password: string; email?: string; firstName?: string; lastName?: string }) => createUserMutation.mutate(userData)}
                    onCancel={() => setShowUserForm(false)}
                    isLoading={createUserMutation.isPending}
                  />
                </div>
              </div>
            )}

            {/* User Edit Form */}
            {editingUser && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                  <h3 className="text-lg font-semibold mb-4">Editar Usuário Administrativo</h3>
                  <UserEditForm 
                    user={editingUser}
                    onSave={(userData: Partial<{ username: string; password: string; email: string; firstName: string; lastName: string }>) => 
                      updateUserMutation.mutate({ id: editingUser.id, userData })
                    }
                    onCancel={() => setEditingUser(null)}
                    isLoading={updateUserMutation.isPending}
                  />
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="whatsapp" className="space-y-6">
          <WhatsappPanel />
        </TabsContent>

        <TabsContent value="smtp" className="space-y-6">
          <SmtpPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// User Form Component
interface UserFormProps {
  onSave: (userData: { username: string; password: string; email?: string; firstName?: string; lastName?: string }) => void;
  onCancel: () => void;
  isLoading: boolean;
}

function UserForm({ onSave, onCancel, isLoading }: UserFormProps) {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    confirmPassword: "",
    email: "",
    firstName: "",
    lastName: ""
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.username.trim()) {
      newErrors.username = "Nome de usuário é obrigatório";
    } else if (formData.username.length < 3) {
      newErrors.username = "Nome de usuário deve ter pelo menos 3 caracteres";
    }

    if (!formData.password) {
      newErrors.password = "Senha é obrigatória";
    } else if (formData.password.length < 6) {
      newErrors.password = "Senha deve ter pelo menos 6 caracteres";
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Senhas não coincidem";
    }

    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "E-mail inválido";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      const { confirmPassword, ...userData } = formData;
      onSave(userData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="username">Nome de Usuário *</Label>
        <Input
          id="username"
          value={formData.username}
          onChange={(e) => setFormData({ ...formData, username: e.target.value })}
          className={errors.username ? "border-red-500" : ""}
          placeholder="Digite o nome de usuário"
        />
        {errors.username && <p className="text-sm text-red-500 mt-1">{errors.username}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="firstName">Nome</Label>
          <Input
            id="firstName"
            value={formData.firstName}
            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
            placeholder="Nome"
          />
        </div>
        <div>
          <Label htmlFor="lastName">Sobrenome</Label>
          <Input
            id="lastName"
            value={formData.lastName}
            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
            placeholder="Sobrenome"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="email">E-mail</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className={errors.email ? "border-red-500" : ""}
          placeholder="usuario@email.com"
        />
        {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email}</p>}
      </div>

      <div>
        <Label htmlFor="password">Senha *</Label>
        <Input
          id="password"
          type="password"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          className={errors.password ? "border-red-500" : ""}
          placeholder="Digite a senha"
        />
        {errors.password && <p className="text-sm text-red-500 mt-1">{errors.password}</p>}
      </div>

      <div>
        <Label htmlFor="confirmPassword">Confirmar Senha *</Label>
        <Input
          id="confirmPassword"
          type="password"
          value={formData.confirmPassword}
          onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
          className={errors.confirmPassword ? "border-red-500" : ""}
          placeholder="Confirme a senha"
        />
        {errors.confirmPassword && <p className="text-sm text-red-500 mt-1">{errors.confirmPassword}</p>}
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading} className="bg-gups-teal hover:bg-gups-teal/90">
          {isLoading ? "Criando..." : "Criar Usuário"}
        </Button>
      </div>
    </form>
  );
}

// User Edit Form Component
interface UserEditFormProps {
  user: User;
  onSave: (userData: Partial<{ username: string; password: string; email: string; firstName: string; lastName: string }>) => void;
  onCancel: () => void;
  isLoading: boolean;
}

function UserEditForm({ user, onSave, onCancel, isLoading }: UserEditFormProps) {
  const [formData, setFormData] = useState({
    username: user.username || "",
    email: user.email || "",
    confirmEmail: user.email || "",
    firstName: user.firstName || "",
    lastName: user.lastName || "",
    newPassword: "",
    confirmPassword: "",
    changePassword: false,
    changeEmail: false
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.username.trim()) {
      newErrors.username = "Nome de usuário é obrigatório";
    } else if (formData.username.length < 3) {
      newErrors.username = "Nome de usuário deve ter pelo menos 3 caracteres";
    }

    // Validação de e-mail se estiver sendo alterado
    if (formData.changeEmail) {
      if (!formData.email.trim()) {
        newErrors.email = "E-mail é obrigatório";
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = "E-mail inválido";
      }

      if (formData.email !== formData.confirmEmail) {
        newErrors.confirmEmail = "E-mails não coincidem";
      }
    }

    // Validação de senha se estiver sendo alterada
    if (formData.changePassword) {
      if (!formData.newPassword) {
        newErrors.newPassword = "Nova senha é obrigatória";
      } else if (formData.newPassword.length < 6) {
        newErrors.newPassword = "Nova senha deve ter pelo menos 6 caracteres";
      }

      if (formData.newPassword !== formData.confirmPassword) {
        newErrors.confirmPassword = "Senhas não coincidem";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      const updateData: Partial<{ username: string; password: string; email: string; firstName: string; lastName: string }> = {
        username: formData.username,
        firstName: formData.firstName,
        lastName: formData.lastName,
      };

      if (formData.changeEmail) {
        updateData.email = formData.email;
      }

      if (formData.changePassword) {
        updateData.password = formData.newPassword;
      }

      onSave(updateData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-96 overflow-y-auto">
      <div>
        <Label htmlFor="username">Nome de Usuário *</Label>
        <Input
          id="username"
          value={formData.username}
          onChange={(e) => setFormData({ ...formData, username: e.target.value })}
          className={errors.username ? "border-red-500" : ""}
        />
        {errors.username && <p className="text-sm text-red-500 mt-1">{errors.username}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="firstName">Nome</Label>
          <Input
            id="firstName"
            value={formData.firstName}
            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="lastName">Sobrenome</Label>
          <Input
            id="lastName"
            value={formData.lastName}
            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
          />
        </div>
      </div>

      {/* Seção de E-mail */}
      <div className="border-t pt-4">
        <div className="flex items-center space-x-2 mb-3">
          <input
            type="checkbox"
            id="changeEmail"
            checked={formData.changeEmail}
            onChange={(e) => setFormData({ ...formData, changeEmail: e.target.checked })}
            className="h-4 w-4 text-gups-teal rounded border-gray-300 focus:ring-gups-teal"
          />
          <Label htmlFor="changeEmail" className="text-sm font-medium">Alterar E-mail</Label>
        </div>

        {formData.changeEmail && (
          <div className="space-y-3">
            <div>
              <Label htmlFor="email">Novo E-mail *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={errors.email ? "border-red-500" : ""}
                placeholder="novo@email.com"
              />
              {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email}</p>}
            </div>
            <div>
              <Label htmlFor="confirmEmail">Confirmar Novo E-mail *</Label>
              <Input
                id="confirmEmail"
                type="email"
                value={formData.confirmEmail}
                onChange={(e) => setFormData({ ...formData, confirmEmail: e.target.value })}
                className={errors.confirmEmail ? "border-red-500" : ""}
                placeholder="Confirme o novo e-mail"
              />
              {errors.confirmEmail && <p className="text-sm text-red-500 mt-1">{errors.confirmEmail}</p>}
            </div>
          </div>
        )}
      </div>

      {/* Seção de Senha */}
      <div className="border-t pt-4">
        <div className="flex items-center space-x-2 mb-3">
          <input
            type="checkbox"
            id="changePassword"
            checked={formData.changePassword}
            onChange={(e) => setFormData({ ...formData, changePassword: e.target.checked })}
            className="h-4 w-4 text-gups-teal rounded border-gray-300 focus:ring-gups-teal"
          />
          <Label htmlFor="changePassword" className="text-sm font-medium">Alterar Senha</Label>
        </div>

        {formData.changePassword && (
          <div className="space-y-3">
            <div>
              <Label htmlFor="newPassword">Nova Senha *</Label>
              <Input
                id="newPassword"
                type="password"
                value={formData.newPassword}
                onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                className={errors.newPassword ? "border-red-500" : ""}
                placeholder="Digite a nova senha"
              />
              {errors.newPassword && <p className="text-sm text-red-500 mt-1">{errors.newPassword}</p>}
            </div>
            <div>
              <Label htmlFor="confirmPassword">Confirmar Nova Senha *</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className={errors.confirmPassword ? "border-red-500" : ""}
                placeholder="Confirme a nova senha"
              />
              {errors.confirmPassword && <p className="text-sm text-red-500 mt-1">{errors.confirmPassword}</p>}
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading} className="bg-gups-teal hover:bg-gups-teal/90">
          {isLoading ? "Salvando..." : "Salvar Alterações"}
        </Button>
      </div>
    </form>
  );
}

// Plan Form Component
interface PlanFormProps {
  plan: HealthPlan;
  onSave: (plan: Partial<HealthPlan>) => void;
  onCancel: () => void;
  isLoading: boolean;
}

function PlanForm({ plan, onSave, onCancel, isLoading }: PlanFormProps) {
  const [formData, setFormData] = useState({
    name: plan.name || "",
    description: plan.description || "",
    monthlyPrice: plan.monthlyPrice?.toString() || "",
    features: plan.features?.join(", ") || "",
    coverage: plan.coverage || "regional",
    isRecommended: plan.isRecommended || false,
    targetPriceRange: plan.targetPriceRange || "intermediate",
    logoUrl: plan.logoUrl || ""
  });
  
  const [recommendationRules, setRecommendationRules] = useState<PlanRecommendationRule[]>(
    plan.recommendationRules || []
  );
  
  const [activeTab, setActiveTab] = useState("basic");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      features: formData.features.split(",").map(f => f.trim()).filter(Boolean),
      logoUrl: formData.logoUrl || null,
      recommendationRules
    });
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="basic">Informações Básicas</TabsTrigger>
          <TabsTrigger value="rules">Regras de Recomendação</TabsTrigger>
        </TabsList>
        
        <TabsContent value="basic" className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="name">Nome do Plano</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="monthlyPrice">Preço Mensal (R$)</Label>
                <Input
                  id="monthlyPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.monthlyPrice}
                  onChange={(e) => setFormData({ ...formData, monthlyPrice: e.target.value })}
                  placeholder="710.45"
                  required
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="features">Características (separadas por vírgula)</Label>
                <Textarea
                  id="features"
                  value={formData.features}
                  onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                  placeholder="Cobertura Nacional, Telemedicina, Obstetrícia"
                />
              </div>
              <div>
                <Label htmlFor="coverage">Cobertura</Label>
                <select
                  id="coverage"
                  value={formData.coverage}
                  onChange={(e) => setFormData({ ...formData, coverage: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="regional">Regional</option>
                  <option value="nacional">Nacional</option>
                  <option value="internacional">Internacional</option>
                </select>
              </div>
              <div>
                <Label htmlFor="targetPriceRange">Faixa de Preço Alvo</Label>
                <select
                  id="targetPriceRange"
                  value={formData.targetPriceRange}
                  onChange={(e) => setFormData({ ...formData, targetPriceRange: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="basic">Básico</option>
                  <option value="intermediate">Intermediário</option>
                  <option value="premium">Premium</option>
                  <option value="executive">Executivo</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="logoUrl">URL da Logo</Label>
                <Input
                  id="logoUrl"
                  value={formData.logoUrl || ""}
                  onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                  placeholder="https://example.com/logo.png"
                />
                <p className="text-xs text-gray-500 mt-1">
                  URL da imagem da logo do plano (opcional)
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isRecommended"
                checked={formData.isRecommended}
                onChange={(e) => setFormData({ ...formData, isRecommended: e.target.checked })}
                className="h-4 w-4 text-gups-teal rounded border-gray-300 focus:ring-gups-teal"
              />
              <Label htmlFor="isRecommended">Marcar como recomendado</Label>
            </div>

            <div className="flex justify-end space-x-4">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading} className="bg-gups-teal hover:bg-gups-teal/90">
                {isLoading ? "Salvando..." : "Salvar Plano"}
              </Button>
            </div>
          </form>
        </TabsContent>
        
        <TabsContent value="rules" className="space-y-6">
          <PlanRecommendationRules 
            rules={recommendationRules}
            onRulesChange={setRecommendationRules}
          />
          <div className="flex justify-end space-x-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
            <Button 
              type="button" 
              disabled={isLoading} 
              className="bg-gups-teal hover:bg-gups-teal/90"
              onClick={handleSubmit}
            >
              {isLoading ? "Salvando..." : "Salvar Plano"}
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
