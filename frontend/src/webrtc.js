/** @type {RTCIceServer[]} */
export const ICE_SERVERS = [{ urls: "stun:stun.l.google.com:19302" }];

export function getSignalUrl() {
  if (import.meta.env.DEV) {
    return "ws://localhost:3001/live-signal";
  }
  const wsProto = window.location.protocol === "https:" ? "wss:" : "ws:";
  const port = import.meta.env.VITE_SIGNAL_PORT || "3001";
  return `${wsProto}//${window.location.hostname}:${port}/live-signal`;
}
