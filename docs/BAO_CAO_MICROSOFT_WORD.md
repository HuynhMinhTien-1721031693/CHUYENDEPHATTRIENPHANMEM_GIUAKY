# Báo cáo Word — phông chữ thân thiện & nội dung theo thứ tự

File này giúp bạn **làm bản báo cáo trên Microsoft Word** (hoặc WPS/Writer tương tự): chọn chữ dễ đọc, bố cục rõ ràng, và **dán nội dung đúng thứ tự** từ trên xuống dưới — không bỏ sót mục.

---

## Phần A — Gợi ý phông chữ và trình bày (dễ gần, dễ hiểu)

**Mục tiêu:** người chấm đọc lâu không mỏi mắt; chữ tiếng Việt hiển thị đẹp.

| Thành phần | Gợi ý | Ghi chú ngắn |
|------------|--------|----------------|
| **Chữ thường (toàn văn)** | **Segoe UI** hoặc **Calibri** | Hai phông này có trên Windows, dễ đọc trên màn hình. |
| **Tiêu đề lớn** | Cùng họ phông với đoạn văn, **in đậm** | Ví dụ: Segoe UI Bold, cỡ 16–18 pt. |
| **Tiêu đề nhỏ (1.1, 1.2)** | In đậm, cỡ 13–14 pt | Dùng **Định dạng có sẵn** (Heading 2) trong Word. |
| **Mã lệnh, đường dẫn** | **Consolas** hoặc **Courier New** | Phân biệt rõ với đoạn văn. |
| **Cỡ chữ đoạn văn** | 12 pt (hoặc 11 pt nếu giáo viên yêu cầu khổ A4 nhiều nội dung) | Giữ **một cỡ** xuyên suốt cho phần chính. |
| **Giãn dòng** | 1,15 hoặc 1,5 | 1,5 dễ đọc hơn khi in. |
| **Lề** | Trái 3 cm, phải 2 cm, trên/dưới 2 cm | Chỉnh theo đúng **mẫu quy định của lớp** nếu có. |

**Cách làm nhanh trong Word**

1. Mở Word → **Kiểu** (Styles): chỉnh **Chữ thường (Normal)** → phông Segoe UI hoặc Calibri, cỡ 12, giãn dòng 1,5.  
2. Chuột phải **Tiêu đề 1 / Tiêu đề 2** → **Sửa** → đặt phông giống đoạn văn, chỉ khác cỡ chữ và in đậm.  
3. Dùng **Đánh số đa cấp** (Multilevel list) cho mục 1, 1.1, 1.1.1 — tránh gõ số tay để không lệch thứ tự.

---

## Phần B — Checklist thứ tự làm file Word (làm lần lượt)

Làm **theo đúng thứ tự** dưới đây để không quên phần nào khi nộp bài.

| Bước | Việc cần làm | Đã xong? |
|------|----------------|----------|
| 1 | Tạo trang bìa / trang đầu: tên trường, môn, đề tài, họ tên, MSSV, lớp (nếu có). | ☐ |
| 2 | Dán **mục lục** (sau khi viết xong toàn bộ, dùng Word: Tham chiếu → Mục lục tự động). | ☐ |
| 3 | Viết **lời mở đầu** (mục I bên dưới). | ☐ |
| 4 | Viết **mô tả sản phẩm** (mục II). | ☐ |
| 5 | Viết **công nghệ & kiến trúc** (mục III). | ☐ |
| 6 | Chèn **sơ đồ / hình** (giao diện host, viewer, terminal chạy test). | ☐ |
| 7 | Viết **cách chạy, test, demo** (mục IV — chi tiết từng bước). | ☐ |
| 8 | Viết **kết quả, hạn chế, hướng phát triển, kết luận** (mục V–VIII). | ☐ |
| 9 | Viết **tài khoản quản trị** (mục IX): Quản lý hệ thống và Admin phòng live — email/mật khẩu mẫu, cách cấu hình `.env`. | ☐ |
| 10 | Ghi **link GitHub** và **link YouTube** (bắt buộc nếu đề bài yêu cầu). | ☐ |
| 11 | Đọc lại chính tả, in thử hoặc xuất PDF, kiểm tra mục lục cập nhật số trang. | ☐ |

---

## Phần C — Nội dung báo cáo (sao chép vào Word theo thứ tự)

**Cách dùng:** copy từng mục vào Word; gán **Tiêu đề 1** cho dòng IN HOA có số La Mã, **Tiêu đề 2** cho “1.1.”, **Tiêu đề 3** cho “1.1.1.” nếu cần.

