import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { taskApi } from "../taskAPI";
import type { Task } from "../types/task";
import "./TaskFormModal.css";

// Validation rules
const taskSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required")
    .max(255, "Title must be 255 characters or less"),
  description: z.string().optional(),
  priority: z.enum(["Low", "Medium", "High"]),
  due_date: z.string().optional(),
  status: z.enum(["Pending", "InProgress", "Completed"]),
});

type FormValues = z.infer<typeof taskSchema>;

interface TaskFormModalProps {
  open: boolean;
  mode: "add" | "edit";
  task?: Task | null;
  onClose: () => void;
  onSaved: () => void;
}

const emptyValues: FormValues = {
  title: "",
  description: "",
  priority: "Medium",
  due_date: "",
  status: "Pending",
};

// Turns a saved task into form values (used in edit mode)
function toFormValues(task?: Task | null): FormValues {
  if (!task) return emptyValues;
  return {
    title: task.title,
    description: task.description ?? "",
    priority: task.priority,
    due_date: task.due_date ? task.due_date.slice(0, 10) : "",
    status: task.status,
  };
}

export default function TaskFormModal({
  open,
  mode,
  task,
  onClose,
  onSaved,
}: TaskFormModalProps) {
  const [apiError, setApiError] = useState("");
  const [success, setSuccess] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: emptyValues,
  });

  // Every time the modal opens, fill or clear the form
  useEffect(() => {
    if (open) {
      reset(mode === "edit" ? toFormValues(task) : emptyValues);
      setApiError("");
      setSuccess("");
    }
  }, [open, mode, task, reset]);

  const onSubmit = async (values: FormValues) => {
    setApiError("");
    const payload = {
      title: values.title.trim(),
      description: values.description?.trim() ? values.description.trim() : null,
      priority: values.priority,
      due_date: values.due_date ? values.due_date : null,
    };

    try {
      if (mode === "edit" && task) {
        await taskApi.update(task.id, { ...payload, status: values.status });
        setSuccess("Task updated successfully.");
      } else {
        await taskApi.create({ ...payload, status: "Pending" });
        setSuccess("Task added successfully.");
      }
      onSaved(); // tells the task list to refresh
      setTimeout(onClose, 800);
    } catch (err) {
      setApiError(
        err instanceof Error ? err.message : "Something went wrong. Please try again."
      );
    }
  };

  if (!open) return null;

  const isEdit = mode === "edit";

  return (
    <div className="tfm-overlay" onClick={() => !isSubmitting && onClose()}>
      <div
        className="tfm-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tfm-heading"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="tfm-heading" className="tfm-heading">
          {isEdit ? "Edit Task" : "Add Task"}
        </h2>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="tfm-field">
            <label htmlFor="tfm-title">Title *</label>
            <input id="tfm-title" type="text" {...register("title")} />
            {errors.title && <p className="tfm-error">{errors.title.message}</p>}
          </div>

          <div className="tfm-field">
            <label htmlFor="tfm-description">Description</label>
            <textarea id="tfm-description" rows={3} {...register("description")} />
          </div>

          <div className="tfm-row">
            <div className="tfm-field">
              <label htmlFor="tfm-priority">Priority</label>
              <select id="tfm-priority" {...register("priority")}>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>

            <div className="tfm-field">
              <label htmlFor="tfm-due">Due date</label>
              <input id="tfm-due" type="date" {...register("due_date")} />
            </div>
          </div>

          {isEdit && (
            <div className="tfm-field">
              <label htmlFor="tfm-status">Status</label>
              <select id="tfm-status" {...register("status")}>
                <option value="Pending">Pending</option>
                <option value="InProgress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          )}

          {apiError && <p className="tfm-error tfm-banner">{apiError}</p>}
          {success && <p className="tfm-success tfm-banner">{success}</p>}

          <div className="tfm-actions">
            <button
              type="button"
              className="tfm-btn tfm-btn-secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button type="submit" className="tfm-btn tfm-btn-primary" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : isEdit ? "Save Changes" : "Save Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}