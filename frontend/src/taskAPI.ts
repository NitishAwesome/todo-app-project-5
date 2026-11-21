import type { Task, CreateTaskRequest, UpdateTaskRequest } from "./types/task";

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

let mockTasks: Task[] = [
  {
    id: 1,
    user_id: 1,
    category_id: 1,
    title: "Configure PostgreSQL / MySQL database tables",
    description: "Verify schemas and seed initial task data.",
    status: "Pending",
    priority: "Low",
    due_date: "2026-11-28",
    created_at: "2026-11-18T10:00:00Z",
    updated_at: "2026-11-18T12:00:00Z",
  },
  {
    id: 2,
    user_id: 1,
    category_id: 2,
    title: "Connect frontend with backend API",
    description: "Integrate task fetching, creation, and status updates with backend endpoints.",
    status: "Pending",
    priority: "Medium",
    due_date: "2026-11-25",
    created_at: "2026-11-19T14:30:00Z",
    updated_at: "2026-11-20T08:00:00Z",
  },
  {
    id: 3,
    user_id: 1,
    category_id: 2,
    title: "Build frontend Task Display components",
    description: "Create TaskWorkspace, TaskList, TaskCard, and filter toolbar.",
    status: "InProgress",
    priority: "High",
    due_date: "2026-11-22",
    created_at: "2026-11-20T09:00:00Z",
    updated_at: "2026-11-20T09:00:00Z",
  },
  {
    id: 4,
    user_id: 1,
    category_id: 3,
    title: "Set up project repository & folder structure",
    description: "Initialize Git repository, README, and project directory structure.",
    status: "Completed",
    priority: "High",
    due_date: "2026-11-20",
    created_at: "2026-11-20T11:00:00Z",
    updated_at: "2026-11-20T11:00:00Z",
  },
];

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (typeof body.detail === "string") message = body.detail;
    } catch {
      // Keep the default message when the body is not JSON.
    }
    throw new Error(message);
  }

  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

export const taskApi = {
  getAll: async (): Promise<Task[]> => {
    try {
      return await request<Task[]>("/api/tasks/");
    } catch {
      console.warn("Backend API unavailable. Displaying preview mock data.");
      return [...mockTasks];
    }
  },

  getById: async (id: number): Promise<Task> => {
    try {
      return await request<Task>(`/api/tasks/${id}`);
    } catch {
      const found = mockTasks.find((t) => t.id === id);
      if (!found) throw new Error("Task not found");
      return found;
    }
  },

  create: async (data: CreateTaskRequest): Promise<Task> => {
    try {
      return await request<Task>("/api/tasks/", {
        method: "POST",
        body: JSON.stringify(data),
      });
    } catch {
      const newTask: Task = {
        id: Date.now(),
        user_id: 1,
        category_id: data.category_id ?? null,
        title: data.title,
        description: data.description ?? null,
        status: data.status ?? "Pending",
        priority: data.priority ?? "Medium",
        due_date: data.due_date ?? null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      mockTasks.push(newTask);
      return newTask;
    }
  },

  update: async (id: number, data: UpdateTaskRequest): Promise<Task> => {
    try {
      return await request<Task>(`/api/tasks/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
    } catch {
      const index = mockTasks.findIndex((t) => t.id === id);
      if (index === -1) throw new Error("Task not found");
      mockTasks[index] = { ...mockTasks[index], ...data, updated_at: new Date().toISOString() };
      return mockTasks[index];
    }
  },

  remove: async (id: number): Promise<void> => {
    try {
      await request<void>(`/api/tasks/${id}`, { method: "DELETE" });
    } catch {
      mockTasks = mockTasks.filter((t) => t.id !== id);
    }
  },
};
