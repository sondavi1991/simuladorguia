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
    staleTime: 0,
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

  // Export to Excel functionality
  const handleExportExcel = async () => {
    try {
      const response = await fetch('/api/form-submissions/export');
      if (!response.ok) {
        throw new Error('Falha ao exportar dados');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `simulacoes-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Exportação concluída",
        description: "Os dados foram exportados para Excel com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro na exportação",
        description: "Não foi possível exportar os dados para Excel.",
        variant: "destructive",
      });
    }
  };

  // Filter submissions based on filters - adapted for dynamic form data
  const filteredSubmissions = submissions.filter((submission) => {
    const submissionDate = new Date(submission.submittedAt);
    const startDate = filters.startDate ? new Date(filters.startDate) : null;
    const endDate = filters.endDate ? new Date(filters.endDate) : null;

    if (startDate && submissionDate < startDate) return false;
    if (endDate && submissionDate > endDate) return false;
    
    // For dynamic form data, check within formData object
    const formData = submission.formData || {};
    if (filters.planType !== "all" && formData.planType !== filters.planType) return false;
    if (filters.priceRange !== "all" && formData.priceRange !== filters.priceRange) return false;

    return true;
  });

  // Pagination
  const totalPages = Math.ceil(filteredSubmissions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedSubmissions = filteredSubmissions.slice(startIndex, startIndex + itemsPerPage);

  // Statistics - adapted for dynamic form data
  const totalSimulations = filteredSubmissions.length;
  const uniqueUsers = new Set(filteredSubmissions.map(s => s.formData?.email || s.id)).size;
  const averageAge = filteredSubmissions.length > 0 
    ? Math.round(filteredSubmissions.reduce((sum, s) => {
        const birthDate = s.formData?.birthDate || s.formData?.['data-nascimento'];
        if (birthDate) {
          const age = new Date().getFullYear() - new Date(birthDate).getFullYear();
          return sum + age;
        }
        return sum;
      }, 0) / filteredSubmissions.length)
    : 0;

  const planTypeStats = filteredSubmissions.reduce((acc, submission) => {
    const planType = submission.formData?.planType || submission.formData?.['tipo-plano'] || 'Não informado';
    acc[planType] = (acc[planType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const handleDeleteSubmission = (id: number) => {
    deleteSubmissionMutation.mutate(id);
  };

  const clearFilters = () => {
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
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Carregando dados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
        <div className="flex gap-2">
          <Button onClick={handleExportExcel} className="bg-green-600 hover:bg-green-700">
            <Download className="h-4 w-4 mr-2" />
            Exportar Excel
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Simulações</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSimulations}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuários Únicos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uniqueUsers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Idade Média</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageAge} anos</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Plano Mais Procurado</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-bold">
              {Object.entries(planTypeStats).length > 0 
                ? Object.entries(planTypeStats).sort(([,a], [,b]) => b - a)[0][0]
                : 'N/A'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
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
                  <SelectValue placeholder="Selecione..." />
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
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="0-200">R$ 0 - R$ 200</SelectItem>
                  <SelectItem value="200-500">R$ 200 - R$ 500</SelectItem>
                  <SelectItem value="500-1000">R$ 500 - R$ 1.000</SelectItem>
                  <SelectItem value="1000+">R$ 1.000+</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button onClick={clearFilters} variant="outline" className="w-full">
                Limpar Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>Simulações ({filteredSubmissions.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Dados do Formulário</TableHead>
                  <TableHead>IP</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedSubmissions.map((submission) => (
                  <TableRow key={submission.id}>
                    <TableCell className="font-medium">{submission.id}</TableCell>
                    <TableCell>
                      {new Date(submission.submittedAt).toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {submission.formData && typeof submission.formData === 'object' && 
                          Object.entries(submission.formData).slice(0, 3).map(([key, value]) => (
                            <div key={key} className="text-xs">
                              <span className="font-medium">{key}:</span> {
                                Array.isArray(value) ? value.join(', ') : 
                                typeof value === 'object' ? JSON.stringify(value) :
                                String(value)
                              }
                            </div>
                          ))
                        }
                        {submission.formData && Object.keys(submission.formData).length > 3 && (
                          <div className="text-xs text-gray-500">
                            +{Object.keys(submission.formData).length - 3} campos...
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-gray-500">
                      {submission.ipAddress || 'N/A'}
                    </TableCell>
                    <TableCell>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja excluir esta simulação? Esta ação não pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteSubmission(submission.id)}>
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
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-gray-700">
                Mostrando {startIndex + 1} a {Math.min(startIndex + itemsPerPage, filteredSubmissions.length)} de {filteredSubmissions.length} resultados
              </p>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm">
                  Página {currentPage} de {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}