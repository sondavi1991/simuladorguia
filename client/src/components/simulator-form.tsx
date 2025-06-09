import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import FormStep from "@/components/form-step";
import PlanCard from "@/components/plan-card";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useFormState } from "@/hooks/use-form-state";
import type { HealthPlan } from "@shared/schema";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";

const formSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  phone: z.string().min(10, "Telefone deve ter pelo menos 10 caracteres"),
  birthDate: z.string().min(1, "Data de nascimento é obrigatória"),
  zipCode: z.string().min(8, "CEP deve ter 8 caracteres"),
  planType: z.enum(["individual", "couple", "family"]),
  priceRange: z.enum(["basic", "intermediate", "premium", "executive"]),
  services: z.array(z.string()).default([]),
  dependents: z.array(z.object({
    name: z.string(),
    birthDate: z.string(),
    relationship: z.string()
  })).default([])
});

type FormData = z.infer<typeof formSchema>;

const TOTAL_STEPS = 4;

export default function SimulatorForm() {
  const { currentStep, setCurrentStep, formData, updateFormData } = useFormState();
  const [recommendations, setRecommendations] = useState<HealthPlan[]>([]);
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      birthDate: "",
      zipCode: "",
      planType: "individual",
      priceRange: "intermediate",
      services: [],
      dependents: []
    }
  });

  const submitMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await apiRequest("POST", "/api/form-submissions", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Sucesso!",
        description: "Suas informações foram enviadas com sucesso. Em breve você receberá contato de nossos consultores.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/form-submissions"] });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao enviar suas informações. Tente novamente.",
        variant: "destructive",
      });
    }
  });

  const getRecommendations = async (data: FormData) => {
    try {
      const response = await apiRequest("POST", "/api/recommendations", {
        priceRange: data.priceRange,
        services: data.services
      });
      const plans = await response.json();
      setRecommendations(plans);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível obter recomendações. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const validateCurrentStep = () => {
    const data = form.getValues();
    
    switch (currentStep) {
      case 1:
        return data.name && data.email && data.phone && data.birthDate && data.zipCode;
      case 2:
        return data.planType;
      case 3:
        return data.priceRange;
      default:
        return true;
    }
  };

  const handleNext = async () => {
    if (!validateCurrentStep()) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos obrigatórios antes de continuar.",
        variant: "destructive",
      });
      return;
    }

    const data = form.getValues();
    updateFormData(data);

    if (currentStep < TOTAL_STEPS) {
      if (currentStep === 3) {
        // Get recommendations before showing results
        await getRecommendations(data);
      }
      setCurrentStep(currentStep + 1);
    } else {
      // Submit form
      submitMutation.mutate(data);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const progressPercentage = (currentStep / TOTAL_STEPS) * 100;

  return (
    <div className="space-y-8">
      {/* Progress Bar */}
      <div>
        <div className="flex items-center justify-between text-sm font-medium text-gray-500 mb-2">
          <span>Progresso</span>
          <span>Passo {currentStep} de {TOTAL_STEPS}</span>
        </div>
        <Progress value={progressPercentage} className="h-2" />
      </div>

      {/* Form Steps Container */}
      <Card className="overflow-hidden shadow-xl">
        <CardContent className="p-8">
          <FormStep
            currentStep={currentStep}
            form={form}
            recommendations={recommendations}
          />
        </CardContent>

        {/* Form Navigation */}
        <div className="px-8 py-6 bg-gray-50 flex justify-between items-center">
          <Button
            variant="ghost"
            onClick={handlePrevious}
            disabled={currentStep === 1}
            className={currentStep === 1 ? "invisible" : ""}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          
          <div className="flex-1" />
          
          <Button
            onClick={handleNext}
            disabled={submitMutation.isPending}
            className="bg-gups-teal hover:bg-gups-teal/90"
          >
            {currentStep === TOTAL_STEPS ? (
              <>
                Finalizar
                <Check className="w-4 h-4 ml-2" />
              </>
            ) : (
              <>
                Próximo
                <ChevronRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </Card>
    </div>
  );
}
