import { useEffect, useRef, useState } from "react";

// A4 portrait at 96dpi. The transfer form is tuned to fit on a single page.
const NATIVE_W = 794;
const NATIVE_H = 1123;

/**
 * Live preview of the transfer-form PDF. Renders the backend's self-contained form HTML
 * (fonts and ITM logo inlined) in a sandboxed iframe at its native A4 size and scales it
 * to fit the container — so the preview matches the generated PDF without clicking
 * "generate" first.
 */
export function TransferFormPreview({ html }: { html: string }) {
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
        background: "#fff",
      }}
    >
      <iframe
        title="Transfer form preview"
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
