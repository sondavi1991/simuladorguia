import { useState } from "react";
import SimulatorForm from "@/components/simulator-form";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { openWhatsApp } from "@/lib/whatsapp";

export default function Home() {
  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Encontre o <span className="text-gups-teal">Plano de Saúde</span> Ideal
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Responda algumas perguntas e receba recomendações personalizadas dos melhores planos para você
        </p>
      </div>

      {/* Simulator Form */}
      <SimulatorForm />

      {/* WhatsApp Floating Button */}
      <div className="fixed bottom-6 right-6 z-40">
        <Button
          size="lg"
          className="bg-green-500 hover:bg-green-600 text-white rounded-full w-16 h-16 p-0 shadow-lg transition-all hover:scale-110"
          onClick={() => openWhatsApp()}
        >
          <MessageCircle className="h-8 w-8" />
        </Button>
      </div>

      {/* Platform Recommendations */}
      <div className="bg-white rounded-2xl shadow-xl p-8 mt-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
          <svg className="w-6 h-6 text-gups-teal mr-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M2 5a2 2 0 012-2h8a2 2 0 012 2v10a2 2 0 002 2H4a2 2 0 01-2-2V5zm3 1h6v4H5V6zm6 6H5v2h6v-2z" clipRule="evenodd" />
          </svg>
          Recomendações de Plataforma
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Database Solutions */}
          <div className="border border-gray-200 rounded-lg p-6">
            <h3 className="font-semibold text-lg text-gray-900 mb-4">Banco de Dados</h3>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded">Recomendado</div>
                <div>
                  <div className="font-medium">Supabase</div>
                  <div className="text-sm text-gray-600">PostgreSQL managed, real-time, com auth integrado</div>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded">Alternativa</div>
                <div>
                  <div className="font-medium">Firebase</div>
                  <div className="text-sm text-gray-600">NoSQL, real-time, integração Google</div>
                </div>
              </div>
            </div>
          </div>

          {/* Hosting Solutions */}
          <div className="border border-gray-200 rounded-lg p-6">
            <h3 className="font-semibold text-lg text-gray-900 mb-4">Hospedagem</h3>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded">Recomendado</div>
                <div>
                  <div className="font-medium">Vercel</div>
                  <div className="text-sm text-gray-600">Deploy automático, CDN global, otimizado para React</div>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded">Alternativa</div>
                <div>
                  <div className="font-medium">Netlify</div>
                  <div className="text-sm text-gray-600">JAMstack, functions serverless, formulários</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-start space-x-3">
            <svg className="w-5 h-5 text-blue-500 mt-1" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <div>
              <div className="font-medium text-blue-900">Recomendação Técnica</div>
              <div className="text-sm text-blue-700 mt-1">
                Para um simulador com admin panel, recomendamos: <strong>Next.js + Supabase + Vercel</strong>. 
                Esta stack oferece desenvolvimento rápido, escalabilidade automática e custos baixos para começar.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
