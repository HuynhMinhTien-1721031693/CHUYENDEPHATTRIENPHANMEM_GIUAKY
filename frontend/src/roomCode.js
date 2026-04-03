/**
 * Chuẩn hóa mã phòng (khớp quy tắc backend).
 * @param {string} raw
 * @returns {string} rỗng nếu không hợp lệ
 */
export function normalizeRoomCode(raw) {
  if (typeof raw !== "string") return "";
  const t = raw.trim().toLowerCase();
  if (t.length < 4 || t.length > 64) return "";
  if (!/^[a-z0-9_-]+$/.test(t)) return "";
  return t;
}
