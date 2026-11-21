import { getStoredToken } from "./authAPI";
import type {
  Subtask,
  Tag,
  Reminder,
  Notification,
  TaskActivityLog,
  UserPreference,
  UserPreferenceUpdate,
} from "./types/productivity";

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

export const subtaskApi = {
  getForTask: async (taskId: number): Promise<Subtask[]> => {
    return await request<Subtask[]>(`/api/tasks/${taskId}/subtasks`);
  },

  create: async (taskId: number, title: string): Promise<Subtask> => {
    return await request<Subtask>(`/api/tasks/${taskId}/subtasks`, {
      method: "POST",
      body: JSON.stringify({ title }),
    });
  },

  toggle: async (subtaskId: number): Promise<Subtask> => {
    return await request<Subtask>(`/api/subtasks/${subtaskId}/toggle`, {
      method: "PATCH",
    });
  },

  update: async (
    subtaskId: number,
    data: { title?: string; is_completed?: boolean; position?: number }
  ): Promise<Subtask> => {
    return await request<Subtask>(`/api/subtasks/${subtaskId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  delete: async (subtaskId: number): Promise<void> => {
    await request<void>(`/api/subtasks/${subtaskId}`, {
      method: "DELETE",
    });
  },
};

export const tagApi = {
  getAll: async (): Promise<Tag[]> => {
    return await request<Tag[]>("/api/tags/");
  },

  create: async (name: string, color: string = "#3b82f6"): Promise<Tag> => {
    return await request<Tag>("/api/tags/", {
      method: "POST",
      body: JSON.stringify({ name, color }),
    });
  },

  update: async (
    id: number,
    data: { name?: string; color?: string }
  ): Promise<Tag> => {
    return await request<Tag>(`/api/tags/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  delete: async (id: number): Promise<void> => {
    await request<void>(`/api/tags/${id}`, {
      method: "DELETE",
    });
  },

  getForTask: async (taskId: number): Promise<Tag[]> => {
    return await request<Tag[]>(`/api/tasks/${taskId}/tags`);
  },

  assignToTask: async (taskId: number, tagIds: number[]): Promise<Tag[]> => {
    return await request<Tag[]>(`/api/tasks/${taskId}/tags`, {
      method: "POST",
      body: JSON.stringify({ tag_ids: tagIds }),
    });
  },
};

export const reminderApi = {
  getAll: async (): Promise<Reminder[]> => {
    return await request<Reminder[]>("/api/reminders/");
  },

  create: async (taskId: number, remindAt: string): Promise<Reminder> => {
    return await request<Reminder>("/api/reminders/", {
      method: "POST",
      body: JSON.stringify({ task_id: taskId, remind_at: remindAt }),
    });
  },

  delete: async (id: number): Promise<void> => {
    await request<void>(`/api/reminders/${id}`, {
      method: "DELETE",
    });
  },

  processDue: async (): Promise<{ processed: number; generated_notifications: number }> => {
    return await request<{ processed: number; generated_notifications: number }>(
      "/api/reminders/process-due",
      {
        method: "POST",
      }
    );
  },
};

export const notificationApi = {
  getAll: async (): Promise<Notification[]> => {
    return await request<Notification[]>("/api/notifications/");
  },

  getUnreadCount: async (): Promise<number> => {
    const res = await request<{ unread_count: number }>("/api/notifications/unread-count");
    return res.unread_count;
  },

  markRead: async (id: number): Promise<Notification> => {
    return await request<Notification>(`/api/notifications/${id}/read`, {
      method: "PATCH",
    });
  },

  markAllRead: async (): Promise<void> => {
    await request<void>("/api/notifications/read-all", {
      method: "PATCH",
    });
  },

  delete: async (id: number): Promise<void> => {
    await request<void>(`/api/notifications/${id}`, {
      method: "DELETE",
    });
  },
};

export const activityApi = {
  getForTask: async (taskId: number): Promise<TaskActivityLog[]> => {
    return await request<TaskActivityLog[]>(`/api/tasks/${taskId}/activity`);
  },
};

export const preferenceApi = {
  get: async (): Promise<UserPreference> => {
    return await request<UserPreference>("/api/preferences/");
  },

  update: async (data: UserPreferenceUpdate): Promise<UserPreference> => {
    return await request<UserPreference>("/api/preferences/", {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },
};
