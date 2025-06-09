import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, MessageCircle } from "lucide-react";
import { openWhatsApp } from "@/lib/whatsapp";
import type { HealthPlan } from "@shared/schema";

interface PlanCardProps {
  plan: HealthPlan;
}

export default function PlanCard({ plan }: PlanCardProps) {
  const handleContactWhatsApp = () => {
    const message = `Olá! Gostaria de saber mais sobre o ${plan.name} (R$ ${plan.monthlyPrice}/mês) que foi recomendado pelo simulador.`;
    openWhatsApp(message);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  return (
    <div className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center mb-2">
            {plan.isRecommended && (
              <Badge className="bg-green-100 text-green-800 mr-3">
                Recomendado
              </Badge>
            )}
            <h3 className="text-xl font-semibold text-gray-900">{plan.name}</h3>
          </div>
          <p className="text-gray-600 mb-4">{plan.description}</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            {plan.features.map((feature, index) => (
              <div key={index} className="flex items-center text-green-600">
                <Check className="w-4 h-4 mr-2 flex-shrink-0" />
                <span>{feature}</span>
              </div>
            ))}
            {/* Show some common features as not included for lower-tier plans */}
            {plan.monthlyPrice < 400 && (
              <>
                <div className="flex items-center text-gray-400">
                  <X className="w-4 h-4 mr-2 flex-shrink-0" />
                  <span>Obstetrícia</span>
                </div>
                <div className="flex items-center text-gray-400">
                  <X className="w-4 h-4 mr-2 flex-shrink-0" />
                  <span>Odontologia</span>
                </div>
              </>
            )}
          </div>
        </div>
        <div className="lg:text-right mt-4 lg:mt-0">
          <div className="text-3xl font-bold text-gray-900 mb-2">
            {formatPrice(plan.monthlyPrice)}
            <span className="text-lg font-normal text-gray-500">/mês</span>
          </div>
          <Button
            onClick={handleContactWhatsApp}
            className={`w-full lg:w-auto mb-2 ${
              plan.isRecommended 
                ? "bg-green-600 hover:bg-green-700" 
                : "bg-gups-teal hover:bg-gups-teal/90"
            }`}
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            Falar com Consultor
          </Button>
          <div className="text-xs text-gray-500">Resposta em até 5 minutos</div>
        </div>
      </div>
    </div>
  );
}
