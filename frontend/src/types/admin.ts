export interface AdminStats {
  total_users: number;
  total_tasks: number;
  pending_tasks: number;
  in_progress_tasks: number;
  completed_tasks: number;
  overdue_tasks: number;
  completion_rate: number;
  tasks_by_priority: {
    High: number;
    Medium: number;
    Low: number;
  };
  tasks_by_status: {
    Pending: number;
    InProgress: number;
    Completed: number;
  };
}

export interface AdminUserItem {
  id: number;
  name: string;
  email: string;
  role: "User" | "Admin";
  created_at: string;
  task_count: number;
  completed_task_count: number;
}

export interface AdminUserListResponse {
  items: AdminUserItem[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface TaskOwnerInfo {
  id: number;
  name: string;
  email: string;
}

export interface AdminTaskItem {
  id: number;
  title: string;
  description: string | null;
  status: "Pending" | "InProgress" | "Completed";
  priority: "Low" | "Medium" | "High";
  due_date: string | null;
  created_at: string;
  owner: TaskOwnerInfo;
}

export interface AdminTaskListResponse {
  items: AdminTaskItem[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}
