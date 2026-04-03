---
pdf_options:
  format: A4
  margin: 18mm
  printBackground: true
---

# BÁO CÁO BÀI GIỮA KỲ

## Chuyên đề phát triển phần mềm

**Đề tài:** Web Live Stream (WebRTC + Signaling WebSocket)

> **Gợi ý:** Nếu bạn soạn bản **Microsoft Word**, dùng thêm file [`BAO_CAO_MICROSOFT_WORD.md`](./BAO_CAO_MICROSOFT_WORD.md) — có hướng dẫn **phông chữ dễ đọc** và **nội dung theo thứ tự** từng mục để copy vào Word.

| Thông tin | Nội dung |
|-----------|----------|
| Họ và tên | Huỳnh Minh Tiến |
| MSSV | 1721031693 |
| Môn học | Chuyên đề phát triển phần mềm |
| Repository mã nguồn | https://github.com/HuynhMinhTien-1721031693/CHUYENDEPHATTRIENPHANMEM_GIUAKY |
| Video demo (YouTube) | *(dán link sau khi upload — bắt buộc theo yêu cầu nộp bài)* |

---

## 1. Mô tả sản phẩm

Đây là một trang web **live stream đơn giản** nhưng đủ để minh họa kiến thức môn học:

- **Host (người phát):** bật camera và micro trên trình duyệt, tạo một **phòng phát** và nhận mã phòng / link để chia sẻ.  
- **Viewer (người xem):** dùng mã phòng hoặc link để **vào cùng phòng** và xem hình ảnh — âm thanh trực tiếp.  
- **Đường truyền hình ảnh và âm thanh** sau khi thiết lập xong đi theo **WebRTC dạng P2P** (peer-to-peer), không cần server chuyển tiếp toàn bộ luồng media như mô hình RTMP truyền thống.

**Mục tiêu học tập:** ôn luyện và thể hiện **Git/GitHub**, **Frontend**, **Backend**, và **Testing** trong cùng một sản phẩm nhỏ có tính tương tác thời gian thực.

---

## 2. Cách thực hiện

### 2.1. Kiến trúc (dễ hình dung)

- **Frontend:** React + Vite + React Router — giao diện và logic kết nối WebRTC phía trình duyệt.  
- **Backend:** Node.js + Express + thư viện WebSocket (`ws`).  
- **Vai trò của server:** chỉ làm **signaling** — truyền các gói `offer`, `answer`, `ICE candidate` giữa các peer. Server **không** xử lý nén/giải mã luồng video/audio như một máy chủ streaming đa phương tiện.

### 2.2. Chức năng chính (người dùng thấy gì)

- **Trang chủ:** chọn **phát** hoặc **xem**.  
- **Host:** tạo phòng, xem trước hình ở máy mình, **sao chép** link / mã cho bạn bè.  
- **Viewer:** hệ thống **gọi REST** để kiểm tra phòng có tồn tại, rồi mở **WebSocket** để tham gia signaling và nhận stream.

### 2.3. Quy tắc và xử lý kỹ thuật (phía code)

- Chuẩn hóa **mã phòng** (4–64 ký tự: chữ thường, số, `_`, `-`) — thống nhất frontend và backend.  
- Giới hạn **số viewer** mỗi phòng (ví dụ 20) cho bản demo.  
- Dùng **ICE buffer** để xử lý trường hợp ICE candidate đến **trước** khi hoàn tất thiết lập SDP — giảm lỗi kết nối.  
- **Tách REST và WebSocket:** REST kiểm tra phòng; WebSocket lo phần realtime signaling — dễ giải thích và mở rộng sau này.

---

## 3. Công nghệ sử dụng

| Lớp | Công nghệ |
|-----|-----------|
| Frontend | React 18, Vite, React Router |
| Giao tiếp realtime | WebRTC (`getUserMedia`, `RTCPeerConnection`), STUN công khai (Google) |
| Backend | Node.js, Express, thư viện `ws` (WebSocket) |
| API bổ trợ | REST: kiểm tra tồn tại phòng (`/api/room/:id/exists`), health (`/api/health` có `version`) |
| Bảo mật cơ bản | Giới hạn kích thước body JSON; header `X-Content-Type-Options: nosniff` |
| Kiểm thử | **Jest** + Supertest (backend); **Vitest** + Testing Library (frontend) |
| Quản lý mã nguồn | Git + GitHub |

---

## 4. Luồng hoạt động và sơ đồ

