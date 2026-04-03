import { useState } from "react";

const section = { marginBottom: 10 };
const card = {
  background: "#fff",
  borderRadius: 12,
  padding: 20,
  boxShadow: "0 1px 4px rgba(15, 23, 42, 0.08)",
  border: "1px solid #e2e8f0",
};
const label = { display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#475569", marginBottom: 6 };
const input = {
  width: "100%",
  boxSizing: "border-box",
  padding: "10px 12px",
  borderRadius: 8,
  border: "1px solid #cbd5e1",
  fontSize: "1rem",
  fontFamily: "inherit",
};
const row = { display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", marginBottom: 12 };
const btn = {
  padding: "12px 20px",
  borderRadius: 8,
  border: "none",
  background: "#2563eb",
  color: "#fff",
  fontWeight: 600,
  fontSize: "1rem",
  cursor: "pointer",
  fontFamily: "inherit",
};
const err = { color: "#dc2626", fontSize: "0.85rem", marginTop: 8 };

/**
 * @param {{ onAdd: (name: string, time: string, date: string) => void }} props
 */
export default function AddTaskForm({ onAdd }) {
  const today = new Date().toISOString().slice(0, 10);
  const [name, setName] = useState("");
  const [time, setTime] = useState("09:00");
  const [date, setDate] = useState(today);
  const [error, setError] = useState("");

  function submit(e) {
    e.preventDefault();
    const n = name.trim();
    if (!n) {
      setError("Vui lòng nhập tên công việc.");
      return;
    }
    setError("");
    onAdd(n, time, date);
    setName("");
  }

  return (
    <section style={section} aria-labelledby="add-task-heading">
      <h2 id="add-task-heading" style={{ margin: "0 0 10px", fontSize: "1.15rem", color: "#334155" }}>
        Thêm công việc
      </h2>
      <form onSubmit={submit} style={card} noValidate>
        <div style={{ marginBottom: 12 }}>
          <label htmlFor="task-name" style={label}>
            Tên
          </label>
          <input
            id="task-name"
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (error) setError("");
            }}
            placeholder="Ví dụ: Ôn bài WebRTC"
            style={input}
            autoComplete="off"
          />
        </div>
        <div style={row}>
          <div>
            <label htmlFor="task-time" style={label}>
              Giờ (HH:MM)
            </label>
            <input id="task-time" type="time" value={time} onChange={(e) => setTime(e.target.value)} style={input} />
          </div>
          <div>
            <label htmlFor="task-date" style={label}>
              Ngày (YYYY-MM-DD)
            </label>
            <input id="task-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} style={input} />
          </div>
        </div>
        {error ? (
          <p role="alert" style={err}>
            {error}
          </p>
        ) : null}
        <button type="submit" style={btn}>
          Thêm vào danh sách
        </button>
      </form>
    </section>
  );
}
