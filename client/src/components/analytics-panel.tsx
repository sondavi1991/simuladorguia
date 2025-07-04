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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar, Download, Trash2, Filter, Users, TrendingUp, FileText, ChevronLeft, ChevronRight, Eye } from "lucide-react";
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

  // Fetch form steps to map field IDs to labels
  const { data: formSteps = [] } = useQuery<any[]>({
    queryKey: ["/api/form-steps"],
  });

  // Create a mapping of field IDs to their labels
  const getFieldLabel = (fieldId: string): string => {
    // Check dynamic fields in form steps
    for (const step of formSteps) {
      if (step.fields) {
        for (const field of step.fields) {
          if (field.id === fieldId) {
            return field.label;
          }
        }
      }
    }
    
    // Map old static field names to readable labels
    const staticFieldLabels: Record<string, string> = {
      'name': 'Nome Completo',
      'email': 'E-mail',
      'phone': 'Telefone',
      'birthDate': 'Data de Nascimento',
      'zipCode': 'CEP',
      'planType': 'Tipo de Plano',
      'priceRange': 'Faixa de Preço',
      'services': 'Serviços',
      'dependents': 'Dependentes'
    };
    
    if (staticFieldLabels[fieldId]) {
      return staticFieldLabels[fieldId];
    }
    
    // Fallback: format field ID nicely
    if (fieldId.includes('_')) {
      const parts = fieldId.split('_');
      const readablePart = parts[parts.length - 1];
      return readablePart.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    }
    
    return fieldId.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
  };

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
                        {submission.formData && typeof submission.formData === 'object' && (() => {
                          // Get current form field IDs
                          const currentFieldIds = new Set<string>();
                          formSteps.forEach(step => {
                            if (step.fields) {
                              step.fields.forEach(field => {
                                currentFieldIds.add(field.id);
                              });
                            }
                          });

                          const entries = Object.entries(submission.formData);
                          // Filter to show only relevant fields
                          const priorityFields = ['name', 'email', 'phone'];
                          const relevantEntries = entries.filter(([key]) => {
                            return currentFieldIds.has(key) || priorityFields.includes(key);
                          });
                          
                          // Prioritize contact fields, then show others
                          const priorityEntries = relevantEntries.filter(([key]) => priorityFields.includes(key));
                          const otherEntries = relevantEntries.filter(([key]) => !priorityFields.includes(key));
                          const displayEntries = [...priorityEntries, ...otherEntries].slice(0, 3);
                          
                          return displayEntries.map(([key, value]) => (
                            <div key={key} className="text-xs">
                              <span className="font-medium">{getFieldLabel(key)}:</span> {
                                value !== null && value !== undefined && String(value).trim() !== '' ? (
                                  Array.isArray(value) ? value.join(', ') : 
                                  typeof value === 'object' ? JSON.stringify(value) :
                                  String(value)
                                ) : (
                                  <span className="text-gray-400">Não informado</span>
                                )
                              }
                            </div>
                          ));
                        })()}
                        {submission.formData && (() => {
                          const currentFieldIds = new Set<string>();
                          formSteps.forEach(step => {
                            if (step.fields) {
                              step.fields.forEach(field => {
                                currentFieldIds.add(field.id);
                              });
                            }
                          });
                          const priorityFields = ['name', 'email', 'phone'];
                          const relevantEntries = Object.entries(submission.formData).filter(([key]) => {
                            return currentFieldIds.has(key) || priorityFields.includes(key);
                          });
                          
                          return relevantEntries.length > 3 ? (
                            <div className="text-xs text-gray-500">
                              +{relevantEntries.length - 3} campos...
                            </div>
                          ) : null;
                        })()}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-gray-500">
                      {submission.ipAddress || 'N/A'}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" className="text-blue-600 hover:text-blue-700">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Detalhes da Simulação #{submission.id}</DialogTitle>
                              <DialogDescription>
                                Visualização completa dos dados preenchidos
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <span className="font-medium text-gray-700">Data de Submissão:</span>
                                  <p>{new Date(submission.submittedAt).toLocaleString("pt-BR")}</p>
                                </div>
                                <div>
                                  <span className="font-medium text-gray-700">Endereço IP:</span>
                                  <p>{submission.ipAddress || 'N/A'}</p>
                                </div>
                                <div>
                                  <span className="font-medium text-gray-700">User Agent:</span>
                                  <p className="text-xs break-all">{submission.userAgent || 'N/A'}</p>
                                </div>
                                <div>
                                  <span className="font-medium text-gray-700">Session ID:</span>
                                  <p className="text-xs break-all">{submission.sessionId || 'N/A'}</p>
                                </div>
                              </div>
                              
                              <div className="border-t pt-4">
                                <h4 className="font-medium text-gray-900 mb-3">Dados do Formulário</h4>
                                <div className="space-y-3">
                                  {submission.formData && typeof submission.formData === 'object' ? (() => {
                                    // Get all current form field IDs from form steps
                                    const currentFieldIds = new Set<string>();
                                    formSteps.forEach(step => {
                                      if (step.fields) {
                                        step.fields.forEach(field => {
                                          currentFieldIds.add(field.id);
                                        });
                                      }
                                    });

                                    // Filter to show only fields that exist in current form structure
                                    const relevantEntries = Object.entries(submission.formData).filter(([key]) => {
                                      // Always include basic contact fields (name, email, phone) for backwards compatibility
                                      const basicFields = ['name', 'email', 'phone'];
                                      return currentFieldIds.has(key) || basicFields.includes(key);
                                    });

                                    if (relevantEntries.length === 0) {
                                      return <p className="text-gray-500 italic">Nenhum dado relevante encontrado</p>;
                                    }

                                    return relevantEntries.map(([key, value]) => (
                                      <div key={key} className="bg-gray-50 p-3 rounded-lg">
                                        <span className="font-medium text-gray-700">
                                          {getFieldLabel(key)}:
                                        </span>
                                        <div className="mt-1">
                                          {Array.isArray(value) ? (
                                            <div className="flex flex-wrap gap-1">
                                              {value.map((item, index) => (
                                                <Badge key={index} className="text-xs bg-[#000c70] text-[#f7f7f7]">
                                                  {typeof item === 'object' ? JSON.stringify(item) : String(item)}
                                                </Badge>
                                              ))}
                                            </div>
                                          ) : typeof value === 'object' && value !== null ? (
                                            <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                                              {JSON.stringify(value, null, 2)}
                                            </pre>
                                          ) : value !== null && value !== undefined && String(value).trim() !== '' ? (
                                            <p className="text-gray-900">{String(value)}</p>
                                          ) : (
                                            <p className="text-gray-400 italic">Não informado</p>
                                          )}
                                        </div>
                                      </div>
                                    ));
                                  })() : (
                                    <p className="text-gray-500 italic">Nenhum dado de formulário disponível</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>

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
                      </div>
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