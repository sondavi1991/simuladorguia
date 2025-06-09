import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Settings, BarChart3, Users, CheckCircle, Play, Shield } from "lucide-react";
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
            <Badge className="mb-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 text-sm font-medium">
              Sistema Totalmente Funcional
            </Badge>
            <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 bg-clip-text text-transparent mb-6">
              Simulador de Planos de Saúde
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8 leading-relaxed">
              Encontre o plano de saúde ideal para você e sua família com nosso simulador inteligente 
              conectado ao Supabase e pronto para uso
            </p>
            
            {/* Quick Stats */}
            <div className="flex flex-wrap justify-center gap-8 mb-12 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-200">
              <div className="flex items-center space-x-2 text-gray-700">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="font-medium">4 Etapas Personalizadas</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-700">
                <Shield className="h-5 w-5 text-blue-500" />
                <span className="font-medium">3 Planos Disponíveis</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-700">
                <Users className="h-5 w-5 text-purple-500" />
                <span className="font-medium">Sistema Multi-usuário</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Action Cards */}
      <div className="max-w-6xl mx-auto px-6 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
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

          {/* Admin Panel Card */}
          <Card className="group relative overflow-hidden bg-gradient-to-br from-white to-slate-50 border-0 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 animate-in fade-in slide-in-from-right duration-700">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-500/5 to-gray-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative p-8">
              <div className="flex items-center mb-6">
                <div className="bg-gradient-to-r from-slate-600 to-gray-600 p-3 rounded-2xl mr-4 group-hover:scale-110 transition-transform duration-300">
                  <Settings className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-gray-900">Painel Admin</h2>
                  <p className="text-slate-600 font-medium">Gestão completa</p>
                </div>
              </div>
              <p className="text-gray-600 mb-6 text-lg leading-relaxed">
                Gerencie formulários, planos de saúde e visualize estatísticas do sistema
              </p>
              <div className="space-y-3 mb-8">
                <div className="flex items-center text-gray-700">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-3" />
                  <span>Constructor de formulários dinâmicos</span>
                </div>
                <div className="flex items-center text-gray-700">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-3" />
                  <span>Gestão de planos de saúde</span>
                </div>
                <div className="flex items-center text-gray-700">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-3" />
                  <span>Relatórios e analytics</span>
                </div>
              </div>
              <Link href="/admin">
                <Button variant="outline" className="w-full border-2 border-slate-300 hover:border-slate-500 hover:bg-slate-50 font-semibold py-4 text-lg rounded-xl transition-all duration-300">
                  Acessar Painel
                  <Settings className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </Card>
        </div>

        {/* Demo Credentials */}
        <Card className="bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200 shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-500">
          <div className="p-8">
            <div className="flex items-start space-x-4">
              <div className="bg-emerald-500 text-white rounded-full p-3">
                <CheckCircle className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-emerald-900 mb-2">Sistema Pronto para Teste</h3>
                <p className="text-emerald-700 mb-4">
                  Use as credenciais abaixo para testar o painel administrativo e explorar todas as funcionalidades
                </p>
                <div className="bg-white/80 rounded-lg p-4 border border-emerald-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="font-semibold text-emerald-900">Usuário:</span>
                      <code className="ml-2 bg-emerald-100 text-emerald-800 px-2 py-1 rounded font-mono">demo</code>
                    </div>
                    <div>
                      <span className="font-semibold text-emerald-900">Senha:</span>
                      <code className="ml-2 bg-emerald-100 text-emerald-800 px-2 py-1 rounded font-mono">demo123</code>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Contact Section */}
        <div className="text-center mt-16 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-700">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">Precisa de Ajuda?</h3>
          <p className="text-gray-600 mb-6">Entre em contato conosco via WhatsApp para suporte personalizado</p>
          <Button 
            onClick={() => openWhatsApp("Olá! Gostaria de saber mais sobre os planos de saúde.")}
            className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-8 py-4 rounded-xl text-lg font-medium shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
          >
            <MessageCircle className="mr-3 h-6 w-6" />
            Falar no WhatsApp
          </Button>
        </div>
      </div>
    </div>
  );
}