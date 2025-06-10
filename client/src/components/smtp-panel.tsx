import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Mail, Settings, TestTube, Save, Edit, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface SmtpSettings {
  id?: number;
  host: string;
  port: number;
  username: string;
  password: string;
  fromEmail: string;
  fromName: string;
  protocol?: string;
  recipientEmail?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export default function SmtpPanel() {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);

  // Fetch existing SMTP settings
  const { data: smtpSettings, isLoading } = useQuery<SmtpSettings>({
    queryKey: ["/api/smtp-settings"],
  });

  // Form state
  const [formData, setFormData] = useState<SmtpSettings>({
    host: "",
    port: 587,
    username: "",
    password: "",
    protocol: "STARTTLS",
    recipientEmail: "",
    isActive: false,
  });

  // Update form data when settings load
  useEffect(() => {
    if (smtpSettings) {
      setFormData({
        host: smtpSettings.host || "",
        port: smtpSettings.port || 587,
        username: smtpSettings.username || "",
        password: smtpSettings.password || "",
        protocol: smtpSettings.protocol || "STARTTLS",
        recipientEmail: smtpSettings.recipientEmail || "",
        isActive: smtpSettings.isActive || false,
      });
    }
  }, [smtpSettings]);

  // Save SMTP settings mutation
  const saveMutation = useMutation({
    mutationFn: async (data: SmtpSettings) => {
      const url = smtpSettings?.id ? `/api/smtp-settings/${smtpSettings.id}` : "/api/smtp-settings";
      const method = smtpSettings?.id ? "PUT" : "POST";
      const response = await apiRequest(method, url, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Sucesso!",
        description: "Configurações SMTP salvas com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/smtp-settings"] });
      setIsEditing(false);
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao salvar configurações SMTP.",
        variant: "destructive",
      });
    }
  });

  // Test SMTP connection mutation
  const testMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/smtp-settings/test", formData);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Teste realizado!",
        description: data.message || "Teste de SMTP concluído com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro no teste",
        description: "Falha ao testar configurações SMTP.",
        variant: "destructive",
      });
    }
  });

  const handleInputChange = (field: keyof SmtpSettings, value: string | number | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = () => {
    saveMutation.mutate(formData);
  };

  const handleTest = () => {
    testMutation.mutate();
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Carregando configurações...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Mail className="w-6 h-6" />
            Configurações SMTP
          </h2>
          <p className="text-gray-600 mt-1">
            Configure o servidor de email para notificações automáticas
          </p>
        </div>
        <Button
          onClick={() => setIsEditing(!isEditing)}
          variant="outline"
          className="flex items-center gap-2"
        >
          <Edit className="w-4 h-4" />
          {isEditing ? "Cancelar" : "Editar"}
        </Button>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Configure seu servidor SMTP para receber notificações quando usuários completarem simulações.
          Suportamos Gmail, Outlook, e outros provedores SMTP.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Servidor SMTP
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="host">Servidor SMTP</Label>
              <Input
                id="host"
                placeholder="smtp.gmail.com"
                value={formData.host}
                onChange={(e) => handleInputChange("host", e.target.value)}
                disabled={!isEditing}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="port">Porta</Label>
              <Input
                id="port"
                type="number"
                placeholder="587"
                value={formData.port}
                onChange={(e) => handleInputChange("port", parseInt(e.target.value) || 587)}
                disabled={!isEditing}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="protocol">Protocolo de Segurança</Label>
            <Select
              value={formData.protocol}
              onValueChange={(value) => handleInputChange("protocol", value)}
              disabled={!isEditing}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="STARTTLS">STARTTLS (Recomendado)</SelectItem>
                <SelectItem value="SSL">SSL/TLS</SelectItem>
                <SelectItem value="PLAIN">Sem criptografia</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="username">Nome de usuário</Label>
              <Input
                id="username"
                type="email"
                placeholder="seu-email@gmail.com"
                value={formData.username}
                onChange={(e) => handleInputChange("username", e.target.value)}
                disabled={!isEditing}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha / Token de aplicativo</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••••••"
                value={formData.password}
                onChange={(e) => handleInputChange("password", e.target.value)}
                disabled={!isEditing}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="recipientEmail">Email de notificação</Label>
            <Input
              id="recipientEmail"
              type="email"
              placeholder="admin@empresa.com"
              value={formData.recipientEmail}
              onChange={(e) => handleInputChange("recipientEmail", e.target.value)}
              disabled={!isEditing}
            />
            <p className="text-sm text-gray-500">
              Email que receberá notificações quando simulações forem concluídas
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={(checked) => handleInputChange("isActive", checked)}
              disabled={!isEditing}
            />
            <Label htmlFor="isActive">Ativar notificações por email</Label>
          </div>

          {isEditing && (
            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleSave}
                disabled={saveMutation.isPending}
                className="flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {saveMutation.isPending ? "Salvando..." : "Salvar Configurações"}
              </Button>
              <Button
                onClick={handleTest}
                disabled={testMutation.isPending || !formData.host || !formData.username}
                variant="outline"
                className="flex items-center gap-2"
              >
                <TestTube className="w-4 h-4" />
                {testMutation.isPending ? "Testando..." : "Testar Conexão"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Configuração rápida para provedores populares</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">Gmail</h4>
              <div className="text-sm space-y-1 text-gray-600">
                <p><strong>Servidor:</strong> smtp.gmail.com</p>
                <p><strong>Porta:</strong> 587</p>
                <p><strong>Protocolo:</strong> STARTTLS</p>
                <p className="text-xs mt-2">* Use senha de aplicativo, não sua senha normal</p>
              </div>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">Outlook/Hotmail</h4>
              <div className="text-sm space-y-1 text-gray-600">
                <p><strong>Servidor:</strong> smtp-mail.outlook.com</p>
                <p><strong>Porta:</strong> 587</p>
                <p><strong>Protocolo:</strong> STARTTLS</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}