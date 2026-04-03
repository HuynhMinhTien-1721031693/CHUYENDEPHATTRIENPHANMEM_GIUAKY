# Hướng dẫn làm báo cáo — từng bước, dễ theo dõi

Tài liệu này giúp bạn **không bỏ sót** các phần khi nộp bài giữa kỳ: báo cáo Word/PDF, mã nguồn, video.

---

## Bước 1 — Đọc nhanh yêu cầu nộp của giảng viên

Đối chiếu **đề bài / LMS / nhóm Zalo** của lớp bạn — tài liệu trong repo **không** thay thế được thông báo chính thức. Dùng bảng dưới đây để **ghi tay** cho khỏi quên:

| Hạng mục | Ghi chú của lớp (điền) |
|----------|-------------------------|
| **Hạn nộp** (ngày giờ) | |
| **Cách nộp** (email / LMS / Google Drive / khác) | |
| **Tên file báo cáo** (có bắt buộc MSSV / mã lớp trong tên không?) | |
| **Định dạng bắt buộc** (`.docx`, `.pdf`, `.pptx`, nén `.zip`…) | |
| **Link GitHub** (public? nhánh nào?) | |
| **Video demo** (bắt buộc YouTube? unlisted được không?) | |
| **Khác** (bìa, font, lề, chữ ký…) | |

Gợi ý đặt tên khi nộp: nếu thầy cô không quy định, có thể dùng dạng `BaoCao_GK_<MSSV>.docx` / `.pdf` / `.pptx` (sao chép từ `docs/BaoCao_GK.*` sau khi build).

---

## Bước 2 — Làm báo cáo Microsoft Word (khuyến nghị nếu nộp .docx)

1. Mở file hướng dẫn chi tiết: **[`BAO_CAO_MICROSOFT_WORD.md`](./BAO_CAO_MICROSOFT_WORD.md)**.  
2. Làm theo **Phần A** (chọn phông chữ, giãn dòng).  
3. Làm theo **Phần B** (checklist thứ tự).  
4. Copy **Phần C** (nội dung theo mục I → VIII) vào Word; chỉnh **họ tên, MSSV, link YouTube**.  
5. Chèn **ảnh chụp** giao diện và terminal chạy test.  
6. Tạo **mục lục tự động** (References → Table of Contents).  
7. Lưu file `.docx` và (nếu cần) **Xuất PDF** từ Word.

---

## Bước 3 — Xuất bộ báo cáo Word + PDF + PowerPoint (khuyến nghị)

1. Sửa nội dung trong **[`BaoCao_GK.md`](./BaoCao_GK.md)** (họ tên, MSSV, link YouTube, v.v.).  
2. Chạy:

```bash
cd scripts/bao-cao-gk
npm install
npm run build
```

3. Kiểm tra các file: **`docs/BaoCao_GK.docx`**, **`docs/BaoCao_GK.pdf`**, **`docs/BaoCao_GK.pptx`**.

**Số LOC trong slide/bảng (PowerPoint):** script đọc **`scripts/bao-cao-gk/loc-snapshot.json`**. Sau khi sửa code nhiều, chạy `npm run rebuild` (hoặc `node count-loc.mjs` rồi `npm run build`) rồi **commit** file `loc-snapshot.json` để số liệu trên GitHub khớp bản xuất báo cáo.

*(Tùy chọn cũ: PDF từ [`BAO_CAO.md`](./BAO_CAO.md) bằng `python scripts/build_pdf.py` + ReportLab.)*

---

## Sau khi quay xong video YouTube

1. Sửa **link YouTube** trong bảng đầu báo cáo: **[`BaoCao_GK.md`](./BaoCao_GK.md)** (và [`BAO_CAO.md`](./BAO_CAO.md) nếu bạn vẫn dùng file đó).  
2. Chạy lại `npm run build` trong `scripts/bao-cao-gk` để cập nhật **DOCX / PDF / PPTX** và slide phụ lục.  
3. Kiểm tra link mở được ở chế độ ẩn danh (nếu video **Unlisted**).

---

## Bước 4 — Đồng bộ nội dung

- Nếu vừa dùng Word vừa dùng `BAO_CAO.md`, hãy **cập nhật cả hai** khi đổi số liệu hoặc mô tả chức năng.  
- Gợi ý bổ sung rubric: **[`BAO_CAO_GOI_Y.md`](./BAO_CAO_GOI_Y.md)**.

---

## Bước 5 — Trước ngày nộp

- [ ] Đã đối chiếu **Bảng Bước 1** với thông báo chính thức của lớp (hạn, tên file, định dạng).  
- [ ] Link GitHub mở được, README hướng dẫn chạy đúng.  
- [ ] Video YouTube (hoặc link demo) hoạt động — cập nhật vào Markdown rồi build lại báo cáo.  
- [ ] Báo cáo có họ tên, MSSV, môn, đề tài.  
- [ ] Đã chạy `npm test` ở backend và frontend (có thể chụp/ghi trong video).  
- [ ] (Khuyến nghị) `loc-snapshot.json` đã cập nhật và commit cùng mã nguồn nếu dùng số LOC trong slide.

Chúc bạn hoàn thành tốt bài nộp.
