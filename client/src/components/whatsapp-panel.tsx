import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { MessageCircle, Plus, Edit, Trash2, Phone, Users, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { WhatsappAttendant, InsertWhatsappAttendant } from "@shared/schema";

export default function WhatsappPanel() {
  const { toast } = useToast();
  const [editingAttendant, setEditingAttendant] = useState<WhatsappAttendant | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);

  // Fetch WhatsApp attendants
  const { data: attendants = [], isLoading } = useQuery<WhatsappAttendant[]>({
    queryKey: ["/api/whatsapp-attendants"],
  });

  // Form state
  const [formData, setFormData] = useState<InsertWhatsappAttendant>({
    name: "",
    phoneNumber: "",
    isActive: true,
    priority: 1,
  });

  // Save attendant mutation
  const saveMutation = useMutation({
    mutationFn: async (data: InsertWhatsappAttendant) => {
      const url = editingAttendant ? `/api/whatsapp-attendants/${editingAttendant.id}` : "/api/whatsapp-attendants";
      const method = editingAttendant ? "PUT" : "POST";
      const response = await apiRequest(method, url, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Sucesso!",
        description: editingAttendant ? "Atendente atualizado com sucesso." : "Atendente adicionado com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/whatsapp-attendants"] });
      resetForm();
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao salvar atendente.",
        variant: "destructive",
      });
    }
  });

  // Delete attendant mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/whatsapp-attendants/${id}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Sucesso!",
        description: "Atendente removido com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/whatsapp-attendants"] });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao remover atendente.",
        variant: "destructive",
      });
    }
  });

  const resetForm = () => {
    setFormData({
      name: "",
      phoneNumber: "",
      isActive: true,
      priority: 1,
    });
    setEditingAttendant(null);
    setIsAddingNew(false);
  };

  const handleEdit = (attendant: WhatsappAttendant) => {
    setEditingAttendant(attendant);
    setFormData({
      name: attendant.name,
      phoneNumber: attendant.phoneNumber,
      isActive: attendant.isActive || true,
      priority: attendant.priority || 1,
    });
    setIsAddingNew(true);
  };

  const handleSave = () => {
    if (!formData.name.trim() || !formData.phoneNumber.trim()) {
      toast({
        title: "Erro",
        description: "Nome e número de telefone são obrigatórios.",
        variant: "destructive",
      });
      return;
    }
    saveMutation.mutate(formData);
  };

  const formatPhoneNumber = (phone: string) => {
    // Remove non-digits
    const digits = phone.replace(/\D/g, '');
    
    // Format as WhatsApp link
    if (digits.startsWith('55')) {
      return `+${digits}`;
    } else if (digits.length >= 10) {
      return `+55${digits}`;
    }
    return phone;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Carregando atendentes...</div>
        </CardContent>
      </Card>
    );
  }

  const activeAttendants = attendants.filter(a => a.isActive);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <MessageCircle className="w-6 h-6" />
            Atendimento WhatsApp
          </h2>
          <p className="text-gray-600 mt-1">
            Configure os números para distribuição automática de atendimento
          </p>
        </div>
        <Button
          onClick={() => setIsAddingNew(true)}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Adicionar Atendente
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600">Total de Atendentes</p>
                <p className="text-2xl font-bold">{attendants.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Phone className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-sm text-gray-600">Ativos</p>
                <p className="text-2xl font-bold">{activeAttendants.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-purple-500" />
              <div>
                <p className="text-sm text-gray-600">Próximo Atendimento</p>
                <p className="text-lg font-semibold">
                  {activeAttendants.length > 0 
                    ? activeAttendants.sort((a, b) => (a.priority || 1) - (b.priority || 1))[0]?.name 
                    : "Nenhum"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          O sistema distribui automaticamente os atendimentos entre os números cadastrados. 
          A cada nova simulação concluída, o próximo atendente na fila recebe o cliente.
          Use a prioridade para definir a ordem de distribuição (menor número = maior prioridade).
        </AlertDescription>
      </Alert>

      {/* Add/Edit Form */}
      {isAddingNew && (
        <Card>
          <CardHeader>
            <CardTitle>{editingAttendant ? 'Editar Atendente' : 'Adicionar Novo Atendente'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Atendente</Label>
                <Input
                  id="name"
                  placeholder="João Silva"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Número WhatsApp</Label>
                <Input
                  id="phoneNumber"
                  placeholder="11999999999"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                />
                <p className="text-xs text-gray-500">
                  Digite apenas os números (com DDD). Ex: 11999999999
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="priority">Prioridade</Label>
                <Input
                  id="priority"
                  type="number"
                  min="1"
                  max="100"
                  value={formData.priority}
                  onChange={(e) => setFormData(prev => ({ ...prev, priority: parseInt(e.target.value) || 1 }))}
                />
                <p className="text-xs text-gray-500">
                  Menor número = maior prioridade (1 = primeira prioridade)
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="isActive">Status</Label>
                <div className="flex items-center space-x-2 pt-2">
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                  />
                  <Label htmlFor="isActive">{formData.isActive ? 'Ativo' : 'Inativo'}</Label>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleSave}
                disabled={saveMutation.isPending}
                className="flex items-center gap-2"
              >
                {saveMutation.isPending ? "Salvando..." : "Salvar Atendente"}
              </Button>
              <Button
                onClick={resetForm}
                variant="outline"
              >
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Attendants List */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Atendentes</CardTitle>
        </CardHeader>
        <CardContent>
          {attendants.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>Nenhum atendente cadastrado</p>
              <p className="text-sm">Adicione atendentes para começar a distribuir os atendimentos</p>
            </div>
          ) : (
            <div className="space-y-4">
              {attendants
                .sort((a, b) => (a.priority || 1) - (b.priority || 1))
                .map((attendant) => (
                <div key={attendant.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <MessageCircle className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">{attendant.name}</h4>
                        {attendant.isActive ? (
                          <Badge className="bg-green-100 text-green-800">Ativo</Badge>
                        ) : (
                          <Badge variant="secondary">Inativo</Badge>
                        )}
                        <Badge variant="outline">Prioridade {attendant.priority || 1}</Badge>
                      </div>
                      <p className="text-sm text-gray-600">{formatPhoneNumber(attendant.phoneNumber)}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(attendant)}
                      className="flex items-center gap-1"
                    >
                      <Edit className="w-3 h-3" />
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => deleteMutation.mutate(attendant.id)}
                      disabled={deleteMutation.isPending}
                      className="flex items-center gap-1 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-3 h-3" />
                      Remover
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Como funciona a distribuição</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-xs">1</div>
              <p>Cliente completa uma simulação e clica em "Saber Mais" em um plano</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-xs">2</div>
              <p>Sistema seleciona automaticamente o próximo atendente ativo na fila (por prioridade)</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-xs">3</div>
              <p>Cliente é direcionado para WhatsApp do atendente selecionado</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-xs">4</div>
              <p>Próxima simulação será direcionada para o próximo atendente na fila</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}