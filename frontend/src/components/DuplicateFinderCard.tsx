import { useMemo, useState } from "react";
import type { Task } from "../types/task";
import { findDuplicates } from "../utils/duplicateFinder";
import "./DuplicateFinderCard.css";

interface DuplicateFinderCardProps {
  tasks: Task[];
  // Parent function that asks for confirmation and deletes the task.
  onDelete: (task: Task) => void;
}

export default function DuplicateFinderCard({ tasks, onDelete }: DuplicateFinderCardProps) {
  const [dismissed, setDismissed] = useState<string[]>([]);

  const pairs = useMemo(() => {
    const byId = new Map(tasks.map((task) => [task.id, task]));
    return findDuplicates(tasks).flatMap((pair) => {
      const first = byId.get(pair.first.id);
      const second = byId.get(pair.second.id);
      return first && second ? [{ key: `${first.id}-${second.id}`, first, second }] : [];
    });
  }, [tasks]);

  const visiblePairs = pairs.filter((pair) => !dismissed.includes(pair.key));

  if (visiblePairs.length === 0) return null;

  return (
    <section className="duplicate-card" aria-label="Possible duplicate tasks">
      <h3>Possible duplicates ({visiblePairs.length})</h3>
      {visiblePairs.map(({ key, first, second }) => (
        <div className="duplicate-pair" key={key}>
          {[
            { keep: first, remove: second },
            { keep: second, remove: first },
          ].map(({ keep, remove }) => (
            <div className="duplicate-option" key={keep.id}>
              <span className="duplicate-title">{keep.title}</span>
              <button type="button" onClick={() => onDelete(remove)}>
                Keep this, delete "{remove.title}"
              </button>
            </div>
          ))}
          <button
            type="button"
            className="duplicate-dismiss"
            onClick={() => setDismissed((prev) => [...prev, key])}
          >
            Not duplicates
          </button>
        </div>
      ))}
    </section>
  );
}