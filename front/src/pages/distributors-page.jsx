import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Edit, Trash2, Eye, X, RefreshCw, AlertTriangle, Settings, MapPin } from "lucide-react";
import { useAuth } from "../hooks/use-auth";
import Sidebar from "../components/sidebar";
import Header from "../components/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
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
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { apiRequest } from "../lib/queryClient";

function ServiceAreaSelector({ serviceAreas, onServiceAreasChange, isLoading = false }) {
  const [selectedState, setSelectedState] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedNeighborhood, setSelectedNeighborhood] = useState("");

  // Debug log
  console.log("ServiceAreaSelector - serviceAreas recebidas:", serviceAreas);

  // Fetch geography data
  const { data: states } = useQuery({
    queryKey: ["/geography/states"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/geography/states");
      return res.json();
    },
  });

  console.log("States carregados:", states);

  const { data: cities } = useQuery({
    queryKey: ["/geography/cities", selectedState],
    enabled: !!selectedState,
    queryFn: async () => {
      const res = await apiRequest("GET", `/geography/cities?state_id=${selectedState}`);
      return res.json();
    },
  });

  console.log("Cities carregadas para state", selectedState, ":", cities);

  const { data: neighborhoods } = useQuery({
    queryKey: ["/geography/neighborhoods", selectedCity],
    enabled: !!selectedCity,
    queryFn: async () => {
      const res = await apiRequest("GET", `/geography/neighborhoods?city_id=${selectedCity}`);
      return res.json();
    },
  });

  console.log("Neighborhoods carregados para city", selectedCity, ":", neighborhoods);

  const addServiceArea = (type) => {
    console.log("addServiceArea chamada com tipo:", type);
    let areaData = null;
    
    if (type === 'state' && selectedState) {
      const state = states?.find(s => s.id === parseInt(selectedState));
      if (state) {
        areaData = {
          type: 'state',
          id: state.id,
          name: state.name
        };
      }
    } else if (type === 'city' && selectedCity) {
      const city = cities?.find(c => c.id === parseInt(selectedCity));
      if (city) {
        areaData = {
          type: 'city',
          id: city.id,
          name: city.name
        };
      }
    } else if (type === 'neighborhood' && selectedNeighborhood) {
      const neighborhood = neighborhoods?.find(n => n.id === parseInt(selectedNeighborhood));
      if (neighborhood) {
        areaData = {
          type: 'neighborhood',
          id: neighborhood.id,
          name: neighborhood.name
        };
      }
    }

    console.log("areaData criada:", areaData);

    if (areaData) {
      // Check if area already exists
      const exists = serviceAreas.some(area => 
        area.type === areaData.type && area.id === areaData.id
      );
      
      if (exists) {
        toast.error("Esta área já foi adicionada");
        return;
      }

      const newAreas = [...serviceAreas, areaData];
      console.log("Chamando onServiceAreasChange com:", newAreas);
      onServiceAreasChange(newAreas);
      
      // Reset selectors
      if (type === 'state') {
        setSelectedState("");
        setSelectedCity("");
        setSelectedNeighborhood("");
      } else if (type === 'city') {
        setSelectedCity("");
        setSelectedNeighborhood("");
      } else if (type === 'neighborhood') {
        setSelectedNeighborhood("");
      }
    } else {
      console.log("areaData é null - não foi possível criar área");
    }
  };

  const removeServiceArea = (index) => {
    const newAreas = serviceAreas.filter((_, i) => i !== index);
    onServiceAreasChange(newAreas);
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Áreas de Serviço</Label>
        <p className="text-sm text-gray-500 mb-3">
          Configure as áreas onde este distribuidor atua. Você pode adicionar estados, cidades ou bairros específicos.
        </p>
      </div>

      {/* Current service areas */}
      {serviceAreas.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">Áreas Configuradas:</Label>
          <div className="max-h-48 overflow-y-auto space-y-2 border rounded-md p-2">
            {serviceAreas.map((area, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-gray-500" />
                  <Badge variant="outline" className="capitalize">
                    {area.type === 'state' ? 'Estado' : area.type === 'city' ? 'Cidade' : 'Bairro'}
                  </Badge>
                  <span className="text-sm">{area.name}</span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeServiceArea(index)}
                  disabled={isLoading}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add new service area */}
      <div className="border rounded-lg p-4 space-y-4">
        <Label className="text-sm font-medium">Adicionar Nova Área:</Label>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="w-full">
            <Label htmlFor="state">Estado</Label>
            <Select 
              value={selectedState} 
              onValueChange={(value) => {
                console.log("Estado selecionado:", value);
                setSelectedState(value);
              }}
              disabled={isLoading}
            >
              <SelectTrigger style={{ width: '100%' }}>
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

          <div className="w-full">
            <Label htmlFor="city">Cidade</Label>
            <Select 
              value={selectedCity} 
              onValueChange={(value) => {
                console.log("Cidade selecionada:", value);
                setSelectedCity(value);
              }}
              disabled={!selectedState || isLoading}
            >
              <SelectTrigger style={{ width: '100%' }}>
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

          <div className="w-full">
            <Label htmlFor="neighborhood">Bairro</Label>
            <Select 
              value={selectedNeighborhood} 
              onValueChange={setSelectedNeighborhood}
              disabled={!selectedCity || isLoading}
            >
              <SelectTrigger style={{ width: '100%' }}>
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              console.log("Botão 'Adicionar Estado Inteiro' clicado");
              console.log("selectedState:", selectedState);
              console.log("isLoading:", isLoading);
              addServiceArea('state');
            }}
            disabled={!selectedState || isLoading}
            className="w-full"
          >
            Adicionar Estado Inteiro
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              console.log("Botão 'Adicionar Cidade' clicado");
              console.log("selectedCity:", selectedCity);
              console.log("isLoading:", isLoading);
              addServiceArea('city');
            }}
            disabled={!selectedCity || isLoading}
            className="w-full"
          >
            Adicionar Cidade
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              console.log("Botão 'Adicionar Bairro' clicado");
              console.log("selectedNeighborhood:", selectedNeighborhood);
              console.log("isLoading:", isLoading);
              addServiceArea('neighborhood');
            }}
            disabled={!selectedNeighborhood || isLoading}
            className="w-full"
          >
            Adicionar Bairro
          </Button>
        </div>
      </div>
    </div>
  );
}

