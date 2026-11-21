import type { Task, CreateTaskRequest, UpdateTaskRequest } from "./types/task";

// TEMP: replace this request helper with the shared API client once it is available.
const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      // FastAPI sends errors as { "detail": "..." }.
      const body = await res.json();
      if (typeof body.detail === "string") message = body.detail;
    } catch {
      // Keep the default message when the body is not JSON.
    }
    throw new Error(message);
  }

  // Some responses (for example DELETE) may have an empty body.
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

export const taskApi = {
  getAll: () => request<Task[]>("/api/tasks/"),

  getById: (id: number) => request<Task>(`/api/tasks/${id}`),

  create: (data: CreateTaskRequest) =>
    request<Task>("/api/tasks/", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: number, data: UpdateTaskRequest) =>
    request<Task>(`/api/tasks/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  remove: (id: number) =>
    request<void>(`/api/tasks/${id}`, { method: "DELETE" }),
};