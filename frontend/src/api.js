/**
 * @param {string} roomId đã chuẩn hóa
 * @returns {Promise<{ exists: boolean, validFormat: boolean, viewers?: number, comments?: number, likes?: number }>}
 */
export async function checkRoomExists(roomId) {
  const r = await fetch(`/api/room/${encodeURIComponent(roomId)}/exists`);
  if (!r.ok) throw new Error("API");
  return r.json();
}
