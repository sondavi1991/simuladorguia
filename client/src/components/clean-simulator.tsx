import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { MessageCircle, ExternalLink } from "lucide-react";
import type { FormStep, HealthPlan, FormField, StepNavigation } from "@shared/schema";
import guiaUnicoLogo from "@assets/logo-guia-unico-scaled_1749516567711.png";

interface NavigationState {
  currentStep: number;
  formData: Record<string, any>;
  completedSteps: number[];
  recommendations: HealthPlan[];
  isComplete: boolean;
}

export default function CleanSimulator() {
  const { toast } = useToast();
  
  const [navigationState, setNavigationState] = useState<NavigationState>({
    currentStep: 1,
    formData: {},
    completedSteps: [],
    recommendations: [],
    isComplete: false
  });

  // Fetch form steps
  const { data: formSteps = [], isLoading: stepsLoading } = useQuery<FormStep[]>({
    queryKey: ["/api/form-steps"],
  });

  // Fetch health plans
  const { data: healthPlans = [], isLoading: plansLoading } = useQuery<HealthPlan[]>({
    queryKey: ["/api/health-plans"],
  });

  // Submit form mutation
  const submitFormMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/form-submissions", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Simulação enviada com sucesso!",
        description: "Encontramos os melhores planos para você.",
      });
    },
    onError: (error) => {
      console.error("Submission error:", error);
      toast({
        title: "Erro",
        description: "Erro ao enviar simulação. Tente novamente.",
        variant: "destructive",
      });
    }
  });

  const currentStepData = formSteps.find((step: FormStep) => step.stepNumber === navigationState.currentStep);

  const evaluateCondition = (rule: StepNavigation, formData: Record<string, any>): boolean => {
    const { field, operator, value } = rule.condition;
    const fieldValue = formData[field];

    switch (operator) {
      case 'equals':
        return fieldValue === value;
      case 'not_equals':
        return fieldValue !== value;
      case 'contains':
        return fieldValue && fieldValue.includes(value);
      case 'selected':
        if (Array.isArray(value) && Array.isArray(fieldValue)) {
          return value.some(v => fieldValue.includes(v));
        }
        return Array.isArray(fieldValue) ? fieldValue.includes(value) : false;
      case 'not_selected':
        if (Array.isArray(value) && Array.isArray(fieldValue)) {
          return !value.some(v => fieldValue.includes(v));
        }
        return Array.isArray(fieldValue) ? !fieldValue.includes(value) : true;
      case 'greater_than':
        return Number(fieldValue) > Number(value);
      case 'less_than':
        return Number(fieldValue) < Number(value);
      default:
        return false;
    }
  };

  const getFilteredRecommendations = (formData: Record<string, any>): HealthPlan[] => {
    const priceRange = formData.priceRange || formData.faixaPreco;
    const services = formData.services || formData.servicos || [];
    
    return healthPlans.filter((plan: HealthPlan) => {
      const matchesPriceRange = !priceRange || plan.targetPriceRange === priceRange;
      const matchesServices = !services.length || 
        (plan.features && services.some((service: string) => 
          plan.features?.some((feature: string) => 
            feature.toLowerCase().includes(service.toLowerCase())
          )
        ));
      
      return matchesPriceRange || matchesServices;
    }).sort((a: HealthPlan, b: HealthPlan) => {
      if (a.isRecommended && !b.isRecommended) return -1;
      if (!a.isRecommended && b.isRecommended) return 1;
      return a.monthlyPrice - b.monthlyPrice;
    });
  };

  const processNavigation = (stepData: FormStep, formData: Record<string, any>) => {
    if (!stepData.navigationRules || stepData.navigationRules.length === 0) {
      const nextStep = formSteps
        .filter((step: FormStep) => step.stepNumber > navigationState.currentStep)
        .sort((a: FormStep, b: FormStep) => a.stepNumber - b.stepNumber)[0];
      
      if (nextStep) {
        setNavigationState(prev => ({
          ...prev,
          currentStep: nextStep.stepNumber,
          completedSteps: [...prev.completedSteps, prev.currentStep]
        }));
      } else {
        completeForm(stepData, formData);
      }
      return;
    }

    const applicableRule = stepData.navigationRules
      .sort((a, b) => (b.priority || 0) - (a.priority || 0))
      .find(rule => evaluateCondition(rule, formData));

    if (applicableRule) {
      if (applicableRule.target.type === 'step' && applicableRule.target.stepNumber) {
        setNavigationState(prev => ({
          ...prev,
          currentStep: applicableRule.target.stepNumber!,
          completedSteps: [...prev.completedSteps, prev.currentStep]
        }));
      } else if (applicableRule.target.type === 'end') {
        completeForm(stepData, formData);
      }
    } else {
      const nextStep = formSteps
        .filter((step: FormStep) => step.stepNumber > navigationState.currentStep)
        .sort((a: FormStep, b: FormStep) => a.stepNumber - b.stepNumber)[0];
      
      if (nextStep) {
        setNavigationState(prev => ({
          ...prev,
          currentStep: nextStep.stepNumber,
          completedSteps: [...prev.completedSteps, prev.currentStep]
        }));
      } else {
        completeForm(stepData, formData);
      }
    }
  };

  const completeForm = (stepData: FormStep, formData: Record<string, any>) => {
    const recommendations = getFilteredRecommendations(formData);
    
    setNavigationState(prev => ({
      ...prev,
      isComplete: true,
      recommendations,
      completedSteps: [...prev.completedSteps, prev.currentStep]
    }));

    // Submit form data
    const submissionData = {
      name: formData.nome || formData.name || "",
      email: formData.email || "",
      phone: formData.telefone || formData.phone || "",
      birthDate: formData.dataNascimento || formData.birthDate || "",
      zipCode: formData.cep || formData.zipCode || "",
      planType: formData.tipoPlano || formData.planType || "individual",
      priceRange: formData.faixaPreco || formData.priceRange || "basic",
      services: Array.isArray(formData.servicos) ? formData.servicos : 
                Array.isArray(formData.services) ? formData.services : [],
      dependents: formData.dependentes || formData.dependents || []
    };

    submitFormMutation.mutate(submissionData);
  };

  const handleFieldChange = (fieldId: string, value: any) => {
    setNavigationState(prev => ({
      ...prev,
      formData: { ...prev.formData, [fieldId]: value }
    }));
  };

  const handleNext = () => {
    if (!currentStepData) return;
    
    const updatedFormData = { ...navigationState.formData };
    processNavigation(currentStepData, updatedFormData);
  };

  const handleWhatsAppContact = async (plan: HealthPlan) => {
    try {
      const response = await apiRequest("POST", "/api/whatsapp/contact", {
        planName: plan.name,
        userName: navigationState.formData.nome || navigationState.formData.name || "Cliente",
        userPhone: navigationState.formData.telefone || navigationState.formData.phone || ""
      });
      
      const result = await response.json();
      if (result.whatsappUrl) {
        window.open(result.whatsappUrl, '_blank');
      }
      
      toast({
        title: "Redirecionando para WhatsApp",
        description: `Você será conectado com nosso atendente para o plano ${plan.name}.`,
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao conectar com WhatsApp. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const renderField = (field: FormField) => {
    const value = navigationState.formData[field.id] || "";

    switch (field.type) {
      case 'text':
      case 'email':
      case 'tel':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id} className="text-sm font-medium text-secondary">
              {field.label}
            </Label>
            <Input
              id={field.id}
              type={field.type}
              placeholder={field.placeholder}
              value={value}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              required={field.required}
              className="border-gray-custom focus:border-primary"
            />
          </div>
        );

      case 'date':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id} className="text-sm font-medium text-secondary">
              {field.label}
            </Label>
            <Input
              id={field.id}
              type="date"
              value={value}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              required={field.required}
              className="border-gray-custom focus:border-primary"
            />
          </div>
        );

      case 'radio':
        return (
          <div key={field.id} className="space-y-3">
            <Label className="text-sm font-medium text-secondary">{field.label}</Label>
            <RadioGroup
              value={value}
              onValueChange={(newValue) => handleFieldChange(field.id, newValue)}
              className="space-y-2"
            >
              {field.options?.map((option, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <RadioGroupItem value={option} id={`${field.id}-${index}`} />
                  <Label htmlFor={`${field.id}-${index}`} className="text-sm cursor-pointer">
                    {option}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        );

      case 'checkbox':
        const selectedValues = Array.isArray(value) ? value : [];
        return (
          <div key={field.id} className="space-y-3">
            <Label className="text-sm font-medium text-secondary">{field.label}</Label>
            <div className="space-y-2">
              {field.options?.map((option, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <Checkbox
                    id={`${field.id}-${index}`}
                    checked={selectedValues.includes(option)}
                    onCheckedChange={(checked) => {
                      const newValues = checked
                        ? [...selectedValues, option]
                        : selectedValues.filter(v => v !== option);
                      handleFieldChange(field.id, newValues);
                    }}
                  />
                  <Label htmlFor={`${field.id}-${index}`} className="text-sm cursor-pointer">
                    {option}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        );

      case 'select':
        return (
          <div key={field.id} className="space-y-2">
            <Label className="text-sm font-medium text-secondary">{field.label}</Label>
            <Select value={value} onValueChange={(newValue) => handleFieldChange(field.id, newValue)}>
              <SelectTrigger className="border-gray-custom focus:border-primary">
                <SelectValue placeholder={field.placeholder || "Selecione uma opção"} />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map((option, index) => (
                  <SelectItem key={index} value={option}>{option}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );

      case 'heading':
        const HeadingTag = (field.headingLevel || 'h2') as keyof JSX.IntrinsicElements;
        return (
          <div key={field.id} className="space-y-2">
            <HeadingTag className="text-lg font-semibold text-secondary">
              {field.content || field.label}
            </HeadingTag>
          </div>
        );

      case 'paragraph':
        return (
          <div key={field.id} className="space-y-2">
            <p className="text-sm text-gray-600">
              {field.content || field.label}
            </p>
          </div>
        );

      case 'image':
        return (
          <div key={field.id} className="space-y-2">
            {field.imageUrl && (
              <img
                src={field.imageUrl}
                alt={field.label}
                className="max-w-full h-auto rounded-lg"
              />
            )}
          </div>
        );

      default:
        return null;
    }
  };

  if (stepsLoading || plansLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-gray-600">Carregando simulador...</p>
        </div>
      </div>
    );
  }

  if (navigationState.isComplete) {
    return (
      <div className="min-h-screen bg-white">
        {/* Header */}
        <div className="bg-white border-b border-gray-custom">
          <div className="max-w-4xl mx-auto px-6 py-4">
            <div className="flex items-center space-x-4">
              <img src={guiaUnicoLogo} alt="Guia Único" className="h-12 w-auto" />
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="max-w-4xl mx-auto px-6 py-12">
          <div className="text-center mb-12">
            <h1 className="text-3xl font-bold text-secondary mb-4">
              Seus Planos Recomendados
            </h1>
            <p className="text-lg text-gray-600">
              Encontramos os melhores planos de saúde baseados no seu perfil
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {navigationState.recommendations.map((plan) => (
              <Card key={plan.id} className="border-gray-custom hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      {plan.logoUrl && (
                        <img src={plan.logoUrl} alt={plan.name} className="h-8 w-8 object-contain" />
                      )}
                      <h3 className="font-semibold text-lg text-secondary">{plan.name}</h3>
                    </div>
                    {plan.isRecommended && (
                      <span className="bg-primary text-white text-xs px-2 py-1 rounded-full">
                        Recomendado
                      </span>
                    )}
                  </div>
                  
                  <p className="text-gray-600 mb-4 text-sm">{plan.description}</p>
                  
                  <div className="text-2xl font-bold text-primary mb-4">
                    R$ {plan.monthlyPrice}
                    <span className="text-sm font-normal text-gray-500">/mês</span>
                  </div>
                  
                  <div className="space-y-2 mb-6">
                    {plan.features?.slice(0, 3).map((feature, index) => (
                      <div key={index} className="text-sm text-gray-600">
                        • {feature}
                      </div>
                    ))}
                    {plan.features && plan.features.length > 3 && (
                      <div className="text-sm text-gray-400">
                        +{plan.features.length - 3} benefícios adicionais
                      </div>
                    )}
                  </div>
                  
                  <Button
                    onClick={() => handleWhatsAppContact(plan)}
                    className="w-full bg-primary hover:bg-primary/90 text-white"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Contratar via WhatsApp
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {navigationState.recommendations.length === 0 && (
            <div className="text-center py-12">
              <h3 className="text-xl font-semibold text-secondary mb-4">
                Nenhum plano encontrado
              </h3>
              <p className="text-gray-600 mb-6">
                Não encontramos planos que correspondam exatamente ao seu perfil, 
                mas nossos especialistas podem ajudá-lo a encontrar a melhor opção.
              </p>
              <Button
                onClick={() => handleWhatsAppContact({
                  id: 0,
                  name: "Consultoria Personalizada",
                  description: "Atendimento especializado",
                  monthlyPrice: 0,
                  features: [],
                  coverage: "",
                  isRecommended: false,
                  targetPriceRange: "",
                  logoUrl: null
                })}
                className="bg-primary hover:bg-primary/90 text-white"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Falar com Especialista
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!currentStepData) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-secondary mb-4">
            Nenhum passo configurado
          </h2>
          <p className="text-gray-600">
            O formulário ainda não foi configurado. Entre em contato conosco.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-custom">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="flex items-center space-x-4">
            <img src={guiaUnicoLogo} alt="Guia Único" className="h-16 w-auto" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-secondary mb-4">
            Simulador - Guia Único dos planos de saúde
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Encontre seu plano de saúde ideal com nosso simulador, faça sua simulação gratuita e rápida conosco
          </p>
        </div>

        {/* Form Step */}
        <Card className="border-gray-custom shadow-lg">
          <CardContent className="p-8">
            <div className="space-y-6">
              {currentStepData.fields?.map(renderField)}
              
              <div className="flex justify-end pt-6">
                <Button
                  onClick={handleNext}
                  disabled={submitFormMutation.isPending}
                  className="bg-primary hover:bg-primary/90 text-white px-8 py-3 text-lg"
                >
                  {submitFormMutation.isPending ? "Processando..." : "Continuar"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}