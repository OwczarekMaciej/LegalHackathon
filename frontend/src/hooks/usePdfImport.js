import { useState, useCallback } from "react";
import * as pdfjsLib from "pdfjs-dist";
import pdfjsWorker from "pdfjs-dist/build/pdf.worker.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

/**
 * extractPageText
 *
 * Converts pdf.js textContent items into clean readable plaintext.
 *
 * Strategy:
 *   - Group items into lines by Y coordinate (rounded to 1pt tolerance)
 *   - Sort lines top-to-bottom, items within a line left-to-right
 *   - Measure the gap between consecutive lines
 *   - Normal line gap  → collapse into a space (justified paragraph flow)
 *   - Large Y gap (> 1.8× normal line height) → paragraph break (\n\n)
 *   - This means body text reflows naturally; headings/sections get spacing
 */
function extractPageText(textContent) {
  if (!textContent.items.length) return "";

  // ── 1. Group items by rounded Y (baseline) ─────────────────────────────────
  const lineMap = new Map();
  for (const item of textContent.items) {
    if (!item.str) continue;
    const y = Math.round(item.transform[5] * 10) / 10; // 0.1pt resolution
    if (!lineMap.has(y)) lineMap.set(y, []);
    lineMap.get(y).push(item);
  }

  // ── 2. Sort lines top-to-bottom (PDF Y is bottom-up so descending) ─────────
  const sortedYs = [...lineMap.keys()].sort((a, b) => b - a);

  // ── 3. Build line strings ───────────────────────────────────────────────────
  const lines = sortedYs.map((y) => {
    const items = lineMap.get(y).sort((a, b) => a.transform[4] - b.transform[4]);
    return {
      y,
      text: items.map((it) => it.str).join(""),
      // Approximate line height from the font scale of this line's items
      lineHeight: Math.abs(items[0].transform[3]) || 12,
    };
  });

  if (!lines.length) return "";

  // ── 4. Estimate normal line spacing from the most common gap ───────────────
  const gaps = [];
  for (let i = 1; i < lines.length; i++) {
    gaps.push(lines[i - 1].y - lines[i].y); // positive = downward
  }
  gaps.sort((a, b) => a - b);
  const medianGap = gaps[Math.floor(gaps.length / 2)] || lines[0].lineHeight;

  // ── 5. Assemble — collapse soft wraps, preserve paragraph breaks ────────────
  const parts = [lines[0].text];
  for (let i = 1; i < lines.length; i++) {
    const gap        = lines[i - 1].y - lines[i].y;
    const isParagraph = gap > medianGap * 1.6;
    parts.push(isParagraph ? "\n\n" : " ");
    parts.push(lines[i].text);
  }

  return parts.join("").replace(/ {2,}/g, " ").trim();
}

export function usePdfImport() {
  const [isParsing, setIsParsing] = useState(false);
  const [error,     setError]     = useState(null);

  const parsePdf = useCallback(async (file) => {
    setError(null);
    setIsParsing(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({
        data:           new Uint8Array(arrayBuffer),
        useSystemFonts: true,
      }).promise;

      const pageCount = pdf.numPages;
      const pages     = [];

      for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
        const page        = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        pages.push(extractPageText(textContent));
      }

      return { pages, pageCount, filename: file.name };

    } catch (err) {
      const msg = err.message || "Failed to parse PDF.";
      setError(msg);
      throw err;
    } finally {
      setIsParsing(false);
    }
  }, []);

  return { parsePdf, isParsing, error };
}
