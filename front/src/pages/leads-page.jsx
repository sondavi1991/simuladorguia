import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "../hooks/use-auth";
import Sidebar from "../components/sidebar";
import Header from "../components/header";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  UserPlus, 
  Search, 
  Filter, 
  Download, 
  Edit, 
  Trash2,
  Eye,
  Plus,
  MessageSquare,
  CheckCircle,
  Clock,
  XCircle,
  PlayCircle
} from "lucide-react";
import { apiRequest, queryClient } from "../lib/queryClient";
import { toast } from "sonner";
import React from "react";

export default function LeadsPage() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [isCommentsDialogOpen, setIsCommentsDialogOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const isAdmin = user?.role === "admin";
  const isDistributor = user?.role === "distributor";
  const [distributorFilter, setDistributorFilter] = useState("all");
  const [startDateFilter, setStartDateFilter] = useState("");
  const [endDateFilter, setEndDateFilter] = useState("");

  const { data: leads, error, isLoading } = useQuery({
    queryKey: ["/leads", searchTerm, statusFilter, distributorFilter, startDateFilter, endDateFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append("search", searchTerm);
      if (statusFilter && statusFilter !== "all") params.append("status", statusFilter);
      if (distributorFilter && distributorFilter !== "all") params.append("distributor_id", distributorFilter);
      if (startDateFilter) params.append("start_date", startDateFilter);
      if (endDateFilter) params.append("end_date", endDateFilter);
      
      const res = await apiRequest("GET", `/leads?${params.toString()}`);
      const data = await res.json();
      
      // Debug temporário
      console.log("Dados dos leads recebidos:", data);
      if (data.data && data.data.length > 0) {
        console.log("Primeiro lead:", data.data[0]);
        console.log("service_type_label do primeiro lead:", data.data[0].service_type_label);
      }
      
      return data;
    },
  });

  const { data: distributors } = useQuery({
    queryKey: ["/distributors"],
    enabled: isAdmin,
    queryFn: async () => {
      const res = await apiRequest("GET", "/distributors");
      return res.json();
    },
  });

  // Mutation para atualizar status do lead
  const updateStatusMutation = useMutation({
    mutationFn: async ({ leadId, status, notes }) => {
      const res = await apiRequest("PUT", `/leads/${leadId}`, {
        ...selectedLead,
        status,
        notes
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/leads"] });
      toast.success("Status atualizado com sucesso!");
      setIsStatusDialogOpen(false);
      setSelectedLead(null);
    },
    onError: (error) => {
      toast.error("Erro ao atualizar status: " + error.message);
    },
  });

  const exportMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("GET", "/leads/export");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `leads_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (leadId) => {
      await apiRequest("DELETE", `/leads/${leadId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/leads"] });
      toast.success("Lead excluído com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao excluir lead: " + error.message);
    },
  });

  const getStatusBadge = (status) => {
    const statusConfig = {
      new: { label: "Novo", variant: "default", icon: Clock },
      in_progress: { label: "Em Andamento", variant: "secondary", icon: PlayCircle },
      completed: { label: "Concluído", variant: "success", icon: CheckCircle },
      lost: { label: "Perdido", variant: "destructive", icon: XCircle },
    };
    
    const config = statusConfig[status] || statusConfig.new;
    const IconComponent = config.icon;
    
    return (
      <Badge variant={config.variant} className="text-xs flex items-center gap-1">
        <IconComponent className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const getStatusColor = (status) => {
    const colors = {
      new: "text-blue-600",
      in_progress: "text-yellow-600", 
      completed: "text-green-600",
      lost: "text-red-600"
    };
    return colors[status] || colors.new;
  };

  const filteredLeads = leads?.data?.filter(lead => {
    const matchesDistributor = distributorFilter === "all" || String(lead.distributor_id) === distributorFilter;
    const matchesStatus = statusFilter === "all" || lead.status === statusFilter;
    const leadDate = lead.created_at ? lead.created_at.slice(0, 10) : ""; // yyyy-mm-dd
    const matchesStartDate = !startDateFilter || leadDate >= startDateFilter;
    const matchesEndDate = !endDateFilter || leadDate <= endDateFilter;
    return matchesDistributor && matchesStatus && matchesStartDate && matchesEndDate;
  }) || [];

  const handleExport = () => {
    exportMutation.mutate();
  };

  const handleDelete = (leadId) => {
    if (window.confirm("Tem certeza que deseja excluir este lead?")) {
      deleteMutation.mutate(leadId);
    }
  };

  const handleEdit = (lead) => {
    setSelectedLead(lead);
    setIsEditDialogOpen(true);
  };

  const handleView = (lead) => {
    setSelectedLead(lead);
    setIsViewDialogOpen(true);
  };

  const handleStatusChange = (lead) => {
    setSelectedLead(lead);
    setIsStatusDialogOpen(true);
  };

  const handleComments = (lead) => {
    setSelectedLead(lead);
    setIsCommentsDialogOpen(true);
  };

  const canEditLead = (lead) => {
    if (isAdmin) return true;
    if (isDistributor && user?.distributor?.id && lead.distributor_id === user.distributor.id) return true;
    return false;
  };

  const closeDialogs = () => {
    setIsCreateDialogOpen(false);
    setIsEditDialogOpen(false);
    setIsViewDialogOpen(false);
    setIsStatusDialogOpen(false);
    setIsCommentsDialogOpen(false);
    setSelectedLead(null);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 ml-64">
        <Header 
          title="Leads" 
          subtitle={`${filteredLeads.length} leads encontrados`}
        />
        
        <main className="p-6">
          {/* Card de estatísticas para distribuidores */}
          {isDistributor && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg">Meus Leads</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {leads?.data?.length || 0}
                    </div>
                    <div className="text-sm text-gray-500">Total</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {leads?.data?.filter(lead => lead.status === 'new').length || 0}
                    </div>
                    <div className="text-sm text-gray-500">Novos</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">
                      {leads?.data?.filter(lead => lead.status === 'in_progress').length || 0}
                    </div>
                    <div className="text-sm text-gray-500">Em Andamento</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {leads?.data?.filter(lead => lead.status === 'completed').length || 0}
                    </div>
                    <div className="text-sm text-gray-500">Concluídos</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {leads?.data?.filter(lead => lead.status === 'lost').length || 0}
                    </div>
                    <div className="text-sm text-gray-500">Perdidos</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <UserPlus className="h-5 w-5 mr-2" />
                  Gerenciar Leads
                </CardTitle>
                <div className="flex items-center space-x-2">
                  <Button
                    onClick={handleExport}
                    variant="outline"
                    size="sm"
                    disabled={exportMutation.isPending}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Exportar Excel
                  </Button>
                  {isAdmin && (
                    <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm">
                          <Plus className="h-4 w-4 mr-2" />
                          Novo Lead
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Criar Novo Lead</DialogTitle>
                          <DialogDescription>
                            Adicione um novo lead ao sistema
                          </DialogDescription>
                        </DialogHeader>
                        <LeadForm onSuccess={closeDialogs} />
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              {isAdmin && (
                <div className="flex items-end space-x-4 mb-6">
                  {/* Filtro de Distribuidor */}
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Distribuidor</label>
                    <Select
                      value={distributorFilter}
                      onValueChange={setDistributorFilter}
                    >
                      <SelectTrigger className="w-56">
                        <Filter className="h-4 w-4 mr-2" />
                        <SelectValue placeholder="Filtrar por distribuidor" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os Distribuidores</SelectItem>
                        {distributors?.data?.map((dist) => (
                          <SelectItem key={dist.id} value={dist.id.toString()}>
                            {dist.user.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {/* Filtro de Data Inicial */}
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Data Inicial</label>
                    <Input
                      type="date"
                      value={startDateFilter}
                      onChange={e => setStartDateFilter(e.target.value)}
                      className="w-36"
                    />
                  </div>
                  {/* Filtro de Data Final */}
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Data Final</label>
                    <Input
                      type="date"
                      value={endDateFilter}
                      onChange={e => setEndDateFilter(e.target.value)}
                      className="w-36"
                    />
                  </div>
                  {/* Filtro de status (mantido) */}
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Status</label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-48">
                        <Filter className="h-4 w-4 mr-2" />
                        <SelectValue placeholder="Filtrar por status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os Status</SelectItem>
                        <SelectItem value="new">Novos</SelectItem>
                        <SelectItem value="in_progress">Em Andamento</SelectItem>
                        <SelectItem value="completed">Concluídos</SelectItem>
                        <SelectItem value="lost">Perdidos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {/* Table */}
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="animate-pulse flex space-x-4 py-4">
                      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Contato</TableHead>
                      <TableHead>Localização</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Distribuidor</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLeads.length > 0 ? (
                      filteredLeads.map((lead) => (
                        <TableRow key={lead.id}>
                          <TableCell className="font-medium">
                            {lead.name}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div>{lead.email}</div>
                              <div className="text-gray-500">{lead.phone}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div>{lead.neighborhood?.name || lead.neighborhood_custom || ''}</div>
                              <div className="text-gray-500">
                                {lead.city?.name}, {lead.state?.name}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {lead.service_type_label}
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(lead.status)}
                          </TableCell>
                          <TableCell>
                            {lead.distributor ? (
                              <div className="text-sm">
                                <div className="font-medium">{lead.distributor.user.name}</div>
                                <div className="text-gray-500">
                                  {lead.distributor.user.whatsapp}
                                </div>
                              </div>
                            ) : (
                              <Badge variant="outline">Não atribuído</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {new Date(lead.created_at).toLocaleDateString('pt-BR')}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end space-x-2">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleView(lead)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              
                              {/* Ações para distribuidores */}
                              {canEditLead(lead) && (
                                <>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => handleStatusChange(lead)}
                                    title="Alterar Status"
                                  >
                                    <PlayCircle className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => handleComments(lead)}
                                    title="Adicionar Comentário"
                                  >
                                    <MessageSquare className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => handleEdit(lead)}
                                    title="Editar Lead"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                              
                              {/* Ações exclusivas para admin */}
                              {isAdmin && (
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handleDelete(lead.id)}
                                  disabled={deleteMutation.isPending}
                                  title="Excluir Lead"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                          Nenhum lead encontrado
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Edit Dialog */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Editar Lead</DialogTitle>
                <DialogDescription>
                  Atualize as informações do lead
                </DialogDescription>
              </DialogHeader>
              {selectedLead && (
                <LeadForm lead={selectedLead} onSuccess={closeDialogs} />
              )}
            </DialogContent>
          </Dialog>

          {/* View Dialog */}
          <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Detalhes do Lead</DialogTitle>
                <DialogDescription>
                  Informações completas do lead
                </DialogDescription>
              </DialogHeader>
              {selectedLead && <LeadDetails lead={selectedLead} />}
            </DialogContent>
          </Dialog>

          {/* Status Change Dialog */}
          <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
            <DialogContent className="max-w-[520px]">
              <DialogHeader>
                <DialogTitle>Alterar Status do Lead</DialogTitle>
                <DialogDescription>
                  Altere o status do lead: {selectedLead?.name}
                </DialogDescription>
              </DialogHeader>
              {selectedLead && <StatusChangeForm lead={selectedLead} onSuccess={closeDialogs} />}
            </DialogContent>
          </Dialog>

          {/* Comments Dialog */}
          <Dialog open={isCommentsDialogOpen} onOpenChange={setIsCommentsDialogOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Adicionar Comentário</DialogTitle>
                <DialogDescription>
                  Adicione ou edite comentários para o lead: {selectedLead?.name}
                </DialogDescription>
              </DialogHeader>
              {selectedLead && <CommentsForm lead={selectedLead} onSuccess={closeDialogs} />}
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  );
}

// Componente de formulário para criar/editar leads
function LeadForm({ onSuccess, lead = null }) {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const isDistributor = user?.role === "distributor";
  
  const [formData, setFormData] = useState({
    name: lead?.name || "",
    email: lead?.email || "",
    phone: lead?.phone || "",
    state_id: lead?.state_id || lead?.state?.id || "",
    city_id: lead?.city_id || lead?.city?.id || "",
    neighborhood_id: lead?.neighborhood_id || lead?.neighborhood?.id || "",
    distributor_id: lead?.distributor_id || lead?.distributor?.id || "",
    address: lead?.address || "",
    notes: lead?.notes || "",
    status: lead?.status || "new",
    service_type: lead?.service_type || "",
  });

  // Guardar o valor inicial para comparação
  const initialFormData = React.useRef(formData);

  // Função para verificar se houve alteração
  const isFormChanged = () => {
    return Object.keys(formData).some(
      (key) => formData[key] !== initialFormData.current[key]
    );
  };

  // Fetch geography data
  const { data: states } = useQuery({
    queryKey: ["/geography/states"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/geography/states");
      return res.json();
    },
  });

  const { data: cities } = useQuery({
    queryKey: ["/geography/cities", formData.state_id],
    enabled: !!formData.state_id,
    queryFn: async () => {
      const res = await apiRequest("GET", `/geography/cities?state_id=${formData.state_id}`);
      return res.json();
    },
  });

  const { data: neighborhoods } = useQuery({
    queryKey: ["/geography/neighborhoods", formData.city_id],
    enabled: !!formData.city_id,
    queryFn: async () => {
      const res = await apiRequest("GET", `/geography/neighborhoods?city_id=${formData.city_id}`);
      return res.json();
    },
  });

  // Fetch distributors for admin users
  const { data: distributors } = useQuery({
    queryKey: ["/distributors"],
    enabled: isAdmin,
    queryFn: async () => {
      const res = await apiRequest("GET", "/distributors");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const method = lead ? "PUT" : "POST";
      const url = lead ? `/leads/${lead.id}` : "/leads";
      const payload = {
        name: data.name,
        email: data.email,
        phone: data.phone,
        status: data.status,
        notes: data.notes,
        state_id: data.state_id || data.state?.id || undefined,
        city_id: data.city_id || data.city?.id || undefined,
        neighborhood_id: data.neighborhood_id || data.neighborhood?.id || undefined,
        service_type: data.service_type || "",
      };
      const res = await apiRequest(method, url, payload);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/leads"] });
      toast.success(lead ? "Lead atualizado com sucesso!" : "Lead criado com sucesso!");
      onSuccess?.();
    },
    onError: (error) => {
      toast.error("Erro ao salvar lead: " + error.message);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Prepare data for submission
    const submitData = {
      ...formData,
      state_id: formData.state_id ? parseInt(formData.state_id) : null,
      city_id: formData.city_id ? parseInt(formData.city_id) : null,
      neighborhood_id: formData.neighborhood_id ? parseInt(formData.neighborhood_id) : null,
      distributor_id: formData.distributor_id ? parseInt(formData.distributor_id) : null,
    };

    createMutation.mutate(submitData);
  };

  const handleStateChange = (value) => {
    setFormData({
      ...formData,
      state_id: value,
      city_id: "",
      neighborhood_id: "",
    });
  };

  const handleCityChange = (value) => {
    setFormData({
      ...formData,
      city_id: value,
      neighborhood_id: "",
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Nome *</label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            disabled={isDistributor} // Distribuidores não podem alterar nome
          />
        </div>
        <div>
          <label className="text-sm font-medium">E-mail *</label>
          <Input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
            disabled={isDistributor} // Distribuidores não podem alterar email
          />
        </div>
        <div>
          <label className="text-sm font-medium">Telefone *</label>
          <Input
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            required
            disabled={isDistributor} // Distribuidores não podem alterar telefone
          />
        </div>
        
        {/* Status - Apenas para leads existentes e distribuidores podem editar */}
        {lead && (
          <div>
            <label className="text-sm font-medium">Status</label>
            <Select 
              value={formData.status} 
              onValueChange={(value) => setFormData({ ...formData, status: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="new">Novo</SelectItem>
                <SelectItem value="in_progress">Em Andamento</SelectItem>
                <SelectItem value="completed">Concluído</SelectItem>
                <SelectItem value="lost">Perdido</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
        
        {/* Tipo de Serviço */}
        <div>
          <label className="text-sm font-medium">Tipo de Atendimento</label>
          <Select 
            value={formData.service_type || ""} 
            onValueChange={(value) => setFormData({ ...formData, service_type: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione o tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cliente_final">Cliente Final</SelectItem>
              <SelectItem value="profissional">Salão</SelectItem>
              <SelectItem value="representante">Quero ser representante</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Geografia - Distribuidores não podem alterar */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="text-sm font-medium">Estado</label>
          <Select 
            value={formData.state_id} 
            onValueChange={handleStateChange}
            disabled={isDistributor}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione o estado" />
            </SelectTrigger>
            <SelectContent>
              {states?.map((state) => (
                <SelectItem key={state.id} value={state.id.toString()}>
                  {state.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm font-medium">Cidade</label>
          <Select 
            value={formData.city_id} 
            onValueChange={handleCityChange}
            disabled={!formData.state_id || isDistributor}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione a cidade" />
            </SelectTrigger>
            <SelectContent>
              {cities?.map((city) => (
                <SelectItem key={city.id} value={city.id.toString()}>
                  {city.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm font-medium">Bairro</label>
          <Select 
            value={formData.neighborhood_id} 
            onValueChange={(value) => setFormData({ ...formData, neighborhood_id: value })}
            disabled={!formData.city_id || isDistributor}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione o bairro" />
            </SelectTrigger>
            <SelectContent>
              {neighborhoods?.map((neighborhood) => (
                <SelectItem key={neighborhood.id} value={neighborhood.id.toString()}>
                  {neighborhood.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Distribuidor Selection - Only for Admin */}
      {isAdmin && (
        <div>
          <label className="text-sm font-medium">Distribuidor</label>
          <Select 
            value={formData.distributor_id || "unassigned"} 
            onValueChange={(value) => setFormData({ 
              ...formData, 
              distributor_id: value === "unassigned" ? "" : value 
            })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione um distribuidor (opcional)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unassigned">Nenhum (atribuição automática)</SelectItem>
              {distributors?.data?.map((distributor) => (
                <SelectItem key={distributor.id} value={distributor.id.toString()}>
                  {distributor.user.name} - {distributor.user.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-gray-500 mt-1">
            Se não selecionado, o lead será atribuído automaticamente baseado na localização
          </p>
        </div>
      )}

      <div>
        <label className="text-sm font-medium">Endereço</label>
        <Input
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          placeholder="Rua, número, complemento..."
          disabled={isDistributor} // Distribuidores não podem alterar endereço
        />
      </div>

      <div>
        <label className="text-sm font-medium">Observações</label>
        <Textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Adicione observações sobre este lead..."
          rows={4}
        />
        {isDistributor && (
          <p className="text-xs text-blue-600 mt-1">
            💡 Use este campo para adicionar anotações sobre o contato com o cliente
          </p>
        )}
      </div>

      {/* Endereço capturado (não editável) */}
      {lead && (
        <div>
          <label className="text-sm font-medium">Endereço Capturado</label>
          <Input
            value={`Estado: ${lead.state?.name || ''}, Cidade: ${lead.city?.name || ''}, Bairro: ${lead.neighborhood?.name || ''}, Endereço: ${lead.address || ''}`}
            readOnly
            className="bg-gray-100 cursor-not-allowed"
          />
        </div>
      )}

      {createMutation.error && (
        <div className="text-red-600 text-sm">
          Erro ao salvar: {createMutation.error.message}
        </div>
      )}

      <Button 
        type="submit" 
        className="w-full"
        disabled={createMutation.isPending || (lead && !isFormChanged())}
      >
        {createMutation.isPending ? "Salvando..." : (lead ? "Atualizar Lead" : "Criar Lead")}
      </Button>
    </form>
  );
}

// Componente para visualizar detalhes do lead
function LeadDetails({ lead }) {
  const getStatusBadge = (status) => {
    const statusConfig = {
      new: { label: "Novo", variant: "default", icon: Clock },
      in_progress: { label: "Em Andamento", variant: "secondary", icon: PlayCircle },
      completed: { label: "Concluído", variant: "success", icon: CheckCircle },
      lost: { label: "Perdido", variant: "destructive", icon: XCircle },
    };
    
    const config = statusConfig[status] || statusConfig.new;
    const IconComponent = config.icon;
    
    return (
      <Badge variant={config.variant} className="text-xs flex items-center gap-1">
        <IconComponent className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Informações Básicas */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-gray-500">Nome</label>
          <p className="text-sm font-medium">{lead.name}</p>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-500">Status</label>
          <div className="mt-1">
            {getStatusBadge(lead.status)}
          </div>
        </div>
      </div>

      {/* Contato */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-gray-500">E-mail</label>
          <p className="text-sm">{lead.email}</p>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-500">Telefone</label>
          <p className="text-sm">{lead.phone}</p>
        </div>
      </div>

      {/* Tipo de Atendimento */}
      {lead.service_type_label && (
        <div>
          <label className="text-sm font-medium text-gray-500">Tipo de Atendimento</label>
          <p className="text-sm font-medium">{lead.service_type_label}</p>
        </div>
      )}

      {/* Localização */}
      <div>
        <label className="text-sm font-medium text-gray-500">Localização</label>
        <div className="mt-1 space-y-1">
          {lead.state && <p className="text-sm">Estado: {lead.state.name}</p>}
          {lead.city && <p className="text-sm">Cidade: {lead.city.name}</p>}
          {lead.neighborhood && <p className="text-sm">Bairro: {lead.neighborhood.name}</p>}
          {!lead.neighborhood && lead.neighborhood_custom && <p className="text-sm">Bairro: {lead.neighborhood_custom}</p>}
          {lead.address && <p className="text-sm">Endereço: {lead.address}</p>}
        </div>
      </div>

      {/* Distribuidor */}
      {lead.distributor && (
        <div>
          <label className="text-sm font-medium text-gray-500">Distribuidor Atribuído</label>
          <div className="mt-1">
            <p className="text-sm font-medium">{lead.distributor.user.name}</p>
            {lead.distributor.user.whatsapp && (
              <p className="text-sm text-gray-600">{lead.distributor.user.whatsapp}</p>
            )}
          </div>
        </div>
      )}

      {/* Observações - Destaque especial */}
      {lead.notes ? (
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare className="w-4 h-4 text-blue-600" />
            <label className="text-sm font-medium text-blue-800">Observações</label>
          </div>
          <p className="text-sm text-blue-700 whitespace-pre-wrap">{lead.notes}</p>
        </div>
      ) : (
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <div className="flex items-center gap-2 text-gray-500">
            <MessageSquare className="w-4 h-4" />
            <span className="text-sm">Nenhuma observação adicionada</span>
          </div>
        </div>
      )}

      {/* Informações do Sistema */}
      <div className="grid grid-cols-2 gap-4 pt-4 border-t">
        <div>
          <label className="text-sm font-medium text-gray-500">Fonte</label>
          <p className="text-sm">{lead.source || 'Dashboard'}</p>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-500">Data de Criação</label>
          <p className="text-sm">{new Date(lead.created_at).toLocaleDateString('pt-BR')}</p>
        </div>
      </div>
    </div>
  );
}

// Componente para mudança rápida de status
function StatusChangeForm({ lead, onSuccess }) {
  const [status, setStatus] = useState(lead.status);
  const [notes, setNotes] = useState(lead.notes || "");

  const updateMutation = useMutation({
    mutationFn: async (data) => {
      const payload = {
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        status: data.status,
        notes: data.notes,
        state_id: lead.state_id || lead.state?.id || undefined,
        city_id: lead.city_id || lead.city?.id || undefined,
        neighborhood_id: lead.neighborhood_id || lead.neighborhood?.id || undefined,
        service_type: lead.service_type || undefined
      };
      const res = await apiRequest("PUT", `/leads/${lead.id}`, payload);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/leads"] });
      toast.success("Status atualizado com sucesso!");
      onSuccess();
    },
    onError: (error) => {
      toast.error("Erro ao atualizar status: " + error.message);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    updateMutation.mutate({ status, notes });
  };

  const statusOptions = [
    { value: "new", label: "Novo", icon: Clock, color: "text-blue-600" },
    { value: "in_progress", label: "Em Andamento", icon: PlayCircle, color: "text-yellow-600" },
    { value: "completed", label: "Concluído", icon: CheckCircle, color: "text-green-600" },
    { value: "lost", label: "Perdido", icon: XCircle, color: "text-red-600" },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm font-medium">Status Atual</label>
        <div className="flex gap-2 mt-2">
          {statusOptions.map((option) => {
            const IconComponent = option.icon;
            return (
              <Button
                key={option.value}
                type="button"
                variant={status === option.value ? "default" : "outline"}
                className={`flex items-center gap-2 ${status === option.value ? '' : option.color}`}
                onClick={() => setStatus(option.value)}
              >
                <IconComponent className="w-4 h-4" />
                {option.label}
              </Button>
            );
          })}
        </div>
      </div>

      <div>
        <label className="text-sm font-medium">Observações (opcional)</label>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Adicione observações sobre a mudança de status..."
          rows={3}
        />
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={updateMutation.isPending} className="flex-1">
          {updateMutation.isPending ? "Salvando..." : "Salvar Status"}
        </Button>
        <Button type="button" variant="outline" onClick={onSuccess}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}

// Componente para edição de comentários
function CommentsForm({ lead, onSuccess }) {
  const [notes, setNotes] = useState(lead.notes || "");

  const updateMutation = useMutation({
    mutationFn: async (data) => {
      // Enviar apenas os campos obrigatórios para distribuidores
      const payload = {
        status: lead.status || 'new', // Garantir que sempre tenha um status válido
        notes: data.notes || "", // Garantir que notes seja sempre string
        service_type: lead.service_type || undefined
      };
      
      console.log("CommentsForm sending payload:", payload);
      
      const res = await apiRequest("PUT", `/leads/${lead.id}`, payload);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/leads"] });
      toast.success("Comentário salvo com sucesso!");
      onSuccess();
    },
    onError: (error) => {
      console.error("CommentsForm error:", error);
      toast.error("Erro ao salvar comentário: " + error.message);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    updateMutation.mutate({ notes });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm font-medium">Comentários/Observações</label>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Adicione seus comentários sobre este lead..."
          rows={5}
          className="mt-1"
        />
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={updateMutation.isPending} className="flex-1">
          {updateMutation.isPending ? "Salvando..." : "Salvar Comentário"}
        </Button>
        <Button type="button" variant="outline" onClick={onSuccess}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}

