import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { AuthProvider } from "./hooks/use-auth";
import { ProtectedRoute } from "./lib/protected-route";
import { Toaster } from "./components/ui/sonner";
import AuthPage from "./pages/auth-page";
import DashboardPage from "./pages/dashboard-page";
import LeadsPage from "./pages/leads-page";
import DistributorsPage from "./pages/distributors-page";
import GeographyPage from "./pages/geography-page";
import UsersPage from "./pages/users-page.jsx";
import ReportsPage from "./pages/reports-page";
import ProfilePage from "./pages/profile-page";
import "./App.css";

// Configure base path for production
const basePath = import.meta.env.PROD ? "/appbulbo" : "";

function Router() {
  return (
    <WouterRouter base={basePath}>
      <Switch>
        <Route path="/auth" component={AuthPage} />
        <ProtectedRoute path="/" component={DashboardPage} />
        <ProtectedRoute path="/dashboard" component={DashboardPage} />
        <ProtectedRoute path="/leads" component={LeadsPage} />
        <ProtectedRoute path="/distributors" component={DistributorsPage} />
        <ProtectedRoute path="/geography" component={GeographyPage} />
        <ProtectedRoute path="/users" component={UsersPage} />
        <ProtectedRoute path="/reports" component={ReportsPage} />
        <ProtectedRoute path="/profile" component={ProfilePage} />
        <Route>
          {/* 404 - redirect to dashboard */}
          <DashboardPage />
        </Route>
      </Switch>
    </WouterRouter>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;

