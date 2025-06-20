import { QueryClient } from "@tanstack/react-query";
import { API_BASE_URL } from "../config";

// Token management
const TOKEN_KEY = "auth_token";

export function getAuthToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setAuthToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeAuthToken() {
  localStorage.removeItem(TOKEN_KEY);
}

async function throwIfResNotOk(res) {
  if (!res.ok) {
    let errorMessage = res.statusText;
    try {
      const errorData = await res.json();
      errorMessage = errorData.message || errorMessage;
    } catch {
      // If response is not JSON, use statusText
    }
    throw new Error(`${res.status}: ${errorMessage}`);
  }
}

export async function apiRequest(method, url, data) {
  const token = getAuthToken();
  const headers = {
    "Content-Type": "application/json",
    "Accept": "application/json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const fullUrl = url.startsWith("http") ? url : `${API_BASE_URL}${url}`;

  const res = await fetch(fullUrl, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
  });

  // If unauthorized, remove token
  if (res.status === 401) {
    removeAuthToken();
  }

  await throwIfResNotOk(res);
  return res;
}

export const getQueryFn = ({ on401 = "throw" }) => async ({ queryKey }) => {
  const token = getAuthToken();
  const headers = {
    "Accept": "application/json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const url = queryKey[0];
  const params = queryKey[1] || {};
  
  // Build URL with query parameters
  let fullUrl = url.startsWith("http") ? url : `${API_BASE_URL}${url}`;
  
  if (Object.keys(params).length > 0) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, value);
      }
    });
    
    if (searchParams.toString()) {
      fullUrl += `?${searchParams.toString()}`;
    }
  }

  const res = await fetch(fullUrl, {
    headers,
  });

  if (on401 === "returnNull" && res.status === 401) {
    removeAuthToken();
    return null;
  }

  if (res.status === 401) {
    removeAuthToken();
  }

  await throwIfResNotOk(res);
  return await res.json();
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes garbage collection time
      retry: (failureCount, error) => {
        // Don't retry on 401 or 403 errors
        if (error?.message?.includes("401") || error?.message?.includes("403")) {
          return false;
        }
        // Retry up to 2 times for other errors
        return failureCount < 2;
      },
    },
    mutations: {
      retry: false,
    },
  },
});

