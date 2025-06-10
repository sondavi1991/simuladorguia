import { useQuery } from "@tanstack/react-query";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Heart, Shield, Users } from "lucide-react";
import type { HealthPlan } from "@shared/schema";

interface PlanSelectorProps {
  selectedPlanIds: number[];
  onPlanSelectionChange: (planIds: number[]) => void;
}

export default function PlanSelector({ selectedPlanIds, onPlanSelectionChange }: PlanSelectorProps) {
  const { data: healthPlans = [], isLoading } = useQuery<HealthPlan[]>({
    queryKey: ["/api/health-plans"],
  });

  const handlePlanToggle = (planId: number, checked: boolean) => {
    if (checked) {
      onPlanSelectionChange([...selectedPlanIds, planId]);
    } else {
      onPlanSelectionChange(selectedPlanIds.filter(id => id !== planId));
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-sm text-gray-500 mt-2">Carregando planos...</p>
      </div>
    );
  }

  if (healthPlans.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Heart className="w-8 h-8 mx-auto text-gray-400 mb-2" />
          <p className="text-sm text-gray-500">
            Nenhum plano de saúde cadastrado. Cadastre planos na aba "Gerenciar Planos".
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3">
        {healthPlans.map((plan) => (
          <Card key={plan.id} className={`transition-colors ${selectedPlanIds.includes(plan.id!) ? 'border-blue-500 bg-blue-50' : ''}`}>
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id={`plan-${plan.id}`}
                  checked={selectedPlanIds.includes(plan.id!)}
                  onCheckedChange={(checked) => handlePlanToggle(plan.id!, checked as boolean)}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <Label htmlFor={`plan-${plan.id}`} className="font-medium cursor-pointer">
                      {plan.name}
                    </Label>
                    <div className="flex items-center space-x-2">
                      {plan.isRecommended && (
                        <Badge className="text-xs text-[#f7f7f7] bg-[#29690e]">
                          <Shield className="w-3 h-3 mr-1" />
                          Recomendado
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-xs">
                        R$ {plan.monthlyPrice}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{plan.description}</p>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center text-xs text-gray-500">
                      <Users className="w-3 h-3 mr-1" />
                      {plan.coverage}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {plan.features?.slice(0, 2).map((feature, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                      {plan.features && plan.features.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{plan.features.length - 2} mais
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {selectedPlanIds.length > 0 && (
        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-800">
            <strong>{selectedPlanIds.length}</strong> plano(s) selecionado(s) para este passo.
            Estes planos aparecerão nas recomendações quando o usuário chegar aqui.
          </p>
        </div>
      )}
    </div>
  );
}