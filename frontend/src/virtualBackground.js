import { SelfieSegmentation } from "@mediapipe/selfie_segmentation";

const MEDIAPIPE_CDN = "https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation@0.1.1675465747";

/** Màu nền gợi ý — host chọn để che phông thật */
export const VB_PRESETS = [
  { key: "slate", label: "Xanh đậm", color: "#0f172a" },
  { key: "indigo", label: "Chàm", color: "#312e81" },
  { key: "zinc", label: "Xám", color: "#27272a" },
  { key: "teal", label: "Xanh ngọc", color: "#134e4a" },
  { key: "rose", label: "Tím đất", color: "#4c0519" },
];

/**
 * @param {CanvasRenderingContext2D} ctx
 */
function enableHighQuality(ctx) {
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
}

/**
 * Độ mờ viền theo kích thước khung — bớt răng cưa / halo cứng.
 * @param {number} w
 * @param {number} h
 */
function maskBlurPx(w, h) {
  const shortSide = Math.min(w, h);
  return Math.min(18, Math.max(7, Math.round(shortSide / 64)));
}

/**
 * @typedef {{ color: string }} VirtualBackgroundStyleRef
 */

/**
 * Tách người khỏi nền bằng MediaPipe, vẽ lên canvas và trả MediaStream (video canvas + audio gốc).
 * @param {MediaStream} rawStream — luồng getUserMedia gốc
 * @param {VirtualBackgroundStyleRef} styleRef — đọc styleRef.color mỗi khung hình
 * @returns {Promise<{ outgoingStream: MediaStream; stop: () => void }>}
 */
