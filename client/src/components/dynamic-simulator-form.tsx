import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { openWhatsApp } from "@/lib/whatsapp";
import { ArrowLeft, ArrowRight, MessageCircle, CheckCircle, Users, Heart, Shield } from "lucide-react";
import type { FormStep, FormField, StepNavigation, HealthPlan } from "@shared/schema";
import PlanCard from "./plan-card";

interface NavigationState {
  currentStep: number;
  formData: Record<string, any>;
  completedSteps: number[];
  recommendations: HealthPlan[];
  isComplete: boolean;
}

export default function DynamicSimulatorForm() {
  const [navigationState, setNavigationState] = useState<NavigationState>({
    currentStep: 1,
    formData: {},
    completedSteps: [],
    recommendations: [],
    isComplete: false
  });

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm();
  const { toast } = useToast();

  // Fetch all form steps
  const { data: formSteps = [], isLoading: stepsLoading } = useQuery<FormStep[]>({
    queryKey: ["/api/form-steps"],
  });

  // Fetch health plans for recommendations
  const { data: healthPlans = [] } = useQuery<HealthPlan[]>({
    queryKey: ["/api/health-plans"],
  });

  // Submit form data mutation
  const submitFormMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/form-submissions", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Formulário enviado!",
        description: "Suas informações foram salvas com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao enviar formulário.",
        variant: "destructive",
      });
    }
  });

  const currentStepData = formSteps.find((step: FormStep) => step.stepNumber === navigationState.currentStep);

  // Process navigation based on current step data and form values
  const processNavigation = (stepData: FormStep, formData: Record<string, any>) => {
    if (!stepData.navigationRules || stepData.navigationRules.length === 0) {
      // No navigation rules, go to next step or complete
      const nextStep = formSteps
        .filter((step: FormStep) => step.stepNumber > navigationState.currentStep)
        .sort((a: FormStep, b: FormStep) => a.stepNumber - b.stepNumber)[0];
      
      if (nextStep) {
        setNavigationState(prev => ({
          ...prev,
          currentStep: nextStep.stepNumber,
          completedSteps: [...prev.completedSteps, navigationState.currentStep]
        }));
      } else {
        // Complete the form
        completeForm(formData);
      }
      return;
    }

    // Evaluate navigation rules
    const applicableRule = stepData.navigationRules
      .sort((a, b) => b.priority - a.priority)
      .find(rule => evaluateCondition(rule, formData));

    if (applicableRule) {
      if (applicableRule.target.type === 'step' && applicableRule.target.stepNumber) {
        setNavigationState(prev => ({
          ...prev,
          currentStep: applicableRule.target.stepNumber!,
          completedSteps: [...prev.completedSteps, navigationState.currentStep]
        }));
      } else if (applicableRule.target.type === 'end') {
        completeForm(formData);
      }
    } else {
      // No matching rule, proceed to next step
      const nextStep = formSteps
        .filter((step: FormStep) => step.stepNumber > navigationState.currentStep)
        .sort((a: FormStep, b: FormStep) => a.stepNumber - b.stepNumber)[0];
      
      if (nextStep) {
        setNavigationState(prev => ({
          ...prev,
          currentStep: nextStep.stepNumber,
          completedSteps: [...prev.completedSteps, navigationState.currentStep]
        }));
      } else {
        completeForm(formData);
      }
    }
  };

  // Evaluate a single navigation condition
  const evaluateCondition = (rule: StepNavigation, formData: Record<string, any>): boolean => {
    const fieldValue = formData[rule.condition.field];
    const conditionValue = rule.condition.value;

    switch (rule.condition.operator) {
      case 'equals':
        return fieldValue === conditionValue;
      case 'not_equals':
        return fieldValue !== conditionValue;
      case 'contains':
        return typeof fieldValue === 'string' && fieldValue.includes(String(conditionValue));
      case 'selected':
        if (Array.isArray(conditionValue)) {
          return conditionValue.includes(fieldValue);
        }
        return fieldValue === conditionValue;
      case 'not_selected':
        if (Array.isArray(conditionValue)) {
          return !conditionValue.includes(fieldValue);
        }
        return fieldValue !== conditionValue;
      default:
        return false;
    }
  };

  // Complete form and generate recommendations
  const completeForm = (formData: Record<string, any>) => {
    const recommendations = generateRecommendations(formData);
    setNavigationState(prev => ({
      ...prev,
      recommendations,
      isComplete: true,
      completedSteps: [...prev.completedSteps, navigationState.currentStep]
    }));

    // Submit form data to backend
    submitFormMutation.mutate(formData);
  };

  // Generate plan recommendations based on form data
  const generateRecommendations = (formData: Record<string, any>): HealthPlan[] => {
    if (healthPlans.length === 0) return [];

    // Extract key factors from form data
    const priceRange = formData.faixa_preco || formData.orcamento || formData.priceRange || '';
    const age = formData.idade || formData.age || '';
    const services = formData.servicos || formData.services || [];
    const dependents = formData.dependentes || formData.dependents || [];

    // Filter and score plans based on user responses
    return healthPlans.filter((plan: HealthPlan) => {
      // Filter by price range if specified
      if (priceRange && plan.targetPriceRange) {
        const priceMatches = [
          'até R$ 200',
          'R$ 200 - R$ 400', 
          'R$ 400 - R$ 600',
          'R$ 600 - R$ 800',
          'acima de R$ 800'
        ];
        
        const userPriceIndex = priceMatches.indexOf(priceRange);
        const planPriceIndex = priceMatches.indexOf(plan.targetPriceRange);
        
        // Allow some flexibility in price matching (±1 range)
        if (userPriceIndex !== -1 && planPriceIndex !== -1) {
          const priceDiff = Math.abs(userPriceIndex - planPriceIndex);
          if (priceDiff > 1) return false;
        }
      }

      return true;
    })
    .sort((a: HealthPlan, b: HealthPlan) => {
      // Sort by relevance score
      let scoreA = 0;
      let scoreB = 0;

      // Boost recommended plans
      if (a.isRecommended) scoreA += 10;
      if (b.isRecommended) scoreB += 10;

      // Consider price range exact match
      if (priceRange) {
        if (a.targetPriceRange === priceRange) scoreA += 5;
        if (b.targetPriceRange === priceRange) scoreB += 5;
      }

      // Consider features match if services were selected
      if (Array.isArray(services) && services.length > 0) {
        const aFeatures = a.features || [];
        const bFeatures = b.features || [];
        
        services.forEach((service: string) => {
          if (aFeatures.some(f => f.toLowerCase().includes(service.toLowerCase()))) {
            scoreA += 2;
          }
          if (bFeatures.some(f => f.toLowerCase().includes(service.toLowerCase()))) {
            scoreB += 2;
          }
        });
      }

      return scoreB - scoreA;
    })
    .slice(0, 3); // Return top 3 recommendations
  };

  // Handle step submission
  const onSubmit = (data: any) => {
    const updatedFormData = { ...navigationState.formData, ...data };
    setNavigationState(prev => ({
      ...prev,
      formData: updatedFormData
    }));

    if (currentStepData) {
      processNavigation(currentStepData, updatedFormData);
    }
  };

  // Go to previous step
  const goToPreviousStep = () => {
    const completedSteps = navigationState.completedSteps;
    if (completedSteps.length > 0) {
      const previousStep = completedSteps[completedSteps.length - 1];
      setNavigationState(prev => ({
        ...prev,
        currentStep: previousStep,
        completedSteps: completedSteps.slice(0, -1)
      }));
    }
  };

  // Render field based on type
  const renderField = (field: FormField) => {
    const fieldKey = field.id;
    const defaultValue = navigationState.formData[fieldKey] || '';

    switch (field.type) {
      case 'text':
      case 'email':
      case 'tel':
      case 'date':
        return (
          <div key={fieldKey} className="space-y-2">
            <Label htmlFor={fieldKey}>{field.label} {field.required && <span className="text-red-500">*</span>}</Label>
            <Input
              id={fieldKey}
              type={field.type}
              placeholder={field.placeholder}
              defaultValue={defaultValue}
              {...register(fieldKey, { required: field.required })}
            />
            {errors[fieldKey] && (
              <p className="text-sm text-red-500">Este campo é obrigatório</p>
            )}
          </div>
        );

      case 'textarea':
        return (
          <div key={fieldKey} className="space-y-2">
            <Label htmlFor={fieldKey}>{field.label} {field.required && <span className="text-red-500">*</span>}</Label>
            <Textarea
              id={fieldKey}
              placeholder={field.placeholder}
              defaultValue={defaultValue}
              {...register(fieldKey, { required: field.required })}
            />
            {errors[fieldKey] && (
              <p className="text-sm text-red-500">Este campo é obrigatório</p>
            )}
          </div>
        );

      case 'radio':
        return (
          <div key={fieldKey} className="space-y-3">
            <Label>{field.label} {field.required && <span className="text-red-500">*</span>}</Label>
            <RadioGroup
              defaultValue={defaultValue}
              onValueChange={(value) => setValue(fieldKey, value)}
            >
              {field.options?.map((option, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <RadioGroupItem value={option} id={`${fieldKey}-${index}`} />
                  <Label htmlFor={`${fieldKey}-${index}`}>{option}</Label>
                </div>
              ))}
            </RadioGroup>
            {errors[fieldKey] && (
              <p className="text-sm text-red-500">Este campo é obrigatório</p>
            )}
          </div>
        );

      case 'checkbox':
        return (
          <div key={fieldKey} className="space-y-3">
            <Label>{field.label} {field.required && <span className="text-red-500">*</span>}</Label>
            <div className="grid grid-cols-1 gap-2">
              {field.options?.map((option, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <Checkbox
                    id={`${fieldKey}-${index}`}
                    onCheckedChange={(checked) => {
                      const currentValues = watch(fieldKey) || [];
                      if (checked) {
                        setValue(fieldKey, [...currentValues, option]);
                      } else {
                        setValue(fieldKey, currentValues.filter((v: string) => v !== option));
                      }
                    }}
                  />
                  <Label htmlFor={`${fieldKey}-${index}`}>{option}</Label>
                </div>
              ))}
            </div>
            {errors[fieldKey] && (
              <p className="text-sm text-red-500">Este campo é obrigatório</p>
            )}
          </div>
        );

      case 'select':
        return (
          <div key={fieldKey} className="space-y-2">
            <Label>{field.label} {field.required && <span className="text-red-500">*</span>}</Label>
            <Select onValueChange={(value) => setValue(fieldKey, value)} defaultValue={defaultValue}>
              <SelectTrigger>
                <SelectValue placeholder={field.placeholder || "Selecione uma opção"} />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map((option, index) => (
                  <SelectItem key={index} value={option}>{option}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors[fieldKey] && (
              <p className="text-sm text-red-500">Este campo é obrigatório</p>
            )}
          </div>
        );

      case 'heading':
        return (
          <div key={fieldKey} className="space-y-2">
            {field.headingLevel === 'h1' && <h1 className="text-3xl font-bold">{field.content}</h1>}
            {field.headingLevel === 'h2' && <h2 className="text-2xl font-semibold">{field.content}</h2>}
            {field.headingLevel === 'h3' && <h3 className="text-xl font-medium">{field.content}</h3>}
          </div>
        );

      case 'paragraph':
        return (
          <div key={fieldKey} className="space-y-2">
            <p className="text-gray-700">{field.content}</p>
          </div>
        );

      case 'image':
        return (
          <div key={fieldKey} className="space-y-2">
            {field.imageUrl && (
              <img src={field.imageUrl} alt={field.label} className="max-w-full h-auto rounded-lg" />
            )}
          </div>
        );

      default:
        return null;
    }
  };

  if (stepsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando formulário...</p>
        </div>
      </div>
    );
  }

  if (formSteps.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Heart className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Formulário não disponível
          </h3>
          <p className="text-gray-500">
            O formulário ainda não foi configurado. Entre em contato conosco para mais informações.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (navigationState.isComplete) {
    return (
      <div className="space-y-6">
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-6 text-center">
            <CheckCircle className="w-12 h-12 mx-auto text-green-600 mb-4" />
            <h2 className="text-2xl font-bold text-green-800 mb-2">
              Simulação Concluída!
            </h2>
            <p className="text-green-700">
              Baseado nas suas respostas, encontramos os melhores planos para você.
            </p>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold flex items-center space-x-2">
              <Shield className="w-5 h-5" />
              <span>Planos Recomendados</span>
            </h3>
            <Badge variant="secondary">
              {navigationState.recommendations.length} plano(s) encontrado(s)
            </Badge>
          </div>

          {navigationState.recommendations.length > 0 ? (
            <div className="grid gap-4">
              {navigationState.recommendations.map((plan, index) => (
                <PlanCard key={plan.id} plan={plan} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Users className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nenhum plano encontrado
                </h3>
                <p className="text-gray-500 mb-4">
                  Não encontramos planos que correspondam ao seu perfil no momento.
                </p>
                <Button onClick={() => openWhatsApp("Gostaria de mais informações sobre planos de saúde")}>
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Falar com um Consultor
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="flex justify-center space-x-4">
          <Button
            variant="outline"
            onClick={() => {
              setNavigationState({
                currentStep: 1,
                formData: {},
                completedSteps: [],
                recommendations: [],
                isComplete: false
              });
              reset();
            }}
          >
            Fazer Nova Simulação
          </Button>
          <Button onClick={() => openWhatsApp("Gostaria de contratar um plano de saúde")}>
            <MessageCircle className="w-4 h-4 mr-2" />
            Falar com Consultor
          </Button>
        </div>
      </div>
    );
  }

  if (!currentStepData) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Passo não encontrado
          </h3>
          <p className="text-gray-500">
            O passo atual do formulário não foi encontrado.
          </p>
        </CardContent>
      </Card>
    );
  }

  const progress = ((navigationState.completedSteps.length + 1) / formSteps.length) * 100;

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">Progresso</span>
          <span>{Math.round(progress)}% concluído</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Current Step */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <Badge variant="outline" className="mb-2">
                Passo {currentStepData.stepNumber} de {formSteps.length}
              </Badge>
              <CardTitle>{currentStepData.title}</CardTitle>
              {currentStepData.description && (
                <p className="text-sm text-gray-600 mt-1">{currentStepData.description}</p>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {currentStepData.fields?.map((field) => renderField(field))}

            <div className="flex items-center justify-between pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={goToPreviousStep}
                disabled={navigationState.completedSteps.length === 0}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>

              <Button type="submit">
                Continuar
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}