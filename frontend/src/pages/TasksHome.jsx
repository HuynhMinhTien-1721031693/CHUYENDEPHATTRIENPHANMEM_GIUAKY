import { useEffect, useState } from "react";
import AddTaskForm from "../components/tasks/AddTaskForm.jsx";
import TaskList from "../components/tasks/TaskList.jsx";
import TasksHeader from "../components/tasks/TasksHeader.jsx";
import { loadTasksFromStorage, nextTaskId, saveTasksToStorage } from "../components/tasks/taskStorage.js";

/**
 * SPA quản lý task: state ở component cha, lưu localStorage, UI tách component con.
 */
export default function TasksHome() {
  const [tasks, setTasks] = useState(() => loadTasksFromStorage());

  useEffect(() => {
    saveTasksToStorage(tasks);
  }, [tasks]);

  function addTask(name, time, date) {
    setTasks((prev) => [...prev, { id: nextTaskId(prev), name, time, date, completed: false }]);
  }

  function toggleTask(id) {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)));
  }

  function removeTask(id) {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }

  const sorted = [...tasks].sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return a.time.localeCompare(b.time);
  });

  const outer = {
    background: "#f0f0f0",
    borderRadius: 16,
    padding: 20,
    minHeight: "70vh",
    boxSizing: "border-box",
    fontFamily: 'Segoe UI, system-ui, -apple-system, sans-serif',
  };

  const inner = {
    maxWidth: 800,
    margin: "0 auto",
    width: "100%",
    boxSizing: "border-box",
  };

  return (
    <div style={outer}>
      <div style={inner}>
        <TasksHeader />
        <AddTaskForm onAdd={addTask} />
        <TaskList tasks={sorted} onToggle={toggleTask} onRemove={removeTask} />
      </div>
    </div>
  );
}
