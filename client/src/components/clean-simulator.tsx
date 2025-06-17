import { useState, useEffect } from "react";
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
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  MessageCircle, 
  ExternalLink, 
  Star, 
  Trophy, 
  Target, 
  Zap,
  User, 
  Users, 
  Heart, 
  Shield, 
  Building, 
  Home, 
  Car, 
  Briefcase, 
  GraduationCap, 
  Baby, 
  Crown,
  DollarSign,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Clock,
  Check,
  Package,
  Stethoscope,
  Activity
} from "lucide-react";
import type { FormStep, HealthPlan, FormField, StepNavigation } from "@shared/schema";
import guiaUnicoLogo from "@assets/logo-guia-unico-scaled_1749516567711.png";

interface NavigationState {
  currentStep: number;
  formData: Record<string, any>;
  completedSteps: number[];
  recommendations: HealthPlan[];
  isComplete: boolean;
  assignedAttendant?: {
    id: number;
    name: string;
    phoneNumber: string;
  };
}

interface GameificationState {
  isLoading: boolean;
  loadingMessage: string;
  progress: number;
  showMotivation: boolean;
  stepsSinceLastMotivation: number;
}

// Smart icon selection based on option content
const getOptionIcon = (option: string, index: number) => {
  const optionLower = option.toLowerCase();
  
  // Health plan related icons
  if (optionLower.includes('amil') || optionLower.includes('bradesco') || optionLower.includes('unimed') || optionLower.includes('santa casa')) {
    return <Shield className="w-6 h-6" />;
  }
  
  // Person/people related
  if (optionLower.includes('apenas uma') || optionLower.includes('individual') || optionLower.includes('só eu') || optionLower.includes('sozinho')) {
    return <User className="w-6 h-6" />;
  }
  if (optionLower.includes('mais pessoas') || optionLower.includes('família') || optionLower.includes('dependentes') || optionLower.includes('casal')) {
    return <Users className="w-6 h-6" />;
  }
  
  // Age related
  if (optionLower.includes('criança') || optionLower.includes('bebê') || optionLower.includes('menor') || optionLower.includes('filho')) {
    return <Baby className="w-6 h-6" />;
  }
  
  // Professional related
  if (optionLower.includes('trabalho') || optionLower.includes('empres') || optionLower.includes('profissional') || optionLower.includes('funcionário')) {
    return <Briefcase className="w-6 h-6" />;
  }
  
  // Education related
  if (optionLower.includes('estud') || optionLower.includes('universid') || optionLower.includes('escola') || optionLower.includes('faculdade')) {
    return <GraduationCap className="w-6 h-6" />;
  }
  
  // Premium/luxury related
  if (optionLower.includes('premium') || optionLower.includes('vip') || optionLower.includes('luxo') || optionLower.includes('executivo')) {
    return <Crown className="w-6 h-6" />;
  }
  
  // Health/medical related
  if (optionLower.includes('saúde') || optionLower.includes('médic') || optionLower.includes('hospital') || optionLower.includes('clínica')) {
    return <Heart className="w-6 h-6" />;
  }
  
  // Money/price related
  if (optionLower.includes('econômic') || optionLower.includes('básic') || optionLower.includes('barato') || optionLower.includes('r$')) {
    return <DollarSign className="w-6 h-6" />;
  }
  
  // Location related
  if (optionLower.includes('casa') || optionLower.includes('residênc') || optionLower.includes('domicil')) {
    return <Home className="w-6 h-6" />;
  }
  if (optionLower.includes('empresa') || optionLower.includes('escritório') || optionLower.includes('comercial')) {
    return <Building className="w-6 h-6" />;
  }
  
  // Activity/sports related
  if (optionLower.includes('exerc') || optionLower.includes('esporte') || optionLower.includes('atividade') || optionLower.includes('ginástica')) {
    return <Activity className="w-6 h-6" />;
  }
  
  // Package/plan related
  if (optionLower.includes('plano') || optionLower.includes('pacote') || optionLower.includes('opção')) {
    return <Package className="w-6 h-6" />;
  }
  
  // Contact related
  if (optionLower.includes('telefone') || optionLower.includes('contato') || optionLower.includes('ligar')) {
    return <Phone className="w-6 h-6" />;
  }
  if (optionLower.includes('email') || optionLower.includes('e-mail') || optionLower.includes('@')) {
    return <Mail className="w-6 h-6" />;
  }
  
  // Default icons based on position
  const defaultIcons = [
    <Star className="w-6 h-6" />,
    <Shield className="w-6 h-6" />,
    <Heart className="w-6 h-6" />,
    <Trophy className="w-6 h-6" />,
    <Target className="w-6 h-6" />,
    <Zap className="w-6 h-6" />,
    <Check className="w-6 h-6" />,
    <Crown className="w-6 h-6" />
  ];
  
  return defaultIcons[index % defaultIcons.length];
};

