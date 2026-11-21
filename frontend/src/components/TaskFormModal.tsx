import { useEffect, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { taskApi, categoryApi } from "../taskAPI";
import { subtaskApi, tagApi, reminderApi, activityApi } from "../productivityAPI";
import type { Task, TaskStatus, Category } from "../types/task";
import type { Subtask, Tag, Reminder, TaskActivityLog } from "../types/productivity";
import "./TaskFormModal.css";

// Validation rules
const taskSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required")
    .max(255, "Title must be 255 characters or less"),
  description: z.string().optional(),
  category_id: z
    .union([z.number(), z.string().transform((v) => (v === "" || v === "none" ? null : Number(v)))])
    .nullable()
    .optional(),
  priority: z.enum(["Low", "Medium", "High"]),
  due_date: z.string().optional(),
  due_time: z.string().optional(),
  status: z.enum(["Pending", "InProgress", "Completed"]),
});

type FormValues = z.infer<typeof taskSchema>;

interface TaskFormModalProps {
  open: boolean;
  mode: "add" | "edit";
  task?: Task | null;
  initialDueDate?: string | null;
  initialStatus?: TaskStatus;
  onClose: () => void;
  onSaved: () => void;
}

const emptyValues: FormValues = {
  title: "",
  description: "",
  category_id: null,
  priority: "Medium",
  due_date: "",
  due_time: "",
  status: "Pending",
};

const TAG_COLOR_PALETTE = [
  "#3b82f6", // Blue
  "#10b981", // Green
  "#f59e0b", // Amber
  "#ef4444", // Red
  "#8b5cf6", // Purple
  "#ec4899", // Pink
  "#06b6d4", // Cyan
  "#64748b", // Slate
];

function toFormValues(task?: Task | null): FormValues {
  if (!task) return emptyValues;
  return {
    title: task.title,
    description: task.description ?? "",
    category_id: task.category_id ?? null,
    priority: task.priority,
    due_date: task.due_date ? task.due_date.slice(0, 10) : "",
    due_time: task.due_time ? String(task.due_time).slice(0, 5) : "",
    status: task.status,
  };
}

