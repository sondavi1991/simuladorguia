import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "../lib/queryClient";
import Sidebar from "../components/sidebar";
import Header from "../components/header";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Badge } from "../components/ui/badge";
import { Trash2, Edit, Plus, MapPin, Map, Navigation, Search, Download, Database, Info, CheckCircle, X } from "lucide-react";
import { toast } from "sonner";

export default function GeographyPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [activeTab, setActiveTab] = useState("states");
  
  // Dialog states
  const [isStateDialogOpen, setIsStateDialogOpen] = useState(false);
  const [isCityDialogOpen, setIsCityDialogOpen] = useState(false);
  const [isNeighborhoodDialogOpen, setIsNeighborhoodDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  
  // Form states
  const [stateForm, setStateForm] = useState({ name: "", code: "" });
  const [cityForm, setCityForm] = useState({ name: "", state_id: "" });
  const [neighborhoodForm, setNeighborhoodForm] = useState({ name: "", state_id: "", city_id: "" });
  
  // Estados para múltiplos bairros
  const [neighborhoodTags, setNeighborhoodTags] = useState([]);
  const [currentNeighborhoodInput, setCurrentNeighborhoodInput] = useState("");
  
  // Edit states
  const [editingState, setEditingState] = useState(null);
  const [editingCity, setEditingCity] = useState(null);
  const [editingNeighborhood, setEditingNeighborhood] = useState(null);

  const queryClient = useQueryClient();

  // Queries
  const { data: states = [], isLoading: statesLoading } = useQuery({
    queryKey: ["/geography/states"],
  });

  const { data: cities = [], isLoading: citiesLoading } = useQuery({
    queryKey: ["/geography/cities", { state_id: selectedState }],
    enabled: !!selectedState,
  });

  const { data: neighborhoods = [], isLoading: neighborhoodsLoading } = useQuery({
    queryKey: ["/geography/neighborhoods", { city_id: selectedCity }],
    enabled: !!selectedCity,
  });

  const { data: searchResults = [] } = useQuery({
    queryKey: ["/geography/search", { query: searchQuery }],
    enabled: searchQuery.length >= 2,
  });

  const { data: ibgeStats } = useQuery({
    queryKey: ["/ibge/stats"],
  });

  // Query para cidades baseada no estado selecionado EXTERNAMENTE (para filtros)
  const { data: modalCities = [], isLoading: modalCitiesLoading } = useQuery({
    queryKey: ["/geography/cities", { state_id: neighborhoodForm.state_id }],
    enabled: !!neighborhoodForm.state_id,
  });

  // Filtros locais baseados no searchQuery
  const filteredStates = states.filter(state => 
    searchQuery.length === 0 || 
    state.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    state.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredCities = cities.filter(city => 
    searchQuery.length === 0 || 
    city.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    city.state?.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredNeighborhoods = neighborhoods.filter(neighborhood => 
    searchQuery.length === 0 || 
    neighborhood.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    neighborhood.city?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    neighborhood.city?.state?.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // IBGE Import Mutations
  const importStatesMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/ibge/import-states"),
    onSuccess: async (response) => {
      const data = await response.json();
      queryClient.invalidateQueries(["/geography/states"]);
      queryClient.invalidateQueries(["/ibge/stats"]);
      toast.success(`Estados importados! ${data.stats?.imported || 0} novos estados adicionados.`);
    },
    onError: (error) => {
      toast.error("Erro ao importar estados do IBGE");
      console.error(error);
    },
  });

  const importCitiesMutation = useMutation({
    mutationFn: ({ state_code }) => apiRequest("POST", "/ibge/import-cities", { state_code }),
    onSuccess: async (response) => {
      const data = await response.json();
      queryClient.invalidateQueries(["/geography/cities"]);
      queryClient.invalidateQueries(["/ibge/stats"]);
      toast.success(`Cidades importadas! ${data.stats?.imported || 0} novas cidades adicionadas.`);
    },
    onError: (error) => {
      toast.error("Erro ao importar cidades do IBGE");
      console.error(error);
    },
  });

  const importAllCitiesMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/ibge/import-all-cities"),
    onSuccess: () => {
      queryClient.invalidateQueries(["/geography/cities"]);
      queryClient.invalidateQueries(["/ibge/stats"]);
      toast.success("Importação de todas as cidades iniciada em segundo plano!");
    },
    onError: (error) => {
      toast.error("Erro ao iniciar importação de todas as cidades");
      console.error(error);
    },
  });

  const importDistrictsMutation = useMutation({
    mutationFn: ({ city_id }) => apiRequest("POST", "/ibge/import-districts", { city_id }),
    onSuccess: async (response) => {
      const data = await response.json();
      queryClient.invalidateQueries(["/geography/neighborhoods"]);
      queryClient.invalidateQueries(["/ibge/stats"]);
      toast.success(`Distritos importados! ${data.stats?.imported || 0} novos bairros adicionados.`);
    },
    onError: (error) => {
      toast.error("Erro ao importar distritos do IBGE");
      console.error(error);
    },
  });

  // Mutations
  const createStateMutation = useMutation({
    mutationFn: (data) => apiRequest("POST", "/geography/states", data),
    onSuccess: () => {
      queryClient.invalidateQueries(["/geography/states"]);
      setIsStateDialogOpen(false);
      setStateForm({ name: "", code: "" });
      toast.success("Estado criado com sucesso!");
    },
    onError: () => toast.error("Erro ao criar estado"),
  });

  const updateStateMutation = useMutation({
    mutationFn: ({ id, data }) => apiRequest("PUT", `/geography/states/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["/geography/states"]);
      setIsStateDialogOpen(false);
      setEditingState(null);
      setStateForm({ name: "", code: "" });
      toast.success("Estado atualizado com sucesso!");
    },
    onError: () => toast.error("Erro ao atualizar estado"),
  });

  const deleteStateMutation = useMutation({
    mutationFn: (id) => apiRequest("DELETE", `/geography/states/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(["/geography/states"]);
      toast.success("Estado excluído com sucesso!");
    },
    onError: () => toast.error("Erro ao excluir estado"),
  });

  const createCityMutation = useMutation({
    mutationFn: (data) => apiRequest("POST", "/geography/cities", data),
    onSuccess: () => {
      queryClient.invalidateQueries(["/geography/cities"]);
      setIsCityDialogOpen(false);
      setCityForm({ name: "", state_id: "" });
      toast.success("Cidade criada com sucesso!");
    },
    onError: () => toast.error("Erro ao criar cidade"),
  });

  const updateCityMutation = useMutation({
    mutationFn: ({ id, data }) => apiRequest("PUT", `/geography/cities/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["/geography/cities"]);
      setIsCityDialogOpen(false);
      setEditingCity(null);
      setCityForm({ name: "", state_id: "" });
      toast.success("Cidade atualizada com sucesso!");
    },
    onError: () => toast.error("Erro ao atualizar cidade"),
  });

  const deleteCityMutation = useMutation({
    mutationFn: (id) => apiRequest("DELETE", `/geography/cities/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(["/geography/cities"]);
      toast.success("Cidade excluída com sucesso!");
    },
    onError: () => toast.error("Erro ao excluir cidade"),
  });

  const createNeighborhoodMutation = useMutation({
    mutationFn: (data) => apiRequest("POST", "/geography/neighborhoods", data),
    onSuccess: () => {
      queryClient.invalidateQueries(["/geography/neighborhoods"]);
      setIsNeighborhoodDialogOpen(false);
      setNeighborhoodForm({ name: "", state_id: "", city_id: "" });
      toast.success("Bairro criado com sucesso!");
    },
    onError: () => toast.error("Erro ao criar bairro"),
  });

  const createMultipleNeighborhoodsMutation = useMutation({
    mutationFn: async ({ names, city_id }) => {
      const results = [];
      for (const name of names) {
        const response = await apiRequest("POST", "/geography/neighborhoods", { name, city_id });
        results.push(response);
      }
      return results;
    },
    onSuccess: (results) => {
      queryClient.invalidateQueries(["/geography/neighborhoods"]);
      setIsNeighborhoodDialogOpen(false);
      setNeighborhoodForm({ name: "", state_id: "", city_id: "" });
      setNeighborhoodTags([]);
      setCurrentNeighborhoodInput("");
      toast.success(`${results.length} bairro(s) criado(s) com sucesso!`);
    },
    onError: () => {
      toast.error("Erro ao criar bairros");
      setNeighborhoodTags([]);
      setCurrentNeighborhoodInput("");
    },
  });

  const updateNeighborhoodMutation = useMutation({
    mutationFn: ({ id, data }) => apiRequest("PUT", `/geography/neighborhoods/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["/geography/neighborhoods"]);
      setIsNeighborhoodDialogOpen(false);
      setEditingNeighborhood(null);
      setNeighborhoodForm({ name: "", state_id: "", city_id: "" });
      toast.success("Bairro atualizado com sucesso!");
    },
    onError: () => toast.error("Erro ao atualizar bairro"),
  });

  const deleteNeighborhoodMutation = useMutation({
    mutationFn: (id) => apiRequest("DELETE", `/geography/neighborhoods/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(["/geography/neighborhoods"]);
      toast.success("Bairro excluído com sucesso!");
    },
    onError: () => toast.error("Erro ao excluir bairro"),
  });

  // Handlers
  const handleCreateState = (e) => {
    e.preventDefault();
    if (editingState) {
      updateStateMutation.mutate({ id: editingState.id, data: stateForm });
    } else {
      createStateMutation.mutate(stateForm);
    }
  };

  const handleCreateCity = (e) => {
    e.preventDefault();
    if (editingCity) {
      updateCityMutation.mutate({ id: editingCity.id, data: cityForm });
    } else {
      createCityMutation.mutate(cityForm);
    }
  };

  // Funções para manipular tags de bairros
  const addNeighborhoodTag = (name) => {
    const trimmedName = name.trim();
    if (trimmedName && !neighborhoodTags.includes(trimmedName)) {
      setNeighborhoodTags([...neighborhoodTags, trimmedName]);
    }
  };

  const removeNeighborhoodTag = (indexToRemove) => {
    setNeighborhoodTags(neighborhoodTags.filter((_, index) => index !== indexToRemove));
  };

  const handleNeighborhoodInputChange = (e) => {
    const value = e.target.value;
    setCurrentNeighborhoodInput(value);
    
    // Se contém vírgula, processar as tags
    if (value.includes(',')) {
      const names = value.split(',');
      const lastInput = names.pop(); // Remove o último (que pode estar incompleto)
      
      names.forEach(name => addNeighborhoodTag(name));
      setCurrentNeighborhoodInput(lastInput.trim());
    }
  };

  const handleNeighborhoodInputKeyDown = (e) => {
    if (e.key === 'Tab' || e.key === 'Enter') {
      e.preventDefault();
      if (currentNeighborhoodInput.trim()) {
        addNeighborhoodTag(currentNeighborhoodInput);
        setCurrentNeighborhoodInput("");
      }
    }
    if (e.key === 'Backspace' && !currentNeighborhoodInput && neighborhoodTags.length > 0) {
      removeNeighborhoodTag(neighborhoodTags.length - 1);
    }
  };

  const handleCreateNeighborhood = (e) => {
    e.preventDefault();
    if (!neighborhoodForm.state_id || !neighborhoodForm.city_id) {
      toast.error("Por favor, selecione um estado e uma cidade");
      return;
    }

    if (editingNeighborhood) {
      // Modo de edição - criar apenas um bairro
      const payload = {
        name: neighborhoodForm.name,
        city_id: neighborhoodForm.city_id
      };
      updateNeighborhoodMutation.mutate({ id: editingNeighborhood.id, data: payload });
    } else {
      // Modo de criação - pode ser múltiplos bairros
      const finalTags = currentNeighborhoodInput.trim() ? 
        [...neighborhoodTags, currentNeighborhoodInput.trim()] : 
        neighborhoodTags;

      if (finalTags.length === 0) {
        toast.error("Por favor, adicione pelo menos um nome de bairro");
        return;
      }

      // Criar múltiplos bairros
      createMultipleNeighborhoodsMutation.mutate({
        names: finalTags,
        city_id: neighborhoodForm.city_id
      });
    }
  };

  const handleEditState = (state) => {
    setEditingState(state);
    setStateForm({ name: state.name, code: state.code });
    setIsStateDialogOpen(true);
  };

  const handleEditCity = (city) => {
    setEditingCity(city);
    setCityForm({ name: city.name, state_id: city.state_id });
    setIsCityDialogOpen(true);
  };

  const handleEditNeighborhood = (neighborhood) => {
    setEditingNeighborhood(neighborhood);
    setNeighborhoodForm({ 
      name: neighborhood.name, 
      state_id: neighborhood.city?.state_id || "", 
      city_id: neighborhood.city_id 
    });
    // No modo de edição, limpar as tags e usar o campo normal
    setNeighborhoodTags([]);
    setCurrentNeighborhoodInput("");
    setIsNeighborhoodDialogOpen(true);
  };

  const resetForms = () => {
    setStateForm({ name: "", code: "" });
    setCityForm({ name: "", state_id: "" });
    setNeighborhoodForm({ name: "", state_id: "", city_id: "" });
    setNeighborhoodTags([]);
    setCurrentNeighborhoodInput("");
    setEditingState(null);
    setEditingCity(null);
    setEditingNeighborhood(null);
  };

  const handleImportCitiesForState = (stateCode) => {
    importCitiesMutation.mutate({ state_code: stateCode });
  };

  const handleImportDistrictsForCity = (cityId) => {
    importDistrictsMutation.mutate({ city_id: cityId });
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 ml-64">
        <Header
          title="Geografia"
          subtitle="Gerenciar estados, cidades e bairros"
        />

        <main className="p-6 space-y-6">
          {/* Import Stats Card */}
          {ibgeStats && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Database className="h-5 w-5 mr-2" />
                  Estatísticas dos Dados IBGE
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{ibgeStats.total_states || 0}</div>
                    <div className="text-sm text-gray-600">Estados</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{ibgeStats.total_cities || 0}</div>
                    <div className="text-sm text-gray-600">Cidades</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{ibgeStats.total_neighborhoods || 0}</div>
                    <div className="text-sm text-gray-600">Bairros/Distritos</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Import Actions Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Download className="h-5 w-5 mr-2" />
                Importar Dados do IBGE
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <Button
                  onClick={() => importStatesMutation.mutate()}
                  disabled={importStatesMutation.isPending}
                  variant="outline"
                >
                  {importStatesMutation.isPending ? "Importando..." : "Importar Estados"}
                </Button>
                
                <Button
                  onClick={() => importAllCitiesMutation.mutate()}
                  disabled={importAllCitiesMutation.isPending}
                  variant="outline"
                >
                  {importAllCitiesMutation.isPending ? "Iniciando..." : "Importar Todas as Cidades"}
                </Button>

                <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <Info className="h-4 w-4 mr-2" />
                      Sobre a Importação
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Importação de Dados do IBGE</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-2">Estados</h4>
                        <p className="text-sm text-gray-600">
                          Importa todos os 26 estados brasileiros + Distrito Federal diretamente da API oficial do IBGE.
                        </p>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">Cidades</h4>
                        <p className="text-sm text-gray-600">
                          Importa todas as cidades de um estado específico ou de todo o Brasil. Use os botões individuais 
                          por estado para imports menores ou o botão "Importar Todas" para um import completo.
                        </p>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">Distritos/Bairros</h4>
                        <p className="text-sm text-gray-600">
                          Importa os distritos oficiais de uma cidade específica. Nem todas as cidades possuem 
                          distritos cadastrados no IBGE.
                        </p>
                      </div>
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <p className="text-sm text-blue-800">
                          <strong>Fonte:</strong> API oficial do IBGE - Instituto Brasileiro de Geografia e Estatística
                        </p>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>

          {/* Search Bar */}
          <Card>
            <CardContent className="pt-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar estados, cidades ou bairros..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              {searchResults.length > 0 && (
                <div className="mt-4 space-y-2 max-h-40 overflow-y-auto">
                  {searchResults.map((result, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div>
                        <span className="font-medium">{result.name}</span>
                        <Badge variant="outline" className="ml-2">
                          {result.type === "state" ? "Estado" : result.type === "city" ? "Cidade" : "Bairro"}
                        </Badge>
                      </div>
                      <span className="text-sm text-gray-500">{result.full_name}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="states" className="flex items-center">
                <Map className="h-4 w-4 mr-2" />
                Estados
              </TabsTrigger>
              <TabsTrigger value="cities" className="flex items-center">
                <MapPin className="h-4 w-4 mr-2" />
                Cidades
              </TabsTrigger>
              <TabsTrigger value="neighborhoods" className="flex items-center">
                <Navigation className="h-4 w-4 mr-2" />
                Bairros
              </TabsTrigger>
            </TabsList>

            {/* States Tab */}
            <TabsContent value="states">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Estados</CardTitle>
                    {searchQuery && (
                      <p className="text-sm text-gray-500">
                        Mostrando {filteredStates.length} de {states.length} estados
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Dialog open={isStateDialogOpen} onOpenChange={(open) => {
                      setIsStateDialogOpen(open);
                      if (!open) resetForms();
                    }}>
                      <DialogTrigger asChild>
                        <Button>
                          <Plus className="h-4 w-4 mr-2" />
                          Novo Estado
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>{editingState ? "Editar Estado" : "Novo Estado"}</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleCreateState} className="space-y-4">
                          <div>
                            <Label htmlFor="state-name">Nome</Label>
                            <Input
                              id="state-name"
                              value={stateForm.name}
                              onChange={(e) => setStateForm({ ...stateForm, name: e.target.value })}
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="state-code">Código (UF)</Label>
                            <Input
                              id="state-code"
                              value={stateForm.code}
                              onChange={(e) => setStateForm({ ...stateForm, code: e.target.value.toUpperCase() })}
                              maxLength={2}
                              required
                            />
                          </div>
                          <Button type="submit" className="w-full">
                            {editingState ? "Atualizar" : "Criar"} Estado
                          </Button>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  {statesLoading ? (
                    <div className="space-y-2">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="animate-pulse h-12 bg-gray-200 rounded"></div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {filteredStates.length === 0 ? (
                        <p className="text-center text-gray-500 py-8">
                          {searchQuery ? `Nenhum estado encontrado para "${searchQuery}"` : "Nenhum estado cadastrado"}
                        </p>
                      ) : (
                        filteredStates.map((state) => (
                          <div key={state.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div>
                              <span className="font-medium">{state.name}</span>
                              <Badge variant="outline" className="ml-2">{state.code}</Badge>
                            </div>
                            <div className="flex space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleImportCitiesForState(state.code)}
                                disabled={importCitiesMutation.isPending}
                                title="Importar cidades do IBGE para este estado"
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditState(state)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => deleteStateMutation.mutate(state.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Cities Tab */}
            <TabsContent value="cities">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Cidades</CardTitle>
                    {searchQuery && (
                      <p className="text-sm text-gray-500">
                        Mostrando {filteredCities.length} de {cities.length} cidades
                      </p>
                    )}
                  </div>
                  <Dialog open={isCityDialogOpen} onOpenChange={(open) => {
                    setIsCityDialogOpen(open);
                    if (!open) resetForms();
                  }}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Nova Cidade
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>{editingCity ? "Editar Cidade" : "Nova Cidade"}</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleCreateCity} className="space-y-4">
                        <div>
                          <Label htmlFor="city-name">Nome</Label>
                          <Input
                            id="city-name"
                            value={cityForm.name}
                            onChange={(e) => setCityForm({ ...cityForm, name: e.target.value })}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="city-state">Estado</Label>
                          <Select
                            value={cityForm.state_id}
                            onValueChange={(value) => setCityForm({ ...cityForm, state_id: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione um estado" />
                            </SelectTrigger>
                            <SelectContent>
                              {filteredStates.map((state) => (
                                <SelectItem key={state.id} value={state.id.toString()}>
                                  {state.name} ({state.code})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <Button type="submit" className="w-full">
                          {editingCity ? "Atualizar" : "Criar"} Cidade
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <Label htmlFor="state-filter">Filtrar por Estado</Label>
                    <Select value={selectedState} onValueChange={setSelectedState}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um estado" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredStates.map((state) => (
                          <SelectItem key={state.id} value={state.id.toString()}>
                            {state.name} ({state.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedState ? (
                    citiesLoading ? (
                      <div className="space-y-2">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="animate-pulse h-12 bg-gray-200 rounded"></div>
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {filteredCities.length === 0 ? (
                          <p className="text-center text-gray-500 py-8">
                            {searchQuery ? `Nenhuma cidade encontrada para "${searchQuery}"` : "Nenhuma cidade encontrada para este estado"}
                          </p>
                        ) : (
                          filteredCities.map((city) => (
                            <div key={city.id} className="flex items-center justify-between p-3 border rounded-lg">
                              <div>
                                <span className="font-medium">{city.name}</span>
                                {city.state && (
                                  <Badge variant="outline" className="ml-2">{city.state.name}</Badge>
                                )}
                              </div>
                              <div className="flex space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleImportDistrictsForCity(city.id)}
                                  disabled={importDistrictsMutation.isPending}
                                  title="Importar distritos do IBGE para esta cidade"
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEditCity(city)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => deleteCityMutation.mutate(city.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )
                  ) : (
                    <p className="text-center text-gray-500 py-8">
                      Selecione um estado para ver as cidades
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Neighborhoods Tab */}
            <TabsContent value="neighborhoods">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Bairros</CardTitle>
                    {searchQuery && (
                      <p className="text-sm text-gray-500">
                        Mostrando {filteredNeighborhoods.length} de {neighborhoods.length} bairros
                      </p>
                    )}
                  </div>
                  <Dialog open={isNeighborhoodDialogOpen} onOpenChange={(open) => {
                    setIsNeighborhoodDialogOpen(open);
                    if (!open) resetForms();
                  }}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Novo Bairro
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>{editingNeighborhood ? "Editar Bairro" : "Novo Bairro"}</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleCreateNeighborhood} className="space-y-4">
                        <div>
                          <Label htmlFor="neighborhood-name">
                            {editingNeighborhood ? "Nome" : "Nomes dos Bairros"}
                          </Label>
                          {editingNeighborhood ? (
                            <Input
                              id="neighborhood-name"
                              value={neighborhoodForm.name}
                              onChange={(e) => setNeighborhoodForm({ ...neighborhoodForm, name: e.target.value })}
                              required
                            />
                          ) : (
                            <div>
                              <div className="min-h-[40px] flex flex-wrap gap-2 p-2 border border-input rounded-md bg-background ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
                                {neighborhoodTags.map((tag, index) => (
                                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                                    {tag}
                                    <X 
                                      className="h-3 w-3 cursor-pointer hover:text-destructive" 
                                      onClick={() => removeNeighborhoodTag(index)}
                                    />
                                  </Badge>
                                ))}
                                <Input
                                  className="flex-1 border-0 shadow-none focus-visible:ring-0 p-0"
                                  placeholder="Digite os nomes separados por vírgula, Tab ou Enter para adicionar"
                                  value={currentNeighborhoodInput}
                                  onChange={handleNeighborhoodInputChange}
                                  onKeyDown={handleNeighborhoodInputKeyDown}
                                />
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                Separe múltiplos bairros por vírgula ou pressione Tab/Enter para adicionar
                              </p>
                            </div>
                          )}
                        </div>
                        <div>
                          <Label htmlFor="neighborhood-state">Estado</Label>
                          <Select
                            value={neighborhoodForm.state_id}
                            onValueChange={(value) => setNeighborhoodForm({ 
                              ...neighborhoodForm, 
                              state_id: value, 
                              city_id: "" // Reset city quando estado mudar
                            })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione um estado" />
                            </SelectTrigger>
                            <SelectContent>
                              {filteredStates.map((state) => (
                                <SelectItem key={state.id} value={state.id.toString()}>
                                  {state.name} ({state.code})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="neighborhood-city">Cidade</Label>
                          <Select
                            value={neighborhoodForm.city_id}
                            onValueChange={(value) => setNeighborhoodForm({ ...neighborhoodForm, city_id: value })}
                            disabled={!neighborhoodForm.state_id}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder={neighborhoodForm.state_id ? "Selecione uma cidade" : "Primeiro selecione um estado"} />
                            </SelectTrigger>
                            <SelectContent>
                              {modalCities.map((city) => (
                                <SelectItem key={city.id} value={city.id.toString()}>
                                  {city.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <Button type="submit" className="w-full">
                          {editingNeighborhood ? "Atualizar Bairro" : 
                           (neighborhoodTags.length > 1 || (neighborhoodTags.length === 1 && currentNeighborhoodInput.trim())) ? 
                           "Criar Bairros" : "Criar Bairro"}
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 mb-4">
                    <div>
                      <Label htmlFor="state-filter-neighborhood">Estado</Label>
                      <Select value={selectedState} onValueChange={setSelectedState}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um estado" />
                        </SelectTrigger>
                        <SelectContent>
                          {filteredStates.map((state) => (
                            <SelectItem key={state.id} value={state.id.toString()}>
                              {state.name} ({state.code})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {selectedState && (
                      <div>
                        <Label htmlFor="city-filter-neighborhood">Cidade</Label>
                        <Select value={selectedCity} onValueChange={setSelectedCity}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione uma cidade" />
                          </SelectTrigger>
                          <SelectContent>
                            {filteredCities.map((city) => (
                              <SelectItem key={city.id} value={city.id.toString()}>
                                {city.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>

                  {selectedCity ? (
                    neighborhoodsLoading ? (
                      <div className="space-y-2">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="animate-pulse h-12 bg-gray-200 rounded"></div>
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {filteredNeighborhoods.length === 0 ? (
                          <p className="text-center text-gray-500 py-8">
                            {searchQuery ? `Nenhum bairro encontrado para "${searchQuery}"` : "Nenhum bairro encontrado para esta cidade"}
                          </p>
                        ) : (
                          filteredNeighborhoods.map((neighborhood) => (
                            <div key={neighborhood.id} className="flex items-center justify-between p-3 border rounded-lg">
                              <div>
                                <span className="font-medium">{neighborhood.name}</span>
                                {neighborhood.city && (
                                  <Badge variant="outline" className="ml-2">
                                    {neighborhood.city.name} - {neighborhood.city.state?.name}
                                  </Badge>
                                )}
                              </div>
                              <div className="flex space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEditNeighborhood(neighborhood)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => deleteNeighborhoodMutation.mutate(neighborhood.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )
                  ) : (
                    <p className="text-center text-gray-500 py-8">
                      Selecione um estado e uma cidade para ver os bairros
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
} 