**Kiến trúc (Mermaid):** xem đầy đủ trong [`BaoCao_GK.md`](./BaoCao_GK.md) mục **III.3** (sơ đồ khối + sequence signaling). Có thể xuất ảnh từ [mermaid.live](https://mermaid.live).

### 4.1. Tóm tắt nhanh

```
  [Host]  -- REST (kiểm tra phòng) -->  [Express :3001]  <-- REST --  [Viewer]
  [Host]  <==== WebSocket: offer / answer / ICE ====>  [Viewer]
  [Host]  ========== RTP/SRTP P2P (không qua Node) ======>  [Viewer]
```

### 4.2. Trình tự signaling (một viewer)

1. Host gửi `host-start` → server trả `room-ready` (mã phòng).  
2. Viewer gửi `viewer-join` → `joined` (viewerId) → server báo host `viewer-joined`.  
3. Host tạo **offer** (SDP) → server chuyển tới viewer; viewer trả **answer** → server chuyển về host.  
4. **ICE** hai chiều: `ice-host` / `ice-viewer` được relay tới đúng peer (có buffer ICE nếu candidate đến sớm).  
5. Sau đó **media** chạy trực tiếp P2P; STUN hỗ trợ thu thập candidate.

---

## 5. Cách chạy và kiểm thử

**Cửa sổ 1 — Backend:**

```bash
cd backend
npm install
npm run dev
```

**Cửa sổ 2 — Frontend:**

```bash
cd frontend
npm install
npm run dev
```

Mở `http://localhost:5173`. Chạy test:

```bash
cd backend
npm test
```

```bash
cd frontend
npm test
```

*(Trên Windows PowerShell, chạy từng lệnh `cd` + `npm test` trong đúng thư mục.)*

---

## 6. Kết quả đạt được

- Ứng dụng chạy **trọn vòng** từ host phát đến viewer xem (khi mạng và quyền trình duyệt thuận lợi).  
- **Kiểm thử tự động** backend và frontend đều chạy với `npm test`.  
- Có **tài liệu** (Markdown + hướng dẫn Word) và bộ **`docs/BaoCao_GK.{md,docx,pdf,pptx}`** (xuất bằng `scripts/bao-cao-gk`).  
- **Video demo** đính kèm qua link YouTube (điền vào bảng thông tin đầu báo cáo).

---

## 7. Hướng dẫn demo

### 7.1. Chuẩn bị

- Hai terminal: một chạy **backend**, một chạy **frontend** (xem mục 5).  
- Mở trình duyệt tại `http://localhost:5173`.

### 7.2. Luồng demo host → viewer (theo thứ tự)

1. Tab/máy thứ nhất: chọn **Tạo phòng phát**.  
2. **Cho phép** camera và micro.  
3. **Sao chép** link hoặc ghi lại mã phòng.  
4. Tab ẩn danh hoặc máy thứ hai: mở link hoặc nhập mã → **Vào xem**.  
5. Kiểm tra viewer thấy **hình và tiếng** từ host.

### 7.3. Demo kiểm thử (nên có trong video)

Chạy `npm test` ở **backend** và **frontend**, quay hoặc chụp kết quả pass.

### 7.4. Lưu ý thực tế

- Nên thử **cùng Wi-Fi** trước.  
- Kiểm tra **firewall**, **VPN**, và **quyền** camera/micro nếu không kết nối được.  
- Một số mạng NAT khó có thể cần **TURN** (ngoài phạm vi demo hiện tại).

---

## 8. Hạn chế và hướng phát triển

- Một số mạng (NAT nghiêm, symmetric NAT) có thể cần **TURN** để relay media; demo hiện chủ yếu dùng **STUN**.  
- Triển khai trên domain thật cần **HTTPS** và **wss**.  
- Hướng mở rộng: xác thực người dùng, ghi log phòng, SFU cho số viewer lớn, giao diện quản trị.

---

## 9. Kết luận

Đề tài đã hoàn thành các phần cốt lõi: **frontend**, **backend**, **signaling realtime**, **test tự động**, **tài liệu** và **mã nguồn trên GitHub**. Qua dự án, các kỹ năng được củng cố gồm xây dựng ứng dụng full-stack nhỏ, làm việc với WebRTC/WebSocket, và chuẩn bị sản phẩm đúng hướng dẫn nộp bài.

---

## 10. Tài khoản quản trị (Quản lý hệ thống và Admin phòng live)

### 10.1. Phân biệt hai vai trò

| Vai trò | Chức năng chính | Không làm |
|---------|------------------|-----------|
| **Quản lý hệ thống** | Chỉnh cấu hình site (tên, thông báo chào, cờ bảo trì), trang `/system` | Quản lý phòng live, host, viewer |
| **Admin phòng live** | Xem/đóng phòng, danh sách user, trang `/admin` | Chỉnh cấu hình hệ thống như trên |

### 10.2. Không tạo quản trị viên qua website

Form **Đăng ký** chỉ tạo tài khoản **user**; **Quản lý hệ thống** và **Admin phòng live** **không** được tạo qua giao diện web — chỉ khởi tạo phía server qua **`backend/.env`** (`SEED_*`) khi chạy backend (hoặc chỉnh dữ liệu cục bộ).

### 10.3. Khởi tạo trên máy chủ (seed)

1. Trong `backend`, tạo **`.env`** từ **`.env.example`**.  
2. Đặt `SEED_SYSMANAGER_*` và `SEED_ADMIN_*`.  
3. Chạy backend; nếu email chưa có trong `backend/data/app-data.json`, hệ thống tạo user đúng vai trò.  
4. **Đăng nhập** (không đăng ký) tại trang **Đăng nhập** bằng email/mật khẩu đã cấu hình.

*Nếu user đã tồn tại, seed không đổi mật khẩu — dùng mật khẩu cũ hoặc chỉnh/xóa bản ghi trong `app-data.json` khi cần demo lại.*

### 10.4. Tài khoản mẫu (theo `.env.example`)

| Vai trò | Email | Mật khẩu (demo) |
|---------|--------|------------------|
| Quản lý hệ thống | `sys@local.test` | `QuanLyHT@Demo2026` |
| Admin phòng live | `admin@local.test` | `AdminLive@Demo2026` |

*Lưu ý:* chỉ dùng cho demo/báo cáo; triển khai thật cần đổi mật khẩu và giữ `.env` ngoài Git.

---