export default function TaskFormModal({
  open,
  mode,
  task,
  initialDueDate,
  initialStatus,
  onClose,
  onSaved,
}: TaskFormModalProps) {
  const [activeModalTab, setActiveModalTab] = useState<
    "details" | "subtasks" | "tags" | "reminder" | "activity"
  >("details");

  const [apiError, setApiError] = useState("");
  const [success, setSuccess] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);

  // Quick inline category creator
  const [showNewCatInput, setShowNewCatInput] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatError, setNewCatError] = useState("");
  const [newCatSaving, setNewCatSaving] = useState(false);

  // Step 7: Subtasks state
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [subtaskLoading, setSubtaskLoading] = useState(false);

  // Step 7: Tags state
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [showNewTagInput, setShowNewTagInput] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState(TAG_COLOR_PALETTE[0]);
  const [tagSaving, setTagSaving] = useState(false);

  // Step 7: Reminder state
  const [existingReminder, setExistingReminder] = useState<Reminder | null>(null);
  const [reminderDateTime, setReminderDateTime] = useState("");
  const [reminderSaving, setReminderSaving] = useState(false);
  const [reminderMessage, setReminderMessage] = useState("");

  // Step 7: Activity history state
  const [activityLogs, setActivityLogs] = useState<TaskActivityLog[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: emptyValues,
  });

  // Close modal on Escape key press
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, isSubmitting, onClose]);

  // Load Categories & Tags
  const loadInitialData = useCallback(async () => {
    try {
      setCategoriesLoading(true);
      const [cats, tags] = await Promise.all([
        categoryApi.getAll().catch(() => [] as Category[]),
        tagApi.getAll().catch(() => [] as Tag[]),
      ]);
      setCategories(cats);
      setAllTags(tags);
    } catch (err) {
      console.error("Failed to load modal dependencies:", err);
    } finally {
      setCategoriesLoading(false);
    }
  }, []);

  // Load Task-specific subtasks, assigned tags, reminders & activity logs
  const loadTaskExtraData = useCallback(async (taskId: number) => {
    try {
      setSubtaskLoading(true);
      const [fetchedSubtasks, taskTags, allReminders] = await Promise.all([
        subtaskApi.getForTask(taskId).catch(() => [] as Subtask[]),
        tagApi.getForTask(taskId).catch(() => [] as Tag[]),
        reminderApi.getAll().catch(() => [] as Reminder[]),
      ]);
      setSubtasks(fetchedSubtasks);
      setSelectedTagIds(taskTags.map((t) => t.id));

      const foundReminder = allReminders.find((r) => r.task_id === taskId);
      if (foundReminder) {
        setExistingReminder(foundReminder);
        setReminderDateTime(foundReminder.remind_at.slice(0, 16));
      } else {
        setExistingReminder(null);
        setReminderDateTime("");
      }
    } catch (err) {
      console.error("Failed to load task relations:", err);
    } finally {
      setSubtaskLoading(false);
    }
  }, []);

  // Reset or initialize modal
  useEffect(() => {
    if (open) {
      setActiveModalTab("details");
      setApiError("");
      setSuccess("");
      setShowNewCatInput(false);
      setNewCatName("");
      setNewCatError("");
      setShowNewTagInput(false);
      setNewTagName("");
      setReminderMessage("");

      loadInitialData();

      if (mode === "edit" && task) {
        reset(toFormValues(task));
        loadTaskExtraData(task.id);
      } else {
        reset({
          ...emptyValues,
          due_date: initialDueDate ?? "",
          status: initialStatus ?? "Pending",
        });
        setSubtasks([]);
        setSelectedTagIds([]);
        setExistingReminder(null);
        setReminderDateTime("");
        setActivityLogs([]);
      }
    }
  }, [open, mode, task, initialDueDate, initialStatus, reset, loadInitialData, loadTaskExtraData]);

  // Load activity history when switching to activity tab
  useEffect(() => {
    if (open && activeModalTab === "activity" && task?.id) {
      setActivityLoading(true);
      activityApi
        .getForTask(task.id)
        .then((logs) => setActivityLogs(logs))
        .catch((err) => console.error("Failed to fetch activity logs:", err))
        .finally(() => setActivityLoading(false));
    }
  }, [open, activeModalTab, task?.id]);

  // Handle inline category creation
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) {
      setNewCatError("Category name cannot be empty");
      return;
    }
    setNewCatError("");
    setNewCatSaving(true);
    try {
      const created = await categoryApi.create(newCatName.trim());
      setCategories((prev) => [...prev, created]);
      setValue("category_id", created.id);
      setNewCatName("");
      setShowNewCatInput(false);
    } catch (err) {
      setNewCatError(err instanceof Error ? err.message : "Failed to create category");
    } finally {
      setNewCatSaving(false);
    }
  };

  // Handle Subtask Actions
  const handleAddSubtask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim() || !task?.id) return;
    try {
      const created = await subtaskApi.create(task.id, newSubtaskTitle.trim());
      setSubtasks((prev) => [...prev, created]);
      setNewSubtaskTitle("");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to add subtask");
    }
  };

  const handleToggleSubtask = async (subtaskId: number) => {
    try {
      const updated = await subtaskApi.toggle(subtaskId);
      setSubtasks((prev) => prev.map((s) => (s.id === subtaskId ? updated : s)));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update subtask");
    }
  };

  const handleDeleteSubtask = async (subtaskId: number) => {
    try {
      await subtaskApi.delete(subtaskId);
      setSubtasks((prev) => prev.filter((s) => s.id !== subtaskId));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete subtask");
    }
  };

  // Handle Tag Actions
  const handleToggleTag = (tagId: number) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

  const handleCreateTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagName.trim()) return;
    setTagSaving(true);
    try {
      const cleanName = newTagName.trim().replace(/^#/, "");
      const created = await tagApi.create(cleanName, newTagColor);
      setAllTags((prev) => [...prev, created]);
      setSelectedTagIds((prev) => [...prev, created.id]);
      setNewTagName("");
      setShowNewTagInput(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to create tag");
    } finally {
      setTagSaving(false);
    }
  };

  // Handle Reminder Actions
  const handleSaveReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task?.id || !reminderDateTime) return;
    setReminderSaving(true);
    setReminderMessage("");
    try {
      const created = await reminderApi.create(task.id, reminderDateTime);
      setExistingReminder(created);
      setReminderMessage("Reminder scheduled successfully.");
      setTimeout(() => setReminderMessage(""), 3000);
    } catch (err) {
      setReminderMessage(err instanceof Error ? err.message : "Failed to set reminder");
    } finally {
      setReminderSaving(false);
    }
  };

  const handleDeleteReminder = async () => {
    if (!existingReminder) return;
    try {
      setReminderSaving(true);
      await reminderApi.delete(existingReminder.id);
      setExistingReminder(null);
      setReminderDateTime("");
      setReminderMessage("Reminder removed.");
      setTimeout(() => setReminderMessage(""), 3000);
    } catch (err) {
      setReminderMessage(err instanceof Error ? err.message : "Failed to remove reminder");
    } finally {
      setReminderSaving(false);
    }
  };

  // Form Submit
  const onSubmit = async (values: FormValues) => {
    setApiError("");
    const parsedCategoryId =
      values.category_id && !isNaN(Number(values.category_id))
        ? Number(values.category_id)
        : null;

    const payload = {
      title: values.title.trim(),
      description: values.description?.trim() ? values.description.trim() : null,
      category_id: parsedCategoryId,
      priority: values.priority,
      due_date: values.due_date ? values.due_date : null,
      due_time: values.due_time ? (values.due_time.length === 5 ? `${values.due_time}:00` : values.due_time) : null,
    };

    try {
      let savedTaskId: number;
      if (mode === "edit" && task) {
        await taskApi.update(task.id, { ...payload, status: values.status });
        savedTaskId = task.id;
        setSuccess("Task updated successfully.");
      } else {
        const created = await taskApi.create({
          ...payload,
          status: values.status || "Pending",
        });
        savedTaskId = created.id;
        setSuccess("Task created successfully.");
      }

      // Sync tags if any were selected
      if (selectedTagIds.length > 0) {
        await tagApi.assignToTask(savedTaskId, selectedTagIds).catch(() => {});
      }

      onSaved();
      setTimeout(onClose, 600);
    } catch (err) {
      setApiError(
        err instanceof Error ? err.message : "Something went wrong. Please try again."
      );
    }
  };

  if (!open) return null;

  const isEdit = mode === "edit";
  const completedSubtasksCount = subtasks.filter((s) => s.is_completed).length;

  return (
    <div className="tfm-overlay" role="presentation" onClick={() => !isSubmitting && onClose()}>
      <div
        className="tfm-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tfm-heading"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="tfm-header">
          <div className="tfm-header-icon" aria-hidden="true">
            <svg fill="none" viewBox="0 0 24 24" strokeWidth="2.2" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
              />
            </svg>
          </div>
          <div>
            <h2 id="tfm-heading" className="tfm-heading">
              {isEdit ? "Edit Task" : "Create New Task"}
            </h2>
            <p className="tfm-subheading">
              {isEdit
                ? "Update task details, checklist, tags, and reminders."
                : "Add a new task to your personal Planova workspace."}
            </p>
          </div>

          <button
            type="button"
            className="tfm-close-btn"
            onClick={onClose}
            aria-label="Close dialog"
            disabled={isSubmitting}
          >
            &times;
          </button>
        </div>

        {/* Modal Tabs for Edit Mode */}
        {isEdit && (
          <div className="tfm-nav-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={activeModalTab === "details"}
              className={`tfm-tab-btn ${activeModalTab === "details" ? "active" : ""}`}
              onClick={() => setActiveModalTab("details")}
            >
              <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" style={{ width: "15px", height: "15px" }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
              <span>Details</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeModalTab === "subtasks"}
              className={`tfm-tab-btn ${activeModalTab === "subtasks" ? "active" : ""}`}
              onClick={() => setActiveModalTab("subtasks")}
            >
              <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" style={{ width: "15px", height: "15px" }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Subtasks</span>
              {subtasks.length > 0 && (
                <span className="tfm-tab-pill">
                  {completedSubtasksCount}/{subtasks.length}
                </span>
              )}
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeModalTab === "tags"}
              className={`tfm-tab-btn ${activeModalTab === "tags" ? "active" : ""}`}
              onClick={() => setActiveModalTab("tags")}
            >
              <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" style={{ width: "15px", height: "15px" }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
              </svg>
              <span>Tags</span>
              {selectedTagIds.length > 0 && (
                <span className="tfm-tab-pill">{selectedTagIds.length}</span>
              )}
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeModalTab === "reminder"}
              className={`tfm-tab-btn ${activeModalTab === "reminder" ? "active" : ""}`}
              onClick={() => setActiveModalTab("reminder")}
            >
              <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" style={{ width: "15px", height: "15px" }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Reminder</span>
              {existingReminder && <span className="tfm-tab-dot" />}
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeModalTab === "activity"}
              className={`tfm-tab-btn ${activeModalTab === "activity" ? "active" : ""}`}
              onClick={() => setActiveModalTab("activity")}
            >
              <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" style={{ width: "15px", height: "15px" }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
              </svg>
              <span>Activity</span>
            </button>
          </div>
        )}

        {/* Alerts */}
        {apiError && (
          <div className="tfm-alert tfm-alert-error" role="alert">
            <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
              />
            </svg>
            <span>{apiError}</span>
          </div>
        )}

        {success && (
          <div className="tfm-alert tfm-alert-success" role="status">
            <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
            <span>{success}</span>
          </div>
        )}

        {/* ================= TAB 1: DETAILS ================= */}
        {activeModalTab === "details" && (
          <form onSubmit={handleSubmit(onSubmit)} className="tfm-form" noValidate>
            {/* Title */}
            <div className="tfm-group">
              <label htmlFor="tfm-title" className="tfm-label">
                Task Title <span className="tfm-req">*</span>
              </label>
              <input
                id="tfm-title"
                type="text"
                placeholder="e.g., Prepare quarterly budget presentation"
                className={`tfm-input ${errors.title ? "tfm-input-error" : ""}`}
                {...register("title")}
                aria-invalid={errors.title ? "true" : "false"}
              />
              {errors.title && <p className="tfm-error-text">{errors.title.message}</p>}
            </div>

            {/* Description */}
            <div className="tfm-group">
              <label htmlFor="tfm-description" className="tfm-label">
                Description <span className="tfm-optional">(Optional)</span>
              </label>
              <textarea
                id="tfm-description"
                rows={3}
                placeholder="Add notes, specifications, or reference details..."
                className="tfm-textarea"
                {...register("description")}
              />
            </div>

            {/* Category Select + Inline Creator */}
            <div className="tfm-group">
              <div className="tfm-label-row">
                <label htmlFor="tfm-category" className="tfm-label">
                  Category
                </label>
                {!showNewCatInput && (
                  <button
                    type="button"
                    className="tfm-link-btn"
                    onClick={() => setShowNewCatInput(true)}
                  >
                    + New Category
                  </button>
                )}
              </div>

              {showNewCatInput ? (
                <div className="tfm-inline-creator">
                  <input
                    type="text"
                    placeholder="New category name"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    className="tfm-input tfm-input-sm"
                    autoFocus
                  />
                  <button
                    type="button"
                    className="btn btn-primary tfm-btn-sm"
                    onClick={handleCreateCategory}
                    disabled={newCatSaving}
                  >
                    {newCatSaving ? "Saving..." : "Add"}
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary tfm-btn-sm"
                    onClick={() => {
                      setShowNewCatInput(false);
                      setNewCatName("");
                      setNewCatError("");
                    }}
                  >
                    Cancel
                  </button>
                  {newCatError && <p className="tfm-error-text">{newCatError}</p>}
                </div>
              ) : (
                <select id="tfm-category" className="tfm-select" {...register("category_id")}>
                  <option value="none">-- No Category --</option>
                  {categoriesLoading && <option disabled>Loading categories...</option>}
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Priority & Status in two columns */}
            <div className="tfm-row-2">
              <div className="tfm-group">
                <label htmlFor="tfm-priority" className="tfm-label">
                  Priority
                </label>
                <select id="tfm-priority" className="tfm-select" {...register("priority")}>
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>

              <div className="tfm-group">
                <label htmlFor="tfm-status" className="tfm-label">
                  Status
                </label>
                <select id="tfm-status" className="tfm-select" {...register("status")}>
                  <option value="Pending">Pending</option>
                  <option value="InProgress">In Progress</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
            </div>

            {/* Due Date & Exact Due Time */}
            <div className="tfm-row-2">
              <div className="tfm-group">
                <label htmlFor="tfm-due-date" className="tfm-label">
                  Due Date
                </label>
                <input
                  id="tfm-due-date"
                  type="date"
                  className="tfm-input"
                  {...register("due_date")}
                />
              </div>

              <div className="tfm-group">
                <label htmlFor="tfm-due-time" className="tfm-label">
                  Due Time <span className="tfm-optional">(Optional)</span>
                </label>
                <input
                  id="tfm-due-time"
                  type="time"
                  className="tfm-input"
                  {...register("due_time")}
                />
              </div>
            </div>

            {/* Quick Tag Selector in Add Mode */}
            {!isEdit && allTags.length > 0 && (
              <div className="tfm-group">
                <label className="tfm-label">Assign Tags</label>
                <div className="tfm-tags-selector">
                  {allTags.map((tag) => {
                    const isSelected = selectedTagIds.includes(tag.id);
                    return (
                      <button
                        key={tag.id}
                        type="button"
                        className={`tfm-tag-pill ${isSelected ? "selected" : ""}`}
                        style={{
                          backgroundColor: isSelected ? tag.color : `${tag.color}18`,
                          color: isSelected ? "#ffffff" : tag.color,
                          borderColor: tag.color,
                        }}
                        onClick={() => handleToggleTag(tag.id)}
                      >
                        #{tag.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="tfm-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                {isSubmitting ? "Saving Task..." : isEdit ? "Save Changes" : "Create Task"}
              </button>
            </div>
          </form>
        )}

        {/* ================= TAB 2: SUBTASKS & CHECKLIST ================= */}
        {activeModalTab === "subtasks" && (
          <div className="tfm-subtasks-panel">
            {/* Progress Bar */}
            <div className="subtask-progress-box">
              <div className="subtask-progress-meta">
                <span className="subtask-progress-title">Checklist Progress</span>
                <span className="subtask-progress-pct">
                  {subtasks.length > 0
                    ? `${Math.round((completedSubtasksCount / subtasks.length) * 100)}% (${completedSubtasksCount}/${subtasks.length})`
                    : "0 subtasks"}
                </span>
              </div>
              <div className="subtask-progress-track">
                <div
                  className="subtask-progress-fill"
                  style={{
                    width: `${subtasks.length > 0 ? (completedSubtasksCount / subtasks.length) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>

            {/* Subtasks List */}
            <div className="subtask-list">
              {subtasks.length === 0 ? (
                <div className="subtask-empty">
                  <p>No subtasks yet. Add steps or checklist items below.</p>
                </div>
              ) : (
                subtasks.map((sub) => (
                  <div
                    key={sub.id}
                    className={`subtask-item ${sub.is_completed ? "is-done" : ""}`}
                  >
                    <label className="subtask-label">
                      <input
                        type="checkbox"
                        checked={sub.is_completed}
                        onChange={() => handleToggleSubtask(sub.id)}
                      />
                      <span className="subtask-title-text">{sub.title}</span>
                    </label>
                    <button
                      type="button"
                      className="subtask-del-btn"
                      onClick={() => handleDeleteSubtask(sub.id)}
                      title="Delete subtask"
                    >
                      &times;
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Add Subtask Form */}
            <form onSubmit={handleAddSubtask} className="subtask-add-row">
              <input
                type="text"
                placeholder="Add a new checklist step..."
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                className="tfm-input tfm-input-sm"
              />
              <button
                type="submit"
                className="btn btn-primary tfm-btn-sm"
                disabled={!newSubtaskTitle.trim()}
              >
                + Add
              </button>
            </form>
          </div>
        )}

        {/* ================= TAB 3: TAGS ================= */}
        {activeModalTab === "tags" && (
          <div className="tfm-tags-panel">
            <p className="tfm-panel-desc">
              Select tags to assign to this task. Colored tags appear as badges on cards.
            </p>

            <div className="tfm-tags-grid">
              {allTags.map((tag) => {
                const isSelected = selectedTagIds.includes(tag.id);
                return (
                  <button
                    key={tag.id}
                    type="button"
                    className={`tfm-tag-item ${isSelected ? "selected" : ""}`}
                    style={{
                      borderColor: tag.color,
                      backgroundColor: isSelected ? tag.color : `${tag.color}15`,
                      color: isSelected ? "#ffffff" : tag.color,
                    }}
                    onClick={async () => {
                      handleToggleTag(tag.id);
                      if (task?.id) {
                        const nextIds = selectedTagIds.includes(tag.id)
                          ? selectedTagIds.filter((id) => id !== tag.id)
                          : [...selectedTagIds, tag.id];
                        await tagApi.assignToTask(task.id, nextIds);
                      }
                    }}
                  >
                    <span>#{tag.name}</span>
                    {isSelected && (
                      <svg fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" style={{ width: "13px", height: "13px", display: "inline-block" }}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Create New Tag */}
            {showNewTagInput ? (
              <form onSubmit={handleCreateTag} className="new-tag-form">
                <input
                  type="text"
                  placeholder="Tag name (e.g., #Testing)"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  className="tfm-input tfm-input-sm"
                  autoFocus
                />
                <div className="tag-color-palette">
                  {TAG_COLOR_PALETTE.map((c) => (
                    <button
                      key={c}
                      type="button"
                      className={`color-swatch ${newTagColor === c ? "swatch-active" : ""}`}
                      style={{ backgroundColor: c }}
                      onClick={() => setNewTagColor(c)}
                    />
                  ))}
                </div>
                <div className="new-tag-actions">
                  <button
                    type="submit"
                    className="btn btn-primary tfm-btn-sm"
                    disabled={tagSaving || !newTagName.trim()}
                  >
                    {tagSaving ? "Creating..." : "Save Tag"}
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary tfm-btn-sm"
                    onClick={() => setShowNewTagInput(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <button
                type="button"
                className="btn btn-secondary tfm-btn-sm new-tag-trigger"
                onClick={() => setShowNewTagInput(true)}
              >
                + Create Custom Tag
              </button>
            )}
          </div>
        )}

        {/* ================= TAB 4: REMINDER ================= */}
        {activeModalTab === "reminder" && (
          <div className="tfm-reminder-panel">
            <p className="tfm-panel-desc">
              Schedule an in-app reminder. When the scheduled date/time arrives, Planova sends an alert banner to your notification bell.
            </p>

            {reminderMessage && (
              <div className="tfm-reminder-alert">{reminderMessage}</div>
            )}

            {existingReminder && (
              <div className="existing-reminder-card">
                <div className="existing-reminder-icon">⏰</div>
                <div className="existing-reminder-meta">
                  <span className="existing-reminder-title">Active Scheduled Reminder</span>
                  <span className="existing-reminder-time">
                    {new Date(existingReminder.remind_at).toLocaleString(undefined, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </span>
                </div>
                <button
                  type="button"
                  className="btn-cancel-reminder"
                  onClick={handleDeleteReminder}
                  disabled={reminderSaving}
                  title="Remove reminder"
                >
                  Cancel
                </button>
              </div>
            )}

            <form onSubmit={handleSaveReminder} className="reminder-form">
              <label className="tfm-label" htmlFor="reminder-datetime">
                {existingReminder ? "Reschedule Reminder" : "Set Alert Date & Time"}
              </label>
              <input
                id="reminder-datetime"
                type="datetime-local"
                value={reminderDateTime}
                onChange={(e) => setReminderDateTime(e.target.value)}
                className="tfm-input"
              />
              <button
                type="submit"
                className="btn btn-primary tfm-btn-sm"
                disabled={reminderSaving || !reminderDateTime}
              >
                {reminderSaving
                  ? "Saving..."
                  : existingReminder
                  ? "Update Reminder"
                  : "Schedule Reminder"}
              </button>
            </form>
          </div>
        )}

        {/* ================= TAB 5: ACTIVITY LOG ================= */}
        {activeModalTab === "activity" && (
          <div className="tfm-activity-panel">
            <p className="tfm-panel-desc">
              Audit trail of actions and milestones recorded for this task.
            </p>

            {activityLoading ? (
              <div className="tfm-activity-loading">Loading activity history...</div>
            ) : activityLogs.length === 0 ? (
              <div className="tfm-activity-empty">
                <p>No activity logs recorded yet.</p>
              </div>
            ) : (
              <div className="activity-timeline">
                {activityLogs.map((log) => (
                  <div key={log.id} className="activity-item">
                    <div className="activity-dot" />
                    <div className="activity-content">
                      <div className="activity-meta">
                        <span className="activity-action-badge">{log.action}</span>
                        <span className="activity-time">
                          {new Date(log.created_at).toLocaleString(undefined, {
                            dateStyle: "short",
                            timeStyle: "short",
                          })}
                        </span>
                      </div>
                      <p className="activity-details">
                        {log.details || `Performed action: ${log.action}`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
