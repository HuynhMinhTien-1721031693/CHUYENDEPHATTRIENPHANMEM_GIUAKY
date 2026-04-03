import { useCallback, useEffect, useState } from "react";
import { fetchSession } from "../api/fetchSession.js";

/** Trang Admin: quản lý phòng live, host & người xem — khác Quản lý hệ thống */
export default function AdminLive() {
  const [rooms, setRooms] = useState(/** @type {Array<{ roomId: string, viewers: number }>} */ ([]));
  const [users, setUsers] = useState(/** @type {Array<{ email: string, name: string, role: string }>} */ ([]));
  const [err, setErr] = useState("");
  const [busyId, setBusyId] = useState("");

  const load = useCallback(async () => {
    setErr("");
    try {
      const [rRooms, rUsers] = await Promise.all([
        fetchSession("/api/admin/rooms"),
        fetchSession("/api/admin/users"),
      ]);
      if (!rRooms.ok || !rUsers.ok) {
        setErr("Không tải được dữ liệu (kiểm tra quyền Admin).");
        return;
      }
      const d1 = await rRooms.json();
      const d2 = await rUsers.json();
      setRooms(d1.rooms || []);
      setUsers(d2.users || []);
    } catch {
      setErr("Lỗi mạng.");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function closeRoom(roomId) {
    setBusyId(roomId);
    setErr("");
    try {
      const r = await fetchSession(`/api/admin/rooms/${encodeURIComponent(roomId)}/close`, { method: "POST" });
      if (!r.ok) {
        const d = await r.json();
        setErr(d.message || "Không đóng được phòng.");
        return;
      }
      await load();
    } catch {
      setErr("Lỗi mạng.");
    } finally {
      setBusyId("");
    }
  }

  return (
    <div className="stack">
      <header className="page-intro">
        <h1 className="page-title">Admin phòng live</h1>
        <p className="page-subtitle">
          Xem phòng đang mở, số viewer, và <strong>đóng phòng</strong> khi cần. Quyền này{" "}
          <strong>không</strong> chỉnh cấu hình website — việc đó thuộc <strong>Quản lý hệ thống</strong>.
        </p>
      </header>
      {err ? (
        <div className="banner error" role="alert">
          {err}
        </div>
      ) : null}
      <div className="card">
        <h2 className="card-title-row">Phòng đang hoạt động</h2>
        <button type="button" className="btn shrink" onClick={() => void load()}>
          Làm mới
        </button>
        {rooms.length === 0 ? (
          <p className="muted small">Không có phòng nào.</p>
        ) : (
          <ul className="admin-list">
            {rooms.map((x) => (
              <li key={x.roomId} className="admin-row">
                <div>
                  <code>{x.roomId}</code>
                  <span className="muted small">
                    {" "}
                    — {x.viewers} viewer, {x.comments} bình luận, {x.likes} like, {x.raisedHands} giơ tay
                  </span>
                </div>
                <button
                  type="button"
                  className="btn"
                  disabled={busyId === x.roomId}
                  onClick={() => void closeRoom(x.roomId)}
                >
                  {busyId === x.roomId ? "Đang đóng…" : "Đóng phòng"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="card">
        <h2 className="card-title-row">Danh sách tài khoản (xem nhanh)</h2>
        <p className="muted small">Gồm vai trò: user, admin, sysmanager.</p>
        <ul className="admin-user-list">
          {users.map((u) => (
            <li key={u.id} className="muted small">
              <strong>{u.name}</strong> ({u.email}) — <code>{u.role}</code>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
