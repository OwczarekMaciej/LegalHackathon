import { useEffect, useRef, useState, useCallback } from "react";
import { buildCharMap, getRects } from "../utils/charMap";

export function usePageRenderer(pdfPage, scale = 1.5, patches = []) {
  const canvasRef      = useRef(null);
  const baseImageRef   = useRef(null);
  const [charMap,    setCharMap]    = useState(null);
  const [viewport,   setViewport]   = useState(null);
  const [isRendering, setRendering] = useState(true);
  const renderTaskRef  = useRef(null);

  const renderBase = useCallback(async () => {
    if (!pdfPage || !canvasRef.current) return;
    if (renderTaskRef.current) { try { renderTaskRef.current.cancel(); } catch {} }
    setRendering(true);

    const vp     = pdfPage.getViewport({ scale });
    const canvas = canvasRef.current;
    const ctx    = canvas.getContext("2d");

    canvas.width        = vp.width;
    canvas.height       = vp.height;
    canvas.style.width  = `${vp.width}px`;
    canvas.style.height = `${vp.height}px`;

    const task = pdfPage.render({ canvasContext: ctx, viewport: vp });
    renderTaskRef.current = task;
    try {
      await task.promise;
    } catch (err) {
      if (err?.name === "RenderingCancelledException") return;
      console.error("PDF render error:", err);
      return;
    }

    baseImageRef.current = ctx.getImageData(0, 0, canvas.width, canvas.height);

    const textContent = await pdfPage.getTextContent();
    const { charMap: cm } = buildCharMap(textContent, vp);
    setViewport(vp);
    setCharMap(cm);
    setRendering(false);
  }, [pdfPage, scale]);

  useEffect(() => { renderBase(); }, [renderBase]);

  useEffect(() => {
    if (!canvasRef.current || !baseImageRef.current || !charMap) return;
    const ctx = canvasRef.current.getContext("2d");

    ctx.putImageData(baseImageRef.current, 0, 0);
    if (!patches.length) return;

    for (const { start, end, newText } of patches) {
      const rects = getRects(charMap, start, end);
      if (!rects.length) continue;

      for (const r of rects) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(r.x - 1, r.y - 2, r.width + 2, r.height + 4);
      }

      const r = rects[0];
      ctx.font         = r.canvasFont;
      ctx.fillStyle    = "#000000";
      ctx.textBaseline = "alphabetic";
      ctx.fillText(newText, r.x, r.baseline);
    }
  }, [patches, charMap]);

  return { canvasRef, charMap, viewport, isRendering };
}
