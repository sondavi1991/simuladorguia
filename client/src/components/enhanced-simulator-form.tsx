import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, CheckCircle2, ArrowRight, ArrowLeft, Heart, Shield, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { FormStep, FormField, HealthPlan, StepNavigation } from "@shared/schema";

interface NavigationState {
  currentStep: number;
  formData: Record<string, any>;
  completedSteps: number[];
  recommendations: HealthPlan[];
  isComplete: boolean;
}

export default function EnhancedSimulatorForm() {
  const { toast } = useToast();
  const [navigationState, setNavigationState] = useState<NavigationState>({
    currentStep: 1,
    formData: {},
    completedSteps: [],
    recommendations: [],
    isComplete: false,
  });

  const { data: formSteps = [], isLoading: stepsLoading } = useQuery<FormStep[]>({
    queryKey: ["/api/form-steps"],
  });

  const { data: healthPlans = [] } = useQuery<HealthPlan[]>({
    queryKey: ["/api/health-plans"],
  });

  const form = useForm({
    defaultValues: navigationState.formData,
  });

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

  // Enhanced condition evaluation with proper field matching
  const evaluateCondition = (rule: StepNavigation, formData: Record<string, any>): boolean => {
    const { field, operator, value: expectedValue } = rule.condition;
    
    // Try to find field value by field name/label or field ID
    let fieldValue = formData[field];
    
    // If not found by field name, try by field ID from the current step
    if (fieldValue === undefined && currentStepData?.fields) {
      const matchingField = currentStepData.fields.find(f => f.label === field || f.id === field);
      if (matchingField) {
        fieldValue = formData[matchingField.id];
      }
    }

    console.log(`🔍 Evaluating condition:`, {
      field,
      operator,
      expectedValue,
      fieldValue,
      formData,
      currentStep: navigationState.currentStep
    });

    if (fieldValue === undefined || fieldValue === null || fieldValue === '') {
      console.log(`❌ Field value is empty, condition fails`);
      return false;
    }

    let result = false;
    switch (operator) {
      case 'equals':
        result = String(fieldValue) === String(expectedValue);
        break;
      case 'not_equals':
        result = String(fieldValue) !== String(expectedValue);
        break;
      case 'contains':
        result = String(fieldValue).toLowerCase().includes(String(expectedValue).toLowerCase());
        break;
      case 'greater_than':
        result = Number(fieldValue) > Number(expectedValue);
        break;
      case 'less_than':
        result = Number(fieldValue) < Number(expectedValue);
        break;
      case 'selected':
        if (Array.isArray(fieldValue)) {
          result = Array.isArray(expectedValue) 
            ? expectedValue.some(val => fieldValue.includes(val))
            : fieldValue.includes(expectedValue);
        } else {
          result = String(fieldValue) === String(expectedValue);
        }
        break;
      case 'not_selected':
        if (Array.isArray(fieldValue)) {
          result = Array.isArray(expectedValue)
            ? !expectedValue.some(val => fieldValue.includes(val))
            : !fieldValue.includes(expectedValue);
        } else {
          result = String(fieldValue) !== String(expectedValue);
        }
        break;
      default:
        result = false;
    }
    
    console.log(`${result ? '✅' : '❌'} Condition result: ${result}`);
    return result;
  };

  // Get step-specific plan recommendations
  const getStepRecommendations = (stepData: FormStep): HealthPlan[] => {
    if (!stepData.recommendedPlanIds || stepData.recommendedPlanIds.length === 0) {
      // Fallback to general recommendations based on form data
      return generateGeneralRecommendations(navigationState.formData);
    }
    
    // Return plans specifically configured for this step
    return healthPlans.filter((plan: HealthPlan) => 
      stepData.recommendedPlanIds?.includes(plan.id!)
    );
  };

  // Generate general recommendations as fallback
  const generateGeneralRecommendations = (formData: Record<string, any>): HealthPlan[] => {
    const priceRange = formData.priceRange || 'medio';
    const services = formData.services || [];
    
    return healthPlans.filter((plan: HealthPlan) => {
      const matchesPrice = plan.targetPriceRange === priceRange;
      const hasMatchingServices = Array.isArray(services) && services.length > 0 
        ? plan.features?.some(feature => services.some((service: string) => 
            feature.toLowerCase().includes(service.toLowerCase())
          ))
        : true;
      
      return matchesPrice || hasMatchingServices || plan.isRecommended;
    }).sort((a: HealthPlan, b: HealthPlan) => {
      if (a.isRecommended && !b.isRecommended) return -1;
      if (!a.isRecommended && b.isRecommended) return 1;
      return a.monthlyPrice - b.monthlyPrice;
    }).slice(0, 3);
  };

  // Process navigation with enhanced conditional logic
  const processNavigation = (stepData: FormStep, formData: Record<string, any>) => {
    // Update form data state
    const updatedFormData = { ...navigationState.formData, ...formData };
    
    console.log(`🚀 Processing navigation for step ${stepData.stepNumber}:`, {
      stepData: stepData.title,
      navigationRules: stepData.navigationRules,
      formData: updatedFormData
    });
    
    // Check for navigation rules
    if (!stepData.navigationRules || stepData.navigationRules.length === 0) {
      console.log(`📝 No navigation rules found, proceeding to next step`);
      goToNextStep(updatedFormData);
      return;
    }

    // Evaluate navigation rules (highest priority first)
    const sortedRules = stepData.navigationRules.sort((a, b) => (b.priority || 0) - (a.priority || 0));
    console.log(`📋 Found ${sortedRules.length} navigation rules to evaluate`);
    
    for (const rule of sortedRules) {
      console.log(`🔍 Evaluating rule:`, rule);
      
      if (evaluateCondition(rule, updatedFormData)) {
        console.log(`✅ Rule matched! Taking action:`, rule.target);
        
        if (rule.target.type === 'step' && rule.target.stepNumber) {
          // Navigate to specific step
          console.log(`➡️ Navigating to step ${rule.target.stepNumber}`);
          setNavigationState(prev => ({
            ...prev,
            currentStep: rule.target.stepNumber!,
            completedSteps: [...prev.completedSteps, prev.currentStep],
            formData: updatedFormData
          }));
          return;
        } else if (rule.target.type === 'end') {
          // Complete form with step-specific recommendations
          console.log(`🏁 Completing form with message: ${rule.target.message}`);
          completeForm(stepData, updatedFormData);
          return;
        }
      } else {
        console.log(`❌ Rule did not match, trying next rule`);
      }
    }

    // No rules matched, proceed to next step
    console.log(`📝 No rules matched, proceeding to next step`);
    goToNextStep(updatedFormData);
  };

  const goToNextStep = (formData: Record<string, any>) => {
    const nextStep = formSteps
      .filter((step: FormStep) => step.stepNumber > navigationState.currentStep)
      .sort((a: FormStep, b: FormStep) => a.stepNumber - b.stepNumber)[0];
    
    if (nextStep) {
      setNavigationState(prev => ({
        ...prev,
        currentStep: nextStep.stepNumber,
        completedSteps: [...prev.completedSteps, prev.currentStep],
        formData
      }));
    } else {
      // No more steps, complete form
      const currentStep = formSteps.find(s => s.stepNumber === navigationState.currentStep);
      completeForm(currentStep!, formData);
    }
  };

  const completeForm = (stepData: FormStep, formData: Record<string, any>) => {
    const recommendations = getStepRecommendations(stepData);
    
    setNavigationState(prev => ({
      ...prev,
      recommendations,
      isComplete: true,
      completedSteps: [...prev.completedSteps, prev.currentStep],
      formData
    }));
  };

  const handleSubmitStep = (data: any) => {
    if (!currentStepData) return;
    
    // Process navigation with current step data and form values
    processNavigation(currentStepData, data);
  };

  const handlePreviousStep = () => {
    if (navigationState.completedSteps.length > 0) {
      const prevStep = navigationState.completedSteps[navigationState.completedSteps.length - 1];
      setNavigationState(prev => ({
        ...prev,
        currentStep: prevStep,
        completedSteps: prev.completedSteps.slice(0, -1)
      }));
    }
  };

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
              {...form.register(fieldKey, { required: field.required })}
            />
          </div>
        );

      case 'select':
        return (
          <div key={fieldKey} className="space-y-2">
            <Label>{field.label} {field.required && <span className="text-red-500">*</span>}</Label>
            <Select
              defaultValue={defaultValue}
              onValueChange={(value) => form.setValue(fieldKey, value)}
            >
              <SelectTrigger>
                <SelectValue placeholder={field.placeholder} />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );

      case 'radio':
        return (
          <div key={fieldKey} className="space-y-2">
            <Label>{field.label} {field.required && <span className="text-red-500">*</span>}</Label>
            <RadioGroup
              defaultValue={defaultValue}
              onValueChange={(value) => form.setValue(fieldKey, value)}
            >
              {field.options?.map((option) => (
                <div key={option} className="flex items-center space-x-2">
                  <RadioGroupItem value={option} id={`${fieldKey}-${option}`} />
                  <Label htmlFor={`${fieldKey}-${option}`}>{option}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        );

      case 'checkbox':
        return (
          <div key={fieldKey} className="space-y-2">
            <Label>{field.label} {field.required && <span className="text-red-500">*</span>}</Label>
            <div className="space-y-2">
              {field.options?.map((option) => (
                <div key={option} className="flex items-center space-x-2">
                  <Checkbox
                    id={`${fieldKey}-${option}`}
                    defaultChecked={Array.isArray(defaultValue) && defaultValue.includes(option)}
                    onCheckedChange={(checked) => {
                      const currentValues = form.getValues(fieldKey) || [];
                      const updatedValues = checked
                        ? [...currentValues, option]
                        : currentValues.filter((v: string) => v !== option);
                      form.setValue(fieldKey, updatedValues);
                    }}
                  />
                  <Label htmlFor={`${fieldKey}-${option}`}>{option}</Label>
                </div>
              ))}
            </div>
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
              <img 
                src={field.imageUrl} 
                alt={field.content || field.label}
                className="max-w-full h-auto rounded-lg"
              />
            )}
            {field.content && <p className="text-sm text-gray-600">{field.content}</p>}
          </div>
        );

      default:
        return null;
    }
  };

  const progress = ((navigationState.currentStep - 1) / Math.max(formSteps.length - 1, 1)) * 100;

  if (stepsLoading) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Carregando simulador...</p>
        </div>
      </div>
    );
  }

  if (navigationState.isComplete) {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle2 className="w-16 h-16 text-green-500" />
            </div>
            <CardTitle className="text-2xl text-green-700">
              Simulação Concluída!
            </CardTitle>
            <p className="text-gray-600">
              Com base nas suas respostas, encontramos os melhores planos para você.
            </p>
          </CardHeader>
        </Card>

        <div className="grid gap-6">
          <h2 className="text-xl font-semibold">Planos Recomendados</h2>
          {navigationState.recommendations.length > 0 ? (
            <div className="grid gap-4">
              {navigationState.recommendations.map((plan) => (
                <Card key={plan.id} className="border-2 hover:border-blue-500 transition-colors">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-start gap-4">
                        {plan.logoUrl && (
                          <img 
                            src={plan.logoUrl} 
                            alt={`Logo ${plan.name}`}
                            className="w-16 h-16 object-contain rounded-lg border"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        )}
                        <div>
                          <h3 className="text-xl font-semibold">{plan.name}</h3>
                          <p className="text-gray-600">{plan.description}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-blue-600">
                          R$ {plan.monthlyPrice}
                        </div>
                        <div className="text-sm text-gray-500">por mês</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <Users className="w-4 h-4 mr-1" />
                        {plan.coverage}
                      </div>
                      {plan.isRecommended && (
                        <Badge variant="secondary">
                          <Shield className="w-3 h-3 mr-1" />
                          Recomendado
                        </Badge>
                      )}
                    </div>

                    {plan.features && plan.features.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-medium">Benefícios inclusos:</h4>
                        <div className="flex flex-wrap gap-1">
                          {plan.features.map((feature, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {feature}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2 mt-4">
                      <Button className="flex-1 bg-blue-600 hover:bg-blue-700">
                        Contratar este Plano
                      </Button>
                      <Button 
                        variant="outline" 
                        className="flex items-center gap-2 px-4"
                        onClick={() => handleWhatsAppContact(plan)}
                      >
                        <MessageCircle className="w-4 h-4" />
                        WhatsApp
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <Heart className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                <p className="text-gray-500">
                  Nenhum plano específico foi configurado para esta etapa.
                  Entre em contato conosco para uma recomendação personalizada.
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="flex justify-center">
          <Button
            onClick={() => setNavigationState({
              currentStep: 1,
              formData: {},
              completedSteps: [],
              recommendations: [],
              isComplete: false,
            })}
            variant="outline"
          >
            Fazer Nova Simulação
          </Button>
        </div>
      </div>
    );
  }

  if (!currentStepData) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-8 h-8 mx-auto text-orange-500 mb-2" />
            <p className="text-gray-600">
              Passo não encontrado. Por favor, configure os passos do formulário no painel administrativo.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-gray-600">
          <span>Passo {navigationState.currentStep} de {formSteps.length}</span>
          <span>{Math.round(progress)}% concluído</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Current Step Form */}
      <Card>
        <CardHeader>
          <CardTitle>{currentStepData.title}</CardTitle>
          {currentStepData.description && (
            <p className="text-gray-600">{currentStepData.description}</p>
          )}
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(handleSubmitStep)} className="space-y-6">
            {currentStepData.fields?.map((field) => renderField(field))}
            
            <Separator />
            
            <div className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={handlePreviousStep}
                disabled={navigationState.completedSteps.length === 0}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Anterior
              </Button>
              
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                Próximo
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}