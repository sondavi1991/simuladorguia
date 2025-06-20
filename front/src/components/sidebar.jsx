import { useAuth } from "../hooks/use-auth";
import { useLocation } from "wouter";
import { Button } from "./ui/button";
import { 
  LayoutDashboard, 
  Users, 
  UserPlus, 
  MapPin, 
  Settings, 
  LogOut,
  Sprout,
  FileText,
  BarChart3,
  User
} from "lucide-react";

export default function Sidebar() {
  const { user, logoutMutation } = useAuth();
  const [location, setLocation] = useLocation();
  const isAdmin = user?.role === "admin";

  const navigation = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard, adminOnly: false },
    { name: "Distribuidores", href: "/distributors", icon: Users, adminOnly: true },
    { name: "Leads", href: "/leads", icon: UserPlus, adminOnly: false },
    { name: "Geografia", href: "/geography", icon: MapPin, adminOnly: true },
    { name: "Usuários", href: "/users", icon: Settings, adminOnly: true },
    { name: "Relatórios", href: "/reports", icon: FileText, adminOnly: false },
    { name: "Meu Perfil", href: "/profile", icon: User, adminOnly: false },
  ];

  const filteredNavigation = navigation.filter(item => !item.adminOnly || isAdmin);

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center justify-center border-b border-gray-200">
          <div className="flex items-center">
            <div className="h-8 w-8 bg-green-600 rounded-lg flex items-center justify-center mr-3">
              <Sprout className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">Bulbo Raiz</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-4 py-6">
          {filteredNavigation.map((item) => {
            const isActive = location === item.href || (item.href === "/" && location === "/dashboard");
            return (
              <button
                key={item.name}
                onClick={() => setLocation(item.href)}
                className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  isActive
                    ? "bg-green-100 text-green-700"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.name}
              </button>
            );
          })}
        </nav>

        {/* User info and logout */}
        <div className="border-t border-gray-200 p-4">
          <div className="flex items-center mb-4">
            <div className="h-8 w-8 bg-green-600 rounded-full flex items-center justify-center mr-3">
              <span className="text-sm font-medium text-white">
                {user?.name?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.name}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {user?.role === "admin" ? "Administrador" : "Distribuidor"}
              </p>
            </div>
          </div>
          <Button
            onClick={handleLogout}
            variant="outline"
            size="sm"
            className="w-full"
            disabled={logoutMutation.isPending}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </Button>
        </div>
      </div>
    </div>
  );
}

