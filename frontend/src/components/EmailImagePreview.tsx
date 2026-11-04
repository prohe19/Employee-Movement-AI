import { useEffect, useRef, useState } from "react";

const NATIVE_W = 1280;
const NATIVE_H = 720;

/**
 * Live preview of the body-email PNG. Renders the backend's self-contained email HTML
 * (fonts, background, photos and logo all inlined) in a sandboxed iframe at its native
 * 1280×720 and scales it to fit the container, so the preview is pixel-identical to the
 * generated PNG without needing to click "generate" first.
 */
export function EmailImagePreview({ html }: { html: string }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const update = () => setScale(el.clientWidth / NATIVE_W);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      ref={wrapRef}
      style={{
        width: "100%",
        aspectRatio: `${NATIVE_W} / ${NATIVE_H}`,
        position: "relative",
        overflow: "hidden",
        boxShadow: "0 12px 30px -10px rgba(0,0,0,0.6)",
      }}
    >
      <iframe
        title="Body email preview"
        srcDoc={html}
        scrolling="no"
        tabIndex={-1}
        aria-hidden="true"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: NATIVE_W,
          height: NATIVE_H,
          border: "none",
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          pointerEvents: "none",
          background: "#fff",
        }}
      />
    </div>
  );
}
