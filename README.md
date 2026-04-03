# Web Live Stream (Bài giữa kỳ)

Đây là dự án web live stream đơn giản để nộp giữa kỳ môn Chuyên đề phát triển phần mềm.

Ý tưởng chính:
- Một người **phát** (host) mở camera/mic trên trình duyệt.
- Người **xem** (viewer) vào bằng mã phòng hoặc link chia sẻ.
- Dữ liệu video/audio đi bằng **WebRTC**.
- Server Node.js chỉ làm **signaling** qua WebSocket (trao đổi offer/answer/ICE).

## Dự án này liên quan gì đến môn học?

- **Git/GitHub:** quản lý mã nguồn, commit, push repo.
- **Frontend:** React + Vite + React Router.
- **Backend:** Express + WebSocket (`ws`).
- **Testing:** Jest (backend), Vitest (frontend).

## Cách chạy nhanh

Mở 2 terminal.

### 1) Chạy backend (port 3001)

```bash
cd backend
npm install
npm run dev
```

### 2) Chạy frontend (port 5173)

```bash
cd frontend
npm install
npm run dev
```

Mở `http://localhost:5173`:
- Vào **Tạo phòng phát** để làm host.
- Cấp quyền camera/mic.
- Copy link hoặc mã phòng gửi cho viewer.

Viewer có thể vào bằng:
- Mở link `/watch/<ma-phong>`, hoặc
- Nhập mã phòng ở trang chủ.

## Chạy test

### Backend

```bash
cd backend
npm test
```

### Frontend

```bash
cd frontend
npm test
```

## Báo cáo (Word / PDF / PowerPoint)

**Nguồn Markdown (trong repo):** [`scripts/bao-cao-gk/BaoCao_GK.md`](scripts/bao-cao-gk/BaoCao_GK.md) — sửa nội dung tại đây rồi xuất file.

**Thư mục `docs/`:** chỉ dùng **cục bộ** để ghi `BaoCao_GK.docx` / `.pdf` / `.pptx` sau khi build; nội dung trong đó **không** đẩy lên Git (xem `docs/.gitignore`).

### Xuất .docx, .pdf, .pptx

```bash
cd scripts/bao-cao-gk
npm install
npm run build
```

*(Cần Node.js; lần đầu có thể tải Chromium cho `md-to-pdf`.)*

Link demo YouTube (cũng ghi trong `BaoCao_GK.md`): **https://youtu.be/3nTMk1xiUGs**

## Đẩy code lên GitHub

```bash
git add .
git commit -m "Web Live Stream: final midterm"
git branch -M main
git remote add origin https://github.com/HuynhMinhTien-1721031693/CHUYENDEPHATTRIENPHANMEM_GIUAKY.git
git push -u origin main
```

Nếu đã có `origin` từ trước thì chỉ cần `git push`.

## Khi demo bị lỗi kết nối

Với WebRTC, có thể xảy ra trường hợp cùng code nhưng mạng khác nhau cho kết quả khác:
- Thử cùng WiFi trước.
- Tắt VPN nếu đang bật.
- Kiểm tra firewall.
- Mạng NAT khó có thể cần TURN server (bản demo hiện chưa tích hợp TURN).

## Triển khai thật (tùy chọn)

- Cần **HTTPS** để dùng camera/mic trên domain thật.
- WebSocket nên dùng **WSS**.
- Có thể reverse proxy bằng nginx về backend port `3001`.
# Web Live Stream — Bài giữa kỳ (Chuyên đề phát triển phần mềm)

Demo **phát video/audio trực tiếp trên web**: host dùng camera + mic, người xem nhận luồng qua **WebRTC** (P2P). Server **Node.js (Express + `ws`)** chỉ làm **signaling** (trao đổi SDP/ICE), không chuyển mã hóa video như OBS→RTMP→HLS.

**Liên hệ môn học:** Git/GitHub, Frontend (React, Vite, React Router), Backend (HTTP + WebSocket), kiểm thử **Jest (backend) + Vitest (frontend)**.

**Báo cáo nộp:** xuất cục bộ bằng `scripts/bao-cao-gk` (mục **Báo cáo** phía trên); file PDF/Word/PPT không nằm trên GitHub theo cấu hình hiện tại.

## Chạy dự án

**Cửa sổ 1 — Backend (HTTP + WebSocket, port 3001):**

```bash
cd backend
npm install
npm run dev
```

**Đăng nhập Quản lý hệ thống / Admin phòng live:** trong thư mục `backend`, tạo file **`.env`** (copy từ `.env.example`), điền `SESSION_SECRET` và bốn biến `SEED_*`. Khi chạy `npm run dev`, Node **tự đọc `.env`** (package `dotenv`). Mỗi lần backend khởi động, hai email seed được **tạo hoặc đồng bộ** vào `backend/data/app-data.json`. Nếu console báo thiếu `SEED_*`, kiểm tra tên file đúng là `backend/.env` (không phải chỉ `.env.example`).

**Cửa sổ 2 — Frontend (port 5173):**

```bash
cd frontend
npm install
npm run dev
```

Mở `http://localhost:5173` → **Tạo phòng phát** → cấp quyền camera/mic → copy link hoặc mã phòng.

**Xem:** máy khác hoặc tab ẩn danh: nhập mã phòng hoặc mở link `/watch/<mã>`.

Trong dev, client kết nối WebSocket tới `ws://localhost:3001/live-signal` (xem `frontend/src/webrtc.js`).

## Test

```bash
cd backend
npm test
```

```bash
cd frontend
npm test
```

## Triển khai / báo cáo PDF (gợi ý)

1. **Mô tả:** Web live stream P2P, một host — nhiều viewer; signaling qua WebSocket; STUN Google.
2. **Kiến trúc:** Sơ đồ Host ↔ Server (WS) ↔ Viewer; sau đó media P2P.
3. **Hạn chế thực tế:** NAT/symmetric NAT có thể cần **TURN** (chưa có trong demo). Firewall chặn UDP.
4. **Khác RTMP/HLS:** Đề tài này là **WebRTC tương tác**, không thay thế nền tảng stream CDN.
5. **Video demo + link YouTube** đưa vào PDF.

## GitHub

```bash
git add .
git commit -m "Web Live Stream: WebRTC + signaling"
git remote add origin https://github.com/HuynhMinhTien-1721031693/CHUYENDEPHATTRIENPHANMEM_GIUAKY.git
git push -u origin main
```

(Sửa URL remote nếu repo khác.)

## Production (tùy chọn)

Cần **HTTPS** cho `getUserMedia` trên domain thật; WebSocket dùng **wss://** cùng origin hoặc reverse proxy (nginx) tới port 3001. Đặt biến môi trường `VITE_SIGNAL_PORT` khi build frontend nếu cần.
