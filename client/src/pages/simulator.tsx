import EnhancedSimulatorForm from "@/components/enhanced-simulator-form";

export default function Simulator() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Simulador de Planos de Saúde
          </h1>
          <p className="text-xl text-gray-600">
            Encontre o plano ideal para você e sua família
          </p>
        </div>
        
        <EnhancedSimulatorForm />
      </div>
    </div>
  );
}