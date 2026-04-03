# Gợi ý bổ sung cho báo cáo (giọng văn gần gũi, dễ hiểu)

File này là **kim chỉ nam thêm**, không thay thế [`BAO_CAO.md`](./BAO_CAO.md). Dùng khi bạn muốn **ăn điểm rubric** mà vẫn giữ văn phong **dễ đọc, không “khô” quá**.

**Làm báo cáo Word theo thứ tự tỉ mỉ:** xem [`BAO_CAO_MICROSOFT_WORD.md`](./BAO_CAO_MICROSOFT_WORD.md).  
**Checklist từng bước (PDF / Word / video):** xem [`HUONG_DAN_BAO_CAO.md`](./HUONG_DAN_BAO_CAO.md).

---

## 1. Mở đầu (giới thiệu ngắn)

- Giới thiệu họ tên, MSSV, môn học, tên đề tài **Web Live Stream**.  
- Nói một câu **bằng tiếng thường ngày:** “Ứng dụng cho phép một người bật camera trên web, người khác xem trực tiếp bằng link hoặc mã phòng.”  
- Nêu mục tiêu: thể hiện **Git, Frontend, Backend, Testing**.

---

## 2. Mô tả sản phẩm (người chấm hiểu ngay)

- **Host:** tạo phòng → có mã và link → **sao chép** gửi bạn bè.  
- **Viewer:** nhập mã hoặc mở link; hệ thống **kiểm tra phòng bằng REST** trước khi vào WebSocket — vừa tiện cho người dùng, vừa dễ giải thích trong báo cáo.  
- **Giới hạn demo:** ví dụ tối đa 20 viewer/phòng; mã phòng chuẩn hóa để tránh gõ sai.

---

## 3. Công nghệ (bảng gọn, dễ quét mắt)

| Lớp | Công nghệ |
|-----|-----------|
| Frontend | React 18, Vite, React Router |
| Realtime | WebRTC, STUN Google |
| Backend | Node.js, Express, `ws` |
| Bảo mật cơ bản | Giới hạn JSON body, header `X-Content-Type-Options: nosniff` |
| Kiểm thử | Jest + Supertest (BE), Vitest + Testing Library (FE) |
| Phiên bản | `/api/health` trả `version` từ `package.json` |

---

## 4. Kiến trúc & luồng (giải thích bằng lời trước, sơ đồ sau)

**Signaling (qua server):** Host ↔ máy chủ WebSocket ↔ Viewer — trao đổi `offer`, `answer`, ICE.  
**Sau khi xong:** video/audio đi **thẳng P2P** giữa host và từng viewer (không qua Node cho phần media).

**Sơ đồ ASCII (chèn vào Word/PDF):**

```
[Host browser]     WS + REST      [Node: Express + ws]
     |                    |                    |
     |---- offer/ice ---->|---- relay ------->|----> [Viewer browser]
     |<--- answer/ice ----|<---- relay -------|<----
     |                                                   
     |======== media RTP (P2P) ========================>|
```

---

## 5. Điểm cộng kỹ thuật (nên nhắc trong báo cáo)

- **Hàng đợi ICE:** candidate đôi khi đến trước khi xong SDP — dùng buffer rồi flush → kết nối ổn định hơn.  
- **Validation mã phòng** thống nhất FE/BE.  
- **Tách REST và WebSocket** — dễ vẽ sơ đồ và phỏng vấn.

---

## 6. Hạn chế & hướng phát triển (thành thật, có học thuật)

- NAT khó → có thể cần **TURN**.  
- Production → **HTTPS + wss**.  
- Mở rộng → log phòng, đăng nhập, SFU.

---

## 7. Kết quả trình bày (ảnh + link)

- Ảnh: trang chủ, host có link, viewer đang xem.  
- Ảnh terminal: `npm test` hai phía.  
- **Link YouTube** (nếu đề bài bắt buộc).

---

## 8. Kết luận (1 đoạn ấm, rõ)

Tóm tắt: đã học WebRTC, async, test hai tầng; đã nộp đủ PDF/Word + code + video theo yêu cầu.
