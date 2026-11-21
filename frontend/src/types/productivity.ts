export interface Subtask {
  id: number;
  task_id: number;
  user_id: number;
  title: string;
  is_completed: boolean;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface Tag {
  id: number;
  user_id: number;
  name: string;
  color: string;
  created_at: string;
}

export interface Reminder {
  id: number;
  task_id: number;
  user_id: number;
  remind_at: string;
  is_sent: boolean;
  created_at: string;
}

export interface Notification {
  id: number;
  user_id: number;
  task_id?: number | null;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

export interface TaskActivityLog {
  id: number;
  task_id: number;
  user_id: number;
  action: string;
  details?: string | null;
  created_at: string;
}

export interface UserPreference {
  id: number;
  user_id: number;
  theme: "light" | "dark" | "system";
  default_task_view: "dashboard" | "tasks" | "kanban" | "calendar";
  notifications_enabled: boolean;
  timezone: string;
  updated_at: string;
}

export interface UserPreferenceUpdate {
  theme?: "light" | "dark" | "system";
  default_task_view?: "dashboard" | "tasks" | "kanban" | "calendar";
  notifications_enabled?: boolean;
  timezone?: string;
}
