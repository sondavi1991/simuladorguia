import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Calendar, Download, Trash2, Filter, Users, TrendingUp, FileText, ChevronLeft, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { FormSubmission } from "@shared/schema";

interface AnalyticsFilters {
  startDate: string;
  endDate: string;
  planType: string;
  priceRange: string;
}

export default function AnalyticsPanel() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [filters, setFilters] = useState<AnalyticsFilters>({
    startDate: "",
    endDate: "",
    planType: "all",
    priceRange: "all"
  });

  const { data: submissions = [], isLoading, refetch } = useQuery<FormSubmission[]>({
    queryKey: ["/api/form-submissions"],
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    staleTime: 0, // Always refetch
  });

  const deleteSubmissionMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/form-submissions/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/form-submissions"] });
      toast({
        title: "Simulação excluída",
        description: "A simulação foi removida com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao excluir simulação.",
        variant: "destructive",
      });
    }
  });

  // Filter submissions based on filters
  const filteredSubmissions = submissions.filter((submission) => {
    const submissionDate = new Date(submission.submittedAt);
    const startDate = filters.startDate ? new Date(filters.startDate) : null;
    const endDate = filters.endDate ? new Date(filters.endDate) : null;

    if (startDate && submissionDate < startDate) return false;
    if (endDate && submissionDate > endDate) return false;
    if (filters.planType !== "all" && submission.planType !== filters.planType) return false;
    if (filters.priceRange !== "all" && submission.priceRange !== filters.priceRange) return false;

    return true;
  });

  // Pagination
  const totalPages = Math.ceil(filteredSubmissions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedSubmissions = filteredSubmissions.slice(startIndex, startIndex + itemsPerPage);

  // Statistics
  const totalSimulations = filteredSubmissions.length;
  const uniqueUsers = new Set(filteredSubmissions.map(s => s.email)).size;
  const averageAge = filteredSubmissions.length > 0 
    ? Math.round(filteredSubmissions.reduce((sum, s) => {
        const age = new Date().getFullYear() - new Date(s.birthDate).getFullYear();
        return sum + age;
      }, 0) / filteredSubmissions.length)
    : 0;

  const planTypeStats = filteredSubmissions.reduce((acc, submission) => {
    acc[submission.planType] = (acc[submission.planType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const handleExportExcel = () => {
    if (filteredSubmissions.length === 0) {
      toast({
        title: "Nenhum dado para exportar",
        description: "Não há simulações para exportar com os filtros aplicados.",
        variant: "destructive",
      });
      return;
    }

    // Create CSV content
    const headers = [
      "Nome",
      "Email", 
      "Telefone",
      "Data de Nascimento",
      "CEP",
      "Tipo de Plano",
      "Faixa de Preço",
      "Serviços",
      "Dependentes",
      "Data da Simulação"
    ];

    const csvContent = [
      headers.join(","),
      ...filteredSubmissions.map(submission => [
        `"${submission.name}"`,
        `"${submission.email}"`,
        `"${submission.phone}"`,
        `"${submission.birthDate}"`,
        `"${submission.zipCode}"`,
        `"${submission.planType}"`,
        `"${submission.priceRange}"`,
        `"${submission.services?.join("; ") || ""}"`,
        `"${submission.dependents?.map(d => d.name).join("; ") || ""}"`,
        `"${new Date(submission.submittedAt).toLocaleDateString("pt-BR")}"`
      ].join(","))
    ].join("\n");

    // Download file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `simulacoes_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Exportação concluída",
      description: "Os dados foram exportados com sucesso.",
    });
  };

  const handleDeleteSubmission = (id: number) => {
    deleteSubmissionMutation.mutate(id);
  };

  const resetFilters = () => {
    setFilters({
      startDate: "",
      endDate: "",
      planType: "all",
      priceRange: "all"
    });
    setCurrentPage(1);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Carregando analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Simulações</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSimulations}</div>
            <p className="text-xs text-muted-foreground">
              {submissions.length} no total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuários Únicos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uniqueUsers}</div>
            <p className="text-xs text-muted-foreground">
              Emails únicos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Idade Média</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageAge}</div>
            <p className="text-xs text-muted-foreground">
              Anos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Plano Mais Popular</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Object.keys(planTypeStats).length > 0 
                ? Object.entries(planTypeStats).sort(([,a], [,b]) => b - a)[0][0]
                : "N/A"
              }
            </div>
            <p className="text-xs text-muted-foreground">
              {Object.keys(planTypeStats).length > 0 
                ? `${Object.entries(planTypeStats).sort(([,a], [,b]) => b - a)[0][1]} simulações`
                : "Nenhum dado"
              }
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filtros
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <TrendingUp className="w-4 h-4" />
              Atualizar Dados
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <Label htmlFor="startDate">Data Inicial</Label>
              <Input
                id="startDate"
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="endDate">Data Final</Label>
              <Input
                id="endDate"
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="planType">Tipo de Plano</Label>
              <Select value={filters.planType} onValueChange={(value) => setFilters({ ...filters, planType: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="individual">Individual</SelectItem>
                  <SelectItem value="familiar">Familiar</SelectItem>
                  <SelectItem value="empresarial">Empresarial</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="priceRange">Faixa de Preço</Label>
              <Select value={filters.priceRange} onValueChange={(value) => setFilters({ ...filters, priceRange: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="até-100">Até R$ 100</SelectItem>
                  <SelectItem value="100-300">R$ 100-300</SelectItem>
                  <SelectItem value="300-500">R$ 300-500</SelectItem>
                  <SelectItem value="acima-500">Acima de R$ 500</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button variant="outline" onClick={resetFilters} className="w-full">
                Limpar Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">
          Simulações ({filteredSubmissions.length})
        </h3>
        <Button onClick={handleExportExcel} className="flex items-center gap-2 bg-green-600 hover:bg-green-700">
          <Download className="w-4 h-4" />
          Exportar Excel
        </Button>
      </div>

      {/* Submissions Table */}
      <Card>
        <CardContent className="p-0">
          {filteredSubmissions.length === 0 ? (
            <div className="p-8 text-center">
              <FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">Nenhuma simulação encontrada com os filtros aplicados.</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Tipo de Plano</TableHead>
                    <TableHead>Faixa de Preço</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedSubmissions.map((submission) => (
                    <TableRow key={submission.id}>
                      <TableCell className="font-medium">{submission.name}</TableCell>
                      <TableCell>{submission.email}</TableCell>
                      <TableCell>{submission.phone}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{submission.planType}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{submission.priceRange}</Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(submission.submittedAt).toLocaleDateString("pt-BR")}
                      </TableCell>
                      <TableCell>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja excluir a simulação de {submission.name}? 
                                Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteSubmission(submission.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between p-4 border-t">
                  <div className="text-sm text-gray-600">
                    Mostrando {startIndex + 1} até {Math.min(startIndex + itemsPerPage, filteredSubmissions.length)} de {filteredSubmissions.length} simulações
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Anterior
                    </Button>
                    <span className="text-sm">
                      Página {currentPage} de {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      Próxima
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}