const FILTERS = ["All", "Pending", "Completed"];

export default function TaskFilter({ current, onChange }) {
  return (
    <div className="task-filter">
      {FILTERS.map((f) => (
        <button
          key={f}
          className={current === f ? "filter-btn active" : "filter-btn"}
          onClick={() => onChange(f)}
        >
          {f}
        </button>
      ))}
    </div>
  );
}