function DistributorForm({ distributor = null, onSuccess, onCancel }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  console.log("DistributorForm - distributor recebido:", distributor);
  console.log("DistributorForm - distributor.service_areas:", distributor?.service_areas);
  
  const [formData, setFormData] = useState({
    name: distributor?.user?.name || "",
    username: distributor?.user?.username || "",
    email: distributor?.user?.email || "",
    password: "",
    whatsapp: distributor?.user?.whatsapp || "",
    active: distributor?.user?.active ?? true,
    service_areas: distributor?.service_areas || []
  });

  console.log("DistributorForm - formData inicial:", formData);
  console.log("DistributorForm - formData.service_areas inicial:", formData.service_areas);

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const res = await apiRequest("POST", "/distributors", data);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/distributors"] });
      queryClient.invalidateQueries({ queryKey: ["/distributors/sync/status"] });
      toast.success("Distribuidor criado com sucesso!");
      onSuccess();
    },
    onError: (error) => {
      toast.error("Erro ao criar distribuidor: " + error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data) => {
      // Debug: log dos dados que estão sendo enviados
      console.log("Dados sendo enviados para update:", data);
      console.log("Service areas:", data.service_areas);
      
      // Se for um distribuidor editando seu próprio perfil, usar rota específica
      const isOwnProfile = user?.role === "distributor" && distributor?.user_id === user?.id;
      
      if (isOwnProfile) {
        const res = await apiRequest("PUT", "/distributor/profile", data);
        return res.json();
      } else {
        const res = await apiRequest("PUT", `/distributors/${distributor.id}`, data);
        return res.json();
      }
    },
    onSuccess: (data) => {
      console.log("Resposta do servidor:", data);
      console.log("Debug info do backend:", data.debug);
      console.log("Service areas foram atualizadas?", data.service_areas_updated);
      
      queryClient.invalidateQueries({ queryKey: ["/distributors"] });
      queryClient.invalidateQueries({ queryKey: ["/distributor/profile"] });
      queryClient.invalidateQueries({ queryKey: ["/distributors/sync/status"] });
      toast.success("Distribuidor atualizado com sucesso!");
      onSuccess();
    },
    onError: (error) => {
      console.error("Erro no update:", error);
      toast.error("Erro ao atualizar distribuidor: " + error.message);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.username) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    if (!distributor && !formData.password) {
      toast.error("Senha é obrigatória para novos distribuidores");
      return;
    }

    // Para novos distribuidores, não exigir service_areas (pode ser configurado depois)
    if (!distributor && formData.service_areas.length === 0) {
      const confirmed = window.confirm(
        "Você não configurou nenhuma área de serviço. O distribuidor precisará configurar isso depois. Deseja continuar?"
      );
      if (!confirmed) return;
    }

    const submitData = { ...formData };
    
    // Remove password field if empty on update
    if (distributor && !submitData.password) {
      delete submitData.password;
    }

    if (distributor) {
      updateMutation.mutate(submitData);
    } else {
      createMutation.mutate(submitData);
    }
  };

  const handleChange = (field, value) => {
    console.log(`handleChange chamado - field: ${field}, value:`, value);
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      console.log("formData atualizado:", newData);
      return newData;
    });
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="w-full">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="Nome do distribuidor"
                disabled={isLoading}
              />
            </div>
            <div className="w-full">
              <Label htmlFor="username">Usuário</Label>
              <Input
                id="username"
                value={formData.username}
                onChange={(e) => handleChange("username", e.target.value)}
                placeholder="Usuário"
                disabled={isLoading}
              />
            </div>
            <div className="w-full">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                placeholder="Email"
                disabled={isLoading}
              />
            </div>
            <div className="w-full">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => handleChange("password", e.target.value)}
                placeholder="Senha"
                disabled={isLoading}
              />
            </div>
            <div className="w-full">
              <Label htmlFor="whatsapp">WhatsApp</Label>
              <Input
                id="whatsapp"
                value={formData.whatsapp}
                onChange={(e) => handleChange("whatsapp", e.target.value)}
                placeholder="(11) 99999-9999"
                disabled={isLoading}
              />
            </div>
            <div className="w-full">
              <Label htmlFor="active">Status</Label>
              <Select 
                value={formData.active ? "true" : "false"} 
                onValueChange={(value) => handleChange("active", value === "true")} 
                disabled={isLoading}
              >
                <SelectTrigger style={{ width: '100%' }}>
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Ativo</SelectItem>
                  <SelectItem value="false">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Service Areas Section */}
          <ServiceAreaSelector
            serviceAreas={formData.service_areas}
            onServiceAreasChange={(areas) => handleChange("service_areas", areas)}
            isLoading={isLoading}
          />
        </form>
      </div>
      
      {/* Botões fixos na parte inferior */}
      <div className="flex justify-end space-x-2 pt-4 border-t bg-white mt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancelar
        </Button>
        <Button type="submit" onClick={handleSubmit} disabled={isLoading}>
          {isLoading ? "Salvando..." : distributor ? "Atualizar" : "Criar"}
        </Button>
      </div>
    </div>
  );
}

