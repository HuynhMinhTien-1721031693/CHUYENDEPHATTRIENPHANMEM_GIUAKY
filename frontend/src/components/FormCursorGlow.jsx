import { useEffect, useRef } from "react";

/**
 * Vùng form: ẩn con trỏ hệ thống, hiển thị chấm + vòng lệch pha theo chuột.
 * @param {{ children: React.ReactNode, className?: string }} props
 */
export default function FormCursorGlow({ children, className = "" }) {
  const zoneRef = useRef(/** @type {HTMLDivElement | null} */ (null));
  const dotRef = useRef(/** @type {HTMLDivElement | null} */ (null));
  const ringRef = useRef(/** @type {HTMLDivElement | null} */ (null));
  const ringPos = useRef({ x: 0, y: 0 });
  const target = useRef({ x: 0, y: 0 });
  const raf = useRef(0);

  useEffect(() => {
    const zone = zoneRef.current;
    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!zone || !dot || !ring) return;

    const onMove = (e) => {
      const r = zone.getBoundingClientRect();
      target.current = { x: e.clientX - r.left, y: e.clientY - r.top };
      dot.style.transform = `translate3d(${target.current.x}px, ${target.current.y}px, 0) translate(-50%, -50%)`;
    };

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const tick = () => {
      const tx = target.current.x;
      const ty = target.current.y;
      if (reduceMotion) {
        ringPos.current = { x: tx, y: ty };
      } else {
        const rx = ringPos.current.x;
        const ry = ringPos.current.y;
        ringPos.current = {
          x: rx + (tx - rx) * 0.18,
          y: ry + (ty - ry) * 0.18,
        };
      }
      ring.style.transform = `translate3d(${ringPos.current.x}px, ${ringPos.current.y}px, 0) translate(-50%, -50%)`;
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);

    zone.addEventListener("mousemove", onMove);
    zone.addEventListener(
      "mouseenter",
      (e) => {
        const r = zone.getBoundingClientRect();
        target.current = { x: e.clientX - r.left, y: e.clientY - r.top };
        ringPos.current = { ...target.current };
      },
      { once: true }
    );

    return () => {
      zone.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf.current);
    };
  }, []);

  return (
    <div ref={zoneRef} className={`form-cursor-zone ${className}`.trim()}>
      <div ref={ringRef} className="form-cursor-ring" aria-hidden="true" />
      <div ref={dotRef} className="form-cursor-dot" aria-hidden="true" />
      <div className="form-cursor-content">{children}</div>
    </div>
  );
}