export async function startVirtualBackground(rawStream, styleRef) {
  const rawVideo = rawStream.getVideoTracks()[0];
  const rawAudio = rawStream.getAudioTracks()[0];
  if (!rawVideo) {
    throw new Error("Không có track video từ camera.");
  }

  const hiddenVideo = document.createElement("video");
  hiddenVideo.muted = true;
  hiddenVideo.playsInline = true;
  hiddenVideo.setAttribute("playsinline", "true");
  hiddenVideo.srcObject = rawStream;
  await hiddenVideo.play();

  await new Promise((resolve) => {
    if (hiddenVideo.videoWidth > 0) resolve(undefined);
    else hiddenVideo.addEventListener("loadeddata", () => resolve(undefined), { once: true });
  });

  const w = hiddenVideo.videoWidth || 640;
  const h = hiddenVideo.videoHeight || 480;

  const outCanvas = document.createElement("canvas");
  const maskSoftCanvas = document.createElement("canvas");
  const blendMaskCanvas = document.createElement("canvas");
  const personCanvas = document.createElement("canvas");
  const prevMaskCanvas = document.createElement("canvas");
  outCanvas.width = maskSoftCanvas.width = blendMaskCanvas.width = personCanvas.width = prevMaskCanvas.width = w;
  outCanvas.height = maskSoftCanvas.height = blendMaskCanvas.height = personCanvas.height = prevMaskCanvas.height = h;

  const outCtx = outCanvas.getContext("2d", { alpha: false });
  const maskSoftCtx = maskSoftCanvas.getContext("2d", { alpha: true });
  const blendMaskCtx = blendMaskCanvas.getContext("2d", { alpha: true });
  const personCtx = personCanvas.getContext("2d", { alpha: true });
  const prevMaskCtx = prevMaskCanvas.getContext("2d", { alpha: true });
  if (!outCtx || !maskSoftCtx || !blendMaskCtx || !personCtx || !prevMaskCtx) {
    throw new Error("Không tạo được canvas 2D.");
  }

  enableHighQuality(outCtx);
  enableHighQuality(maskSoftCtx);
  enableHighQuality(blendMaskCtx);
  enableHighQuality(personCtx);
  enableHighQuality(prevMaskCtx);

  const selfie = new SelfieSegmentation({
    locateFile: (file) => `${MEDIAPIPE_CDN}/${file}`,
  });
  /**
   * selfieMode: true — khớp camera trước (gương) với model; false nếu dùng camera sau / không gương.
   * modelSelection: 0 general; 1 landscape — thử 0 trước cho cận mặt.
   */
  selfie.setOptions({ modelSelection: 0, selfieMode: true });

  /** Trọng số frame mới trong làm mượt mask (0–1); cao = bám sát model hơn, thấp = mượt hơn */
  const temporalAlpha = 0.5;
  let hasPrevMask = false;

  selfie.onResults((results) => {
    const cw = outCanvas.width;
    const ch = outCanvas.height;
    if (!cw || !ch) return;

    const blur = maskBlurPx(cw, ch);

    maskSoftCtx.clearRect(0, 0, cw, ch);
    maskSoftCtx.filter = `blur(${blur}px)`;
    maskSoftCtx.drawImage(results.segmentationMask, 0, 0, cw, ch);
    maskSoftCtx.filter = "none";

    blendMaskCtx.globalCompositeOperation = "source-over";
    blendMaskCtx.fillStyle = "#000000";
    blendMaskCtx.fillRect(0, 0, cw, ch);
    if (hasPrevMask) {
      blendMaskCtx.globalAlpha = 1 - temporalAlpha;
      blendMaskCtx.drawImage(prevMaskCanvas, 0, 0, cw, ch);
      blendMaskCtx.globalAlpha = temporalAlpha;
      blendMaskCtx.drawImage(maskSoftCanvas, 0, 0, cw, ch);
      blendMaskCtx.globalAlpha = 1;
    } else {
      blendMaskCtx.drawImage(maskSoftCanvas, 0, 0, cw, ch);
      hasPrevMask = true;
    }

    prevMaskCtx.clearRect(0, 0, cw, ch);
    prevMaskCtx.drawImage(blendMaskCanvas, 0, 0, cw, ch);

    personCtx.clearRect(0, 0, cw, ch);
    personCtx.drawImage(results.image, 0, 0, cw, ch);
    personCtx.globalCompositeOperation = "destination-in";
    personCtx.drawImage(blendMaskCanvas, 0, 0, cw, ch);
    personCtx.globalCompositeOperation = "source-over";

    const bg = styleRef.color || "#0f172a";
    outCtx.fillStyle = bg;
    outCtx.fillRect(0, 0, cw, ch);
    outCtx.drawImage(personCanvas, 0, 0);
  });

  await selfie.initialize();

  let active = true;
  let rafId = 0;
  let sendBusy = false;
  const useRvfc = typeof hiddenVideo.requestVideoFrameCallback === "function";
  const settings = rawVideo.getSettings?.() ?? {};
  const fpsCap =
    settings.frameRate && settings.frameRate > 0 ? Math.min(30, Math.round(settings.frameRate)) : 30;

  const runSend = async () => {
    if (!active || sendBusy) return;
    if (hiddenVideo.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return;
    sendBusy = true;
    try {
      await selfie.send({ image: hiddenVideo });
    } catch {
      /* một frame lỗi — bỏ qua */
    } finally {
      sendBusy = false;
    }
  };

  const scheduleNext = () => {
    if (!active) return;
    if (useRvfc) {
      hiddenVideo.requestVideoFrameCallback(() => {
        void (async () => {
          await runSend();
          scheduleNext();
        })();
      });
    } else {
      rafId = requestAnimationFrame(() => {
        void (async () => {
          await runSend();
          scheduleNext();
        })();
      });
    }
  };
  scheduleNext();

  const capStream = outCanvas.captureStream(fpsCap);
  const capVideoTrack = capStream.getVideoTracks()[0];
  const outgoingStream = new MediaStream();
  outgoingStream.addTrack(capVideoTrack);
  if (rawAudio) {
    outgoingStream.addTrack(rawAudio);
  }

  const stop = () => {
    active = false;
    if (!useRvfc && rafId) cancelAnimationFrame(rafId);
    rafId = 0;
    capVideoTrack.stop();
    hiddenVideo.pause();
    hiddenVideo.srcObject = null;
    void selfie.close();
  };

  return { outgoingStream, stop };
}
