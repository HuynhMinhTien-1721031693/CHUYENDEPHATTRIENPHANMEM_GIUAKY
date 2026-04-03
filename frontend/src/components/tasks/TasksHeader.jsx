import { Link } from "react-router-dom";

const section = { marginBottom: 10 };
const title = {
  margin: 0,
  fontSize: "1.65rem",
  fontWeight: 700,
  color: "#1e293b",
};
const sub = { margin: "6px 0 0", fontSize: "0.95rem", color: "#64748b", lineHeight: 1.45 };
const linkStyle = {
  display: "inline-block",
  marginTop: 10,
  fontSize: "0.9rem",
  color: "#2563eb",
  textDecoration: "none",
  fontWeight: 600,
};

export default function TasksHeader() {
  return (
    <header style={section}>
      <h1 style={title}>Danh sách công việc</h1>
      <p style={sub}>
        Single-page application — dữ liệu lưu trong <strong>localStorage</strong>, giữ nguyên sau khi tải lại trang.
      </p>
      <Link to="/live" style={linkStyle}>
        → Mở phần phát trực tiếp (Web Live Stream)
      </Link>
    </header>
  );
}
