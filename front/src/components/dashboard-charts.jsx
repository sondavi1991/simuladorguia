import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useAuth } from "../hooks/use-auth";
import { TrendingUp, Users } from "lucide-react";
import { apiRequest } from "../lib/queryClient";

export default function DashboardCharts() {
  const { user } = useAuth();
  const [period, setPeriod] = useState("30");
  const isAdmin = user?.role === "admin";

  const { data: leadsChart, isLoading: leadsLoading } = useQuery({
    queryKey: ["/dashboard/leads-chart", period],
    queryFn: async ({ queryKey }) => {
      const [url, periodParam] = queryKey;
      const res = await apiRequest("GET", `/dashboard/leads-chart?period=${periodParam}`);
      return res.json();
    },
  });

  const { data: topDistributors, isLoading: distributorsLoading } = useQuery({
    queryKey: ["/dashboard/top-distributors"],
    enabled: isAdmin,
  });

  // Prepare chart data
  const chartData = leadsChart?.map(item => ({
    date: new Date(item.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
    Novos: item.new,
    "Em Andamento": item.in_progress,
    Concluídos: item.completed,
    Perdidos: item.lost,
  })) || [];

  // Prepare distributor data for pie chart
  const distributorData = topDistributors?.slice(0, 5).map((dist, index) => ({
    name: dist.user?.name?.split(' ')[0] || 'N/A', // First name only
    value: dist.leads_count || 0,
    color: [
      "#10B981", // Green
      "#3B82F6", // Blue
      "#F59E0B", // Yellow
      "#EF4444", // Red
      "#8B5CF6", // Purple
    ][index] || "#e5e7eb",
  })) || [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Leads Chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              {isAdmin ? "Leads por Período" : "Meus Leads"}
            </CardTitle>
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 dias</SelectItem>
                <SelectItem value="30">30 dias</SelectItem>
                <SelectItem value="90">90 dias</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {leadsLoading ? (
            <div className="h-[300px] flex items-center justify-center">
              <div className="animate-pulse text-gray-500">Carregando gráfico...</div>
            </div>
          ) : chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="Novos" 
                  stroke="#10B981" 
                  strokeWidth={2}
                  dot={{ fill: "#10B981", strokeWidth: 2, r: 4 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="Em Andamento" 
                  stroke="#F59E0B" 
                  strokeWidth={2}
                  dot={{ fill: "#F59E0B", strokeWidth: 2, r: 4 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="Concluídos" 
                  stroke="#3B82F6" 
                  strokeWidth={2}
                  dot={{ fill: "#3B82F6", strokeWidth: 2, r: 4 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="Perdidos" 
                  stroke="#EF4444" 
                  strokeWidth={2}
                  dot={{ fill: "#EF4444", strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-500">
              Nenhum dado disponível para o período selecionado
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top Distributors Chart (Admin only) or Lead Status Chart (Distributor) */}
      {isAdmin ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              Leads Atendidos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {leadsLoading ? (
              <div className="h-[300px] flex items-center justify-center">
                <div className="animate-pulse text-gray-500">Carregando dados...</div>
              </div>
            ) : leadsChart && leadsChart.length > 0 ? (
              (() => {
                // Soma os status dos leads
                const totalNovos = leadsChart.reduce((acc, item) => acc + (item.new || 0), 0);
                const totalAndamento = leadsChart.reduce((acc, item) => acc + (item.in_progress || 0), 0);
                const totalConcluidos = leadsChart.reduce((acc, item) => acc + (item.completed || 0), 0);
                const totalPerdidos = leadsChart.reduce((acc, item) => acc + (item.lost || 0), 0);
                const data = [
                  { name: 'Novos', value: totalNovos, color: '#10B981' },
                  { name: 'Em Andamento', value: totalAndamento, color: '#F59E0B' },
                  { name: 'Concluídos', value: totalConcluidos, color: '#3B82F6' },
                  { name: 'Perdidos', value: totalPerdidos, color: '#EF4444' },
                ].filter(d => d.value > 0);
                return (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {data.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value, name) => [`${value} leads`, name]} />
                    </PieChart>
                  </ResponsiveContainer>
                );
              })()
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-500">
                Nenhum dado disponível
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              Status dos Meus Leads
            </CardTitle>
          </CardHeader>
          <CardContent>
            {leadsLoading ? (
              <div className="h-[300px] flex items-center justify-center">
                <div className="animate-pulse text-gray-500">Carregando dados...</div>
              </div>
            ) : chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="Novos" fill="#10B981" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="Em Andamento" fill="#F59E0B" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="Concluídos" fill="#3B82F6" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-500">
                Nenhum dado disponível
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

