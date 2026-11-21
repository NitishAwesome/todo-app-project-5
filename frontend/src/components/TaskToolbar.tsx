import type { TaskPriority, TaskStatus, Category } from "../types/task";
import type { Tag } from "../types/productivity";

export type StatusFilter = "All" | TaskStatus;
export type PriorityFilter = "All" | TaskPriority;
export type DueDateFilter = "all" | "overdue" | "today" | "week";
export type SortOption = "newest" | "dueDate" | "priority" | "title";

export interface TaskFilters {
  status: StatusFilter;
  priority: PriorityFilter;
  categoryId: number | "all";
  tagId: number | "all";
  dueDate: DueDateFilter;
  search: string;
  sort: SortOption;
}

export const DEFAULT_FILTERS: TaskFilters = {
  status: "All",
  priority: "All",
  categoryId: "all",
  tagId: "all",
  dueDate: "all",
  search: "",
  sort: "newest",
};

const STATUS_BUTTONS: { value: StatusFilter; label: string }[] = [
  { value: "All", label: "All Tasks" },
  { value: "Pending", label: "Pending" },
  { value: "InProgress", label: "In Progress" },
  { value: "Completed", label: "Completed" },
];

interface TaskToolbarProps {
  filters: TaskFilters;
  counts: Record<StatusFilter, number>;
  categories: Category[];
  tags?: Tag[];
  onChange: (filters: TaskFilters) => void;
}

export default function TaskToolbar({
  filters,
  counts,
  categories,
  tags = [],
  onChange,
}: TaskToolbarProps) {
  const isAnyFilterActive =
    filters.status !== "All" ||
    filters.priority !== "All" ||
    filters.categoryId !== "all" ||
    filters.tagId !== "all" ||
    filters.dueDate !== "all" ||
    filters.search.trim() !== "";

  const handleResetFilters = () => {
    onChange({
      ...DEFAULT_FILTERS,
      sort: filters.sort,
    });
  };

  return (
    <div className="planova-task-toolbar">
      {/* Top Status Tabs */}
      <div className="task-status-tabs" role="tablist" aria-label="Filter tasks by status">
        {STATUS_BUTTONS.map((tab) => {
          const isActive = filters.status === tab.value;
          return (
            <button
              key={tab.value}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={`status-tab-btn ${isActive ? "active" : ""}`}
              onClick={() => onChange({ ...filters, status: tab.value })}
            >
              <span>{tab.label}</span>
              <span className="tab-count-badge">{counts[tab.value] ?? 0}</span>
            </button>
          );
        })}
      </div>

      {/* Filter and Search Controls */}
      <div className="task-toolbar-controls">
        {/* Search Input */}
        <div className="search-input-box">
          <svg
            className="search-icon"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="2"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
            />
          </svg>
          <input
            type="text"
            placeholder="Search by title or description..."
            value={filters.search}
            onChange={(e) => onChange({ ...filters, search: e.target.value })}
            aria-label="Search tasks"
          />
          {filters.search && (
            <button
              type="button"
              className="clear-search-btn"
              onClick={() => onChange({ ...filters, search: "" })}
              title="Clear search"
              aria-label="Clear search"
            >
              &times;
            </button>
          )}
        </div>

        {/* Category Filter */}
        <div className="select-control-box">
          <select
            value={filters.categoryId}
            onChange={(e) =>
              onChange({
                ...filters,
                categoryId: e.target.value === "all" ? "all" : Number(e.target.value),
              })
            }
            aria-label="Filter by category"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Tag Filter */}
        {tags.length > 0 && (
          <div className="select-control-box">
            <select
              value={filters.tagId}
              onChange={(e) =>
                onChange({
                  ...filters,
                  tagId: e.target.value === "all" ? "all" : Number(e.target.value),
                })
              }
              aria-label="Filter by tag"
            >
              <option value="all">All Tags</option>
              {tags.map((t) => (
                <option key={t.id} value={t.id}>
                  #{t.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Priority Filter */}
        <div className="select-control-box">
          <select
            value={filters.priority}
            onChange={(e) =>
              onChange({
                ...filters,
                priority: e.target.value as PriorityFilter,
              })
            }
            aria-label="Filter by priority"
          >
            <option value="All">All Priorities</option>
            <option value="High">High Priority</option>
            <option value="Medium">Medium Priority</option>
            <option value="Low">Low Priority</option>
          </select>
        </div>

        {/* Due Date Filter */}
        <div className="select-control-box">
          <select
            value={filters.dueDate}
            onChange={(e) =>
              onChange({
                ...filters,
                dueDate: e.target.value as DueDateFilter,
              })
            }
            aria-label="Filter by due date"
          >
            <option value="all">All Deadlines</option>
            <option value="overdue">Overdue</option>
            <option value="today">Due Today</option>
            <option value="week">Due This Week</option>
          </select>
        </div>

        {/* Sort Select */}
        <div className="select-control-box sort-box">
          <select
            value={filters.sort}
            onChange={(e) =>
              onChange({ ...filters, sort: e.target.value as SortOption })
            }
            aria-label="Sort tasks"
          >
            <option value="newest">Sort: Newest First</option>
            <option value="dueDate">Sort: Due Date</option>
            <option value="priority">Sort: High Priority</option>
            <option value="title">Sort: Title (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Active Filter Pills Bar */}
      {isAnyFilterActive && (
        <div className="active-filters-bar">
          <span className="active-filters-label">Active Filters:</span>

          {filters.status !== "All" && (
            <span className="filter-chip">
              Status: <strong>{filters.status}</strong>
              <button
                type="button"
                onClick={() => onChange({ ...filters, status: "All" })}
                aria-label="Remove status filter"
              >
                &times;
              </button>
            </span>
          )}

          {filters.priority !== "All" && (
            <span className="filter-chip">
              Priority: <strong>{filters.priority}</strong>
              <button
                type="button"
                onClick={() => onChange({ ...filters, priority: "All" })}
                aria-label="Remove priority filter"
              >
                &times;
              </button>
            </span>
          )}

          {filters.categoryId !== "all" && (
            <span className="filter-chip">
              Category:{" "}
              <strong>
                {categories.find((c) => c.id === filters.categoryId)?.name ?? filters.categoryId}
              </strong>
              <button
                type="button"
                onClick={() => onChange({ ...filters, categoryId: "all" })}
                aria-label="Remove category filter"
              >
                &times;
              </button>
            </span>
          )}

          {filters.tagId !== "all" && (
            <span className="filter-chip">
              Tag:{" "}
              <strong>
                #{tags.find((t) => t.id === filters.tagId)?.name ?? filters.tagId}
              </strong>
              <button
                type="button"
                onClick={() => onChange({ ...filters, tagId: "all" })}
                aria-label="Remove tag filter"
              >
                &times;
              </button>
            </span>
          )}

          {filters.dueDate !== "all" && (
            <span className="filter-chip">
              Due: <strong>{filters.dueDate}</strong>
              <button
                type="button"
                onClick={() => onChange({ ...filters, dueDate: "all" })}
                aria-label="Remove due date filter"
              >
                &times;
              </button>
            </span>
          )}

          {filters.search && (
            <span className="filter-chip">
              Search: "<strong>{filters.search}</strong>"
              <button
                type="button"
                onClick={() => onChange({ ...filters, search: "" })}
                aria-label="Remove search query"
              >
                &times;
              </button>
            </span>
          )}

          <button
            type="button"
            className="reset-all-filters-btn"
            onClick={handleResetFilters}
          >
            Clear All Filters
          </button>
        </div>
      )}
    </div>
  );
}
