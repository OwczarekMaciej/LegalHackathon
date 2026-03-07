import { useState, useCallback } from "react";
import * as pdfjsLib from "pdfjs-dist";
import pdfjsWorker from "pdfjs-dist/build/pdf.worker.mjs?url";

// Assign the worker once at module load time — Vite resolves the ?url import
// to the bundled worker file, so no external fetch is needed.
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

/**
 * usePdfImport
 *
 * Requires: npm install pdfjs-dist
 *
 * Returns:
 *   parsePdf(File) => Promise<{ pages: string[], pageCount: number, filename: string }>
 */
export function usePdfImport() {
  const [isParsing, setIsParsing] = useState(false);
  const [error, setError]         = useState(null);

  const parsePdf = useCallback(async (file) => {
    setError(null);
    setIsParsing(true);

    try {
      const arrayBuffer = await file.arrayBuffer();

      const pdf       = await pdfjsLib.getDocument({
        data:            new Uint8Array(arrayBuffer),
        useSystemFonts:  true,
      }).promise;

      const pageCount = pdf.numPages;
      const pages     = [];

      for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
        const page    = await pdf.getPage(pageNum);
        const content = await page.getTextContent();

        // Reconstruct lines from Y coordinates (PDF Y-axis is bottom-up)
        const lineMap = new Map();
        for (const item of content.items) {
          if (!item.str?.trim()) continue;
          const y = Math.round(item.transform[5] / 3) * 3;
          if (!lineMap.has(y)) lineMap.set(y, []);
          lineMap.get(y).push(item.str);
        }

        const sortedYs = [...lineMap.keys()].sort((a, b) => b - a);
        pages.push(sortedYs.map((y) => lineMap.get(y).join(" ")).join("\n"));
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
