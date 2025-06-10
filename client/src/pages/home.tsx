import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, BarChart3, Users, CheckCircle, Play, Shield } from "lucide-react";
import { Link } from "wouter";
import { openWhatsApp } from "@/lib/whatsapp";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10" />
        <div className="relative max-w-7xl mx-auto px-6 py-16">
          <div className="text-center animate-in fade-in slide-in-from-bottom-8 duration-1000">
            
            <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 bg-clip-text text-transparent mb-6">Simulador - Guia Único dos planos de saúde</h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8 leading-relaxed">
              Encontre o plano de saúde ideal para você e sua família com nosso simulador inteligente 
              conectado ao Supabase e pronto para uso
            </p>
            
            
          </div>
        </div>
      </div>
      {/* Main Action Cards */}
      <div className="max-w-6xl mx-auto px-6 pb-16">
        <div className="grid grid-cols-1 gap-8 mb-16 max-w-2xl mx-auto">
          {/* Simulator Card */}
          <Card className="group relative overflow-hidden bg-gradient-to-br from-white to-blue-50 border-0 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 animate-in fade-in slide-in-from-left duration-700">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative p-8">
              <div className="flex items-center mb-6">
                <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-3 rounded-2xl mr-4 group-hover:scale-110 transition-transform duration-300">
                  <Play className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-gray-900">Iniciar Simulação</h2>
                  <p className="text-blue-600 font-medium">Encontre seu plano ideal</p>
                </div>
              </div>
              <p className="text-gray-600 mb-6 text-lg leading-relaxed">
                Responda 4 etapas personalizadas e receba recomendações inteligentes baseadas no seu perfil
              </p>
              <div className="space-y-3 mb-8">
                <div className="flex items-center text-gray-700">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-3" />
                  <span>Informações pessoais e localização</span>
                </div>
                <div className="flex items-center text-gray-700">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-3" />
                  <span>Dependentes e faixa etária</span>
                </div>
                <div className="flex items-center text-gray-700">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-3" />
                  <span>Serviços e cobertura desejados</span>
                </div>
              </div>
              <Link href="/simulator">
                <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-4 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
                  Começar Simulação
                  <Play className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </Card>

          
        </div>

        

        
      </div>
    </div>
  );
}