---

### I. Lời mở đầu

Em / tôi thực hiện đề tài **Web Live Stream** trong khuôn khổ môn **Chuyên đề phát triển phần mềm** (bài giữa kỳ). Đây là một trang web cho phép một người **phát** hình ảnh và âm thanh từ camera và micro trên trình duyệt, và người khác **xem trực tiếp** bằng mã phòng hoặc link chia sẻ.

Qua đề tài, em cố gắng ôn luyện và thể hiện các phần môn học đã học: làm việc với **Git/GitHub**, xây **frontend** bằng React, xây **backend** bằng Node.js, và viết **kiểm thử tự động**. Phần “xương sống” kỹ thuật là **WebRTC** (truyền media trực tiếp giữa hai trình duyệt) và **WebSocket** trên server chỉ để **trao đổi tín hiệu** (signaling), không phải để chuyển tiếp toàn bộ video như các nền tảng stream truyền thống.

Báo cáo được trình bày theo thứ tự: giới thiệu sản phẩm → công nghệ và cách làm → hướng dẫn chạy thử và demo → kết quả, hạn chế, hướng phát triển.

---

### II. Mô tả sản phẩm (ứng dụng làm gì, ai dùng)

#### II.1. Vấn đề cần giải quyết

Trong phạm vi bài giữa kỳ, em cần một sản phẩm **chạy được trên trình duyệt**, có **tương tác thời gian thực** (phát – xem), và có **mã nguồn + tài liệu + video demo** để nộp.

#### II.2. Giải pháp tổng quan

- **Người phát (host):** vào trang phát, cho phép trình duyệt dùng camera và micro, hệ thống tạo **mã phòng** và **đường link** để chia sẻ.  
- **Người xem (viewer):** mở link hoặc nhập mã phòng ở trang chủ; sau khi kết nối ổn định, viewer nhận **luồng video/audio** từ host.  
- **Server:** dùng **WebSocket** để chuyển các thông điệp kỹ thuật (offer, answer, ICE candidate) giúp hai trình duyệt “bắt tay” với nhau. Phần hình ảnh và âm thanh chính đi **trực tiếp giữa host và viewer** (peer-to-peer) sau khi thiết lập xong.

#### II.3. Giới hạn hợp lý của bản demo

- Mã phòng được **chuẩn hóa** (độ dài và ký tự cho phép) để tránh nhập sai và đồng bộ với backend.  
- Số viewer tối đa mỗi phòng có **giới hạn** (theo cấu hình demo, ví dụ 20 người) để tránh quá tải trong môi trường thử nghiệm.

---

### III. Công nghệ và kiến trúc

#### III.1. Danh sách công nghệ (dễ đọc)

| Lớp | Công nghệ dùng trong đề tài |
|-----|-----------------------------|
| Giao diện người dùng | React 18, Vite, React Router |
| Media trên trình duyệt | WebRTC (`getUserMedia`, `RTCPeerConnection`), STUN công khai (Google) |
| Máy chủ | Node.js, Express, thư viện `ws` (WebSocket) |
| API bổ trợ | REST: kiểm tra phòng (`/api/room/:id/exists`), kiểm tra hoạt động (`/api/health`) |
| Kiểm thử | Jest + Supertest (backend); Vitest + Testing Library (frontend) |
| Quản lý mã nguồn | Git, GitHub |

#### III.2. Kiến trúc ngắn gọn (bằng lời)

Có thể hình dung **hai luồng**:  
(1) **HTTP/REST** — viewer (và đôi khi các thao tác khác) gọi API để **biết phòng có tồn tại** trước khi mở kết nối WebSocket.  
(2) **WebSocket** — host và viewer **trao đổi tín hiệu** để WebRTC thiết lập đường truyền. Sau đó, **media không đi qua Node** theo kiểu “chuyển tiếp toàn bộ video” mà đi **P2P** giữa các peer.

#### III.3. Sơ đồ kiến trúc / WebRTC (chèn vào Word)

