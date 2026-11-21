import type { TaskPriority, TaskStatus } from "../types/task";

export type StatusFilter = "All" | TaskStatus;
export type PriorityFilter = "All" | TaskPriority;
export type SortOption = "newest" | "dueDate" | "priority";

export interface TaskFilters {
  status: StatusFilter;
  priority: PriorityFilter;
  search: string;
  sort: SortOption;
}

export const DEFAULT_FILTERS: TaskFilters = {
  status: "All",
  priority: "All",
  search: "",
  sort: "newest",
};

const STATUS_BUTTONS: { value: StatusFilter; label: string }[] = [
  { value: "All", label: "All" },
  { value: "Pending", label: "Pending" },
  { value: "InProgress", label: "In Progress" },
  { value: "Completed", label: "Completed" },
];

interface TaskToolbarProps {
  filters: TaskFilters;
  counts: Record<StatusFilter, number>;
  onChange: (filters: TaskFilters) => void;
}

export default function TaskToolbar({
  filters,
  counts,
  onChange,
}: TaskToolbarProps) {
  return (
    <div className="task-toolbar">
      <div className="task-filter">
        {STATUS_BUTTONS.map((b) => (
          <button
            key={b.value}
            className={
              filters.status === b.value ? "filter-btn active" : "filter-btn"
            }
            onClick={() => onChange({ ...filters, status: b.value })}
          >
            {b.label} ({counts[b.value]})
          </button>
        ))}
      </div>

      <div className="task-controls">
        <input
          type="text"
          placeholder="Search by title"
          value={filters.search}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
        />

        <select
          value={filters.priority}
          onChange={(e) =>
            onChange({
              ...filters,
              priority: e.target.value as PriorityFilter,
            })
          }
        >
          <option value="All">All priorities</option>
          <option value="Low">Low</option>
          <option value="Medium">Medium</option>
          <option value="High">High</option>
        </select>

        <select
          value={filters.sort}
          onChange={(e) =>
            onChange({ ...filters, sort: e.target.value as SortOption })
          }
        >
          <option value="newest">Newest first</option>
          <option value="dueDate">Due date</option>
          <option value="priority">Priority</option>
        </select>
      </div>
    </div>
  );
}