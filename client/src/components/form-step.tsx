import { UseFormReturn } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import PlanCard from "@/components/plan-card";
import { User, Heart, Users, Plus, Trash2 } from "lucide-react";
import type { HealthPlan } from "@shared/schema";

interface FormStepProps {
  currentStep: number;
  form: UseFormReturn<any>;
  recommendations: HealthPlan[];
}

export default function FormStep({ currentStep, form, recommendations }: FormStepProps) {
  const { register, watch, setValue, getValues } = form;
  const planType = watch("planType");
  const services = watch("services") || [];
  const dependents = watch("dependents") || [];

  const addDependent = () => {
    const newDependents = [...dependents, { name: "", birthDate: "", relationship: "Cônjuge" }];
    setValue("dependents", newDependents);
  };

  const removeDependent = (index: number) => {
    const newDependents = dependents.filter((_: any, i: number) => i !== index);
    setValue("dependents", newDependents);
  };

  const updateDependent = (index: number, field: string, value: string) => {
    const newDependents = [...dependents];
    newDependents[index] = { ...newDependents[index], [field]: value };
    setValue("dependents", newDependents);
  };

  const toggleService = (service: string) => {
    const newServices = services.includes(service)
      ? services.filter((s: string) => s !== service)
      : [...services, service];
    setValue("services", newServices);
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="flex items-center mb-6">
              <div className="bg-gups-teal text-white rounded-full w-8 h-8 flex items-center justify-center font-semibold mr-3">1</div>
              <h2 className="text-2xl font-semibold text-gray-900">Informações Pessoais</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="name">Nome Completo *</Label>
                <Input
                  id="name"
                  {...register("name")}
                  placeholder="Digite seu nome completo"
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="birthDate">Data de Nascimento *</Label>
                <Input
                  id="birthDate"
                  type="date"
                  {...register("birthDate")}
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="phone">Telefone *</Label>
                <Input
                  id="phone"
                  type="tel"
                  {...register("phone")}
                  placeholder="(11) 99999-9999"
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  {...register("email")}
                  placeholder="seu@email.com"
                  className="mt-2"
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="zipCode">CEP *</Label>
                <Input
                  id="zipCode"
                  {...register("zipCode")}
                  placeholder="00000-000"
                  className="mt-2"
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="flex items-center mb-6">
              <div className="bg-gups-teal text-white rounded-full w-8 h-8 flex items-center justify-center font-semibold mr-3">2</div>
              <h2 className="text-2xl font-semibold text-gray-900">Informações da Família</h2>
            </div>
            
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-4 block">Tipo de Plano</Label>
              <RadioGroup
                value={planType}
                onValueChange={(value) => setValue("planType", value)}
                className="grid grid-cols-1 md:grid-cols-3 gap-4"
              >
                <Label className="cursor-pointer">
                  <RadioGroupItem value="individual" className="sr-only" />
                  <div className={`border-2 rounded-lg p-4 text-center transition-colors ${
                    planType === "individual" ? "border-gups-teal bg-gups-teal/5" : "border-gray-200 hover:border-gups-teal"
                  }`}>
                    <User className="text-2xl mx-auto mb-2 text-gray-400" />
                    <div className="font-medium">Individual</div>
                  </div>
                </Label>
                <Label className="cursor-pointer">
                  <RadioGroupItem value="couple" className="sr-only" />
                  <div className={`border-2 rounded-lg p-4 text-center transition-colors ${
                    planType === "couple" ? "border-gups-teal bg-gups-teal/5" : "border-gray-200 hover:border-gups-teal"
                  }`}>
                    <Heart className="text-2xl mx-auto mb-2 text-gray-400" />
                    <div className="font-medium">Casal</div>
                  </div>
                </Label>
                <Label className="cursor-pointer">
                  <RadioGroupItem value="family" className="sr-only" />
                  <div className={`border-2 rounded-lg p-4 text-center transition-colors ${
                    planType === "family" ? "border-gups-teal bg-gups-teal/5" : "border-gray-200 hover:border-gups-teal"
                  }`}>
                    <Users className="text-2xl mx-auto mb-2 text-gray-400" />
                    <div className="font-medium">Familiar</div>
                  </div>
                </Label>
              </RadioGroup>
            </div>
            
            {(planType === "couple" || planType === "family") && (
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-gray-900">Dependentes</h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addDependent}
                    className="text-gups-teal border-gups-teal hover:bg-gups-teal/10"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar
                  </Button>
                </div>
                <div className="space-y-4">
                  {dependents.map((dependent: any, index: number) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-white rounded-lg">
                      <Input
                        placeholder="Nome do dependente"
                        value={dependent.name}
                        onChange={(e) => updateDependent(index, "name", e.target.value)}
                      />
                      <Input
                        type="date"
                        value={dependent.birthDate}
                        onChange={(e) => updateDependent(index, "birthDate", e.target.value)}
                      />
                      <select
                        className="px-3 py-2 border border-gray-300 rounded-lg"
                        value={dependent.relationship}
                        onChange={(e) => updateDependent(index, "relationship", e.target.value)}
                      >
                        <option value="Cônjuge">Cônjuge</option>
                        <option value="Filho(a)">Filho(a)</option>
                        <option value="Pai/Mãe">Pai/Mãe</option>
                        <option value="Outro">Outro</option>
                      </select>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeDependent(index)}
                        className="text-red-600 border-red-200 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-8">
            <div className="flex items-center mb-6">
              <div className="bg-gups-teal text-white rounded-full w-8 h-8 flex items-center justify-center font-semibold mr-3">3</div>
              <h2 className="text-2xl font-semibold text-gray-900">Preferências de Saúde</h2>
            </div>
            
            <div>
              <Label className="block text-sm font-medium text-gray-700 mb-4">Faixa de Preço Mensal</Label>
              <RadioGroup
                value={watch("priceRange")}
                onValueChange={(value) => setValue("priceRange", value)}
                className="grid grid-cols-1 md:grid-cols-4 gap-4"
              >
                {[
                  { value: "basic", label: "R$ 150-300", subtitle: "Básico" },
                  { value: "intermediate", label: "R$ 300-500", subtitle: "Intermediário" },
                  { value: "premium", label: "R$ 500-800", subtitle: "Premium" },
                  { value: "executive", label: "R$ 800+", subtitle: "Executivo" }
                ].map((option) => (
                  <Label key={option.value} className="cursor-pointer">
                    <RadioGroupItem value={option.value} className="sr-only" />
                    <div className={`border-2 rounded-lg p-4 text-center transition-colors ${
                      watch("priceRange") === option.value ? "border-gups-teal bg-gups-teal/5" : "border-gray-200 hover:border-gups-teal"
                    }`}>
                      <div className="font-bold text-lg text-gray-900">{option.label}</div>
                      <div className="text-sm text-gray-500">{option.subtitle}</div>
                    </div>
                  </Label>
                ))}
              </RadioGroup>
            </div>
            
            <div>
              <Label className="block text-sm font-medium text-gray-700 mb-4">Serviços Importantes</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { id: "nacional", label: "Cobertura Nacional", description: "Atendimento em todo o Brasil" },
                  { id: "telemedicina", label: "Telemedicina", description: "Consultas online 24h" },
                  { id: "obstetricia", label: "Obstetrícia", description: "Parto e acompanhamento" },
                  { id: "odontologia", label: "Odontologia", description: "Tratamentos dentários" }
                ].map((service) => (
                  <div key={service.id} className="flex items-start space-x-3">
                    <Checkbox
                      id={service.id}
                      checked={services.includes(service.id)}
                      onCheckedChange={() => toggleService(service.id)}
                      className="mt-1"
                    />
                    <div>
                      <Label htmlFor={service.id} className="font-medium text-gray-900 cursor-pointer">
                        {service.label}
                      </Label>
                      <div className="text-sm text-gray-500">{service.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="flex items-center mb-6">
              <div className="bg-gups-teal text-white rounded-full w-8 h-8 flex items-center justify-center font-semibold mr-3">4</div>
              <h2 className="text-2xl font-semibold text-gray-900">Planos Recomendados</h2>
            </div>
            
            <div className="space-y-6">
              {recommendations.length > 0 ? (
                recommendations.map((plan) => (
                  <PlanCard key={plan.id} plan={plan} />
                ))
              ) : (
                <div className="text-center py-8">
                  <div className="text-gray-500">Carregando recomendações...</div>
                </div>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return renderStep();
}
