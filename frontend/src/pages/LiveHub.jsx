import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { normalizeRoomCode } from "../roomCode.js";

/** Trang hub Web Live Stream (phát / xem) — đường dẫn `/live`. */
export default function LiveHub() {
  const [code, setCode] = useState("");
  const [formError, setFormError] = useState("");
  const [siteWelcome, setSiteWelcome] = useState("");
  const [maintenance, setMaintenance] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetch("/api/public/site-info")
      .then((r) => r.json())
      .then((d) => {
        if (typeof d.welcomeMessage === "string") setSiteWelcome(d.welcomeMessage);
        setMaintenance(Boolean(d.maintenanceMode));
      })
      .catch(() => {});
  }, []);

  function watch(e) {
    e.preventDefault();
    const id = normalizeRoomCode(code);
    if (!id) {
      setFormError("Mã phòng: 4–64 ký tự (chữ thường, số, _ hoặc -).");
      return;
    }
    setFormError("");
    navigate(`/watch/${encodeURIComponent(id)}`);
  }

  return (
    <div className="stack">
      <section className="hero">
        <p className="eyebrow">Phát trực tiếp trong trình duyệt</p>
        <h1>Chào mừng — bắt đầu trong vài bước</h1>
        <p className="lede">
          Bạn có thể <strong>phát</strong> camera và mic tới người khác, hoặc <strong>xem</strong> phòng đã có mã. Kết
          nối dùng WebRTC; server chỉ giúp trao đổi tín hiệu, không lưu video.
        </p>
        {siteWelcome ? (
          <p className="banner ok site-welcome-banner" role="note">
            {siteWelcome}
          </p>
        ) : null}
        {maintenance ? (
          <p className="banner error" role="alert">
            Hệ thống đang bật cờ bảo trì — bạn vẫn có thể thử phát/xem trên môi trường demo.
          </p>
        ) : null}
      </section>

      <ol className="steps" aria-label="Các bước sử dụng">
        <li className="steps-item">
          <span className="steps-num" aria-hidden="true">
            1
          </span>
          <div>
            <strong className="steps-title">Host bấm nút &ldquo;Tạo phòng phát&rdquo;</strong>
            <p className="steps-desc">Cho phép camera/mic, sao chép link hoặc mã phòng gửi người xem.</p>
          </div>
        </li>
        <li className="steps-item">
          <span className="steps-num" aria-hidden="true">
            2
          </span>
          <div>
            <strong className="steps-title">Viewer mở link hoặc nhập mã</strong>
            <p className="steps-desc">Mã gồm chữ thường, số, dấu gạch (4–64 ký tự).</p>
          </div>
        </li>
        <li className="steps-item">
          <span className="steps-num" aria-hidden="true">
            3
          </span>
          <div>
            <strong className="steps-title">Đợi vài giây để kết nối</strong>
            <p className="steps-desc">Nếu không xem được, kiểm tra backend đang chạy và mạng/firewall.</p>
          </div>
        </li>
      </ol>

      {formError ? (
        <div className="banner error" role="alert">
          {formError}
        </div>
      ) : null}

      <div className="card-grid">
        <div className="card card-action">
          <h2>Tôi là người phát</h2>
          <p className="muted">Tạo phòng mới và chia sẻ cho bạn bè.</p>
          <Link className="btn primary btn-block" to="/host">
            Tạo phòng phát
          </Link>
        </div>
        <div className="card card-action">
          <h2>Tôi là người xem</h2>
          <p className="muted">Dán mã phòng mà host đã gửi.</p>
          <form onSubmit={watch} className="stack-tight" noValidate>
            <div className="field">
              <label className="field-label" htmlFor="room-code">
                Mã phòng
              </label>
              <input
                id="room-code"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  if (formError) setFormError("");
                }}
                placeholder="ví dụ: abc-123"
                autoComplete="off"
                aria-invalid={!!formError}
                aria-describedby="room-hint"
              />
              <p id="room-hint" className="field-hint">
                Hệ thống tự chuẩn hóa giống backend để tránh nhập sai định dạng.
              </p>
            </div>
            <button type="submit" className="btn primary btn-block">
              Vào xem
            </button>
          </form>
        </div>
      </div>

      <section className="card note">
        <h3>Gợi ý khi demo / báo cáo</h3>
        <ul className="muted list-bullets">
          <li>
            Chạy backend (cổng 3001) và frontend (cổng 5173); có thể chạy <code>npm test</code> ở cả hai thư mục.
          </li>
          <li>
            Máy 1: trang phát (<code>/host</code>), cấp quyền thiết bị, bấm <strong>Sao chép</strong> link.
          </li>
          <li>Máy khác hoặc tab ẩn danh: mở link hoặc nhập mã phòng.</li>
          <li>Không kết nối được: thử cùng mạng Wi‑Fi; NAT nghiêm có thể cần TURN (nâng cao).</li>
        </ul>
      </section>
    </div>
  );
}
