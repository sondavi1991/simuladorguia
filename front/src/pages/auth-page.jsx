import { useState } from "react";
import { useAuth } from "../hooks/use-auth";
import { Redirect } from "wouter";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Loader2, Sprout } from "lucide-react";

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  const [loginData, setLoginData] = useState({ username: "", password: "" });
  const [registerData, setRegisterData] = useState({
    username: "",
    password: "",
    name: "",
    email: "",
    role: "distributor",
    whatsapp: "",
  });

  // Redirect if already logged in
  if (user) {
    return <Redirect to="/" />;
  }

  const handleLogin = (e) => {
    e.preventDefault();
    loginMutation.mutate(loginData);
  };

  const handleRegister = (e) => {
    e.preventDefault();
    registerMutation.mutate(registerData);
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left side - Form */}
      <div className="w-full md:flex-1 flex items-center justify-center bg-white p-4 md:p-8">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <div className="mx-auto h-16 w-16 bg-green-600 rounded-full flex items-center justify-center mb-6">
              <Sprout className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2 w-full md:w-1/2 mx-auto">Bulbo Raiz</h1>
            <p className="text-gray-600 mb-8">Sistema de Distribuidores</p>
          </div>

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-1">
              <TabsTrigger value="login">Entrar</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <Card>
                <CardHeader>
                  <CardTitle>Fazer Login</CardTitle>
                  <CardDescription>
                    Entre com suas credenciais para acessar o sistema
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                      <Label htmlFor="username">Usuário</Label>
                      <Input
                        id="username"
                        type="text"
                        value={loginData.username}
                        onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
                        required
                        placeholder="seu.usuario"
                      />
                    </div>
                    <div>
                      <Label htmlFor="password">Senha</Label>
                      <Input
                        id="password"
                        type="password"
                        value={loginData.password}
                        onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                        required
                        placeholder="••••••••"
                      />
                    </div>
                    {loginMutation.error && (
                      <div className="text-red-600 text-sm">
                        {loginMutation.error.message}
                      </div>
                    )}
                    <Button
                      type="submit"
                      className="w-full bg-green-600 hover:bg-green-700"
                      disabled={loginMutation.isPending}
                    >
                      {loginMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : null}
                      Entrar
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Right side - Hero */}
      <div className="w-full md:flex-1 bg-gradient-to-br from-green-600 to-green-800 flex items-center justify-center p-4 md:p-8">
        <div className="max-w-md text-center text-white">
          <div className="mb-8">
            <div className="mx-auto h-24 w-24 bg-white/20 rounded-full flex items-center justify-center mb-6">
              <Sprout className="h-12 w-12 text-white" />
            </div>
            <h2 className="text-3xl font-bold mb-4">
              Gerencie sua Rede de Distribuidores
            </h2>
            <p className="text-xl text-green-100 mb-6">
              Sistema completo para controle de áreas de atendimento, leads e análises de performance.
            </p>
          </div>
          
          <div className="space-y-4 text-left">
            <div className="flex items-center">
              <div className="h-2 w-2 bg-green-300 rounded-full mr-3"></div>
              <span>Gestão de distribuidores por região</span>
            </div>
            <div className="flex items-center">
              <div className="h-2 w-2 bg-green-300 rounded-full mr-3"></div>
              <span>Captura e distribuição automática de leads</span>
            </div>
            <div className="flex items-center">
              <div className="h-2 w-2 bg-green-300 rounded-full mr-3"></div>
              <span>Dashboard com métricas em tempo real</span>
            </div>
            <div className="flex items-center">
              <div className="h-2 w-2 bg-green-300 rounded-full mr-3"></div>
              <span>Exportação de relatórios para Excel</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

