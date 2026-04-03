import { useCallback, useEffect, useRef, useState } from "react";
import { addIceWhenReady, flushIceBuffer } from "../iceBuffer.js";
import { getSignalUrl, ICE_SERVERS } from "../webrtc.js";
import { startVirtualBackground, VB_PRESETS } from "../virtualBackground.js";

/** @param {{ stream: MediaStream; label: string }} props */
function RemoteViewerReturnVideo({ stream, label }) {
  const r = useRef(/** @type {HTMLVideoElement | null} */ (null));
  useEffect(() => {
    const el = r.current;
    if (el) el.srcObject = stream;
    return () => {
      if (el) el.srcObject = null;
    };
  }, [stream]);
  return (
    <div className="viewer-return-tile">
      <p className="muted small viewer-return-label">{label}</p>
      <video ref={r} autoPlay playsInline className="video video--small" />
    </div>
  );
}

export default function HostLive() {
  const videoRef = useRef(null);
  const wsRef = useRef(null);
  /** Luồng gửi đi (thô hoặc đã ghép nền ảo) */
  const streamRef = useRef(null);
  /** Luôn là luồng camera/mic gốc từ getUserMedia */
  const rawStreamRef = useRef(null);
  const vbStopRef = useRef(/** @type {null | (() => void)} */ (null));
  const vbStyleRef = useRef({ color: VB_PRESETS[0].color });
  const [vbColorHex, setVbColorHex] = useState(VB_PRESETS[0].color);
  /** @type {React.MutableRefObject<Map<string, RTCPeerConnection>>} */
  const pcsRef = useRef(new Map());
  /** @type {React.MutableRefObject<Map<string, RTCIceCandidateInit[]>>} */
  const iceBuffersRef = useRef(new Map());

  const [roomId, setRoomId] = useState("");
  const [status, setStatus] = useState("Đang kết nối server…");
  const [error, setError] = useState("");
  const [copyHint, setCopyHint] = useState("");
  const [comments, setComments] = useState([]);
  const [vbEnabled, setVbEnabled] = useState(false);
  const [vbLoading, setVbLoading] = useState(false);
  const [vbPreset, setVbPreset] = useState(VB_PRESETS[0].key);
  /** @type {Record<string, { raised: boolean; allowed: boolean }>} */
  const [viewerMeta, setViewerMeta] = useState({});
  /** @type {Record<string, MediaStream>} */
  const [viewerRemoteStreams, setViewerRemoteStreams] = useState({});
  const [likeCount, setLikeCount] = useState(0);

  const watchUrl =
    typeof window !== "undefined" && roomId
      ? `${window.location.origin}/watch/${encodeURIComponent(roomId)}`
      : "";

  const attachViewer = useCallback(async (viewerId) => {
    const stream = streamRef.current;
    const ws = wsRef.current;
    if (!stream || !ws || ws.readyState !== WebSocket.OPEN) return;

    const iceBuf = [];
    iceBuffersRef.current.set(viewerId, iceBuf);

    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    pcsRef.current.set(viewerId, pc);

    stream.getTracks().forEach((t) => pc.addTrack(t, stream));

    pc.onicecandidate = (e) => {
      if (e.candidate && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "ice-host", viewerId, candidate: e.candidate }));
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "failed" || pc.connectionState === "disconnected") {
        setStatus(`Kết nối viewer ${viewerId.slice(0, 4)}…: ${pc.connectionState}`);
      }
      if (pc.connectionState === "connected") {
        setStatus("Đang phát — có viewer kết nối ổn định");
      }
    };

    pc.ontrack = (ev) => {
      const [stream] = ev.streams;
      if (stream) {
        setViewerRemoteStreams((prev) => ({ ...prev, [viewerId]: stream }));
      }
    };

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    ws.send(JSON.stringify({ type: "offer", viewerId, sdp: pc.localDescription }));
  }, []);

  const replaceOutgoingVideo = useCallback(async (videoTrack) => {
    for (const pc of pcsRef.current.values()) {
      const sender = pc.getSenders().find((s) => s.track?.kind === "video");
      if (sender && videoTrack) {
        await sender.replaceTrack(videoTrack);
      }
    }
  }, []);

  useEffect(() => {
    let ws;
    let cancelled = false;

    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
          audio: true,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        rawStreamRef.current = stream;
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch {
        setError("Không lấy được camera/mic. Kiểm tra quyền trình duyệt và HTTPS (localhost được phép).");
        setStatus("Lỗi thiết bị");
        return;
      }

      ws = new WebSocket(getSignalUrl());
      wsRef.current = ws;

      ws.onopen = () => {
        setStatus("Đã kết nối — tạo phòng…");
        ws.send(JSON.stringify({ type: "host-start" }));
      };

      ws.onmessage = async (ev) => {
        let msg;
        try {
          msg = JSON.parse(ev.data);
        } catch {
          return;
        }

        if (msg.type === "room-ready") {
          setRoomId(msg.roomId);
          setStatus("Đang chờ người xem…");
          setLikeCount(0);
          return;
        }

        if (msg.type === "room-stats") {
          if (typeof msg.likes === "number") setLikeCount(msg.likes);
          return;
        }

        if (msg.type === "viewer-joined") {
          setStatus("Viewer mới — thiết lập WebRTC…");
          setViewerMeta((prev) => ({
            ...prev,
            [msg.viewerId]: { raised: false, allowed: false },
          }));
          try {
            await attachViewer(msg.viewerId);
          } catch {
            setError("Không tạo được kết nối WebRTC.");
          }
          return;
        }

        if (msg.type === "raise-hand" && typeof msg.viewerId === "string") {
          setViewerMeta((prev) => ({
            ...prev,
            [msg.viewerId]: {
              raised: Boolean(msg.raised),
              allowed: prev[msg.viewerId]?.allowed ?? false,
            },
          }));
          if (msg.raised) {
            setStatus(`Viewer ${msg.viewerId.slice(0, 4)}… đang giơ tay — xem danh sách bên dưới.`);
          }
          return;
        }

        if (msg.type === "media-reoffer" && msg.viewerId && msg.sdp) {
          const pc = pcsRef.current.get(msg.viewerId);
          const wsCur = wsRef.current;
          if (!pc || !wsCur || wsCur.readyState !== WebSocket.OPEN) return;
          try {
            await pc.setRemoteDescription(msg.sdp);
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            wsCur.send(
              JSON.stringify({
                type: "media-reanswer",
                viewerId: msg.viewerId,
                sdp: pc.localDescription,
              })
            );
          } catch {
            setError("Không hoàn tất kết nối camera/mic từ viewer.");
          }
          return;
        }

        if (msg.type === "answer") {
          const pc = pcsRef.current.get(msg.viewerId);
          if (pc && msg.sdp) {
            await pc.setRemoteDescription(msg.sdp);
            const buf = iceBuffersRef.current.get(msg.viewerId) || [];
            await flushIceBuffer(pc, buf);
            setStatus("Đang phát");
          }
          return;
        }

        if (msg.type === "ice" && msg.viewerId && msg.candidate) {
          const pc = pcsRef.current.get(msg.viewerId);
          const buf = iceBuffersRef.current.get(msg.viewerId) || [];
          await addIceWhenReady(pc, msg.candidate, buf);
          return;
        }

        if (msg.type === "viewer-left") {
          const pc = pcsRef.current.get(msg.viewerId);
          pc?.close();
          pcsRef.current.delete(msg.viewerId);
          iceBuffersRef.current.delete(msg.viewerId);
          setViewerMeta((prev) => {
            const next = { ...prev };
            delete next[msg.viewerId];
            return next;
          });
          setViewerRemoteStreams((prev) => {
            const next = { ...prev };
            delete next[msg.viewerId];
            return next;
          });
          setStatus("Viewer đã rời — vẫn có thể chờ người khác.");
          return;
        }

        if (msg.type === "room-comment" && typeof msg.text === "string") {
          setComments((prev) => {
            const next = [
              ...prev,
              {
                id: String(msg.id || crypto.randomUUID()),
                viewerId: String(msg.viewerId || ""),
                text: msg.text,
              },
            ];
            return next.slice(-100);
          });
        }
      };

      ws.onerror = () => {
        setError("Lỗi WebSocket — hãy chạy backend (npm run dev trong thư mục backend).");
      };

      ws.onclose = () => {
        if (!cancelled) setStatus("Mất kết nối server.");
      };
    })();

    return () => {
      cancelled = true;
      pcsRef.current.forEach((pc) => pc.close());
      pcsRef.current.clear();
      iceBuffersRef.current.clear();
      vbStopRef.current?.();
      vbStopRef.current = null;
      rawStreamRef.current?.getTracks().forEach((t) => t.stop());
      rawStreamRef.current = null;
      streamRef.current = null;
      try {
        ws?.close();
      } catch {
        /* ignore */
      }
      wsRef.current = null;
    };
  }, [attachViewer]);

  async function toggleVirtualBackground() {
    const raw = rawStreamRef.current;
    if (!raw || vbLoading) return;

    if (!vbEnabled) {
      setVbLoading(true);
      setError("");
      try {
        vbStyleRef.current.color = vbColorHex;
        const { outgoingStream, stop } = await startVirtualBackground(raw, vbStyleRef.current);
        vbStopRef.current = stop;
        streamRef.current = outgoingStream;
        if (videoRef.current) {
          videoRef.current.srcObject = outgoingStream;
        }
        const v = outgoingStream.getVideoTracks()[0];
        if (v) await replaceOutgoingVideo(v);
        setVbEnabled(true);
      } catch {
        setError(
          "Không bật được thay nền (cần tải mô hình từ mạng). Thử lại, hoặc kiểm tra chặn CDN / tải lại trang."
        );
      } finally {
        setVbLoading(false);
      }
      return;
    }

    setVbLoading(true);
    vbStopRef.current?.();
    vbStopRef.current = null;
    streamRef.current = raw;
    if (videoRef.current) {
      videoRef.current.srcObject = raw;
    }
    const v = raw.getVideoTracks()[0];
    if (v) await replaceOutgoingVideo(v);
    setVbEnabled(false);
    setVbLoading(false);
  }

  function selectVbPreset(key) {
    const p = VB_PRESETS.find((x) => x.key === key);
    if (!p) return;
    vbStyleRef.current.color = p.color;
    setVbColorHex(p.color);
    setVbPreset(key);
  }

  function allowViewerMedia(viewerId) {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    ws.send(JSON.stringify({ type: "host-allow-media", viewerId }));
    setViewerMeta((prev) => ({
      ...prev,
      [viewerId]: { ...prev[viewerId], raised: prev[viewerId]?.raised ?? false, allowed: true },
    }));
  }

  function revokeViewerMedia(viewerId) {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    ws.send(JSON.stringify({ type: "host-revoke-media", viewerId }));
    setViewerMeta((prev) => ({
      ...prev,
      [viewerId]: { ...prev[viewerId], raised: prev[viewerId]?.raised ?? false, allowed: false },
    }));
    setViewerRemoteStreams((prev) => {
      const next = { ...prev };
      delete next[viewerId];
      return next;
    });
  }

  function copyLink() {
    if (!watchUrl) return;
    navigator.clipboard.writeText(watchUrl).then(
      () => {
        setCopyHint("Đã sao chép link.");
        setTimeout(() => setCopyHint(""), 2500);
      },
      () => setCopyHint("Không sao chép được — chọn ô link và Ctrl+C.")
    );
  }

  return (
    <div className="stack">
      <div className="sr-only" aria-live="polite">
        {status}
      </div>

      <header className="page-intro">
        <h1 className="page-title">Phát trực tiếp</h1>
        <p className="page-subtitle">Giữ tab này mở trong lúc có người xem. Tắt tab sẽ dừng phòng.</p>
      </header>

      {error ? (
        <div className="banner error" role="alert">
          {error}
        </div>
      ) : null}
      {copyHint ? (
        <div className="banner ok" role="status">
          {copyHint}
        </div>
      ) : null}

      <div className="card">
        <h2 className="card-title-row">Phòng của bạn</h2>
        <p className={`status-pill ${error ? "status-pill--error" : ""}`} aria-live="polite">
          {status}
        </p>
        {roomId ? (
          <div className="room-box">
            <p>
              <strong>Mã phòng:</strong> <code className="code-lg">{roomId}</code>
            </p>
            <p className="muted small">
              Lượt thích từ người xem: <strong>{likeCount}</strong>
            </p>
            <p className="muted small">Link cho viewer:</p>
            <div className="link-row">
              <input className="full-input grow" readOnly value={watchUrl} onFocus={(e) => e.target.select()} />
              <button type="button" className="btn primary shrink" onClick={copyLink}>
                Sao chép
              </button>
            </div>
          </div>
        ) : null}
      </div>

      <div className="card vb-card">
        <h3 className="card-title-row">Riêng tư — thay nền sau lưng</h3>
        <p className="muted small vb-lead">
          Chỉ <strong>người bạn</strong> được giữ; nền phòng thật được thay bằng màu bạn chọn. Người xem nhìn thấy
          luồng đã xử lý (chạy trên máy bạn, cần GPU/CPU đủ mạnh).
        </p>
        <div className="vb-toolbar">
          <button
            type="button"
            className={`btn ${vbEnabled ? "" : "primary"}`}
            onClick={() => void toggleVirtualBackground()}
            disabled={vbLoading}
            aria-pressed={vbEnabled}
          >
            {vbLoading ? "Đang xử lý…" : vbEnabled ? "Tắt thay nền" : "Bật thay nền"}
          </button>
        </div>
        {vbEnabled ? (
          <div className="vb-presets" role="group" aria-label="Chọn màu nền thay thế">
            <p className="muted small vb-presets-label">Màu nền:</p>
            <div className="vb-preset-row">
              {VB_PRESETS.map((p) => (
                <button
                  key={p.key}
                  type="button"
                  className={`vb-swatch ${vbPreset === p.key ? "vb-swatch--on" : ""}`}
                  style={{ backgroundColor: p.color }}
                  title={p.label}
                  aria-label={p.label}
                  aria-pressed={vbPreset === p.key}
                  onClick={() => selectVbPreset(p.key)}
                />
              ))}
              <label className="vb-color-custom">
                <span className="sr-only">Tùy chỉnh màu</span>
                <input
                  type="color"
                  value={vbColorHex}
                  onChange={(e) => {
                    const v = e.target.value;
                    vbStyleRef.current.color = v;
                    setVbColorHex(v);
                    setVbPreset("custom");
                  }}
                  aria-label="Chọn màu tùy ý"
                />
              </label>
            </div>
          </div>
        ) : null}
      </div>

      <div className="card">
        <h3 className="card-title-row">Giơ tay &amp; giao lưu (camera/mic viewer)</h3>
        <p className="muted small">
          Khi viewer <strong>giơ tay</strong>, bạn thấy cảnh báo ở đây. Bấm <strong>Cho phép phát</strong> để họ có thể
          bật camera/mic trả lời; <strong>Thu quyền</strong> để tắt luồng từ họ.
        </p>
        {Object.keys(viewerMeta).length === 0 ? (
          <p className="muted small">Chưa có viewer kết nối.</p>
        ) : (
          <ul className="viewer-interact-list">
            {Object.entries(viewerMeta).map(([vid, meta]) => (
              <li key={vid} className="viewer-interact-row">
                <div className="viewer-interact-info">
                  <span className="viewer-id-label">Viewer {vid.slice(0, 6)}…</span>
                  {meta.raised ? (
                    <span className="viewer-hand-badge" role="status">
                      Đang giơ tay
                    </span>
                  ) : null}
                  {meta.allowed ? (
                    <span className="viewer-allowed-badge" role="status">
                      Được phép phát
                    </span>
                  ) : null}
                </div>
                <div className="viewer-interact-actions">
                  <button type="button" className="btn primary shrink" onClick={() => allowViewerMedia(vid)}>
                    Cho phép phát
                  </button>
                  <button type="button" className="btn shrink" onClick={() => revokeViewerMedia(vid)}>
                    Thu quyền
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
        {Object.keys(viewerRemoteStreams).length > 0 ? (
          <div className="viewer-return-grid">
            <p className="muted small">Luồng từ viewer (sau khi họ bật camera/mic):</p>
            <div className="viewer-return-videos">
              {Object.entries(viewerRemoteStreams).map(([vid, stream]) => (
                <RemoteViewerReturnVideo key={vid} stream={stream} label={`Viewer ${vid.slice(0, 6)}…`} />
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <div className="host-live-layout">
        <div className="video-wrap card">
          <h3>Xem trước (local)</h3>
          <video ref={videoRef} autoPlay playsInline muted className="video" />
        </div>

        <div className="card host-comments">
          <h3>Bình luận từ người xem</h3>
          <div className="stack small host-comments-list">
            {comments.length ? (
              comments.map((item) => (
                <p key={item.id} className="muted small">
                  <strong>{item.viewerId ? `Viewer ${item.viewerId.slice(0, 4)}` : "Viewer"}:</strong> {item.text}
                </p>
              ))
            ) : (
              <p className="muted small">Chưa có bình luận.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
