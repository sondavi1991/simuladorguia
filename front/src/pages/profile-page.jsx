import { useState, useEffect } from "react";
import { useAuth } from "../hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { toast } from "sonner";
import Sidebar from "@/components/sidebar";
import Header from "@/components/header";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// Schema dinâmico baseado no contexto
const createProfileSchema = (isChangingPassword, isChangingPersonalInfo) => {
  return z.object({
    name: z.string().min(1, "Nome é obrigatório"),
    email: z.string().email("Email inválido"),
    current_password: z.string().optional(),
    password: z.string().optional(),
    password_confirmation: z.string().optional()
  }).refine((data) => {
    // Se está alterando senha, ambos os campos devem ter pelo menos 6 caracteres
    if (isChangingPassword) {
      if (!data.password || data.password.length < 6) {
        return false;
      }
      if (!data.password_confirmation || data.password_confirmation.length < 6) {
        return false;
      }
    }
    return true;
  }, {
    message: "Nova senha deve ter pelo menos 6 caracteres",
    path: ["password"],
  }).refine((data) => {
    // Se está alterando senha, as senhas devem coincidir
    // Verifica se ambos os campos têm conteúdo antes de comparar
    if (isChangingPassword) {
      const hasPassword = data.password && data.password.length > 0;
      const hasPasswordConfirmation = data.password_confirmation && data.password_confirmation.length > 0;
      
      if (hasPassword && hasPasswordConfirmation && data.password !== data.password_confirmation) {
        return false;
      }
    }
    return true;
  }, {
    message: "As senhas não coincidem",
    path: ["password_confirmation"],
  }).refine((data) => {
    // Se está alterando senha OU informações pessoais, deve fornecer senha atual
    if ((isChangingPassword || isChangingPersonalInfo) && (!data.current_password || data.current_password.length === 0)) {
      return false;
    }
    return true;
  }, {
    message: "Senha atual é obrigatória para confirmar as alterações",
    path: ["current_password"],
  });
};

