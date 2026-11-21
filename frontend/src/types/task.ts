import type { Subtask, Tag } from "./productivity";

export type TaskStatus = "Pending" | "InProgress" | "Completed";
export type TaskPriority = "Low" | "Medium" | "High";

export interface Category {
  id: number;
  user_id: number;
  name: string;
  created_at?: string | null;
}

export interface Task {
  id: number;
  user_id: number;
  category_id: number | null;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string | null;
  due_time?: string | null;
  due_datetime?: string | null;
  timezone?: string | null;
  created_at: string;
  updated_at: string;
  subtasks?: Subtask[];
  tags?: Tag[];
}

export interface CreateTaskRequest {
  title: string;
  description?: string | null;
  category_id?: number | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  due_date?: string | null;
  due_time?: string | null;
  due_datetime?: string | null;
  timezone?: string | null;
}

export type UpdateTaskRequest = Partial<CreateTaskRequest>;
