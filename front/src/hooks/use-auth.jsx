import { createContext, useContext } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient, setAuthToken, removeAuthToken, getAuthToken } from "../lib/queryClient";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const {
    data: user,
    error,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["/user"],
    queryFn: async () => {
      const token = getAuthToken();
      if (!token) return null;
      
      try {
        const res = await apiRequest("GET", "/user");
        const data = await res.json();
        return data.user;
      } catch (error) {
        console.error("Auth check failed:", error);
        // Only remove token if it's a 401 (unauthorized)
        if (error.message.includes("401")) {
          removeAuthToken();
        }
        return null;
      }
    },
    enabled: !!getAuthToken(),
    staleTime: 10 * 60 * 1000, // 10 minutes - token is valid longer
    gcTime: 15 * 60 * 1000, // 15 minutes cache time
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    retry: false,
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials) => {
      const res = await apiRequest("POST", "/login", credentials);
      const data = await res.json();
      return data;
    },
    onSuccess: (data) => {
      setAuthToken(data.token);
      queryClient.setQueryData(["/user"], data.user);
      // Set a longer stale time for the user data after login
      queryClient.setQueryData(["/user"], data.user, {
        updatedAt: Date.now(),
      });
      
      // Redirect to dashboard with correct base path after login
      setTimeout(() => {
        window.location.href = import.meta.env.PROD ? '/appbulbo/' : '/';
      }, 100);
    },
    onError: (error) => {
      console.error("Login error:", error);
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (credentials) => {
      const res = await apiRequest("POST", "/register", credentials);
      const data = await res.json();
      return data;
    },
    onSuccess: (data) => {
      setAuthToken(data.token);
      queryClient.setQueryData(["/user"], data.user);
    },
    onError: (error) => {
      console.error("Register error:", error);
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      try {
        await apiRequest("POST", "/logout");
      } catch (error) {
        // Even if logout fails on server, we should clear local token
        console.warn("Logout request failed:", error);
      }
    },
    onSuccess: () => {
      // Clear authentication
      removeAuthToken();
      queryClient.setQueryData(["/user"], null);
      queryClient.clear(); // Clear all cached data
      
      // Clear all storage
      localStorage.clear();
      sessionStorage.clear();
      
      // Clear all cookies
      document.cookie.split(";").forEach((cookie) => {
        const eqPos = cookie.indexOf("=");
        const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
        // Clear for all possible domains and paths
        document.cookie = `${name.trim()}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;`;
        document.cookie = `${name.trim()}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname};`;
        document.cookie = `${name.trim()}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/appbulbo/;`;
        document.cookie = `${name.trim()}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/appbulbo/;domain=${window.location.hostname};`;
      });
      
      // Force page reload to ensure clean state
      setTimeout(() => {
        window.location.href = import.meta.env.PROD ? '/appbulbo/auth' : '/auth';
      }, 100);
    },
    onError: (error) => {
      // Still remove token even if server request failed
      removeAuthToken();
      queryClient.setQueryData(["/user"], null);
      queryClient.clear();
      
      // Clear all storage
      localStorage.clear();
      sessionStorage.clear();
      
      // Clear all cookies
      document.cookie.split(";").forEach((cookie) => {
        const eqPos = cookie.indexOf("=");
        const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
        // Clear for all possible domains and paths
        document.cookie = `${name.trim()}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;`;
        document.cookie = `${name.trim()}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname};`;
        document.cookie = `${name.trim()}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/appbulbo/;`;
        document.cookie = `${name.trim()}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/appbulbo/;domain=${window.location.hostname};`;
      });
      
      // Force page reload to ensure clean state
      setTimeout(() => {
        window.location.href = import.meta.env.PROD ? '/appbulbo/auth' : '/auth';
      }, 100);
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
        refetchUser: refetch,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  
  return context;
}