export default function ProfilePage() {
  const { user, refetchUser } = useAuth();
  const [hasChanges, setHasChanges] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isChangingPersonalInfo, setIsChangingPersonalInfo] = useState(false);
  const [originalValues, setOriginalValues] = useState({
    name: user?.name || "",
    email: user?.email || "",
  });
  
  // Atualizar valores originais quando o usuário mudar
  const form = useForm({
    resolver: zodResolver(createProfileSchema(isChangingPassword, isChangingPersonalInfo)),
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
      current_password: "",
      password: "",
      password_confirmation: "",
    },
  });

  useEffect(() => {
    if (user) {
      const newValues = {
        name: user.name || "",
        email: user.email || "",
      };
      setOriginalValues(newValues);
      
      // Atualizar o formulário também
      form.reset({
        name: newValues.name,
        email: newValues.email,
        current_password: "",
        password: "",
        password_confirmation: "",
      });
    }
  }, [user, form]);

  // Observa mudanças nos valores do formulário
  const watchedValues = form.watch();
  
  useEffect(() => {
    const currentName = watchedValues.name || "";
    const currentEmail = watchedValues.email || "";
    const currentPassword = watchedValues.password || "";
    const currentPasswordConfirmation = watchedValues.password_confirmation || "";
    
    // Verifica se informações pessoais mudaram
    const personalInfoChanged = 
      currentName !== originalValues.name || 
      currentEmail !== originalValues.email;
    
    // Verifica se está tentando alterar senha
    const passwordChanged = currentPassword.length > 0 || currentPasswordConfirmation.length > 0;
    
    setIsChangingPersonalInfo(personalInfoChanged);
    setIsChangingPassword(passwordChanged);
    setHasChanges(personalInfoChanged || passwordChanged);
  }, [watchedValues, originalValues.name, originalValues.email]);
  
  // Atualiza o schema quando o contexto muda
  useEffect(() => {
    form.clearErrors();
    const newSchema = createProfileSchema(isChangingPassword, isChangingPersonalInfo);
    // Re-validate with new schema
    form.trigger();
  }, [isChangingPassword, isChangingPersonalInfo, form]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data) => {
      const res = await apiRequest("PUT", "/profile", data);
      return res.json();
    },
    onSuccess: (data) => {
      toast.success("Perfil atualizado com sucesso!");
      
      // Recarregar dados do usuário
      refetchUser();
      
      // Resetar estados
      setHasChanges(false);
      setIsChangingPassword(false);
      setIsChangingPersonalInfo(false);
      
      // Limpar campos de senha e atualizar valores padrão
      form.setValue("current_password", "");
      form.setValue("password", "");
      form.setValue("password_confirmation", "");
      
      // Atualizar valores padrão com os novos dados salvos
      const updatedName = form.getValues("name");
      const updatedEmail = form.getValues("email");
      
      form.reset({
        name: updatedName,
        email: updatedEmail,
        current_password: "",
        password: "",
        password_confirmation: "",
      });
      
      // Atualizar originalValues para as próximas comparações
      setOriginalValues({
        name: updatedName,
        email: updatedEmail,
      });
    },
    onError: (error) => {
      console.error("Erro ao atualizar perfil:", error);
      
      if (error.response) {
        // Erro do servidor com resposta
        if (error.response.status === 422) {
          toast.error("A senha atual está incorreta");
        } else if (error.response.status === 400) {
          toast.error("Dados inválidos. Verifique as informações fornecidas.");
        } else {
          toast.error(`Erro do servidor: ${error.response.status}`);
        }
      } else if (error.message) {
        // Erro de rede ou outros
        toast.error("Erro ao atualizar perfil: " + error.message);
      } else {
        // Erro genérico
        toast.error("Erro inesperado ao atualizar perfil");
      }
    },
  });

  const onSubmit = (data) => {
    // Monta os dados para envio baseado no que está sendo alterado
    const submitData = {
      name: data.name,
      email: data.email,
      current_password: data.current_password, // Sempre incluir para validação no backend
    };
    
    // Só inclui campos de senha se estiver alterando
    if (isChangingPassword) {
      submitData.password = data.password;
      submitData.password_confirmation = data.password_confirmation;
    }
    
    updateProfileMutation.mutate(submitData);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 ml-64">
        <Header />
        <main className="p-8">
          <Card>
            <CardHeader>
              <CardTitle>Meu Perfil</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input {...field} type="email" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Seção de confirmação de senha atual - aparece quando há mudanças */}
                  {(isChangingPersonalInfo || isChangingPassword) && (
                    <div className="pt-4 border-t">
                      <h3 className="text-lg font-medium mb-2">
                        {isChangingPassword ? "Confirmação de Segurança" : "Confirmar Alterações"}
                      </h3>
                      <p className="text-sm text-gray-600 mb-4">
                        {isChangingPassword 
                          ? "Para alterar sua senha, digite sua senha atual para confirmação:" 
                          : "Para confirmar as alterações nas suas informações pessoais, digite sua senha atual:"
                        }
                      </p>
                      
                      <FormField
                        control={form.control}
                        name="current_password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Senha Atual</FormLabel>
                            <FormControl>
                              <Input {...field} type="password" placeholder="Digite sua senha atual" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}

                  {/* Seção de alteração de senha - opcional */}
                  <div className="pt-4 border-t">
                    <h3 className="text-lg font-medium mb-2">Alterar Senha (Opcional)</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Deixe em branco se não quiser alterar sua senha.
                    </p>
                    
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nova Senha</FormLabel>
                            <FormControl>
                              <Input {...field} type="password" placeholder="Digite nova senha (opcional)" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="password_confirmation"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Confirmar Nova Senha</FormLabel>
                            <FormControl>
                              <Input {...field} type="password" placeholder="Confirme a nova senha" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Informações sobre o estado atual */}
                  {hasChanges && (
                    <div className="pt-4 border-t bg-blue-50 p-4 rounded-lg">
                      <div className="text-sm text-blue-800">
                        <strong>Alterações detectadas:</strong>
                        <ul className="mt-2 list-disc list-inside">
                          {isChangingPersonalInfo && <li>Informações pessoais (nome/email)</li>}
                          {isChangingPassword && <li>Alteração de senha</li>}
                        </ul>
                      </div>
                    </div>
                  )}

                  <div className="pt-4">
                    <Button 
                      type="submit"
                      className="w-full"
                      disabled={!hasChanges || updateProfileMutation.isPending}
                    >
                      {updateProfileMutation.isPending 
                        ? "Salvando..." 
                        : hasChanges 
                          ? "Salvar Alterações" 
                          : "Nenhuma alteração para salvar"
                      }
                    </Button>
                    
                    {!hasChanges && (
                      <p className="text-center text-sm text-gray-500 mt-2">
                        Faça alterações nos campos acima para habilitar o botão de salvar.
                      </p>
                    )}
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
} 