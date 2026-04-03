const section = { marginBottom: 10 };
const card = {
  background: "#fff",
  borderRadius: 12,
  padding: 20,
  boxShadow: "0 1px 4px rgba(15, 23, 42, 0.08)",
  border: "1px solid #e2e8f0",
};
const item = {
  display: "flex",
  alignItems: "flex-start",
  gap: 12,
  padding: "12px 0",
  borderBottom: "1px solid #f1f5f9",
};
const itemDone = { ...item, opacity: 0.75 };
const meta = { fontSize: "0.8rem", color: "#64748b", marginTop: 4 };
const delBtn = {
  marginLeft: "auto",
  padding: "6px 12px",
  borderRadius: 6,
  border: "1px solid #fecaca",
  background: "#fff",
  color: "#b91c1c",
  cursor: "pointer",
  fontSize: "0.85rem",
  fontFamily: "inherit",
};

/**
 * @param {{ tasks: import('./taskStorage.js').Task[], onToggle: (id: number) => void, onRemove: (id: number) => void }} props
 */
export default function TaskList({ tasks, onToggle, onRemove }) {
  return (
    <section style={section} aria-labelledby="list-heading">
      <h2 id="list-heading" style={{ margin: "0 0 10px", fontSize: "1.15rem", color: "#334155" }}>
        Danh sách ({tasks.length})
      </h2>
      <div style={card}>
        {tasks.length === 0 ? (
          <p style={{ margin: 0, color: "#94a3b8", textAlign: "center", padding: "8px 0" }}>
            Chưa có công việc. Thêm một task phía trên.
          </p>
        ) : (
          <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {tasks.map((t) => (
              <li key={t.id} style={t.completed ? itemDone : item}>
                <input
                  type="checkbox"
                  checked={t.completed}
                  onChange={() => onToggle(t.id)}
                  aria-label={`Đánh dấu hoàn thành: ${t.name}`}
                  style={{ width: 18, height: 18, marginTop: 4, cursor: "pointer" }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span
                    style={{
                      fontWeight: 600,
                      color: "#0f172a",
                      textDecoration: t.completed ? "line-through" : "none",
                    }}
                  >
                    {t.name}
                  </span>
                  <div style={meta}>
                    {t.date} · {t.time}
                  </div>
                </div>
                <button type="button" style={delBtn} onClick={() => onRemove(t.id)}>
                  Xóa
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
