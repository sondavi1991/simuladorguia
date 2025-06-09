import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowRight, CheckCircle, Heart, Shield, Users } from "lucide-react";
import { Link } from "wouter";
import type { FormStep, HealthPlan, FormField } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

interface NavigationState {
  currentStep: number;
  formData: Record<string, any>;
  completedSteps: number[];
  recommendations: HealthPlan[];
  isComplete: boolean;
}

export default function Simulator() {
  const queryClient = useQueryClient();
  const [navigationState, setNavigationState] = useState<NavigationState>({
    currentStep: 1,
    formData: {},
    completedSteps: [],
    recommendations: [],
    isComplete: false,
  });

  const { data: formSteps = [], isLoading: stepsLoading } = useQuery({
    queryKey: ["/api/form-steps"],
  });

  const { data: healthPlans = [] } = useQuery({
    queryKey: ["/api/health-plans"],
  });

  const submitMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("/api/form-submissions", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/form-submissions"] });
    },
  });

  const currentStepData = formSteps.find((step: FormStep) => step.stepNumber === navigationState.currentStep);

  const handleNext = () => {
    if (!currentStepData) return;

    // Mark current step as completed
    const newCompletedSteps = [...navigationState.completedSteps, navigationState.currentStep];
    
    // Check if this is the last step
    const isLastStep = navigationState.currentStep === Math.max(...formSteps.map((s: FormStep) => s.stepNumber));
    
    if (isLastStep) {
      // Generate recommendations and complete the process
      const recommendations = getRecommendations(navigationState.formData);
      
      // Submit form data
      submitMutation.mutate({
        ...navigationState.formData,
        submittedAt: new Date().toISOString(),
      });

      setNavigationState(prev => ({
        ...prev,
        completedSteps: newCompletedSteps,
        recommendations,
        isComplete: true,
      }));
    } else {
      // Move to next step
      const nextStep = navigationState.currentStep + 1;
      setNavigationState(prev => ({
        ...prev,
        currentStep: nextStep,
        completedSteps: newCompletedSteps,
      }));
    }
  };

  const handlePrevious = () => {
    if (navigationState.currentStep > 1) {
      setNavigationState(prev => ({
        ...prev,
        currentStep: prev.currentStep - 1,
      }));
    }
  };

  const getRecommendations = (formData: Record<string, any>) => {
    // Smart recommendation logic based on form data
    const priceRange = formData.priceRange || '';
    const planType = formData.planType || '';
    const services = formData.services || [];
    
    return healthPlans.filter((plan: HealthPlan) => {
      // Filter by price range
      if (priceRange.includes('200') && plan.monthlyPrice > 200) return false;
      if (priceRange.includes('400') && (plan.monthlyPrice < 200 || plan.monthlyPrice > 400)) return false;
      if (priceRange.includes('600') && (plan.monthlyPrice < 400 || plan.monthlyPrice > 600)) return false;
      if (priceRange.includes('Acima') && plan.monthlyPrice < 600) return false;
      
      return true;
    }).slice(0, 3); // Return top 3 recommendations
  };

  const renderField = (field: FormField) => {
    switch (field.type) {
      case 'text':
      case 'email':
      case 'tel':
      case 'date':
        return (
          <div key={field.id} className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <label className="text-sm font-semibold text-gray-800">{field.label}</label>
            <input
              type={field.type}
              placeholder={field.placeholder}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 hover:border-gray-300"
              value={navigationState.formData[field.id] || ''}
              onChange={(e) => setNavigationState(prev => ({
                ...prev,
                formData: { ...prev.formData, [field.id]: e.target.value }
              }))}
              required={field.required}
            />
          </div>
        );

      case 'radio':
        return (
          <div key={field.id} className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <label className="text-sm font-semibold text-gray-800">{field.label}</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {field.options?.map((option) => (
                <label key={option} className="group relative flex items-center p-4 border-2 border-gray-200 rounded-xl cursor-pointer hover:border-blue-300 hover:bg-blue-50 transition-all duration-300">
                  <input
                    type="radio"
                    name={field.id}
                    value={option}
                    checked={navigationState.formData[field.id] === option}
                    onChange={(e) => setNavigationState(prev => ({
                      ...prev,
                      formData: { ...prev.formData, [field.id]: e.target.value }
                    }))}
                    className="sr-only"
                  />
                  <div className={`w-5 h-5 rounded-full border-2 mr-3 transition-all duration-200 ${
                    navigationState.formData[field.id] === option 
                      ? 'border-blue-500 bg-blue-500' 
                      : 'border-gray-300 group-hover:border-blue-400'
                  }`}>
                    {navigationState.formData[field.id] === option && (
                      <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>
                    )}
                  </div>
                  <span className="text-sm font-medium text-gray-700 group-hover:text-blue-700 transition-colors duration-200">{option}</span>
                </label>
              ))}
            </div>
          </div>
        );

      case 'checkbox':
        return (
          <div key={field.id} className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <label className="text-sm font-semibold text-gray-800">{field.label}</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {field.options?.map((option) => (
                <label key={option} className="group relative flex items-center p-4 border-2 border-gray-200 rounded-xl cursor-pointer hover:border-blue-300 hover:bg-blue-50 transition-all duration-300">
                  <input
                    type="checkbox"
                    value={option}
                    checked={(navigationState.formData[field.id] || []).includes(option)}
                    onChange={(e) => {
                      const currentValues = navigationState.formData[field.id] || [];
                      const newValues = e.target.checked
                        ? [...currentValues, option]
                        : currentValues.filter((v: string) => v !== option);
                      
                      setNavigationState(prev => ({
                        ...prev,
                        formData: { ...prev.formData, [field.id]: newValues }
                      }));
                    }}
                    className="sr-only"
                  />
                  <div className={`w-5 h-5 rounded border-2 mr-3 transition-all duration-200 ${
                    (navigationState.formData[field.id] || []).includes(option)
                      ? 'border-blue-500 bg-blue-500' 
                      : 'border-gray-300 group-hover:border-blue-400'
                  }`}>
                    {(navigationState.formData[field.id] || []).includes(option) && (
                      <svg className="w-3 h-3 text-white m-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <span className="text-sm font-medium text-gray-700 group-hover:text-blue-700 transition-colors duration-200">{option}</span>
                </label>
              ))}
            </div>
          </div>
        );

      case 'select':
        return (
          <div key={field.id} className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <label className="text-sm font-semibold text-gray-800">{field.label}</label>
            <select
              value={navigationState.formData[field.id] || ''}
              onChange={(e) => setNavigationState(prev => ({
                ...prev,
                formData: { ...prev.formData, [field.id]: e.target.value }
              }))}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 hover:border-gray-300 bg-white"
              required={field.required}
            >
              <option value="">Selecione uma opção</option>
              {field.options?.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
        );

      default:
        return null;
    }
  };

  if (stepsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando formulário...</p>
        </div>
      </div>
    );
  }

  if (navigationState.isComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <div className="bg-green-500 text-white rounded-full p-4 w-16 h-16 mx-auto mb-4">
              <CheckCircle className="w-8 h-8" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Simulação Concluída!</h1>
            <p className="text-xl text-gray-600">Aqui estão suas recomendações personalizadas</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {navigationState.recommendations.map((plan, index) => (
              <Card key={plan.id} className="p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 animate-in fade-in slide-in-from-bottom-4 duration-700" style={{animationDelay: `${index * 100}ms`}}>
                <div className="flex items-center mb-4">
                  <Heart className="h-6 w-6 text-red-500 mr-2" />
                  <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                </div>
                <p className="text-gray-600 mb-4">{plan.description}</p>
                <div className="text-center mb-4">
                  <div className="text-3xl font-bold text-blue-600">R$ {plan.monthlyPrice}</div>
                  <div className="text-sm text-gray-500">por mês</div>
                </div>
                <div className="space-y-2 mb-6">
                  {plan.features?.slice(0, 3).map((feature, idx) => (
                    <div key={idx} className="flex items-center text-sm text-gray-700">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                      {feature}
                    </div>
                  ))}
                </div>
                <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                  Contratar Plano
                </Button>
              </Card>
            ))}
          </div>

          <div className="text-center animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-500">
            <Link href="/">
              <Button variant="outline" className="mr-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar ao Início
              </Button>
            </Link>
            <Button 
              onClick={() => setNavigationState({
                currentStep: 1,
                formData: {},
                completedSteps: [],
                recommendations: [],
                isComplete: false,
              })}
              className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
            >
              Nova Simulação
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <Link href="/">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Simulador de Planos</h1>
          <p className="text-xl text-gray-600">Encontre o plano ideal para você</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Progresso</span>
            <span className="text-sm text-gray-500">
              Etapa {navigationState.currentStep} de {formSteps.length}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${(navigationState.currentStep / formSteps.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Current Step */}
        {currentStepData && (
          <Card className="p-8 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
            <div className="mb-6">
              <Badge className="mb-4 bg-blue-100 text-blue-800">
                Etapa {currentStepData.stepNumber}
              </Badge>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{currentStepData.title}</h2>
              {currentStepData.description && (
                <p className="text-gray-600">{currentStepData.description}</p>
              )}
            </div>

            <div className="space-y-6">
              {currentStepData.fields?.map((field) => renderField(field))}
            </div>

            <div className="flex justify-between mt-8">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={navigationState.currentStep === 1}
                className="transition-all duration-300"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Anterior
              </Button>
              
              <Button
                onClick={handleNext}
                disabled={submitMutation.isPending}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-300"
              >
                {navigationState.currentStep === formSteps.length ? 'Finalizar' : 'Próximo'}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}