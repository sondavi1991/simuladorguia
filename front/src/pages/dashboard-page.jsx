import { useAuth } from "../hooks/use-auth";
import Sidebar from "../components/sidebar";
import Header from "../components/header";
import DashboardStats from "../components/dashboard-stats";
import DashboardCharts from "../components/dashboard-charts";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { UserPlus, Check, Clock, Users, TrendingUp, AlertCircle, Activity, Globe } from "lucide-react";

export default function DashboardPage() {
  const { user } = useAuth();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/dashboard/stats"],
  });

  const { data: activities, isLoading: activitiesLoading } = useQuery({
    queryKey: ["/dashboard/recent-activities"],
  });

  if (statsLoading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 ml-64">
          <Header title="Dashboard" subtitle="Carregando..." />
          <div className="p-6">
            <div className="animate-pulse space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-gray-200 h-32 rounded-xl"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return "agora";
    if (diffInMinutes < 60) return `há ${diffInMinutes} min`;
    if (diffInMinutes < 1440) return `há ${Math.floor(diffInMinutes / 60)} h`;
    return `há ${Math.floor(diffInMinutes / 1440)} dias`;
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case "lead":
        return {
          icon: UserPlus,
          iconBg: "bg-green-100",
          iconColor: "text-green-600",
        };
      case "service":
        return {
          icon: Check,
          iconBg: "bg-blue-100",
          iconColor: "text-blue-600",
        };
      case "distributor":
        return {
          icon: Users,
          iconBg: "bg-purple-100",
          iconColor: "text-purple-600",
        };
      default:
        return {
          icon: AlertCircle,
          iconBg: "bg-gray-100",
          iconColor: "text-gray-600",
        };
    }
  };

  // Função para formatar atividades de forma amigável
  const formatActivityForDisplay = (activity) => {
    let title = activity.title;
    let description = activity.description;
    let distributor = activity.distributor;

    // Se title for objeto, extrair informações relevantes
    if (typeof title === "object" && title !== null) {
      if (title.name) {
        title = `Novo lead: ${title.name}`;
      } else {
        title = "Nova atividade";
      }
    }

    // Se description for objeto ou contém JSON, extrair informações
    if (typeof description === "object" && description !== null) {
      description = `Atividade do sistema`;
    } else if (typeof description === "string" && description.includes('{"')) {
      // Se a description contém JSON, tentar extrair informações úteis
      try {
        // Extrair cidade e estado se possível
        const cityMatch = description.match(/"name":"([^"]+)"/);
        const city = cityMatch ? cityMatch[1] : null;
        
        if (city) {
          description = `Lead de ${city}`;
        } else {
          description = "Nova atividade registrada";
        }
      } catch (e) {
        description = "Nova atividade registrada";
      }
    }

    // Se distributor for objeto, extrair o nome
    if (typeof distributor === "object" && distributor !== null) {
      distributor = distributor.name || distributor.user?.name || "Distribuidor";
    }

    return {
      title,
      description,
      distributor,
      date: activity.date,
      type: activity.type
    };
  };

  // Aplica o tratamento em todas as atividades
  const formattedActivities = activities?.map(formatActivityForDisplay) || [];

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 ml-64">
        <Header 
          title="Dashboard" 
          subtitle={`Bem-vindo, ${user?.name}! Visão geral do sistema`} 
        />
        <main className="p-6 space-y-6">
          <DashboardStats stats={stats} />
          <DashboardCharts />
          {/* Atividades Recentes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="h-5 w-5 mr-2" />
                Atividades Recentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {activitiesLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-gray-500">Carregando atividades...</p>
                </div>
              ) : formattedActivities && formattedActivities.length > 0 ? (
                <div className="space-y-4">
                  {formattedActivities.map((activity, index) => {
                    const { icon: Icon, iconBg, iconColor } = getActivityIcon(activity.type);
                    return (
                      <div key={index} className="flex items-center space-x-4 py-3 border-b border-gray-100 last:border-b-0">
                        <div className={`h-10 w-10 ${iconBg} rounded-lg flex items-center justify-center`}>
                          <Icon className={`h-5 w-5 ${iconColor}`} />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            {activity.title}
                          </p>
                          <p className="text-xs text-gray-500">
                            {activity.description}
                            {activity.distributor && ` - ${activity.distributor}`}
                          </p>
                        </div>
                        <span className="text-xs text-gray-500">{formatDate(activity.date)}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <TrendingUp className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Nenhuma atividade recente encontrada</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Créditos DM Soluções */}
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-100">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="text-center md:text-left">
                  <h3 className="text-lg font-semibold text-blue-900 mb-1">
                    Sistema desenvolvido por DM - Soluções WEB
                  </h3>
                  <p className="text-blue-700">
                    Fale conosco para mais soluções
                  </p>
                </div>
                <Button
                  onClick={() => window.open('https://www.davimanoel.com.br', '_blank')}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors duration-200 flex items-center gap-2"
                >
                  <Globe className="h-4 w-4" />
                  Visitar Site
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}

