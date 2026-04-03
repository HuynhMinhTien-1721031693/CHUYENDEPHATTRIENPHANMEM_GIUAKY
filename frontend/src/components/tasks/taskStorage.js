/** @typedef {{ id: number, name: string, time: string, date: string, completed: boolean }} Task */

export const TASKS_STORAGE_KEY = "gk-spa-tasks-v1";

/** @returns {Task[]} */
export function loadTasksFromStorage() {
  try {
    const raw = localStorage.getItem(TASKS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (t) =>
        t &&
        typeof t.id === "number" &&
        typeof t.name === "string" &&
        typeof t.time === "string" &&
        typeof t.date === "string" &&
        typeof t.completed === "boolean"
    );
  } catch {
    return [];
  }
}

/** @param {Task[]} tasks */
export function saveTasksToStorage(tasks) {
  localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
}

/** @param {Task[]} tasks @returns {number} */
export function nextTaskId(tasks) {
  if (!tasks.length) return 1;
  return Math.max(...tasks.map((t) => t.id)) + 1;
}