export default function CleanSimulator() {
  const { toast } = useToast();
  
  const [navigationState, setNavigationState] = useState<NavigationState>({
    currentStep: 1,
    formData: {},
    completedSteps: [],
    recommendations: [],
    isComplete: false,
    assignedAttendant: undefined
  });

  const [gameState, setGameState] = useState<GameificationState>({
    isLoading: false,
    loadingMessage: "",
    progress: 0,
    showMotivation: false,
    stepsSinceLastMotivation: 0
  });

  // Mensagens motivacionais estratégicas
  const motivationalMessages = [
    { text: "Ótimo! Você está indo muito bem!", icon: Star, color: "text-yellow-500" },
    { text: "Quase lá! Seu plano ideal está sendo calculado...", icon: Target, color: "text-blue-500" },
    { text: "Excelente progresso! Continue assim!", icon: Trophy, color: "text-amber-500" },
    { text: "Você está quase terminando! Falta pouco!", icon: Zap, color: "text-purple-500" }
  ];

  const loadingMessages = [
    "Analisando suas preferências...",
    "Calculando o melhor plano para você...",
    "Comparando coberturas disponíveis...",
    "Encontrando as melhores opções...",
    "Preparando suas recomendações...",
    "Finalizando sua análise personalizada..."
  ];

  // Fetch form steps
  const { data: formSteps = [], isLoading: stepsLoading } = useQuery<FormStep[]>({
    queryKey: ["/api/form-steps"],
  });

  // Fetch health plans
  const { data: healthPlans = [], isLoading: plansLoading } = useQuery<HealthPlan[]>({
    queryKey: ["/api/health-plans"],
  });

  // Determina se deve mostrar motivação (a cada 2-3 steps, com variação)
  const shouldShowMotivation = (currentStep: number, completed: number[]) => {
    if (completed.length < 2) return false; // Não mostrar muito cedo
    if (gameState.stepsSinceLastMotivation < 2) return false; // Não muito frequente
    
    // Mostrar em momentos estratégicos (meio do formulário, quase no final)
    const totalSteps = formSteps.length;
    const isMiddle = currentStep >= Math.floor(totalSteps / 2) && currentStep < totalSteps - 1;
    const isNearEnd = currentStep === totalSteps - 1;
    
    return (isMiddle && Math.random() > 0.4) || (isNearEnd && Math.random() > 0.2);
  };

  // Calcula progresso baseado nos steps completados
  const calculateProgress = () => {
    if (formSteps.length === 0) return 0;
    return Math.round((navigationState.completedSteps.length / formSteps.length) * 100);
  };

  // Efeito para atualizar progresso
  useEffect(() => {
    const newProgress = calculateProgress();
    setGameState(prev => ({ ...prev, progress: newProgress }));
  }, [navigationState.completedSteps, formSteps.length]);

  // Função para mostrar loading animado com mensagens
  const showLoadingWithMessage = (duration: number = 2000) => {
    const randomMessage = loadingMessages[Math.floor(Math.random() * loadingMessages.length)];
    
    setGameState(prev => ({
      ...prev,
      isLoading: true,
      loadingMessage: randomMessage
    }));

    setTimeout(() => {
      setGameState(prev => ({ ...prev, isLoading: false, loadingMessage: "" }));
    }, duration);
  };

  // Função para mostrar motivação estratégica
  const showMotivationalMessage = () => {
    const randomMessage = motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)];
    
    toast({
      title: randomMessage.text,
      description: "Continue assim! Você está no caminho certo.",
      duration: 3000,
    });

    setGameState(prev => ({
      ...prev,
      stepsSinceLastMotivation: 0,
      showMotivation: false
    }));
  };

  // Submit form mutation
  const submitFormMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/form-submissions", data);
      return response.json();
    },
    onSuccess: () => {
      // Invalidate form submissions cache to refresh Analytics
      queryClient.invalidateQueries({ queryKey: ["/api/form-submissions"] });
      
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
    
    // Try to find the field value using both field ID and field label for compatibility
    let fieldValue = formData[field];
    
    // If not found by field name, try to find by field ID from current step
    if (fieldValue === undefined && currentStepData?.fields) {
      const fieldDef = currentStepData.fields.find(f => f.label === field || f.id === field);
      if (fieldDef) {
        fieldValue = formData[fieldDef.id];
      }
    }

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

  const processNavigation = (stepData: FormStep, formData: Record<string, any>) => {
    // Mostrar loading para criar experiência envolvente
    const isLastStep = navigationState.currentStep === formSteps.length;
    const loadingDuration = isLastStep ? 3000 : 1500; // Mais tempo no último step
    
    showLoadingWithMessage(loadingDuration);

    // Incrementar contador de steps e verificar se deve mostrar motivação
    const newStepsSinceMotivation = gameState.stepsSinceLastMotivation + 1;
    setGameState(prev => ({ ...prev, stepsSinceLastMotivation: newStepsSinceMotivation }));

    setTimeout(() => {
      // Verificar se deve mostrar mensagem motivacional
      if (shouldShowMotivation(navigationState.currentStep, navigationState.completedSteps)) {
        setTimeout(() => showMotivationalMessage(), 500); // Pequeno delay após o loading
      }

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
          // Use plans specifically recommended for this step when ending via navigation rule
          const stepRecommendedPlans = stepData.recommendedPlanIds || [];
          const recommendations = healthPlans.filter((plan: HealthPlan) => 
            stepRecommendedPlans.includes(plan.id)
          );
          
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
    }, loadingDuration);
  };

  const completeForm = async (stepData: FormStep, formData: Record<string, any>) => {
    try {
      // Get recommendations using conditional API
      const response = await apiRequest("POST", "/api/health-plans/recommend", { formData });
      const recommendations = await response.json();
      
      // Get assigned attendant for this simulation
      const attendantResponse = await apiRequest("GET", "/api/whatsapp-attendants/next");
      const assignedAttendant = await attendantResponse.json();
      
      setNavigationState(prev => ({
        ...prev,
        isComplete: true,
        recommendations,
        assignedAttendant,
        completedSteps: [...prev.completedSteps, prev.currentStep]
      }));

      // Submit form data - preserve all dynamic field data
      submitFormMutation.mutate(formData);
    } catch (error) {
      console.error("Error getting recommendations:", error);
      // Show empty recommendations on error
      setNavigationState(prev => ({
        ...prev,
        isComplete: true,
        recommendations: [],
        completedSteps: [...prev.completedSteps, prev.currentStep]
      }));
    }
  };

  const handleFieldChange = (fieldId: string, value: any) => {
    setNavigationState(prev => ({
      ...prev,
      formData: { ...prev.formData, [fieldId]: value }
    }));
  };

  const validateCurrentStep = (): boolean => {
    if (!currentStepData?.fields) return true;
    
    const requiredFields = currentStepData.fields.filter(field => field.required);
    
    for (const field of requiredFields) {
      const value = navigationState.formData[field.id];
      
      if (!value || (Array.isArray(value) && value.length === 0)) {
        return false;
      }
      
      if (typeof value === 'string' && value.trim() === '') {
        return false;
      }
    }
    
    return true;
  };

  const handleNext = () => {
    if (!currentStepData) return;
    
    if (!validateCurrentStep()) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos obrigatórios antes de continuar.",
        variant: "destructive",
      });
      return;
    }
    
    const updatedFormData = { ...navigationState.formData };
    processNavigation(currentStepData, updatedFormData);
  };

  const handleWhatsAppContact = async (plan: HealthPlan) => {
    try {
      // Use the assigned attendant for this simulation, or get one if not assigned yet
      let attendant = navigationState.assignedAttendant;
      
      if (!attendant) {
        // Get an attendant for this contact
        const attendantResponse = await apiRequest("GET", "/api/whatsapp-attendants/next");
        attendant = await attendantResponse.json();
        
        // Update state with assigned attendant
        setNavigationState(prev => ({
          ...prev,
          assignedAttendant: attendant
        }));
      }

      if (!attendant) {
        toast({
          title: "Erro",
          description: "Nenhum atendente disponível no momento.",
          variant: "destructive",
        });
        return;
      }

      // Create WhatsApp message
      const userName = navigationState.formData.nome || navigationState.formData.name || "Cliente";
      const message = `Olá! Sou ${userName} e tenho interesse no plano *${plan.name}* no valor de R$ ${String(plan.monthlyPrice)}/mês. Gostaria de mais informações.`;
      const whatsappUrl = `https://wa.me/${attendant.phoneNumber.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
      
      window.open(whatsappUrl, '_blank');

      toast({
        title: "Redirecionando para WhatsApp",
        description: `Você será conectado com ${attendant.name} para o plano ${plan.name}.`,
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
      case 'number':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id} className="text-sm font-medium text-secondary">
              {field.label}
              {!field.required && <span className="text-gray-400 text-xs ml-1">(Opcional)</span>}
            </Label>
            <Input
              id={field.id}
              type={field.type}
              placeholder={field.placeholder}
              value={value}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              required={field.required}
              className="border-gray-custom focus:border-primary text-sm sm:text-base"
            />
          </div>
        );

      case 'date':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id} className="text-sm font-medium text-secondary">
              {field.label}
              {!field.required && <span className="text-gray-400 text-xs ml-1">(Opcional)</span>}
            </Label>
            <Input
              id={field.id}
              type="date"
              value={value}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              required={field.required}
              className="border-gray-custom focus:border-primary text-sm sm:text-base"
            />
          </div>
        );

      case 'radio':
        return (
          <div key={field.id} className="space-y-4">
            <Label className="text-lg font-semibold text-secondary">
              {field.label}
              {!field.required && <span className="text-gray-400 text-xs ml-1">(Opcional)</span>}
            </Label>
            <div className="grid gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3">
              {field.options?.map((option, index) => {
                const isSelected = value === option;
                const optionIcon = getOptionIcon(option, index);
                
                return (
                  <div
                    key={index}
                    className={`
                      relative p-6 rounded-2xl border-2 cursor-pointer transition-all duration-300 group
                      ${isSelected
                        ? 'bg-primary border-primary text-white'
                        : 'bg-white border-gray-200 text-gray-700 hover:border-primary/50 hover:shadow-md hover:scale-102'
                      }
                    `}
                    onClick={() => handleFieldChange(field.id, option)}
                  >
                    {/* Ícone */}
                    <div className={`
                      flex items-center justify-center w-12 h-12 rounded-xl mb-4 mx-auto transition-all duration-300 z-10
                      ${isSelected
                        ? 'bg-white text-primary'
                        : 'bg-gray-100 text-gray-500 group-hover:bg-primary/10 group-hover:text-primary'
                      }
                    `}>
                      {optionIcon}
                    </div>
                    {/* Texto */}
                    <div className="text-center z-10">
                      <p className={`
                        font-medium text-base transition-colors duration-200
                        ${isSelected ? 'text-white' : 'text-gray-700 group-hover:text-primary'}
                      `}>
                        {option}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );

      case 'checkbox':
        const selectedValues = Array.isArray(value) ? value : [];
        return (
          <div key={field.id} className="space-y-4">
            <Label className="text-lg font-semibold text-secondary">
              {field.label}
              {!field.required && <span className="text-gray-400 text-xs ml-1">(Opcional)</span>}
            </Label>
            <div className="grid gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3">
              {field.options?.map((option, index) => {
                const isSelected = selectedValues.includes(option);
                const optionIcon = getOptionIcon(option, index);
                
                return (
                  <div
                    key={index}
                    className={`
                      relative p-6 rounded-2xl border-2 cursor-pointer transition-all duration-300 group
                      ${isSelected
                        ? 'bg-primary border-primary text-white'
                        : 'bg-white border-gray-200 text-gray-700 hover:border-primary/50 hover:shadow-md hover:scale-102'
                      }
                    `}
                    onClick={() => {
                      const newValues = isSelected
                        ? selectedValues.filter(v => v !== option)
                        : [...selectedValues, option];
                      handleFieldChange(field.id, newValues);
                    }}
                  >
                    {/* Ícone */}
                    <div className={`
                      flex items-center justify-center w-12 h-12 rounded-xl mb-4 mx-auto transition-all duration-300 z-10
                      ${isSelected
                        ? 'bg-white text-primary'
                        : 'bg-gray-100 text-gray-500 group-hover:bg-primary/10 group-hover:text-primary'
                      }
                    `}>
                      {optionIcon}
                    </div>
                    {/* Texto */}
                    <div className="text-center z-10">
                      <p className={`
                        font-medium text-base transition-colors duration-200
                        ${isSelected ? 'text-white' : 'text-gray-700 group-hover:text-primary'}
                      `}>
                        {option}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );

      case 'select':
        return (
          <div key={field.id} className="space-y-2">
            <Label className="text-sm font-medium text-secondary">{field.label}</Label>
            <Select value={value} onValueChange={(newValue) => handleFieldChange(field.id, newValue)}>
              <SelectTrigger className="border-gray-custom focus:border-primary text-sm sm:text-base">
                <SelectValue placeholder={field.placeholder || "Selecione uma opção"} />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map((option, index) => (
                  <SelectItem key={index} value={option} className="text-sm sm:text-base">{option}</SelectItem>
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
        {/* Results */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 lg:py-12">
          <div className="text-center mb-8 sm:mb-10 lg:mb-12">
            <h1 className="text-2xl sm:text-3xl font-bold text-secondary mb-2 sm:mb-4">
              Seus Planos Recomendados
            </h1>
            <p className="text-base sm:text-lg text-gray-600 px-2">
              Encontramos os melhores planos de saúde baseados no seu perfil
            </p>
          </div>

          <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
            {navigationState.recommendations.map((plan) => (
              <Card key={plan.id} className="border-gray-custom hover:shadow-lg transition-shadow h-full flex flex-col">
                <CardContent className="p-4 sm:p-6 flex flex-col h-full">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 sm:mb-4">
                    <div className="flex items-center space-x-2 sm:space-x-3 mb-2 sm:mb-0">
                      {plan.logoUrl && (
                        <img src={plan.logoUrl} alt={plan.name} className="h-6 w-6 sm:h-8 sm:w-8 object-contain flex-shrink-0" />
                      )}
                      <h3 className="font-semibold text-base sm:text-lg text-secondary line-clamp-2">{plan.name}</h3>
                    </div>
                    {plan.isRecommended && (
                      <span className="bg-primary text-white text-xs px-2 py-1 rounded-full self-start flex-shrink-0">
                        Recomendado
                      </span>
                    )}
                  </div>
                  
                  <p className="text-gray-600 mb-3 sm:mb-4 text-xs sm:text-sm line-clamp-2 flex-shrink-0">{plan.description}</p>
                  
                  <div className="text-xl sm:text-2xl font-bold text-primary mb-3 sm:mb-4 flex-shrink-0">
                    R$ {plan.monthlyPrice}
                    <span className="text-xs sm:text-sm font-normal text-gray-500">/mês</span>
                  </div>
                  
                  <div className="space-y-1 sm:space-y-2 mb-4 sm:mb-6 flex-1">
                    {plan.features?.slice(0, 3).map((feature, index) => (
                      <div key={index} className="text-xs sm:text-sm text-gray-600">
                        • {feature}
                      </div>
                    ))}
                    {plan.features && plan.features.length > 3 && (
                      <div className="text-xs sm:text-sm text-gray-400">
                        +{plan.features.length - 3} benefícios adicionais
                      </div>
                    )}
                  </div>
                  
                  <Button
                    onClick={() => handleWhatsAppContact(plan)}
                    className="w-full bg-primary hover:bg-primary/90 text-white text-sm sm:text-base py-2 sm:py-3 mt-auto"
                  >
                    <MessageCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                    Contratar via WhatsApp
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {navigationState.recommendations.length === 0 && (
            <div className="text-center py-8 sm:py-12 px-4">
              <h3 className="text-lg sm:text-xl font-semibold text-secondary mb-3 sm:mb-4">
              Ops, nenhum plano foi encontrado. Recomendamos que você entre em contato com um de nossos consultores para uma análise detalhada de suas necessidades. Eles poderão apresentar as opções de planos de saúde mais adequadas ao seu perfil e orçamento.
              </h3>
              <Button
                onClick={() => handleWhatsAppContact({
                  id: 0,
                  name: "Consultoria Personalizada",
                  description: "Atendimento especializado",
                  monthlyPrice: "0",
                  features: [],
                  coverage: "",
                  isRecommended: false,
                  targetPriceRange: "",
                  logoUrl: null,
                  recommendationRules: null
                })}
                className="bg-primary hover:bg-primary/90 text-white text-sm sm:text-base py-2 sm:py-3 px-4 sm:px-6"
              >
                <MessageCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                Falar com Especialista
              </Button>
            </div>
          )}
        </div>

        {/* Aviso de simulação */}
        <div className="max-w-3xl mx-auto mt-10">
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 rounded-xl shadow text-yellow-900 text-base sm:text-lg text-justify">
            <strong>Aviso importante:</strong> <br />
            Os valores apresentados nesta simulação são meramente informativos e representam uma estimativa inicial. Os preços e condições dos planos de saúde estão sujeitos a alterações pelas operadoras, de acordo com fatores como a sua idade, região de cobertura, tipo de plano e rede credenciada. <br /><br />
            Para obter uma proposta personalizada e informações precisas, entre em contato com um de nossos consultores especializados. <br />
            <span className="font-semibold">A Guia Único dos Planos de Saúde está à disposição para te auxiliar na escolha do plano ideal para você e sua família.</span>
          </div>
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
    <div className="min-h-screen bg-white relative">
      {/* Loading Overlay */}
      {gameState.isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 sm:p-6 lg:p-8 max-w-sm mx-4 text-center">
            <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <h3 className="text-base sm:text-lg font-semibold text-secondary mb-2">
              {gameState.loadingMessage}
            </h3>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-500" 
                style={{ width: `${gameState.progress}%` }}
              ></div>
            </div>
            <p className="text-xs sm:text-sm text-gray-600 mt-2">
              {gameState.progress}% concluído
            </p>
          </div>
        </div>
      )}

      

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 lg:py-12">
        <div className="text-center mb-6 sm:mb-8 lg:mb-12">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-secondary mb-2 sm:mb-4 leading-tight">
            Simulador - Guia Único dos planos de saúde
          </h1>
          
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-gray-600">
              Passo {navigationState.currentStep} de {formSteps.length}
            </span>
            <span className="text-sm font-medium text-primary">
              {Math.round((navigationState.currentStep / formSteps.length) * 100)}% concluído
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-primary to-primary/80 h-2 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${(navigationState.currentStep / formSteps.length) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Step Title */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary text-white font-bold text-lg">
              {navigationState.currentStep}
            </div>
          </div>
          <h2 className="text-xl sm:text-2xl font-semibold text-secondary mb-2">
            {currentStepData.title}
          </h2>
          {currentStepData.description && (
            <p className="text-gray-600 text-sm sm:text-base px-2">
              {currentStepData.description}
            </p>
          )}
        </div>

        {/* Form Step */}
        <Card className="border-gray-custom shadow-lg">
          <CardContent className="p-4 sm:p-6 lg:p-8">
            <div className="space-y-4 sm:space-y-6">
              {currentStepData.fields?.map(renderField)}
              
              <div className="flex justify-center pt-6 sm:pt-8">
                <Button
                  onClick={handleNext}
                  disabled={submitFormMutation.isPending || gameState.isLoading}
                  className="
                    group relative overflow-hidden w-full sm:w-auto min-w-[200px] 
                    bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary
                    text-white font-semibold px-8 py-4 rounded-2xl text-lg
                    transform transition-all duration-300 hover:scale-105 hover:shadow-xl
                    disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
                  "
                >
                  {/* Animated background effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  
                  {/* Content */}
                  <div className="relative flex items-center justify-center space-x-2">
                    {submitFormMutation.isPending || gameState.isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        <span>Processando...</span>
                      </>
                    ) : (
                      <>
                        <span>Continuar</span>
                        <div className="transform transition-transform duration-300 group-hover:translate-x-1">
                          →
                        </div>
                      </>
                    )}
                  </div>
                  
                  {/* Shine effect */}
                  <div className="absolute inset-0 -skew-x-12 bg-gradient-to-r from-transparent via-white/20 to-transparent transform translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}