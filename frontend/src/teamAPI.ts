import { getStoredToken } from "./authAPI";
import type {
  TeamTask,
  TeamTaskCreatePayload,
  TeamTaskUpdatePayload,
  TaskAssignment,
  AssignmentProgressUpdatePayload,
  AssignmentDiscussion,
  AdminReminderPayload,
  TeamAnalytics,
} from "./types/team";

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
      throw new Error("Access denied: You do not have permission for this collaboration resource.");
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
      // ignore
    }
    throw new Error(message);
  }

  if (res.status === 204) {
    return {} as T;
  }

  return res.json();
}

export const teamApi = {
  // Admin Endpoints
  createTeamTask: (data: TeamTaskCreatePayload): Promise<TeamTask> => {
    return request<TeamTask>("/api/admin/team-tasks", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  getTeamTasks: (params?: { search?: string; priority?: string }): Promise<TeamTask[]> => {
    const query = new URLSearchParams();
    if (params?.search) query.append("search", params.search);
    if (params?.priority) query.append("priority", params.priority);
    const qs = query.toString() ? `?${query.toString()}` : "";
    return request<TeamTask[]>(`/api/admin/team-tasks${qs}`);
  },

  getTeamTaskDetail: (taskId: number): Promise<TeamTask> => {
    return request<TeamTask>(`/api/admin/team-tasks/${taskId}`);
  },

  updateTeamTask: (taskId: number, data: TeamTaskUpdatePayload): Promise<TeamTask> => {
    return request<TeamTask>(`/api/admin/team-tasks/${taskId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  deleteTeamTask: (taskId: number): Promise<{ status: string; message: string }> => {
    return request<{ status: string; message: string }>(`/api/admin/team-tasks/${taskId}`, {
      method: "DELETE",
    });
  },

  revokeAssignment: (assignmentId: number): Promise<{ status: string; message: string }> => {
    return request<{ status: string; message: string }>(`/api/admin/assignments/${assignmentId}`, {
      method: "DELETE",
    });
  },

  sendAdminReminder: (taskId: number, payload: AdminReminderPayload): Promise<{ status: string; sent_count: number; message: string }> => {
    return request<{ status: string; sent_count: number; message: string }>(`/api/admin/team-tasks/${taskId}/remind`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  getTeamAnalytics: (): Promise<TeamAnalytics> => {
    return request<TeamAnalytics>("/api/admin/team-analytics");
  },

  // User "Assigned to Me" Endpoints
  getMyAssignedTasks: (params?: { search?: string; status?: string; priority?: string }): Promise<TaskAssignment[]> => {
    const query = new URLSearchParams();
    if (params?.search) query.append("search", params.search);
    if (params?.status && params.status !== "All") query.append("status", params.status);
    if (params?.priority && params.priority !== "All") query.append("priority", params.priority);
    const qs = query.toString() ? `?${query.toString()}` : "";
    return request<TaskAssignment[]>(`/api/assignments/me${qs}`);
  },

  updateAssignmentProgress: (assignmentId: number, data: AssignmentProgressUpdatePayload): Promise<TaskAssignment> => {
    return request<TaskAssignment>(`/api/assignments/${assignmentId}/progress`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  getAssignmentDiscussions: (assignmentId: number): Promise<AssignmentDiscussion[]> => {
    return request<AssignmentDiscussion[]>(`/api/assignments/${assignmentId}/discussions`);
  },

  sendDiscussionMessage: (
    assignmentId: number,
    data: {
      message: string;
      message_type?: string;
      progress_percent?: number | null;
      status_update?: string | null;
    }
  ): Promise<AssignmentDiscussion> => {
    return request<AssignmentDiscussion>(`/api/assignments/${assignmentId}/discussions`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
};
