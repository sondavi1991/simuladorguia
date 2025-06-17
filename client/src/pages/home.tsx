import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";
import { Link } from "wouter";

export default function Home() {
  const [termsAccepted, setTermsAccepted] = useState(true);

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50/30 to-white">
      {/* Header */}
      <header className="w-full px-6 py-8">
        <div className="container mx-auto text-center">
          <a 
            href="https://www.guiadeplanosdesaude.com.br/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-block hover:opacity-80 transition-opacity"
          >
            <img 
              src="/images/logo-guia-unico.png" 
              alt="Guia Único dos Planos de Saúde" 
              className="h-20 md:h-24 w-auto mx-auto" 
            />
          </a>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-12 md:py-20">
        <div className="max-w-4xl mx-auto text-center">
          {/* Hero Section */}
          <div className="animate-fade-in-up">
            <h1 className="text-4xl md:text-6xl font-bold text-brand-black mb-6 leading-tight">
              Encontre o plano de saúde{" "}
              <span className="text-brand-blue">ideal para você</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
              Compare planos, analise benefícios e faça a melhor escolha para sua saúde e a de sua família com nosso simulador inteligente.
            </p>
          </div>

          {/* CTA Section */}
          <div className="animate-fade-in-up" style={{animationDelay: '0.3s'}}>
            <Card className="p-8 md:p-12 bg-white/80 backdrop-blur-sm border-2 border-brand-blue/10 shadow-xl hover:shadow-2xl transition-all duration-300 max-w-2xl mx-auto">
              <div className="space-y-6">
                <div className="w-20 h-20 mx-auto bg-brand-blue/10 rounded-full flex items-center justify-center animate-pulse-soft">
                  <div className="w-10 h-10 bg-brand-blue rounded-full flex items-center justify-center">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-white">
                      <path d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z" fill="currentColor" />
                    </svg>
                  </div>
                </div>
                
                <h2 className="text-2xl md:text-3xl font-semibold text-brand-black">
                  Pronto para começar?
                </h2>
                
                <p className="text-gray-600 text-lg">
                  Responda algumas perguntas simples e descubra os planos que mais se adequam ao seu perfil e orçamento.
                </p>
                
                <Link href="/simulator">
                  <Button 
                    size="lg" 
                    disabled={!termsAccepted}
                    className="bg-brand-blue hover:bg-brand-blue/90 text-white px-12 py-6 text-xl font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:hover:scale-100"
                  >
                    Faça a sua simulação
                  </Button>
                </Link>
                
                <div className="flex items-center justify-center space-x-2 mt-4">
                  <Checkbox 
                    id="terms" 
                    checked={termsAccepted}
                    onCheckedChange={(checked) => setTermsAccepted(checked as boolean)}
                  />
                  <label 
                    htmlFor="terms" 
                    className="text-sm text-gray-600 cursor-pointer"
                  >
                    Ao iniciar você concorda com nossos termos de uso e política de privacidade
                  </label>
                </div>
                
                <p className="text-sm text-gray-500 mt-4">
                  ✓ Gratuito ✓ Rápido ✓ Sem compromisso
                </p>
              </div>
            </Card>
          </div>

          {/* Features Section */}
          <div className="grid md:grid-cols-3 gap-8 mt-20 animate-fade-in-up" style={{animationDelay: '0.6s'}}>
            <div className="text-center p-6">
              <div className="w-16 h-16 mx-auto bg-brand-blue/10 rounded-full flex items-center justify-center mb-4">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="text-brand-blue">
                  <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-brand-black mb-2">Comparação Inteligente</h3>
              <p className="text-gray-600">Compare dezenas de planos de forma rápida e objetiva</p>
            </div>
            
            <div className="text-center p-6">
              <div className="w-16 h-16 mx-auto bg-brand-blue/10 rounded-full flex items-center justify-center mb-4">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="text-brand-blue">
                  <path d="M12 2V6M12 18V22M4.93 4.93L7.76 7.76M16.24 16.24L19.07 19.07M2 12H6M18 12H22M4.93 19.07L7.76 16.24M16.24 7.76L19.07 4.93" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-brand-black mb-2">Personalizado</h3>
              <p className="text-gray-600">Recomendações baseadas no seu perfil e necessidades</p>
            </div>
            
            <div className="text-center p-6">
              <div className="w-16 h-16 mx-auto bg-brand-blue/10 rounded-full flex items-center justify-center mb-4">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="text-brand-blue">
                  <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-brand-black mb-2">Resultado Instantâneo</h3>
              <p className="text-gray-600">Tenha a resposta em poucos minutos</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-20 py-8 border-t border-gray-200">
        <div className="container mx-auto px-6 text-center text-gray-500">
          <p>© 2025 Guia Único dos Planos de Saúde. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}