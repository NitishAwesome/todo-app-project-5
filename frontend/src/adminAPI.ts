import type {
  AdminStats,
  AdminUserListResponse,
  AdminUserItem,
  AdminTaskListResponse,
} from "./types/admin";
import { getStoredToken } from "./authAPI";

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...((options.headers as Record<string, string>) || {}),
  };

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    if (res.status === 401) {
      throw new Error("Authentication required or session expired. Please log in.");
    }
    if (res.status === 403) {
      throw new Error("Forbidden: Administrator privileges required to access this resource.");
    }

    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (typeof body.detail === "string") {
        message = body.detail;
      } else if (Array.isArray(body.detail) && body.detail.length > 0) {
        message = body.detail
          .map((d: { msg?: string }) => d.msg ?? "")
          .filter(Boolean)
          .join(", ");
      }
    } catch {
      if (res.statusText) message = res.statusText;
    }
    throw new Error(message);
  }

  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

export const adminApi = {
  getStats: async (): Promise<AdminStats> => {
    return await request<AdminStats>("/api/admin/stats");
  },

  getUsers: async (params?: {
    q?: string;
    role?: string;
    page?: number;
    page_size?: number;
    limit?: number;
  }): Promise<AdminUserListResponse> => {
    const query = new URLSearchParams();
    if (params?.q) query.append("q", params.q);
    if (params?.role && params.role !== "all") query.append("role", params.role);
    if (params?.page) query.append("page", String(params.page));
    const pageSize = params?.page_size || params?.limit || 100;
    query.append("page_size", String(pageSize));

    const qs = query.toString();
    return await request<AdminUserListResponse>(`/api/admin/users${qs ? `?${qs}` : ""}`);
  },

  updateUserRole: async (
    userId: number,
    role: "User" | "Admin"
  ): Promise<AdminUserItem> => {
    return await request<AdminUserItem>(`/api/admin/users/${userId}/role`, {
      method: "PATCH",
      body: JSON.stringify({ role }),
    });
  },

  getTasks: async (params?: {
    q?: string;
    status?: string;
    priority?: string;
    page?: number;
    page_size?: number;
  }): Promise<AdminTaskListResponse> => {
    const query = new URLSearchParams();
    if (params?.q) query.append("q", params.q);
    if (params?.status && params.status !== "all") query.append("status", params.status);
    if (params?.priority && params.priority !== "all") query.append("priority", params.priority);
    if (params?.page) query.append("page", String(params.page));
    if (params?.page_size) query.append("page_size", String(params.page_size));

    const qs = query.toString();
    return await request<AdminTaskListResponse>(`/api/admin/tasks${qs ? `?${qs}` : ""}`);
  },
};
