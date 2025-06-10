import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { MessageCircle, BarChart3, Users, CheckCircle, Play, Shield } from "lucide-react";
import { Link } from "wouter";
import { openWhatsApp } from "@/lib/whatsapp";
import { useState } from "react";

export default function Home() {
  const [termsAccepted, setTermsAccepted] = useState(true);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 lg:py-16">
          <div className="text-center animate-in fade-in slide-in-from-bottom-8 duration-1000">
            
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 bg-clip-text text-transparent mb-4 sm:mb-6 leading-tight">
              Simulador - Guia Único dos planos de saúde
            </h1>
            <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto mb-6 sm:mb-8 leading-relaxed px-2">
              Encontre seu plano de saúde ideal com nosso simulador, faça sua simulação gratuita e rápida conosco
            </p>
            
            
          </div>
        </div>
      </div>
      {/* Main Action Cards */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-8 sm:pb-16">
        <div className="grid grid-cols-1 gap-6 sm:gap-8 mb-8 sm:mb-16 max-w-2xl mx-auto">
          {/* Simulator Card */}
          <Card className="group relative overflow-hidden bg-gradient-to-br from-white to-blue-50 border-0 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 sm:hover:-translate-y-2 animate-in fade-in slide-in-from-left duration-700">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative p-4 sm:p-6 lg:p-8">
              <div className="flex flex-col sm:flex-row items-start sm:items-center mb-4 sm:mb-6">
                <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-2 sm:p-3 rounded-xl sm:rounded-2xl mb-3 sm:mb-0 sm:mr-4 group-hover:scale-110 transition-transform duration-300">
                  <Play className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                </div>
                <div className="text-center sm:text-left">
                  <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Iniciar Simulação</h2>
                  <p className="text-blue-600 font-medium text-sm sm:text-base">Encontre seu plano ideal</p>
                </div>
              </div>
              
              
              <Link href="/simulator">
                <Button 
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 sm:py-4 text-base sm:text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!termsAccepted}
                >
                  Começar Simulação
                  <Play className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              </Link>
              
              <div className="flex items-start space-x-3 mt-4 text-xs sm:text-sm text-gray-600">
                <Checkbox 
                  id="terms"
                  checked={termsAccepted}
                  onCheckedChange={(checked) => setTermsAccepted(checked as boolean)}
                  className="border-gray-300 mt-0.5 flex-shrink-0"
                />
                <label htmlFor="terms" className="cursor-pointer leading-relaxed">
                  Ao iniciar você concorda com nossos termos de uso e política de privacidade
                </label>
              </div>
            </div>
          </Card>

          
        </div>

        

        
      </div>
    </div>
  );
}