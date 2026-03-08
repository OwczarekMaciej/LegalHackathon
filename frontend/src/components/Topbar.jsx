import { PdfImportButton } from "./PdfImportButton";

export function Topbar({ filename, suggestionCount, isDark, onToggleTheme, onImport }) {
  return (
    <div
      style={{
        height: 52,
        background: "var(--surface-1)",
        borderBottom: "1px solid var(--border)",
        display: "flex",
        alignItems: "center",
        padding: "0 24px",
        gap: 16,
        flexShrink: 0,
      }}
    >
      {/* Logo */}
      <div style={{ display: "flex", alignItems: "baseline", gap: 0 }}>
        <span style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
          Legal
        </span>
        <span style={{ fontSize: 15, fontWeight: 700, color: "#22c55e", letterSpacing: "-0.02em" }}>
          ease
        </span>
      </div>

      <div style={{ width: 1, height: 20, background: "var(--border)", margin: "0 4px" }} />

      <span
        style={{
          fontSize: 13,
          color: "var(--text-secondary)",
          fontFamily: "'DM Mono', monospace",
        }}
      >
        {filename}
      </span>

      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 12 }}>
        {/* PDF import */}
        <PdfImportButton onImport={onImport} />

        <div style={{ width: 1, height: 20, background: "var(--border)" }} />

        <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
          {suggestionCount === 1 ? "1 sugestia" : suggestionCount >= 2 && suggestionCount <= 4 ? `${suggestionCount} sugestie` : `${suggestionCount} sugestii`}
        </div>
        <button
          onClick={onToggleTheme}
          style={{
            background: "var(--surface-2)",
            border: "1px solid var(--border)",
            borderRadius: 6,
            padding: "5px 10px",
            fontSize: 12,
            color: "var(--text-secondary)",
            cursor: "pointer",
          }}
        >
          {isDark ? "☀ Jasny" : "☽ Ciemny"}
        </button>
      </div>
    </div>
  );
}
