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
  GripHorizontal as Grip
} from "lucide-react";
import type { FormSubmission, HealthPlan } from "@shared/schema";

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState("form-builder");
  const [editingPlan, setEditingPlan] = useState<HealthPlan | null>(null);
  const { toast } = useToast();

  // Fetch form submissions
  const { data: submissions = [], isLoading: submissionsLoading } = useQuery<FormSubmission[]>({
    queryKey: ["/api/form-submissions"],
  });

  // Fetch health plans
  const { data: healthPlans = [], isLoading: plansLoading } = useQuery<HealthPlan[]>({
    queryKey: ["/api/health-plans"],
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
        <TabsList className="grid w-full grid-cols-3">
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
        </TabsList>

        <TabsContent value="form-builder" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Construtor de Formulário</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Component Library */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-4">Componentes Disponíveis</h3>
                  <div className="space-y-2">
                    {[
                      { icon: "📝", name: "Campo de Texto", type: "text-input" },
                      { icon: "🔘", name: "Múltipla Escolha", type: "radio-group" },
                      { icon: "☑️", name: "Caixas de Seleção", type: "checkbox-group" },
                      { icon: "📋", name: "Lista Suspensa", type: "dropdown" },
                      { icon: "🔀", name: "Lógica Condicional", type: "conditional-logic" }
                    ].map((component) => (
                      <div
                        key={component.type}
                        className="bg-white p-3 rounded border cursor-move hover:shadow-sm flex items-center space-x-3"
                        draggable
                      >
                        <span className="text-lg">{component.icon}</span>
                        <span className="text-sm">{component.name}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Form Builder Canvas */}
                <div className="lg:col-span-2">
                  <div className="bg-white border-2 border-dashed border-gray-300 rounded-lg min-h-96 p-6 flex items-center justify-center">
                    <div className="text-center text-gray-500">
                      <Grip className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                      <p>Arraste componentes aqui para construir seu formulário</p>
                      <p className="text-sm mt-2">Funcionalidade completa em desenvolvimento</p>
                    </div>
                  </div>
                  
                  {/* Conditional Logic Panel */}
                  <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-900 mb-2">Lógica Condicional Ativa</h4>
                    <div className="text-sm text-blue-700 space-y-1">
                      <p><strong>Se</strong> "Tipo de Plano" = "Familiar" <strong>então</strong> mostrar "Dependentes"</p>
                      <p><strong>Se</strong> "Faixa de Preço" ≥ "Premium" <strong>então</strong> mostrar "Serviços Premium"</p>
                    </div>
                    <Button size="sm" variant="outline" className="mt-2 text-blue-600 border-blue-200">
                      + Adicionar Regra
                    </Button>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-end space-x-4">
                <Button variant="outline">Visualizar</Button>
                <Button className="bg-gups-teal hover:bg-gups-teal/90">Salvar Alterações</Button>
              </div>
            </CardContent>
          </Card>
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
                      {plan.features.slice(0, 3).map((feature, index) => (
                        <div key={index} className="text-sm text-gray-600">• {feature}</div>
                      ))}
                      {plan.features.length > 3 && (
                        <div className="text-sm text-gray-400">+{plan.features.length - 3} mais</div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
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
