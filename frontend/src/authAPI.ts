import type { User, LoginRequest, RegisterRequest, TokenResponse } from "./types/auth";

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";
const TOKEN_KEY = "planova_jwt_token";

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY) || localStorage.getItem("taskflow_jwt_token");
  } catch {
    return null;
  }
}

export function setStoredToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // Ignore storage quota errors
  }
}

export function removeStoredToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem("taskflow_jwt_token");
  } catch {
    // Ignore storage errors
  }
}

async function authFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${BASE_URL}${path}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> || {}),
  };

  const res = await fetch(url, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const data = await res.json();
      if (typeof data.detail === "string") {
        message = data.detail;
      } else if (Array.isArray(data.detail) && data.detail.length > 0) {
        message = data.detail.map((err: { msg?: string }) => err.msg ?? "").filter(Boolean).join(", ");
      }
    } catch {
      // Use fallback status text if body is not JSON
      if (res.statusText) message = res.statusText;
    }
    throw new Error(message);
  }

  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

export const authApi = {
  login: async (credentials: LoginRequest): Promise<TokenResponse> => {
    return await authFetch<TokenResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
  },

  register: async (data: RegisterRequest): Promise<User> => {
    return await authFetch<User>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  getMe: async (token?: string): Promise<User> => {
    const activeToken = token ?? getStoredToken();
    if (!activeToken) {
      throw new Error("No token provided");
    }

    return await authFetch<User>("/api/auth/me", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${activeToken}`,
      },
    });
  },
};
