import { useRef, useState, useCallback } from "react";
import { usePdfImport } from "../hooks/usePdfImport";

/**
 * PdfImportButton
 *
 * Props:
 *   onImport: fn({ text: string, filename: string, pageCount: number })
 *             called when PDF is successfully parsed
 */
export function PdfImportButton({ onImport }) {
  const { parsePdf, isParsing, error } = usePdfImport();
  const inputRef   = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = useCallback(async (file) => {
    if (!file || file.type !== "application/pdf") return;
    try {
      const result = await parsePdf(file);
      onImport(result);
    } catch {
      // error is already set in the hook
    }
  }, [parsePdf, onImport]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    handleFile(file);
  }, [handleFile]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => setIsDragging(false), []);

  return (
    <div>
      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        style={{ display: "none" }}
        onChange={(e) => handleFile(e.target.files[0])}
      />

      {/* Drop zone / button */}
      <div
        onClick={() => !isParsing && inputRef.current.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "6px 12px",
          borderRadius: 7,
          border: isDragging
            ? "1.5px dashed var(--accent)"
            : "1px solid var(--border)",
          background: isDragging ? "rgba(79,127,255,0.08)" : "var(--surface-2)",
          color: isParsing ? "var(--text-muted)" : "var(--text-secondary)",
          fontSize: 12,
          fontWeight: 500,
          cursor: isParsing ? "wait" : "pointer",
          transition: "all 0.15s",
          userSelect: "none",
          whiteSpace: "nowrap",
        }}
      >
        {isParsing ? (
          <>
            <Spinner />
            Odczytywanie PDF…
          </>
        ) : (
          <>
            <span style={{ fontSize: 14 }}>⬆</span>
            Importuj PDF
          </>
        )}
      </div>

      {/* Inline error */}
      {error && (
        <div style={{
          marginTop: 6,
          fontSize: 11,
          color: "#ef4444",
          maxWidth: 200,
        }}>
          {error}
        </div>
      )}
    </div>
  );
}

function Spinner() {
  return (
    <span style={{
      display: "inline-block",
      width: 11,
      height: 11,
      border: "2px solid var(--border)",
      borderTopColor: "var(--accent)",
      borderRadius: "50%",
      animation: "spin 0.7s linear infinite",
    }} />
  );
}
