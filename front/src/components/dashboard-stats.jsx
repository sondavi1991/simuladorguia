import { Card, CardContent } from "./ui/card";
import { Users, UserPlus, Headphones, TrendingUp, Building, AlertCircle } from "lucide-react";
import { useAuth } from "../hooks/use-auth";

export default function DashboardStats({ stats }) {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  if (!stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-gray-200 h-32 rounded-xl"></div>
          </div>
        ))}
      </div>
    );
  }

  // Calculate conversion rate
  const conversionRate = stats.leads?.total > 0 
    ? Math.round((stats.leads.completed / stats.leads.total) * 100)
    : 0;

  // Different stats for admin vs distributor - removido o 4º card para distribuidores
  const statsCards = isAdmin ? [
    {
      title: "Leads Recebidos",
      value: stats.leads?.total || 0,
      subtitle: `${stats.leads?.new || 0} novos`,
      icon: UserPlus,
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
    },
    {
      title: "Atendimentos",
      value: stats.services?.total || 0,
      subtitle: `${stats.services?.completed || 0} concluídos`,
      icon: Headphones,
      iconBg: "bg-purple-100",
      iconColor: "text-purple-600",
    },
    {
      title: "Taxa de Conversão",
      value: `${conversionRate}%`,
      subtitle: `${stats.leads?.completed || 0} de ${stats.leads?.total || 0}`,
      icon: TrendingUp,
      iconBg: "bg-orange-100",
      iconColor: "text-orange-600",
    },
  ] : [
    {
      title: "Meus Leads",
      value: stats.leads?.total || 0,
      subtitle: `${stats.leads?.new || 0} novos`,
      icon: UserPlus,
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
    },
    {
      title: "Em Andamento",
      value: stats.leads?.in_progress || 0,
      subtitle: "leads ativos",
      icon: Building,
      iconBg: "bg-yellow-100",
      iconColor: "text-yellow-600",
    },
    {
      title: "Concluídos",
      value: stats.leads?.completed || 0,
      subtitle: "leads finalizados",
      icon: TrendingUp,
      iconBg: "bg-green-100",
      iconColor: "text-green-600",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {statsCards.map((card, index) => (
        <Card key={index} className="hover:shadow-lg transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{card.title}</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{card.value}</p>
                <p className="text-xs text-gray-500 mt-1">{card.subtitle}</p>
              </div>
              <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${card.iconBg}`}>
                <card.icon className={`h-6 w-6 ${card.iconColor}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
      
      {/* Show unassigned leads warning for admin */}
      {isAdmin && stats.leads?.unassigned && stats.leads.unassigned > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-800">Leads Não Atribuídos</p>
                <p className="text-3xl font-bold text-orange-900 mt-1">{stats.leads.unassigned}</p>
                <p className="text-xs text-orange-600 mt-1">necessitam atribuição</p>
              </div>
              <div className="h-12 w-12 bg-orange-200 rounded-lg flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

