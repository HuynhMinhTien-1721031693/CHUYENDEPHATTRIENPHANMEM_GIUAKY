/**
 * Xử lý ICE đến trước khi setRemoteDescription (tránh lỗi thứ tự WebRTC).
 * @param {RTCPeerConnection} pc
 * @param {RTCIceCandidateInit} candidate
 * @param {RTCIceCandidateInit[]} buffer
 */
export async function addIceWhenReady(pc, candidate, buffer) {
  if (!pc) return;
  if (pc.remoteDescription) {
    try {
      await pc.addIceCandidate(candidate);
    } catch {
      /* ignore */
    }
  } else {
    buffer.push(candidate);
  }
}

/**
 * @param {RTCPeerConnection} pc
 * @param {RTCIceCandidateInit[]} buffer
 */
export async function flushIceBuffer(pc, buffer) {
  if (!pc) return;
  while (buffer.length > 0) {
    const c = buffer.shift();
    try {
      await pc.addIceCandidate(c);
    } catch {
      /* ignore */
    }
  }
}