function DistributorsPage() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDistributor, setSelectedDistributor] = useState(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingDistributor, setEditingDistributor] = useState(null);
  const [syncFilter, setSyncFilter] = useState("all"); // all, configured, needs_config

  const queryClient = useQueryClient();
  const isAdmin = user?.role === "admin";

  // Query para buscar distribuidores
  const {
    data: distributorsResponse,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["/distributors", { needs_sync: syncFilter === "needs_config" ? true : undefined }],
    enabled: isAdmin, // Apenas admins podem ver todos os distribuidores
  });

  // Query para status de sincronização (apenas para admins)
  const {
    data: syncStatus,
    isLoading: isLoadingSyncStatus,
  } = useQuery({
    queryKey: ["/distributors/sync/status"],
    enabled: isAdmin,
    refetchInterval: 30000, // Atualiza a cada 30 segundos
  });

  // Query para distribuidor individual (se for distribuidor)
  const {
    data: distributorProfile,
    isLoading: isLoadingProfile,
    error: profileError,
  } = useQuery({
    queryKey: ["/distributor/profile"],
    enabled: !isAdmin && user?.role === "distributor",
  });

  // Mutation para sincronização forçada
  const forceSyncMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/distributors/sync/force");
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/distributors"] });
      queryClient.invalidateQueries({ queryKey: ["/distributors/sync/status"] });
      toast.success(data.message || "Sincronização realizada com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro na sincronização: " + error.message);
    },
  });

  // Mutation para reatribuição de leads
  const reassignLeadsMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/leads/reassign");
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/distributors"] });
      queryClient.invalidateQueries({ queryKey: ["/distributors/sync/status"] });
      toast.success(`Reatribuição concluída! ${data.data.assigned} leads foram atribuídos.`);
    },
    onError: (error) => {
      toast.error("Erro na reatribuição: " + error.message);
    },
  });

  // Mutation para teste de update (temporário)
  const testUpdateMutation = useMutation({
    mutationFn: async ({ distributorId, data }) => {
      console.log("Sending test data:", data);
      const res = await apiRequest("POST", `/distributors/${distributorId}/test-update`, data);
      return res.json();
    },
    onSuccess: (data) => {
      console.log("Test response:", data);
      toast.success("Teste concluído - verifique o console");
    },
    onError: (error) => {
      console.error("Test error:", error);
      toast.error("Erro no teste: " + error.message);
    },
  });

  // Preparar dados baseado no tipo de usuário
  const distributors = isAdmin 
    ? (distributorsResponse?.data || [])
    : (distributorProfile ? [distributorProfile] : []);

  // Mutation para deletar distribuidor
  const deleteMutation = useMutation({
    mutationFn: async (distributorId) => {
      await apiRequest("DELETE", `/distributors/${distributorId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/distributors"] });
      queryClient.invalidateQueries({ queryKey: ["/distributors/sync/status"] });
      toast.success("Distribuidor excluído com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao excluir distribuidor: " + error.message);
    },
  });

  const filteredDistributors = distributors.filter((distributor) => {
    const userName = distributor.user?.name || "";
    const userEmail = distributor.user?.email || "";
    const searchLower = searchTerm.toLowerCase();
    
    const matchesSearch = userName.toLowerCase().includes(searchLower) ||
                         userEmail.toLowerCase().includes(searchLower);

    // Filtrar por status de configuração
    if (syncFilter === "needs_config") {
      return matchesSearch && distributor.needs_configuration;
    } else if (syncFilter === "configured") {
      return matchesSearch && !distributor.needs_configuration;
    }
    
    return matchesSearch;
  });

  const handleViewDistributor = async (distributor) => {
    // Encontrar o distribuidor atualizado na lista atual
    const updatedDistributor = distributors.find(d => d.id === distributor.id) || distributor;
    setSelectedDistributor(updatedDistributor);
    setIsViewDialogOpen(true);
    
    // Forçar um refetch dos dados para garantir que temos a versão mais recente
    queryClient.invalidateQueries({ queryKey: ["/distributors"] });
    if (!isAdmin) {
      queryClient.invalidateQueries({ queryKey: ["/distributor/profile"] });
    }
  };

  // Atualizar selectedDistributor quando os dados são atualizados
  useEffect(() => {
    if (selectedDistributor && distributors.length > 0) {
      const updatedDistributor = distributors.find(d => d.id === selectedDistributor.id);
      if (updatedDistributor) {
        setSelectedDistributor(updatedDistributor);
      }
    }
  }, [distributors, selectedDistributor?.id]);

  const handleEditDistributor = (distributor) => {
    console.log("handleEditDistributor - distributor selecionado:", distributor);
    console.log("handleEditDistributor - service_areas:", distributor.service_areas);
    
    // Verificar permissões: admin pode editar todos, distribuidor apenas seu próprio
    if (!isAdmin && distributor.user_id !== user?.id) {
      toast.error("Você não tem permissão para editar este distribuidor");
      return;
    }
    
    setEditingDistributor(distributor);
    setIsEditDialogOpen(true);
  };

  const handleDeleteDistributor = (distributor) => {
    // Apenas admins podem deletar
    if (!isAdmin) {
      toast.error("Você não tem permissão para excluir distribuidores");
      return;
    }

    if (window.confirm(`Tem certeza que deseja excluir "${distributor.user?.name}"?`)) {
      deleteMutation.mutate(distributor.id);
    }
  };

  const getStatusBadge = (active) => {
    return active ? (
      <Badge variant="default" className="bg-green-100 text-green-800">
        Ativo
      </Badge>
    ) : (
      <Badge variant="secondary" className="bg-red-100 text-red-800">
        Inativo
      </Badge>
    );
  };

  const getConfigurationBadge = (needsConfiguration) => {
    return needsConfiguration ? (
      <Badge variant="outline" className="bg-yellow-50 text-yellow-800 border-yellow-300">
        <AlertTriangle className="w-3 h-3 mr-1" />
        Requer Configuração
      </Badge>
    ) : (
      <Badge variant="outline" className="bg-green-50 text-green-800 border-green-300">
        <Settings className="w-3 h-3 mr-1" />
        Configurado
      </Badge>
    );
  };

  const loading = isAdmin ? isLoading : isLoadingProfile;
  const apiError = isAdmin ? error : profileError;

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 ml-64">
          <Header title="Distribuidores" subtitle="Carregando..." />
          <div className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-gray-200 rounded w-1/4"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-12 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (apiError) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 ml-64">
          <Header title="Distribuidores" subtitle="Erro ao carregar" />
          <div className="p-6">
            <Card>
              <CardContent className="p-6">
                <p className="text-red-600">Erro ao carregar distribuidores: {apiError.message}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 ml-64">
        <Header 
          title="Distribuidores" 
          subtitle={`${filteredDistributors.length} distribuidores encontrados`}
        />
        
        <main className="p-6">
          {/* Card de status de sincronização (apenas para admins) */}
          {isAdmin && syncStatus && (
            <Card className="mb-6">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Status de Sincronização e Atribuição</CardTitle>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => forceSyncMutation.mutate()}
                      disabled={forceSyncMutation.isPending}
                    >
                      <RefreshCw className={`w-4 h-4 mr-2 ${forceSyncMutation.isPending ? 'animate-spin' : ''}`} />
                      {forceSyncMutation.isPending ? 'Sincronizando...' : 'Forçar Sincronização'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => reassignLeadsMutation.mutate()}
                      disabled={reassignLeadsMutation.isPending}
                    >
                      <MapPin className={`w-4 h-4 mr-2 ${reassignLeadsMutation.isPending ? 'animate-spin' : ''}`} />
                      {reassignLeadsMutation.isPending ? 'Reatribuindo...' : 'Reatribuir Leads'}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{syncStatus.total_distributor_users}</div>
                    <div className="text-sm text-gray-500">Usuários Distribuidores</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{syncStatus.total_distributor_records}</div>
                    <div className="text-sm text-gray-500">Registros Distribuidores</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">{syncStatus.orphan_users}</div>
                    <div className="text-sm text-gray-500">Usuários Órfãos</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{syncStatus.orphan_records}</div>
                    <div className="text-sm text-gray-500">Registros Órfãos</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{syncStatus.unconfigured_distributors}</div>
                    <div className="text-sm text-gray-500">Não Configurados</div>
                  </div>
                </div>
                {!syncStatus.is_synchronized && (
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <div className="flex items-center">
                      <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2" />
                      <span className="text-yellow-800">
                        Dados não estão sincronizados. Execute uma sincronização forçada para corrigir.
                      </span>
                    </div>
                  </div>
                )}
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <MapPin className="w-5 h-5 text-blue-600 mr-2" />
                      <span className="text-blue-800 text-sm">
                        Use "Reatribuir Leads" para automaticamente atribuir leads não atribuídos aos distribuidores com base em suas áreas de serviço.
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Lista de Distribuidores</CardTitle>
                <div className="flex items-center space-x-4">
                  {isAdmin && (
                    <Select value={syncFilter} onValueChange={setSyncFilter}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Filtrar por configuração" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="configured">Configurados</SelectItem>
                        <SelectItem value="needs_config">Precisam Configurar</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                  <div className="relative w-72">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Pesquisar distribuidores..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  {isAdmin && (
                    <Button onClick={() => setIsCreateDialogOpen(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Novo Distribuidor
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>WhatsApp</TableHead>
                    <TableHead>Status</TableHead>
                    {isAdmin && <TableHead>Configuração</TableHead>}
                    <TableHead>Data Cadastro</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDistributors.map((distributor) => (
                    <TableRow key={distributor.id}>
                      <TableCell className="font-medium">{distributor.user?.name}</TableCell>
                      <TableCell>{distributor.user?.username}</TableCell>
                      <TableCell>{distributor.user?.email}</TableCell>
                      <TableCell>{distributor.user?.whatsapp || "-"}</TableCell>
                      <TableCell>{getStatusBadge(distributor.user?.active)}</TableCell>
                      {isAdmin && (
                        <TableCell>{getConfigurationBadge(distributor.needs_configuration)}</TableCell>
                      )}
                      <TableCell>
                        {new Date(distributor.created_at).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewDistributor(distributor)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {(isAdmin || distributor.user_id === user?.id) && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleEditDistributor(distributor)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          )}
                          {isAdmin && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="text-red-600 hover:text-red-700"
                              onClick={() => handleDeleteDistributor(distributor)}
                              disabled={deleteMutation.isPending}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {filteredDistributors.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-500">Nenhum distribuidor encontrado.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Dialog para criar distribuidor */}
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
              <DialogHeader>
                <DialogTitle>Criar Novo Distribuidor</DialogTitle>
              </DialogHeader>
              <div className="flex-1 overflow-y-auto px-1">
                <DistributorForm
                  onSuccess={() => setIsCreateDialogOpen(false)}
                  onCancel={() => setIsCreateDialogOpen(false)}
                />
              </div>
            </DialogContent>
          </Dialog>

          {/* Dialog para editar distribuidor */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="max-w-[620px] max-h-[90vh] flex flex-col">
              <DialogHeader>
                <DialogTitle>Editar Distribuidor</DialogTitle>
              </DialogHeader>
              <div className="flex-1 overflow-y-auto px-1">
                <DistributorForm
                  distributor={editingDistributor}
                  onSuccess={() => {
                    setIsEditDialogOpen(false);
                    setEditingDistributor(null);
                    // Se estiver com o dialog de visualização aberto para o mesmo distribuidor, feche-o
                    // para que seja aberto com dados atualizados
                    if (selectedDistributor && editingDistributor && selectedDistributor.id === editingDistributor.id) {
                      setIsViewDialogOpen(false);
                      setSelectedDistributor(null);
                    }
                  }}
                  onCancel={() => {
                    setIsEditDialogOpen(false);
                    setEditingDistributor(null);
                  }}
                />
              </div>
            </DialogContent>
          </Dialog>

          {/* Dialog para visualizar detalhes do distribuidor */}
          <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
            <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
              <DialogHeader>
                <DialogTitle>Detalhes do Distribuidor</DialogTitle>
              </DialogHeader>
              <div className="flex-1 overflow-y-auto px-1">
              {selectedDistributor && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Nome</label>
                      <p className="text-lg">{selectedDistributor.user?.name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Status</label>
                      <div className="mt-1">
                        {getStatusBadge(selectedDistributor.user?.active)}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Username</label>
                      <p>{selectedDistributor.user?.username}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Email</label>
                      <p>{selectedDistributor.user?.email}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">WhatsApp</label>
                      <p>{selectedDistributor.user?.whatsapp || "-"}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Configuração</label>
                      <div className="mt-1">
                        {getConfigurationBadge(selectedDistributor.needs_configuration)}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Data de Cadastro</label>
                      <p>{new Date(selectedDistributor.created_at).toLocaleDateString('pt-BR')}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Última Atualização</label>
                      <p>{new Date(selectedDistributor.updated_at).toLocaleDateString('pt-BR')}</p>
                    </div>
                  </div>
                  
                  {/* Áreas de Serviço */}
                  <div className="mt-6">
                    <label className="text-sm font-medium text-gray-500">Áreas de Serviço</label>
                    {selectedDistributor.service_areas && selectedDistributor.service_areas.length > 0 ? (
                      <div className="mt-2 space-y-2">
                        {selectedDistributor.service_areas.map((area, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <MapPin className="w-4 h-4 text-gray-500" />
                            <Badge variant="outline" className="capitalize">
                              {area.type === 'state' ? 'Estado' : area.type === 'city' ? 'Cidade' : 'Bairro'}
                            </Badge>
                            <span>{area.name}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                        <div className="flex items-center">
                          <AlertTriangle className="w-4 h-4 text-yellow-600 mr-2" />
                          <span className="text-yellow-800 text-sm">
                            Nenhuma área de serviço configurada. Este distribuidor precisa configurar suas áreas de atuação.
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
              </div>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  );
}

export default DistributorsPage; 