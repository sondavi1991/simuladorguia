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
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { openWhatsApp } from "@/lib/whatsapp";
import { ArrowLeft, ArrowRight, MessageCircle, CheckCircle } from "lucide-react";
import type { FormStep, FormField, StepNavigation, HealthPlan } from "@shared/schema";

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

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm();
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
      return await apiRequest("/api/form-submissions", "POST", {
        formData: data,
        submittedAt: new Date().toISOString()
      });
    },
    onSuccess: () => {
      toast({
        title: "Formulário enviado!",
        description: "Suas informações foram processadas com sucesso.",
      });
    }
  });

  const currentStepData = formSteps.find((step: FormStep) => step.stepNumber === navigationState.currentStep);
  const watchedValues = watch();

  // Process conditional navigation
  const processNavigation = (stepData: FormStep, formData: Record<string, any>) => {
    if (!stepData.navigationRules || stepData.navigationRules.length === 0) {
      return getNextStep(stepData.stepNumber);
    }

    // Sort rules by priority (higher priority first)
    const sortedRules = [...stepData.navigationRules].sort((a, b) => b.priority - a.priority);

    for (const rule of sortedRules) {
      if (evaluateCondition(rule, formData)) {
        switch (rule.target.type) {
          case 'step':
            return rule.target.stepNumber || getNextStep(stepData.stepNumber);
          case 'end':
            return 'END';
          case 'external_url':
            if (rule.target.url) {
              window.open(rule.target.url, '_blank');
            }
            return 'END';
          default:
            return getNextStep(stepData.stepNumber);
        }
      }
    }

    return getNextStep(stepData.stepNumber);
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
        return fieldValue && fieldValue.toString().toLowerCase().includes(conditionValue.toString().toLowerCase());
      case 'selected':
        if (Array.isArray(fieldValue)) {
          return Array.isArray(conditionValue) 
            ? conditionValue.some(val => fieldValue.includes(val))
            : fieldValue.includes(conditionValue);
        }
        return fieldValue === conditionValue;
      case 'not_selected':
        if (Array.isArray(fieldValue)) {
          return Array.isArray(conditionValue) 
            ? !conditionValue.some(val => fieldValue.includes(val))
            : !fieldValue.includes(conditionValue);
        }
        return fieldValue !== conditionValue;
      case 'greater_than':
        return parseFloat(fieldValue) > parseFloat(conditionValue.toString());
      case 'less_than':
        return parseFloat(fieldValue) < parseFloat(conditionValue.toString());
      default:
        return false;
    }
  };

  // Get next step number
  const getNextStep = (currentStep: number): number => {
    const nextSteps = formSteps
      .filter((step: FormStep) => step.stepNumber > currentStep)
      .sort((a: FormStep, b: FormStep) => a.stepNumber - b.stepNumber);
    
    return nextSteps.length > 0 ? nextSteps[0].stepNumber : -1;
  };

  // Generate health plan recommendations
  const generateRecommendations = (formData: Record<string, any>): HealthPlan[] => {
    // Simple recommendation logic based on form data
    const budget = formData.budget || 'economico';
    const coverage = formData.cobertura || [];
    
    return healthPlans.filter((plan: HealthPlan) => {
      const planFeatures = plan.features || [];
      const hasRequiredServices = Array.isArray(coverage) 
        ? coverage.some((service: string) => planFeatures.includes(service))
        : planFeatures.includes(coverage);
      
      return plan.targetPriceRange === budget || hasRequiredServices;
    }).slice(0, 3); // Limit to top 3 recommendations
  };

  // Handle form step submission
  const onSubmit = (data: any) => {
    const updatedFormData = { ...navigationState.formData, ...data };
    
    if (!currentStepData) return;

    const nextStep = processNavigation(currentStepData, updatedFormData);
    
    if (nextStep === 'END' || nextStep === -1) {
      // Form complete - generate recommendations
      const recommendations = generateRecommendations(updatedFormData);
      setNavigationState(prev => ({
        ...prev,
        formData: updatedFormData,
        recommendations,
        isComplete: true,
        completedSteps: [...prev.completedSteps, navigationState.currentStep]
      }));
      
      // Submit form data
      submitFormMutation.mutate(updatedFormData);
    } else {
      // Navigate to next step
      setNavigationState(prev => ({
        ...prev,
        currentStep: nextStep,
        formData: updatedFormData,
        completedSteps: [...prev.completedSteps, navigationState.currentStep]
      }));
    }
  };

  // Go back to previous step
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

  // Render form field based on type
  const renderField = (field: FormField) => {
    const fieldName = field.label.toLowerCase().replace(/\s+/g, '_');
    
    switch (field.type) {
      case 'heading':
        const HeadingTag = field.headingLevel || 'h2';
        return (
          <div key={field.id} className="mb-6">
            <HeadingTag className="text-2xl font-bold text-gups-blue mb-2">
              {field.content}
            </HeadingTag>
          </div>
        );
      
      case 'paragraph':
        return (
          <div key={field.id} className="mb-4">
            <p className="text-gray-700 leading-relaxed">{field.content}</p>
          </div>
        );
      
      case 'image':
        return (
          <div key={field.id} className="mb-6">
            {field.imageUrl ? (
              <img 
                src={field.imageUrl} 
                alt={field.content} 
                className="max-w-full h-auto rounded-lg shadow-md"
              />
            ) : (
              <div className="bg-gray-100 p-8 rounded-lg text-center">
                <p className="text-gray-600">{field.content}</p>
              </div>
            )}
          </div>
        );
      
      case 'radio':
        return (
          <div key={field.id} className="mb-6">
            <Label className="text-lg font-semibold mb-4 block">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <RadioGroup 
              onValueChange={(value) => setValue(fieldName, value)}
              className="space-y-3"
            >
              {field.options?.map((option, idx) => (
                <div key={idx} className="flex items-center space-x-3">
                  <RadioGroupItem value={option} id={`${fieldName}_${idx}`} />
                  <Label htmlFor={`${fieldName}_${idx}`} className="cursor-pointer">
                    {option}
                  </Label>
                </div>
              ))}
            </RadioGroup>
            {errors[fieldName] && (
              <p className="text-red-500 text-sm mt-2">Este campo é obrigatório</p>
            )}
          </div>
        );
      
      case 'checkbox':
        return (
          <div key={field.id} className="mb-6">
            <Label className="text-lg font-semibold mb-4 block">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <div className="space-y-3">
              {field.options?.map((option, idx) => (
                <div key={idx} className="flex items-center space-x-3">
                  <Checkbox 
                    id={`${fieldName}_${idx}`}
                    onCheckedChange={(checked) => {
                      const currentValues = watchedValues[fieldName] || [];
                      const newValues = checked
                        ? [...currentValues, option]
                        : currentValues.filter((val: string) => val !== option);
                      setValue(fieldName, newValues);
                    }}
                  />
                  <Label htmlFor={`${fieldName}_${idx}`} className="cursor-pointer">
                    {option}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        );
      
      case 'select':
        return (
          <div key={field.id} className="mb-6">
            <Label className="text-lg font-semibold mb-2 block">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Select onValueChange={(value) => setValue(fieldName, value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma opção" />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map((option, idx) => (
                  <SelectItem key={idx} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors[fieldName] && (
              <p className="text-red-500 text-sm mt-2">Este campo é obrigatório</p>
            )}
          </div>
        );
      
      default:
        return (
          <div key={field.id} className="mb-6">
            <Label className="text-lg font-semibold mb-2 block">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              type={field.type}
              placeholder={field.placeholder}
              {...register(fieldName, { required: field.required })}
              className="text-lg p-3"
            />
            {errors[fieldName] && (
              <p className="text-red-500 text-sm mt-2">Este campo é obrigatório</p>
            )}
          </div>
        );
    }
  };

  if (stepsLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gups-teal mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando formulário...</p>
        </div>
      </div>
    );
  }

  if (navigationState.isComplete) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card className="border-2 border-green-200 bg-green-50">
          <CardHeader className="text-center">
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <CardTitle className="text-2xl text-green-800">
              Parabéns! Simulação Concluída
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-center text-gray-700">
              Com base nas suas respostas, encontramos os melhores planos para você:
            </p>
            
            <div className="grid gap-4">
              {navigationState.recommendations.map((plan) => (
                <Card key={plan.id} className="border-l-4 border-l-gups-teal">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-lg text-gups-blue">{plan.name}</h3>
                      <Badge className="bg-gups-teal text-white">
                        {plan.targetPriceRange}
                      </Badge>
                    </div>
                    <p className="text-gray-600 mb-3">{plan.description}</p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {plan.features?.slice(0, 3).map((feature: string, idx: number) => (
                        <Badge key={idx} variant="outline">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                    <Button 
                      onClick={() => openWhatsApp(`Olá! Tenho interesse no plano ${plan.name}. Gostaria de mais informações.`)}
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Conversar no WhatsApp
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            <div className="text-center pt-4">
              <Button 
                onClick={() => window.location.reload()}
                variant="outline"
              >
                Fazer Nova Simulação
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!currentStepData) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-gray-600">Nenhum passo encontrado. Configure o formulário no painel administrativo.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl text-gups-blue">
                {currentStepData.title}
              </CardTitle>
              {currentStepData.description && (
                <p className="text-gray-600 mt-2">{currentStepData.description}</p>
              )}
            </div>
            <Badge variant="outline" className="text-gups-teal border-gups-teal">
              Passo {navigationState.currentStep}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {currentStepData.fields?.map(renderField)}
            
            <div className="flex justify-between pt-6 border-t">
              <Button 
                type="button"
                variant="outline"
                onClick={goToPreviousStep}
                disabled={navigationState.completedSteps.length === 0}
                className="flex items-center"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
              
              <Button 
                type="submit"
                className="bg-gups-teal hover:bg-gups-teal/90 flex items-center"
                disabled={submitFormMutation.isPending}
              >
                {submitFormMutation.isPending ? 'Processando...' : 'Continuar'}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}