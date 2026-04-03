function makeId() {
  return Math.random().toString(36).slice(2, 10);
}

function makeRoomId() {
  let id = makeId();
  id = id.length >= 6 ? id.slice(0, 8) : id + makeId().slice(0, 4);
  return id.toLowerCase();
}

/**
 * Chuẩn hóa mã phòng từ người dùng (URL / form).
 * @param {unknown} raw
 * @returns {string} rỗng nếu không hợp lệ
 */
function normalizeRoomId(raw) {
  if (typeof raw !== "string") return "";
  const t = raw.trim().toLowerCase();
  if (t.length < 4 || t.length > 64) return "";
  if (!/^[a-z0-9_-]+$/.test(t)) return "";
  return t;
}

/**
 * @typedef {{ maxViewersPerRoom?: number }} LiveRoomOptions
 */

/**
 * WebSocket signaling: một host / phòng, nhiều viewer (mỗi viewer một RTCPeerConnection phía host).
 * @param {LiveRoomOptions} [options]
 */
function createLiveRooms(options = {}) {
  const maxViewersPerRoom = options.maxViewersPerRoom ?? 20;

  /**
   * @type {Map<string, {
   * host: import('ws').WebSocket,
   * viewers: Map<string, import('ws').WebSocket>,
   * comments: Array<{ id: string, viewerId: string, text: string, createdAt: string }>,
   * raisedHands: Set<string>,
   * mediaAllowed: Set<string>,
   * likedBy: Set<string>
   * }>}
   */
  const rooms = new Map();

  function hasRoom(roomId) {
    return rooms.has(roomId);
  }

  function viewerCount(roomId) {
    return rooms.get(roomId)?.viewers.size ?? 0;
  }

  function commentCount(roomId) {
    return rooms.get(roomId)?.comments.length ?? 0;
  }

  function likeCount(roomId) {
    return rooms.get(roomId)?.likedBy.size ?? 0;
  }

  /**
   * @param {string} roomId
   */
  function broadcastRoomStats(roomId) {
    const room = rooms.get(roomId);
    if (!room) return;
    const payload = {
      type: "room-stats",
      viewers: room.viewers.size,
      comments: room.comments.length,
      likes: room.likedBy.size,
    };
    safeSend(room.host, payload);
    for (const [, vws] of room.viewers) {
      safeSend(vws, payload);
    }
  }

  /**
   * @param {import('ws').WebSocket} ws
   * @param {Record<string, unknown>} msg
   */
  function handleMessage(ws, msg) {
    if (!msg || typeof msg.type !== "string") return;

    switch (msg.type) {
      case "host-start": {
        if (ws.__liveInfo) return;
        let roomId = makeRoomId();
        while (rooms.has(roomId)) roomId = makeRoomId();
        rooms.set(roomId, {
          host: ws,
          viewers: new Map(),
          comments: [],
          raisedHands: new Set(),
          mediaAllowed: new Set(),
          likedBy: new Set(),
        });
        ws.__liveInfo = { role: "host", roomId };
        safeSend(ws, { type: "room-ready", roomId });
        broadcastRoomStats(roomId);
        return;
      }

      case "viewer-join": {
        if (ws.__liveInfo) return;
        const roomId = normalizeRoomId(msg.roomId);
        if (!roomId) {
          safeSend(ws, {
            type: "error",
            message: "Mã phòng không hợp lệ (4–64 ký tự: chữ, số, _ hoặc -).",
          });
          return;
        }
        const room = rooms.get(roomId);
        if (!room || !room.host || room.host.readyState !== 1) {
          safeSend(ws, {
            type: "error",
            message: "Phòng không tồn tại hoặc host đã ngắt.",
          });
          return;
        }
        if (room.viewers.size >= maxViewersPerRoom) {
          safeSend(ws, {
            type: "error",
            message: `Phòng đã đạt giới hạn ${maxViewersPerRoom} người xem (bản demo).`,
          });
          return;
        }
        const viewerId = makeId();
        room.viewers.set(viewerId, ws);
        ws.__liveInfo = { role: "viewer", roomId, viewerId };
        safeSend(ws, {
          type: "joined",
          viewerId,
          viewers: room.viewers.size,
          comments: room.comments.length,
          likes: room.likedBy.size,
        });
        safeSend(room.host, { type: "viewer-joined", viewerId });
        broadcastRoomStats(roomId);
        return;
      }

      case "comment-add": {
        const info = ws.__liveInfo;
        if (!info || info.role !== "viewer") return;
        const room = rooms.get(info.roomId);
        if (!room) return;
        const textRaw = typeof msg.text === "string" ? msg.text : "";
        const text = textRaw.trim().slice(0, 300);
        if (!text) return;
        const comment = {
          id: makeId(),
          viewerId: info.viewerId,
          text,
          createdAt: new Date().toISOString(),
        };
        room.comments.push(comment);
        if (room.comments.length > 300) {
          room.comments.shift();
        }
        const payload = {
          type: "room-comment",
          id: comment.id,
          viewerId: comment.viewerId,
          text: comment.text,
          createdAt: comment.createdAt,
        };
        safeSend(room.host, payload);
        for (const [, vws] of room.viewers) {
          safeSend(vws, payload);
        }
        broadcastRoomStats(info.roomId);
        return;
      }

      case "offer": {
        const info = ws.__liveInfo;
        if (!info || info.role !== "host") return;
        const viewerId = msg.viewerId;
        const sdp = msg.sdp;
        if (typeof viewerId !== "string" || !sdp) return;
        const room = rooms.get(info.roomId);
        const vws = room?.viewers.get(viewerId);
        if (vws && vws.readyState === 1) {
          safeSend(vws, { type: "offer", sdp });
        }
        return;
      }

      case "answer": {
        const info = ws.__liveInfo;
        if (!info || info.role !== "viewer") return;
        const sdp = msg.sdp;
        if (!sdp) return;
        const room = rooms.get(info.roomId);
        if (room?.host && room.host.readyState === 1) {
          safeSend(room.host, {
            type: "answer",
            viewerId: info.viewerId,
            sdp,
          });
        }
        return;
      }

      case "ice-host": {
        const info = ws.__liveInfo;
        if (!info || info.role !== "host") return;
        const viewerId = msg.viewerId;
        const candidate = msg.candidate;
        if (typeof viewerId !== "string" || !candidate) return;
        const room = rooms.get(info.roomId);
        const vws = room?.viewers.get(viewerId);
        if (vws && vws.readyState === 1) {
          safeSend(vws, { type: "ice", candidate });
        }
        return;
      }

      case "ice-viewer": {
        const info = ws.__liveInfo;
        if (!info || info.role !== "viewer") return;
        const candidate = msg.candidate;
        if (!candidate) return;
        const room = rooms.get(info.roomId);
        if (room?.host && room.host.readyState === 1) {
          safeSend(room.host, {
            type: "ice",
            viewerId: info.viewerId,
            candidate,
          });
        }
        return;
      }

      case "like-toggle": {
        const info = ws.__liveInfo;
        if (!info || info.role !== "viewer") return;
        const room = rooms.get(info.roomId);
        if (!room) return;
        if (room.likedBy.has(info.viewerId)) {
          room.likedBy.delete(info.viewerId);
        } else {
          room.likedBy.add(info.viewerId);
        }
        const liked = room.likedBy.has(info.viewerId);
        const likes = room.likedBy.size;
        safeSend(ws, { type: "like-state", liked, likes });
        broadcastRoomStats(info.roomId);
        return;
      }

      case "raise-hand": {
        const info = ws.__liveInfo;
        if (!info || info.role !== "viewer") return;
        const room = rooms.get(info.roomId);
        if (!room?.host || room.host.readyState !== 1) return;
        const raised = Boolean(msg.raised);
        if (raised) room.raisedHands.add(info.viewerId);
        else room.raisedHands.delete(info.viewerId);
        safeSend(room.host, {
          type: "raise-hand",
          viewerId: info.viewerId,
          raised,
        });
        return;
      }

      case "host-allow-media": {
        const info = ws.__liveInfo;
        if (!info || info.role !== "host") return;
        const viewerId = msg.viewerId;
        if (typeof viewerId !== "string") return;
        const room = rooms.get(info.roomId);
        const vws = room?.viewers.get(viewerId);
        if (!vws || vws.readyState !== 1) return;
        room.mediaAllowed.add(viewerId);
        safeSend(vws, { type: "media-allowed" });
        return;
      }

      case "host-revoke-media": {
        const info = ws.__liveInfo;
        if (!info || info.role !== "host") return;
        const viewerId = msg.viewerId;
        if (typeof viewerId !== "string") return;
        const room = rooms.get(info.roomId);
        const vws = room?.viewers.get(viewerId);
        room?.mediaAllowed.delete(viewerId);
        if (vws && vws.readyState === 1) {
          safeSend(vws, { type: "media-revoked" });
        }
        return;
      }

      case "media-reoffer": {
        const info = ws.__liveInfo;
        if (!info || info.role !== "viewer") return;
        const sdp = msg.sdp;
        if (!sdp) return;
        const room = rooms.get(info.roomId);
        if (room?.host && room.host.readyState === 1) {
          safeSend(room.host, {
            type: "media-reoffer",
            viewerId: info.viewerId,
            sdp,
          });
        }
        return;
      }

      case "media-reanswer": {
        const info = ws.__liveInfo;
        if (!info || info.role !== "host") return;
        const viewerId = msg.viewerId;
        const sdp = msg.sdp;
        if (typeof viewerId !== "string" || !sdp) return;
        const room = rooms.get(info.roomId);
        const vws = room?.viewers.get(viewerId);
        if (vws && vws.readyState === 1) {
          safeSend(vws, { type: "media-reanswer", sdp });
        }
        return;
      }

      default:
        break;
    }
  }

  /**
   * @param {import('ws').WebSocket} ws
   */
  function handleClose(ws) {
    const info = ws.__liveInfo;
    if (!info) return;

    if (info.role === "host") {
      const room = rooms.get(info.roomId);
      if (room) {
        for (const [, vws] of room.viewers) {
          safeSend(vws, { type: "host-left" });
          try {
            vws.close();
          } catch {
            /* ignore */
          }
        }
      }
      rooms.delete(info.roomId);
    } else if (info.role === "viewer") {
      const room = rooms.get(info.roomId);
      if (room) {
        room.viewers.delete(info.viewerId);
        room.raisedHands.delete(info.viewerId);
        room.mediaAllowed.delete(info.viewerId);
        room.likedBy.delete(info.viewerId);
        if (room.host && room.host.readyState === 1) {
          safeSend(room.host, { type: "viewer-left", viewerId: info.viewerId });
        }
        broadcastRoomStats(info.roomId);
      }
    }
    delete ws.__liveInfo;
  }

  /**
   * @returns {Array<{ roomId: string, viewers: number, comments: number, likes: number, raisedHands: number }>}
   */
  function listRoomsSnapshot() {
    const out = [];
    for (const [roomId, room] of rooms.entries()) {
      out.push({
        roomId,
        viewers: room.viewers.size,
        comments: room.comments.length,
        likes: room.likedBy.size,
        raisedHands: room.raisedHands.size,
      });
    }
    return out;
  }

  /**
   * Đóng phòng admin (ngắt host + viewer, giống host thoát).
   * @param {string} roomId
   * @returns {boolean}
   */
  function forceCloseRoom(roomId) {
    const id = normalizeRoomId(roomId);
    if (!id) return false;
    const room = rooms.get(id);
    if (!room) return false;
    for (const [, vws] of room.viewers) {
      safeSend(vws, { type: "host-left" });
      try {
        vws.close();
      } catch {
        /* ignore */
      }
    }
    try {
      room.host.close();
    } catch {
      /* ignore */
    }
    rooms.delete(id);
    return true;
  }

  return {
    handleMessage,
    handleClose,
    hasRoom,
    viewerCount,
    commentCount,
    likeCount,
    listRoomsSnapshot,
    forceCloseRoom,
  };
}

function safeSend(ws, payload) {
  try {
    if (ws.readyState === 1) ws.send(JSON.stringify(payload));
  } catch {
    /* ignore */
  }
}

module.exports = { createLiveRooms, makeRoomId, normalizeRoomId };
