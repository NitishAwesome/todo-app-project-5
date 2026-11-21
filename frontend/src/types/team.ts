export interface AssignmentDiscussion {
  id: number;
  assignment_id: number;
  sender_id: number;
  sender_role: string;
  sender_name?: string;
  message_type: 'comment' | 'inquiry' | 'progress_update' | 'blocker_report' | 'reminder' | 'system';
  message: string;
  progress_percent?: number | null;
  status_update?: string | null;
  is_read: boolean;
  created_at: string;
}

export interface TaskAssignment {
  id: number;
  team_task_id: number;
  user_id: number;
  user_name?: string;
  user_email?: string;
  status: 'Pending' | 'InProgress' | 'Completed';
  progress_percent: number;
  assigned_at: string;
  started_at?: string | null;
  completed_at?: string | null;
  last_activity_at?: string | null;
  notes?: string | null;
  blockers?: string | null;
  checklist_state?: any;

  // Embedded task fields
  task_title?: string;
  task_description?: string;
  task_instructions?: string;
  task_priority?: 'Low' | 'Medium' | 'High';
  task_due_date?: string | null;
  task_due_time?: string | null;
  task_due_datetime?: string | null;
  task_timezone?: string;
  task_checklist?: any;
  admin_name?: string;
  admin_email?: string;

  discussions?: AssignmentDiscussion[];
}

export interface TeamTask {
  id: number;
  admin_id: number;
  admin_name?: string;
  admin_email?: string;
  title: string;
  description?: string | null;
  instructions?: string | null;
  priority: 'Low' | 'Medium' | 'High';
  due_date?: string | null;
  due_time?: string | null;
  due_datetime?: string | null;
  timezone: string;
  checklist?: any;
  created_at: string;
  updated_at: string;

  total_assignments: number;
  pending_count: number;
  in_progress_count: number;
  completed_count: number;
  overdue_count: number;
  completion_rate: number;

  assignments?: TaskAssignment[];
}

export interface TeamTaskCreatePayload {
  title: string;
  description?: string;
  instructions?: string;
  priority: 'Low' | 'Medium' | 'High';
  due_date?: string | null;
  due_time?: string | null;
  due_datetime?: string | null;
  timezone?: string;
  assignee_ids: number[];
  checklist?: string[];
  send_immediate_notification?: boolean;
}

export interface TeamTaskUpdatePayload {
  title?: string;
  description?: string;
  instructions?: string;
  priority?: 'Low' | 'Medium' | 'High';
  due_date?: string | null;
  due_time?: string | null;
  due_datetime?: string | null;
  timezone?: string;
  checklist?: string[];
  add_assignee_ids?: number[];
  remove_assignee_ids?: number[];
}

export interface AssignmentProgressUpdatePayload {
  status?: 'Pending' | 'InProgress' | 'Completed';
  progress_percent?: number;
  notes?: string;
  blockers?: string;
  checklist_state?: any;
}

export interface AdminReminderPayload {
  recipient_filter: 'all' | 'selected' | 'incomplete' | 'overdue';
  selected_user_ids?: number[];
  message: string;
}

export interface TeamAnalytics {
  total_team_tasks: number;
  total_assignments: number;
  active_assignments: number;
  completed_assignments: number;
  pending_assignments: number;
  overdue_assignments: number;
  overall_completion_rate: number;
  members_breakdown: Array<{
    user_id: number;
    name: string;
    email: string;
    role: string;
    assigned_count: number;
    completed_count: number;
    completion_rate: number;
    in_progress_count: number;
    overdue_count: number;
  }>;
}
