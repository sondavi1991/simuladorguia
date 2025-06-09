import { useState } from "react";

interface FormState {
  currentStep: number;
  formData: Record<string, any>;
}

export function useFormState() {
  const [state, setState] = useState<FormState>({
    currentStep: 1,
    formData: {}
  });

  const setCurrentStep = (step: number) => {
    setState(prev => ({ ...prev, currentStep: step }));
  };

  const updateFormData = (data: Record<string, any>) => {
    setState(prev => ({ 
      ...prev, 
      formData: { ...prev.formData, ...data }
    }));
  };

  const resetForm = () => {
    setState({
      currentStep: 1,
      formData: {}
    });
  };

  return {
    currentStep: state.currentStep,
    formData: state.formData,
    setCurrentStep,
    updateFormData,
    resetForm
  };
}
