import { useAuth } from "../hooks/use-auth";
import { Redirect } from "wouter";

export function ProtectedRoute({ component: Component, ...props }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/auth" />;
  }

  return <Component {...props} />;
}

