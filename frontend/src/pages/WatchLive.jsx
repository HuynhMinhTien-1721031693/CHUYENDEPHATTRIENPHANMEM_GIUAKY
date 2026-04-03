import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { checkRoomExists } from "../api.js";
import { addIceWhenReady, flushIceBuffer } from "../iceBuffer.js";
import { normalizeRoomCode } from "../roomCode.js";
import { getSignalUrl, ICE_SERVERS } from "../webrtc.js";

/** @param {{ stream: MediaStream }} props */
function SelfPublishPreview({ stream }) {
  const r = useRef(/** @type {HTMLVideoElement | null} */ (null));
  useEffect(() => {
    const el = r.current;
    if (el) el.srcObject = stream;
    return () => {
      if (el) el.srcObject = null;
    };
  }, [stream]);
  return <video ref={r} autoPlay playsInline muted className="video video--small" />;
}

export default function WatchLive() {
  const { roomId: roomIdParam } = useParams();
  const roomId = normalizeRoomCode(decodeURIComponent(roomIdParam || ""));

  const videoRef = useRef(null);
  const wsRef = useRef(null);
  const pcRef = useRef(null);
  const iceBufferRef = useRef(/** @type {RTCIceCandidateInit[]} */ ([]));
  const publishStreamRef = useRef(/** @type {MediaStream | null} */ (null));
  const shareDialogRef = useRef(/** @type {HTMLDialogElement | null} */ (null));

  const [status, setStatus] = useState("Đang kiểm tra phòng…");
  const [error, setError] = useState("");
  const [viewerCount, setViewerCount] = useState(0);
  const [commentCount, setCommentCount] = useState(0);
  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState([]);
  const [handRaised, setHandRaised] = useState(false);
  const [mediaAllowed, setMediaAllowed] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishStream, setPublishStream] = useState(/** @type {MediaStream | null} */ (null));
  const [publishBusy, setPublishBusy] = useState(false);
  const [publishHint, setPublishHint] = useState("");
  const [likeCount, setLikeCount] = useState(0);
  const [iLiked, setILiked] = useState(false);
  const [shareCopyHint, setShareCopyHint] = useState("");

  const shareWatchUrl =
    typeof window !== "undefined" && roomId
      ? `${window.location.origin}/watch/${encodeURIComponent(roomId)}`
      : "";

  const stopViewerPublish = useCallback(async () => {
    const pub = publishStreamRef.current;
    publishStreamRef.current = null;
    setPublishStream(null);
    setPublishing(false);
    if (pub) {
      pub.getTracks().forEach((t) => t.stop());
    }
    const pc = pcRef.current;
    const ws = wsRef.current;
    if (!pc) return;
    for (const sender of pc.getSenders()) {
      if (sender.track) {
        await sender.replaceTrack(null);
      }
    }
    if (ws && ws.readyState === WebSocket.OPEN) {
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        ws.send(JSON.stringify({ type: "media-reoffer", sdp: pc.localDescription }));
      } catch {
        /* ignore */
      }
    }
  }, []);

  const startViewerPublish = useCallback(async () => {
    const pc = pcRef.current;
    const ws = wsRef.current;
    if (!pc || !ws || ws.readyState !== WebSocket.OPEN || !mediaAllowed) {
      setPublishHint("Host chưa cho phép hoặc chưa kết nối.");
      return;
    }
    setPublishBusy(true);
    setPublishHint("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: true,
      });
      publishStreamRef.current = stream;
      setPublishStream(stream);
      stream.getTracks().forEach((t) => pc.addTrack(t, stream));
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      ws.send(JSON.stringify({ type: "media-reoffer", sdp: pc.localDescription }));
      setPublishing(true);
    } catch {
      publishStreamRef.current?.getTracks().forEach((t) => t.stop());
      publishStreamRef.current = null;
      setPublishStream(null);
      for (const sender of pc.getSenders()) {
        if (sender.track) {
          await sender.replaceTrack(null);
        }
      }
      setPublishHint("Không bật được camera/mic. Kiểm tra quyền trình duyệt.");
    } finally {
      setPublishBusy(false);
    }
  }, [mediaAllowed]);

  useEffect(() => {
    if (!roomId) {
      setError("Mã phòng không hợp lệ (4–64 ký tự: chữ thường, số, _ hoặc -).");
      setStatus("Lỗi");
      return;
    }

    let ws;
    let cancelled = false;

    (async () => {
      try {
        const info = await checkRoomExists(roomId);
        if (cancelled) return;
        if (!info.validFormat) {
          setError("Mã phòng không hợp lệ.");
          setStatus("Lỗi");
          return;
        }
        if (!info.exists) {
          setError("Phòng không tồn tại hoặc host chưa tạo phòng. Hãy đợi host mở trang phát.");
          setStatus("Lỗi");
          return;
        }
        setViewerCount(typeof info.viewers === "number" ? info.viewers : 0);
        setCommentCount(typeof info.comments === "number" ? info.comments : 0);
        setLikeCount(typeof info.likes === "number" ? info.likes : 0);
      } catch {
        if (cancelled) return;
        setError("Không gọi được API — chạy backend (port 3001) và thử lại.");
        setStatus("Lỗi");
        return;
      }

      if (cancelled) return;

      iceBufferRef.current = [];

      ws = new WebSocket(getSignalUrl());
      wsRef.current = ws;

      ws.onopen = () => {
        setStatus("Đang vào phòng…");
        ws.send(JSON.stringify({ type: "viewer-join", roomId }));
      };

      ws.onmessage = async (ev) => {
        let msg;
        try {
          msg = JSON.parse(ev.data);
        } catch {
          return;
        }

        if (msg.type === "error") {
          setError(msg.message || "Không vào được phòng.");
          setStatus("Lỗi");
          return;
        }

        if (msg.type === "joined") {
          setStatus("Đã vào phòng — chờ tín hiệu từ host…");
          if (typeof msg.viewers === "number") setViewerCount(msg.viewers);
          if (typeof msg.comments === "number") setCommentCount(msg.comments);
          if (typeof msg.likes === "number") setLikeCount(msg.likes);
          return;
        }

        if (msg.type === "room-stats") {
          if (typeof msg.viewers === "number") setViewerCount(msg.viewers);
          if (typeof msg.comments === "number") setCommentCount(msg.comments);
          if (typeof msg.likes === "number") setLikeCount(msg.likes);
          return;
        }

        if (msg.type === "like-state") {
          if (typeof msg.liked === "boolean") setILiked(msg.liked);
          if (typeof msg.likes === "number") setLikeCount(msg.likes);
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
          return;
        }

        if (msg.type === "media-allowed") {
          setMediaAllowed(true);
          setPublishHint("Host đã cho phép — bạn có thể bật camera và mic để giao lưu.");
          return;
        }

        if (msg.type === "media-revoked") {
          setMediaAllowed(false);
          setHandRaised(false);
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: "raise-hand", raised: false }));
          }
          setPublishHint("Host đã thu quyền phát. Luồng camera/mic của bạn đã tắt.");
          await stopViewerPublish();
          return;
        }

        if (msg.type === "media-reanswer" && msg.sdp) {
          const pc = pcRef.current;
          if (!pc) return;
          try {
            await pc.setRemoteDescription(msg.sdp);
          } catch {
            setPublishHint("Không đồng bộ được tín hiệu với host. Thử tắt rồi bật lại camera.");
          }
          return;
        }

        if (msg.type === "offer" && msg.sdp) {
          if (cancelled) return;
          const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
          pcRef.current = pc;

          pc.ontrack = (e) => {
            if (videoRef.current && e.streams[0]) {
              videoRef.current.srcObject = e.streams[0];
            }
          };

          pc.onicecandidate = (e) => {
            if (e.candidate && ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ type: "ice-viewer", candidate: e.candidate }));
            }
          };

          pc.onconnectionstatechange = () => {
            if (pc.connectionState === "connected") {
              setStatus("Đang xem — kết nối ổn định");
            }
          };

          await pc.setRemoteDescription(msg.sdp);
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          await flushIceBuffer(pc, iceBufferRef.current);
          ws.send(JSON.stringify({ type: "answer", sdp: pc.localDescription }));
          setStatus("Đang nhận stream…");
          return;
        }

        if (msg.type === "ice" && msg.candidate) {
          const pc = pcRef.current;
          if (!pc) {
            iceBufferRef.current.push(msg.candidate);
            return;
          }
          await addIceWhenReady(pc, msg.candidate, iceBufferRef.current);
          return;
        }

        if (msg.type === "host-left") {
          setError("Host đã dừng phát.");
          setStatus("Kết thúc");
          pcRef.current?.close();
          pcRef.current = null;
        }
      };

      ws.onerror = () => {
        setError("Lỗi WebSocket — chạy backend trước.");
      };

      ws.onclose = () => {
        if (!cancelled) setStatus((s) => (s.startsWith("Lỗi") ? s : "Đã ngắt kết nối."));
      };
    })();

    return () => {
      cancelled = true;
      publishStreamRef.current?.getTracks().forEach((t) => t.stop());
      publishStreamRef.current = null;
      pcRef.current?.close();
      pcRef.current = null;
      iceBufferRef.current = [];
      try {
        ws?.close();
      } catch {
        /* ignore */
      }
      wsRef.current = null;
    };
  }, [roomId, stopViewerPublish]);

  function sendComment(event) {
    event.preventDefault();
    const ws = wsRef.current;
    const text = commentText.trim();
    if (!ws || ws.readyState !== WebSocket.OPEN || !text) return;
    ws.send(JSON.stringify({ type: "comment-add", text }));
    setCommentText("");
  }

  function toggleRaiseHand() {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    const next = !handRaised;
    ws.send(JSON.stringify({ type: "raise-hand", raised: next }));
    setHandRaised(next);
  }

  function toggleLike() {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN || error) return;
    ws.send(JSON.stringify({ type: "like-toggle" }));
  }

  function openShareDialog() {
    setShareCopyHint("");
    shareDialogRef.current?.showModal();
  }

  function copyShareLink() {
    if (!shareWatchUrl) return;
    navigator.clipboard.writeText(shareWatchUrl).then(
      () => {
        setShareCopyHint("Đã sao chép link — gửi cho bạn bè để họ vào xem.");
        setTimeout(() => setShareCopyHint(""), 2800);
      },
      () => setShareCopyHint("Không sao chép tự động được — chọn ô link và Ctrl+C.")
    );
  }

  async function nativeShareLink() {
    if (!shareWatchUrl) return;
    if (!navigator.share) {
      setShareCopyHint('Trình duyệt không có chia sẻ nhanh — dùng "Sao chép link".');
      return;
    }
    try {
      await navigator.share({
        title: "Mời xem live",
        text: "Vào link này để xem cùng phòng live.",
        url: shareWatchUrl,
      });
    } catch {
      /* người dùng hủy */
    }
  }

  return (
    <div className="stack">
      <div className="sr-only" aria-live="polite">
        {status}
      </div>

      <header className="page-intro">
        <h1 className="page-title">Đang xem phòng</h1>
        <p className="page-subtitle">Video có thể mất vài giây sau khi host đã sẵn sàng.</p>
      </header>

      {error ? (
        <div className="banner error" role="alert">
          {error}
        </div>
      ) : null}

      <div className="card">
        <h2 className="card-title-row">Thông tin phòng</h2>
        <dl className="meta-list">
          <div className="meta-row">
            <dt>Mã phòng</dt>
            <dd>
              <code className="code-lg">{roomId || "—"}</code>
            </dd>
          </div>
          <div className="meta-row">
            <dt>Trạng thái</dt>
            <dd>
              <span className={`status-pill ${error ? "status-pill--error" : ""}`} aria-live="polite">
                {status}
              </span>
            </dd>
          </div>
          <div className="meta-row meta-row--inline">
            <dt>Người đang xem</dt>
            <dd>{viewerCount}</dd>
            <dt>Bình luận</dt>
            <dd>{commentCount}</dd>
            <dt>Lượt thích</dt>
            <dd>{likeCount}</dd>
          </div>
        </dl>
      </div>

      <div className="card watch-social-card">
        <h3 className="card-title-row">Thích &amp; chia sẻ</h3>
        <p className="muted small">
          Bấm <strong>Thích</strong> nếu bạn thấy nội dung thú vị. <strong>Chia sẻ</strong> mở hộp chứa link — gửi cho người
          khác để họ mở và vào xem cùng phòng.
        </p>
        <div className="watch-social-toolbar">
          <button
            type="button"
            className={`btn like-btn ${iLiked ? "like-btn--on" : ""}`}
            onClick={toggleLike}
            disabled={!!error}
            aria-pressed={iLiked}
            aria-label={iLiked ? "Bỏ thích" : "Thích"}
          >
            {iLiked ? "♥ Đã thích" : "♡ Thích"} {likeCount > 0 ? `· ${likeCount}` : ""}
          </button>
          <button type="button" className="btn primary" onClick={openShareDialog} disabled={!!error || !roomId}>
            Chia sẻ link
          </button>
        </div>
      </div>

      <div className="card">
        <h3 className="card-title-row">Giơ tay &amp; giao lưu với host</h3>
        <p className="muted small">
          <strong>Giơ tay</strong> để host thấy bạn muốn nói. Khi host <strong>cho phép</strong>, bạn có thể bật camera và
          mic — chỉ sau khi được phép mới gửi được hình/tiếng tới host.
        </p>
        <div className="watch-interact-toolbar">
          <button
            type="button"
            className={`btn ${handRaised ? "" : "primary"}`}
            onClick={toggleRaiseHand}
            disabled={!!error}
            aria-pressed={handRaised}
          >
            {handRaised ? "Hạ tay" : "Giơ tay"}
          </button>
          <button
            type="button"
            className="btn primary"
            onClick={() => void startViewerPublish()}
            disabled={!!error || !mediaAllowed || publishBusy || publishing}
          >
            {publishBusy ? "Đang bật…" : "Bật camera & mic (giao lưu)"}
          </button>
          <button
            type="button"
            className="btn"
            onClick={() => void stopViewerPublish()}
            disabled={!publishing && !publishStream}
          >
            Tắt camera & mic
          </button>
        </div>
        {mediaAllowed ? (
          <p className="banner ok" role="status">
            Host đã cho phép bạn phát. Bấm &quot;Bật camera &amp; mic&quot; khi sẵn sàng.
          </p>
        ) : null}
        {publishHint ? (
          <p className="muted small" role="status">
            {publishHint}
          </p>
        ) : null}
        {publishStream ? (
          <div className="watch-self-preview">
            <p className="muted small">Xem trước luồng của bạn (đã tắt tiếng loa để tránh hú):</p>
            <SelfPublishPreview stream={publishStream} />
          </div>
        ) : null}
      </div>

      <div className="video-wrap card">
        <div className="video-toolbar">
          <h3 className="video-heading">Luồng từ host</h3>
        </div>
        <video ref={videoRef} autoPlay playsInline className="video" />
      </div>

      <div className="card">
        <h3>Bình luận</h3>
        <form className="comment-form" onSubmit={sendComment}>
          <label className="sr-only" htmlFor="comment-input">
            Nội dung bình luận
          </label>
          <input
            id="comment-input"
            className="full-input grow"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Viết bình luận (tối đa 300 ký tự)…"
            maxLength={300}
            autoComplete="off"
          />
          <button type="submit" className="btn primary comment-send">
            Gửi
          </button>
        </form>
        <div className="stack small">
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

      <dialog ref={shareDialogRef} className="share-dialog" aria-labelledby="share-dialog-title">
        <h3 id="share-dialog-title" className="share-dialog-title">
          Link để người khác vào xem
        </h3>
        <p className="muted small share-dialog-lead">
          Sao chép hoặc chia sẻ đường dẫn dưới đây. Người nhận mở link sẽ vào trang xem cùng mã phòng{" "}
          <code>{roomId || "—"}</code>.
        </p>
        <label className="sr-only" htmlFor="share-url-field">
          Link xem phòng
        </label>
        <input
          id="share-url-field"
          className="full-input share-dialog-input"
          readOnly
          value={shareWatchUrl}
          onFocus={(e) => e.target.select()}
        />
        {shareCopyHint ? (
          <p className="banner ok share-dialog-hint" role="status">
            {shareCopyHint}
          </p>
        ) : null}
        <div className="share-dialog-actions">
          <button type="button" className="btn primary" onClick={copyShareLink}>
            Sao chép link
          </button>
          <button type="button" className="btn" onClick={() => void nativeShareLink()}>
            Chia sẻ (điện thoại / hệ thống)
          </button>
          <button type="button" className="btn" onClick={() => shareDialogRef.current?.close()}>
            Đóng
          </button>
        </div>
      </dialog>
    </div>
  );
}