Trong repo, **sơ đồ Mermaid đầy đủ** (khối chức năng + sequence signaling) nằm ở `BaoCao_GK.md` mục **III.3**. Cách nhanh: mở file trên GitHub hoặc [mermaid.live](https://mermaid.live) → xuất **PNG** → chèn vào Word.

**Bản tóm tắt dạng text** (khi không dùng hình):

```
  [Host]  -- REST -->  [Express :3001]  <-- REST --  [Viewer]
  [Host]  <==== WebSocket JSON: offer, answer, ICE ====>  [Viewer]
  [Host]  ========== RTP/SRTP (P2P, không qua Node) ======>  [Viewer]
  [Host]  .... STUN (ICE) ....                    [Viewer]
```

#### III.4. Một vài xử lý kỹ thuật đáng nói

- **ICE buffer:** đôi khi gói ICE candidate đến **trước** khi hoàn tất thiết lập mô tả phiên (SDP); code dùng **bộ đệm** rồi **flush** sau khi sẵn sàng — giúp giảm lỗi kết nối.  
- **Chuẩn hóa mã phòng** thống nhất giữa frontend và backend.  
- **Tách REST và WebSocket:** minh họa rõ vai trò từng kênh trong ứng dụng thực tế.

---

### IV. Cách chạy dự án, kiểm thử và hướng dẫn demo (làm lần lượt)

#### IV.1. Chuẩn bị môi trường

1. Cài **Node.js** (phiên bản tương thích với dự án).  
2. Clone hoặc tải mã nguồn từ GitHub về máy.  
3. Mở **hai cửa sổ terminal** (hoặc hai tab) trong thư mục dự án.

#### IV.2. Bước 1 — Chạy backend (cửa sổ thứ nhất)

```bash
cd backend
npm install
npm run dev
```

Đợi terminal báo server chạy (thường cổng **3001** — kiểm tra theo log hoặc tài liệu dự án).

#### IV.3. Bước 2 — Chạy frontend (cửa sổ thứ hai)

```bash
cd frontend
npm install
npm run dev
```

Mở trình duyệt tại địa chỉ dev (thường `http://localhost:5173`).

#### IV.4. Bước 3 — Chạy kiểm thử tự động (nên quay trong video demo)

**Backend:**

```bash
cd backend
npm test
```

**Frontend:**

```bash
cd frontend
npm test
```

Chụp màn hình hoặc quay cảnh terminal **pass** hết test để đưa vào báo cáo / video.

#### IV.5. Bước 4 — Demo luồng host → viewer (từng thao tác một)

1. **Tab hoặc máy thứ nhất:** vào trang chủ → chọn **Tạo phòng phát**.  
2. Khi trình duyệt hỏi, **cho phép** camera và micro.  
3. Chờ hệ thống hiện **mã phòng** và **link** → bấm **Sao chép** link (hoặc ghi mã phòng).  
4. **Tab ẩn danh hoặc máy thứ hai:** dán link hoặc vào trang chủ, nhập **mã phòng**, bấm **Vào xem**.  
5. Quan sát: phía viewer có **hình và tiếng** từ host sau vài giây (tùy mạng).  
6. (Tùy chọn) Thử gửi **bình luận** nếu tính năng có trong phiên bản đang demo.

#### IV.6. Lưu ý khi demo để tránh “tắc”

- Ưu tiên **cùng mạng Wi-Fi** cho host và viewer lần đầu.  
- Tắt **VPN** nếu có xung đột.  
- Kiểm tra **firewall** nếu không kết nối được.  
- Một số loại NAT khó có thể cần **TURN** (ngoài phạm vi bản demo hiện tại).

---

### V. Kết quả đạt được

- Ứng dụng chạy **end-to-end**: host phát, viewer xem được trên **tab khác hoặc máy khác** khi điều kiện mạng phù hợp.  
- **Test tự động** backend và frontend chạy được bằng `npm test`.  
- Có **mã nguồn** trên GitHub và **báo cáo** (Word/PDF) kèm **link video** theo yêu cầu giảng viên.

---

### VI. Hạn chế

- Demo chủ yếu dùng **STUN**; một số mạng cần **TURN** để relay media thì có thể **không xem được** dù code đúng.  
- Triển khai lên domain thật cần **HTTPS** và **wss://** cho WebSocket.  
- Quy mô lớn (rất nhiều viewer) thường cần kiến trúc **SFU/MCU**, khác với demo P2P hiện tại.

---

### VII. Hướng phát triển

- Tích hợp **TURN** khi cần thiết.  
- **Xác thực** người dùng, quản lý phòng, ghi log.  
- Cải thiện **giao diện**, trải nghiệm mobile, và giám sát chất lượng luồng.

---

### VIII. Kết luận

Đề tài đã hoàn thành một vòng đời sản phẩm nhỏ nhưng đủ các phần: **frontend**, **backend**, **realtime signaling**, **kiểm thử**, **tài liệu** và **video minh họa**. Em rút ra được kinh nghiệm về WebRTC, WebSocket, và cách phối hợp nhiều công cụ trong một dự án full-stack ngắn.

---

### IX. Tài khoản quản trị và phân quyền (Quản lý hệ thống / Admin phòng live)

Ứng dụng có **hai vai trò quản trị tách biệt** (không thay thế lẫn nhau):

#### IX.1. Quản lý hệ thống (System manager)

- **Mục đích:** chỉnh các **thiết lập toàn site** (tên hiển thị, thông báo chào mừng, chế độ bảo trì).  
- **Không** dùng để quản lý phòng phát, host hay viewer.  
- **Sau khi đăng nhập:** vào đường dẫn **Quản lý hệ thống** (trên giao diện web, ví dụ `/system`).

#### IX.2. Admin phòng live (Admin)

- **Mục đích:** **quản lý phòng live** — xem danh sách phòng, có thể **đóng phòng**, xem **danh sách người dùng** đã tạo tài khoản qua form **Đăng ký** trên web.  
- **Không** dùng để chỉnh cấu hình hệ thống như mục IX.1.  
- **Sau khi đăng nhập:** vào **Admin phòng live** (ví dụ `/admin`).

#### IX.3. Hai quyền quản trị không được tạo qua giao diện web

- Trang **Đăng ký** chỉ tạo tài khoản **user**; backend **không** gán `sysmanager` hay `admin` qua API đăng ký công khai.  
- **Quản lý hệ thống** và **Admin phòng live** **không** có chức năng tự đăng ký trên web.  
- Hai tài khoản này **chỉ khởi tạo phía máy chủ** qua **`backend/.env`** (`SEED_*`); sau đó **đăng nhập** bằng email/mật khẩu đã cấu hình — **không** tạo mới qua trang Đăng ký.

#### IX.4. Các bước khởi tạo trên máy chủ (môi trường demo)

1. Trong thư mục **`backend`**, sao chép **`.env.example`** thành **`.env`**.  
2. Điền **`SEED_SYSMANAGER_*`** và **`SEED_ADMIN_*`**.  
3. Chạy backend (`npm run dev` hoặc `npm start`). Hai email `SEED_*` trong **`.env`** được **tạo hoặc đồng bộ** vào `backend/data/app-data.json` (đúng vai trò và mật khẩu), kể cả khi đã từng đăng ký web trùng email.  
4. Mở **Đăng nhập** và đăng nhập bằng email/mật khẩu trong `.env` — đây là **đăng nhập**, không phải **đăng ký** tạo tài khoản quản trị.

*Mật khẩu đăng nhập hai tài khoản seed luôn khớp giá trị `SEED_*_PASSWORD` trong `.env` sau mỗi lần khởi động backend (đồng bộ có chủ đích).*

#### IX.5. Bảng tài khoản và mật khẩu mẫu (theo `.env.example`)

| STT | Vai trò | Email (mẫu) | Mật khẩu (mẫu) | Ghi chú |
|:---:|---------|-------------|-----------------|---------|
| 1 | **Quản lý hệ thống** | `sys@local.test` | `QuanLyHT@Demo2026` | Chỉ tạo qua seed `.env`, không qua web Đăng ký. |
| 2 | **Admin phòng live** | `admin@local.test` | `AdminLive@Demo2026` | Chỉ tạo qua seed `.env`, không qua web Đăng ký. |

**An toàn:** bảng trên phục vụ **báo cáo và demo cục bộ**; triển khai thật cần **đổi mật khẩu mạnh** và **không** đưa `.env` lên Git.

---

### Phụ lục — Thông tin nộp bài (điền đầy đủ trước khi nộp)

| Mục | Nội dung |
|-----|----------|
| Họ và tên | *(điền)* |
| MSSV | *(điền)* |
| Môn học | Chuyên đề phát triển phần mềm |
| Đề tài | Web Live Stream (WebRTC + Signaling WebSocket) |
| Link GitHub | https://github.com/HuynhMinhTien-1721031693/CHUYENDEPHATTRIENPHANMEM_GIUAKY |
| Link video YouTube | https://youtu.be/3nTMk1xiUGs |

---

**Ghi chú cuối:** Bộ nộp đồng bộ **Word / PDF / PPT** xuất từ `docs/BaoCao_GK.md` (chạy `scripts/bao-cao-gk`). Nội dung song song có trong `docs/BAO_CAO.md` và `README.md`. Khi chỉnh báo cáo, **sửa `BaoCao_GK.md` rồi chạy lại `npm run build`** (hoặc đồng bộ tay với các file `.md` khác) để tránh lệch số liệu.
