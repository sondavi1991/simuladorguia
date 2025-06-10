import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Mail, Settings, TestTube } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

const smtpSchema = z.object({
  host: z.string().min(1, "Host é obrigatório"),
  port: z.number().min(1, "Porta é obrigatória").max(65535, "Porta inválida"),
  username: z.string().min(1, "Usuário é obrigatório"),
  password: z.string().min(1, "Senha é obrigatória"),
  protocol: z.enum(["STARTTLS", "SSL", "NONE"], {
    required_error: "Protocolo é obrigatório",
  }),
  recipientEmail: z.string().email("Email do destinatário inválido"),
  isActive: z.boolean(),
});

type SmtpFormData = z.infer<typeof smtpSchema>;

export default function SmtpPanel() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [testingEmail, setTestingEmail] = useState(false);

  const { data: smtpSettings, isLoading } = useQuery({
    queryKey: ["/api/smtp-settings"],
    retry: false,
  });

  const form = useForm<SmtpFormData>({
    resolver: zodResolver(smtpSchema),
    defaultValues: {
      host: smtpSettings?.host || "",
      port: smtpSettings?.port || 587,
      username: smtpSettings?.username || "",
      password: smtpSettings?.password || "",
      protocol: smtpSettings?.protocol || "STARTTLS",
      recipientEmail: smtpSettings?.recipientEmail || "",
      isActive: smtpSettings?.isActive ?? true,
    },
  });

  // Update form when data loads
  useState(() => {
    if (smtpSettings) {
      form.reset({
        host: smtpSettings.host,
        port: smtpSettings.port,
        username: smtpSettings.username,
        password: smtpSettings.password,
        protocol: smtpSettings.protocol,
        recipientEmail: smtpSettings.recipientEmail,
        isActive: smtpSettings.isActive,
      });
    }
  });

  const saveSmtpMutation = useMutation({
    mutationFn: async (data: SmtpFormData) => {
      const response = await apiRequest(
        smtpSettings ? "PUT" : "POST",
        smtpSettings ? `/api/smtp-settings/${smtpSettings.id}` : "/api/smtp-settings",
        data
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/smtp-settings"] });
      toast({
        title: "Configurações SMTP salvas",
        description: "As configurações de email foram atualizadas com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao salvar configurações",
        description: error.details || "Erro interno do servidor",
        variant: "destructive",
      });
    },
  });

  const testEmailMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/smtp-settings/test", {});
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Email de teste enviado",
        description: "Verifique sua caixa de entrada para confirmar o funcionamento.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Falha no teste de email",
        description: error.details || "Verifique as configurações SMTP",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: SmtpFormData) => {
    saveSmtpMutation.mutate(data);
  };

  const handleTestEmail = () => {
    setTestingEmail(true);
    testEmailMutation.mutate();
    setTimeout(() => setTestingEmail(false), 3000);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gups-teal"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <Mail className="h-6 w-6 text-gups-teal" />
        <h2 className="text-2xl font-bold">Configurações SMTP</h2>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Servidor de Email</span>
          </CardTitle>
          <CardDescription>
            Configure as credenciais do seu provedor de email para receber notificações de submissões.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="host">Host do Servidor</Label>
                <Input
                  id="host"
                  {...form.register("host")}
                  placeholder="smtp.gmail.com"
                  className={form.formState.errors.host ? "border-red-500" : ""}
                />
                {form.formState.errors.host && (
                  <p className="text-sm text-red-500">{form.formState.errors.host.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="port">Porta</Label>
                <Input
                  id="port"
                  type="number"
                  {...form.register("port", { valueAsNumber: true })}
                  placeholder="587"
                  className={form.formState.errors.port ? "border-red-500" : ""}
                />
                {form.formState.errors.port && (
                  <p className="text-sm text-red-500">{form.formState.errors.port.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="username">Usuário/Email</Label>
                <Input
                  id="username"
                  type="email"
                  {...form.register("username")}
                  placeholder="seu-email@provedor.com"
                  className={form.formState.errors.username ? "border-red-500" : ""}
                />
                {form.formState.errors.username && (
                  <p className="text-sm text-red-500">{form.formState.errors.username.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  {...form.register("password")}
                  placeholder="••••••••"
                  className={form.formState.errors.password ? "border-red-500" : ""}
                />
                {form.formState.errors.password && (
                  <p className="text-sm text-red-500">{form.formState.errors.password.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="protocol">Protocolo de Segurança</Label>
                <Select 
                  value={form.watch("protocol")} 
                  onValueChange={(value) => form.setValue("protocol", value as any)}
                >
                  <SelectTrigger className={form.formState.errors.protocol ? "border-red-500" : ""}>
                    <SelectValue placeholder="Selecione o protocolo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="STARTTLS">STARTTLS (Recomendado)</SelectItem>
                    <SelectItem value="SSL">SSL/TLS</SelectItem>
                    <SelectItem value="NONE">Nenhum</SelectItem>
                  </SelectContent>
                </Select>
                {form.formState.errors.protocol && (
                  <p className="text-sm text-red-500">{form.formState.errors.protocol.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="recipientEmail">Email para Notificações</Label>
                <Input
                  id="recipientEmail"
                  type="email"
                  {...form.register("recipientEmail")}
                  placeholder="destino@exemplo.com"
                  className={form.formState.errors.recipientEmail ? "border-red-500" : ""}
                />
                {form.formState.errors.recipientEmail && (
                  <p className="text-sm text-red-500">{form.formState.errors.recipientEmail.message}</p>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={form.watch("isActive")}
                onCheckedChange={(checked) => form.setValue("isActive", checked)}
              />
              <Label htmlFor="isActive" className="text-sm font-medium">
                Ativar notificações por email
              </Label>
            </div>

            <div className="flex space-x-3 pt-4">
              <Button
                type="submit"
                disabled={saveSmtpMutation.isPending}
                className="bg-gups-teal hover:bg-gups-teal/90"
              >
                {saveSmtpMutation.isPending ? "Salvando..." : "Salvar Configurações"}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={handleTestEmail}
                disabled={testingEmail || testEmailMutation.isPending || !form.watch("host")}
              >
                <TestTube className="h-4 w-4 mr-2" />
                {testingEmail || testEmailMutation.isPending ? "Enviando..." : "Testar Email"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Informações Importantes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-gray-600">
          <p>• As configurações SMTP são necessárias para receber notificações quando alguém completa o simulador.</p>
          <p>• Para Gmail, use "smtp.gmail.com" na porta 587 com STARTTLS e uma senha de aplicativo.</p>
          <p>• Para Outlook/Hotmail, use "smtp-mail.outlook.com" na porta 587 com STARTTLS.</p>
          <p>• O email de notificação será enviado sempre que um formulário for concluído.</p>
        </CardContent>
      </Card>
    </div>
  );
}