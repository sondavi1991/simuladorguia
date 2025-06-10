import { useState } from "react";
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
  GripHorizontal as Grip
} from "lucide-react";
import FormBuilder from "./form-builder";
import SmtpPanel from "./smtp-panel";
import type { FormSubmission, HealthPlan, FormStep } from "@shared/schema";

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState("form-builder");
  const [editingPlan, setEditingPlan] = useState<HealthPlan | null>(null);
  const [editingStep, setEditingStep] = useState<FormStep | null>(null);
  const [showStepBuilder, setShowStepBuilder] = useState(false);
  const { toast } = useToast();

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

  const handleSavePlan = (planData: Partial<HealthPlan>) => {
    planMutation.mutate({
      plan: planData,
      isEdit: !!editingPlan,
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
        <TabsList className="grid w-full grid-cols-4">
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
                                  <Badge key={index} variant="secondary" className="text-xs">
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
                                    <Badge key={index} variant="outline" className="text-xs">
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Card>
              <CardContent className="p-6">
                <div className="text-2xl font-bold text-gups-teal">{submissions.length}</div>
                <p className="text-sm text-gray-600">Total de Respostas</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="text-2xl font-bold text-green-600">
                  {submissions.filter(s => s.priceRange === 'premium').length}
                </div>
                <p className="text-sm text-gray-600">Interessados Premium</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="text-2xl font-bold text-blue-600">
                  {submissions.filter(s => s.planType === 'family').length}
                </div>
                <p className="text-sm text-gray-600">Planos Familiares</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Respostas Recentes</CardTitle>
            </CardHeader>
            <CardContent>
              {submissionsLoading ? (
                <div className="text-center py-8">Carregando...</div>
              ) : submissions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Nenhuma resposta encontrada
                </div>
              ) : (
                <div className="space-y-4">
                  {submissions.slice(0, 10).map((submission) => (
                    <div key={submission.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold">{submission.name}</h4>
                          <p className="text-sm text-gray-600">{submission.email} • {submission.phone}</p>
                          <div className="flex space-x-2 mt-2">
                            <Badge variant="outline">{submission.planType}</Badge>
                            <Badge variant="outline">{submission.priceRange}</Badge>
                          </div>
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(submission.submittedAt).toLocaleDateString('pt-BR')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="plans" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Planos de Saúde</h2>
            <Button 
              onClick={() => setEditingPlan({} as HealthPlan)}
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

        <TabsContent value="smtp" className="space-y-6">
          <SmtpPanel />
        </TabsContent>
      </Tabs>
    </div>
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
    monthlyPrice: plan.monthlyPrice || 0,
    features: plan.features?.join(", ") || "",
    coverage: plan.coverage || "regional",
    isRecommended: plan.isRecommended || false,
    targetPriceRange: plan.targetPriceRange || "intermediate"
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      features: formData.features.split(",").map(f => f.trim()).filter(Boolean)
    });
  };

  return (
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
            value={formData.monthlyPrice}
            onChange={(e) => setFormData({ ...formData, monthlyPrice: parseInt(e.target.value) || 0 })}
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
  );
}
