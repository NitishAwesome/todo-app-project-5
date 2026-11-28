import type { Task } from "../types/task";

type TaskLike = Pick<Task, "id" | "title" | "status">;

export interface DuplicatePair {
  first: TaskLike;
  second: TaskLike;
  score: number;
}

const STOP_WORDS = new Set(["a", "an", "the", "to", "for", "of", "and", "my", "your", "our", "on", "in", "at", "with"]);

const SYNONYMS: Record<string, string> = {
  send: "submit",
  deliver: "submit",
  get: "buy",
  purchase: "buy",
  repair: "fix",
  phone: "call",
  mail: "email",
  complete: "finish",
  finalize: "finish",
};

export function normalizeTitle(title: string): string[] {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word && !STOP_WORDS.has(word))
    .map((word) => (word.length > 3 && word.endsWith("s") ? word.slice(0, -1) : word))
    .map((word) => SYNONYMS[word] ?? word);
}

function similarity(a: string[], b: string[]): number {
  const setA = new Set(a);
  const setB = new Set(b);
  if (setA.size === 0 || setB.size === 0) return 0;
  let common = 0;
  setA.forEach((word) => {
    if (setB.has(word)) common++;
  });
  return common / (setA.size + setB.size - common);
}

export function findDuplicates(tasks: TaskLike[], threshold = 0.7): DuplicatePair[] {
  const active = tasks.filter((task) => task.status !== "Completed");
  const tokens = active.map((task) => normalizeTitle(task.title));
  const pairs: DuplicatePair[] = [];
  for (let i = 0; i < active.length; i++) {
    for (let j = i + 1; j < active.length; j++) {
      const score = similarity(tokens[i], tokens[j]);
      if (score >= threshold) pairs.push({ first: active[i], second: active[j], score });
    }
  }
  return pairs.sort((a, b) => b.score - a.score);
}