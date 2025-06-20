import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/sidebar";
import Header from "@/components/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { FileSpreadsheet, Download, Calendar, Filter, BarChart3, TrendingUp } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { apiRequest } from "@/lib/queryClient";

export default function ReportsPage() {
  const { user } = useAuth();
  
  const isAdmin = user?.role === "admin";
  const isDistributor = user?.role === "distributor";
  
  // Estados para distribuidor
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  
  // Estados para admin
  const [reportType, setReportType] = useState("leads");
  const [period, setPeriod] = useState("month");
  const [distributor, setDistributor] = useState("all");
  
  const [isExporting, setIsExporting] = useState(false);

  // Função auxiliar para formatar data
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR");
  };

  // Função auxiliar para ajustar data para o fuso horário do Brasil
  const adjustDateToBrazilTimezone = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    // Ajusta para o fuso horário do Brasil (UTC-3)
    date.setHours(date.getHours() - 3);
    return date;
  };

  // Query para distribuidor - buscar leads
  const { data: leads, isLoading: leadsLoading } = useQuery({
    queryKey: ["/leads", { startDate, endDate, distributor_id: user?.distributor?.id }],
    queryFn: async () => {
      let url = "/leads";
      const params = [];
      
      // Sempre incluir o ID do distribuidor
      if (user?.distributor?.id) {
        params.push(`distributor_id=${user.distributor.id}`);
      }
      
      // Incluir datas se especificadas
      if (startDate) {
        // Ajusta a data inicial para o início do dia no fuso horário do Brasil
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        // Ajusta para UTC
        start.setHours(start.getHours() + 3);
        params.push(`start_date=${start.toISOString()}`);
      }
      
      if (endDate) {
        // Ajusta a data final para o fim do dia no fuso horário do Brasil
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        // Ajusta para UTC
        end.setHours(end.getHours() + 3);
        params.push(`end_date=${end.toISOString()}`);
      }
      
      if (params.length > 0) {
        url += `?${params.join("&")}`;
      }
      
      console.log("URL da busca:", url);
      const res = await apiRequest("GET", url);
      const data = await res.json();
      console.log("Dados recebidos:", data);
      return data;
    },
    enabled: isDistributor && !!user?.distributor?.id,
  });

  // Query para admin - estatísticas
  const { data: stats } = useQuery({
    queryKey: ["/reports/stats", { period, distributor_id: distributor !== 'all' ? distributor : null }],
    enabled: isAdmin,
  });

  // Query para admin - distribuidores
  const { data: distributors = [] } = useQuery({
    queryKey: ["/distributors"],
    enabled: isAdmin,
    select: (data) => data.data || [],
  });

  // Filtrar apenas leads do distribuidor logado
  const filteredLeads = isDistributor ? (leads?.data || []) : [];

  // Configurações para admin
  const reportTypes = [
    { value: "leads", label: "Relatório de Leads", icon: BarChart3 },
    { value: "performance", label: "Relatório de Performance", icon: TrendingUp },
  ];

  const periods = [
    { value: "week", label: "Última Semana" },
    { value: "month", label: "Último Mês" },
    { value: "quarter", label: "Último Trimestre" },
    { value: "year", label: "Último Ano" },
  ];

  // Exportação para distribuidor
  const handleDistributorExport = async () => {
    if (isExporting) return;
    
    setIsExporting(true);
    
    try {
      console.log("Iniciando exportação para distribuidor...");
      
      if (!user?.distributor?.id) {
        throw new Error("ID do distribuidor não encontrado");
      }

      const payload = {
        type: "leads",
        distributor_id: String(user.distributor.id),
      };
      
      // Incluir datas se especificadas, senão usar período padrão
      if (startDate || endDate) {
        if (startDate) payload.start_date = startDate;
        if (endDate) payload.end_date = endDate;
      } else {
        payload.period = "month"; // Período padrão se nenhuma data for especificada
      }
      
      console.log("Payload enviado:", payload);
      
      const response = await apiRequest("POST", "/reports/export", payload);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Erro na resposta:", response.status, errorText);
        throw new Error(`Erro ${response.status}: ${errorText}`);
      }
      
      const blob = await response.blob();
      
      if (blob.size === 0) {
        throw new Error("Arquivo exportado está vazio");
      }
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = `relatorio_leads_${new Date().toISOString().split("T")[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }, 100);
      
      toast.success("Relatório exportado com sucesso!");
      
    } catch (error) {
      console.error("Erro ao exportar:", error);
      toast.error(error.message || "Erro ao exportar relatório");
    } finally {
      setIsExporting(false);
    }
  };

  // Exportação para admin
  const handleAdminExport = async (type = reportType) => {
    setIsExporting(true);
    try {
      const payload = {
        type: type,
        period: period,
        distributor_id: distributor !== 'all' ? distributor : null,
      };
      const response = await apiRequest('POST', '/reports/export', payload);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      const contentDisposition = response.headers.get('content-disposition');
      let filename = `relatorio_${type}_${new Date().toISOString().split('T')[0]}.xlsx`;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Relatório exportado com sucesso!');
    } catch (error) {
      toast.error(error.message || 'Erro ao exportar relatório');
    } finally {
      setIsExporting(false);
    }
  };

  const getQuickStats = () => {
    if (!stats) return [];
    return [
      {
        title: "Total de Leads",
        value: stats.totalLeads,
        change: "+12%",
        positive: true,
      },
      {
        title: "Taxa de Conversão",
        value: `${stats.conversionRate}%`,
        change: "+3%",
        positive: true,
      },
      {
        title: "Atendimentos",
        value: stats.totalServices,
        change: "+8%",
        positive: true,
      },
      {
        title: "Distribuidores Ativos",
        value: stats.totalDistributors,
        change: "+2",
        positive: true,
      },
    ];
  };

  // VIEW PARA DISTRIBUIDOR
  if (!isAdmin) {
    console.log("=== ENTRANDO NA VIEW DO DISTRIBUIDOR ===");
    console.log("Condição !isAdmin:", !isAdmin);
    console.log("isAdmin:", isAdmin);
    console.log("Vai criar o botão de exportação");
    
    const exportButton = (
      <Button 
        onClick={handleDistributorExport} 
        disabled={isExporting || !user?.distributor?.id}
        className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded"
      >
        <Download className="h-4 w-4 mr-2" />
        {isExporting ? "Exportando..." : "Exportar Excel"}
      </Button>
    );
    
    console.log("Botão criado:", exportButton);
    console.log("===================================");
    
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 ml-64">
          <Header
            title="Relatório de Leads"
            subtitle="Veja e exporte seus leads atribuídos"
            action={exportButton}
            hideSearchAndNotifications={true}
          />
          <main className="p-6 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Filtrar por Data</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row gap-4 items-center">
                  <div>
                    <Label>Data Inicial</Label>
                    <input 
                      type="date" 
                      value={startDate} 
                      onChange={e => setStartDate(e.target.value)} 
                      className="border rounded px-2 py-1" 
                    />
                  </div>
                  <div>
                    <Label>Data Final</Label>
                    <input 
                      type="date" 
                      value={endDate} 
                      onChange={e => setEndDate(e.target.value)} 
                      className="border rounded px-2 py-1" 
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Leads Atribuídos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                  <span className="text-base font-medium text-gray-700">
                    Total de leads encontrados: <span className="font-bold text-primary">{filteredLeads.length}</span>
                  </span>
                  {startDate || endDate ? (
                    <span className="text-xs text-gray-500">
                      {startDate && `De: ${formatDate(startDate)}`} 
                      {endDate && ` até ${formatDate(endDate)}`}
                    </span>
                  ) : null}
                </div>
                <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
                  <table className="min-w-full text-sm text-gray-700">
                    <thead className="bg-gray-50 sticky top-0 z-10">
                      <tr>
                        <th className="px-4 py-3 border-b font-semibold text-left">Data</th>
                        <th className="px-4 py-3 border-b font-semibold text-left">Nome</th>
                        <th className="px-4 py-3 border-b font-semibold text-left">Cidade</th>
                        <th className="px-4 py-3 border-b font-semibold text-left">Estado</th>
                        <th className="px-4 py-3 border-b font-semibold text-left">Bairro</th>
                        <th className="px-4 py-3 border-b font-semibold text-left">Whatsapp</th>
                        <th className="px-4 py-3 border-b font-semibold text-left">E-mail</th>
                        <th className="px-4 py-3 border-b font-semibold text-left">Atualização de status de prospecção</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredLeads.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="text-center py-8 text-gray-400">
                            {leadsLoading ? "Carregando leads..." : "Nenhum lead encontrado para o período selecionado."}
                          </td>
                        </tr>
                      ) : (
                        filteredLeads.map((lead, idx) => (
                          <tr key={lead.id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                            <td className="px-4 py-2 border-b">{formatDate(lead.created_at)}</td>
                            <td className="px-4 py-2 border-b">{lead.name}</td>
                            <td className="px-4 py-2 border-b">{lead.city?.name || ""}</td>
                            <td className="px-4 py-2 border-b">{lead.state?.name || ""}</td>
                            <td className="px-4 py-2 border-b">{lead.neighborhood?.name || ""}</td>
                            <td className="px-4 py-2 border-b">{lead.whatsapp || lead.phone || ""}</td>
                            <td className="px-4 py-2 border-b">{lead.email}</td>
                            <td className="px-4 py-2 border-b">{lead.notes || ""}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    );
  }

  // VIEW PARA ADMIN (ORIGINAL)
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 ml-64">
        <Header 
          title="Relatórios" 
          subtitle="Exporte dados e gere relatórios do sistema"
          action={
            <Button onClick={() => handleAdminExport()} disabled={isExporting} className="bg-warning hover:bg-warning/90 text-white">
              <Download className="h-4 w-4 mr-2" />
              {isExporting ? 'Exportando...' : 'Exportar Excel'}
            </Button>
          }
        />
        
        <main className="p-6 space-y-6">
          {/* Report Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Filter className="h-5 w-5 mr-2" />
                Configuração do Relatório
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label>Tipo de Relatório</Label>
                  <Select value={reportType} onValueChange={setReportType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {reportTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center">
                            <type.icon className="h-4 w-4 mr-2" />
                            {type.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Período</Label>
                  <Select value={period} onValueChange={setPeriod}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {periods.map((p) => (
                        <SelectItem key={p.value} value={p.value}>
                          {p.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Distribuidor</Label>
                  <Select value={distributor} onValueChange={setDistributor}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os Distribuidores</SelectItem>
                      {distributors.map((dist) => (
                        <SelectItem key={dist.id} value={dist.id.toString()}>
                          {dist.user.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Available Reports */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {reportTypes.map((type) => (
              <Card key={type.value} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <type.icon className="h-5 w-5 mr-2 text-primary" />
                    {type.label}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600">
                      {type.value === "leads" && "Relatório completo de todos os leads recebidos, incluindo status, distribuidor responsável e histórico de atendimento."}
                      {type.value === "performance" && "Métricas de performance por distribuidor, taxa de conversão e análise de tendências."}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        Formato: Excel (.xlsx)
                      </span>
                      <Button 
                        size="sm" 
                        variant="outline"
                        disabled={isExporting}
                        onClick={() => {
                          setReportType(type.value);
                          handleAdminExport(type.value);
                        }}
                      >
                        <FileSpreadsheet className="h-4 w-4 mr-1" />
                        {isExporting ? 'Gerando...' : 'Gerar'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
} 