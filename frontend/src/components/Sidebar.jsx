import { SEVERITY_STYLES, TYPE_ICONS } from "../data/theme";

const STATUS_DOT = {
  pending:  { color: "var(--text-muted)",  title: "Pending" },
  edited:   { color: "#f59e0b",            title: "Edited — awaiting re-analysis" },
  resolved: { color: "#22c55e",            title: "Resolved" },
};

export function Sidebar({ suggestions, activeId, onHover, onDismiss, onReanalyse, isAnalysing }) {
  const counts = {
    error:   suggestions.filter((s) => s.severity === "error").length,
    warning: suggestions.filter((s) => s.severity === "warning").length,
    info:    suggestions.filter((s) => s.severity === "info").length,
  };
  const editedCount = suggestions.filter((s) => s.status === "edited").length;

  return (
    <div style={{
      width: 260,
      flexShrink: 0,
      display: "flex",
      flexDirection: "column",
      background: "var(--surface-1)",
      borderLeft: "1px solid var(--border)",
      overflow: "hidden",
    }}>
      {/* Stats */}
      <div style={{ padding: "20px 18px 16px", borderBottom: "1px solid var(--border)" }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 12 }}>
          Analysis
        </div>
        <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
          {Object.entries(counts).map(([sev, count]) => {
            const s = SEVERITY_STYLES[sev];
            return (
              <div key={sev} style={{
                flex: 1, textAlign: "center", padding: "8px 4px",
                background: s.bg, borderRadius: 7, border: `1px solid ${s.border}`,
              }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: s.dot }}>{count}</div>
                <div style={{ fontSize: 10, color: s.dot, opacity: 0.85, textTransform: "capitalize" }}>
                  {sev === "error" ? "Issues" : sev === "warning" ? "Warnings" : "Tips"}
                </div>
              </div>
            );
          })}
        </div>

        {/* Re-analyse button */}
        <button
          onClick={onReanalyse}
          disabled={isAnalysing}
          style={{
            width: "100%",
            padding: "8px 0",
            borderRadius: 7,
            border: editedCount > 0 ? "1px solid var(--accent)" : "1px solid var(--border)",
            background: editedCount > 0 ? "var(--accent)" : "var(--surface-2)",
            color: editedCount > 0 ? "#fff" : "var(--text-secondary)",
            fontSize: 12,
            fontWeight: 600,
            cursor: isAnalysing ? "wait" : "pointer",
            opacity: isAnalysing ? 0.6 : 1,
            transition: "all 0.15s",
            letterSpacing: "0.03em",
          }}
        >
          {isAnalysing
            ? "Analysing…"
            : editedCount > 0
            ? `↺  Re-analyse  (${editedCount} edited)`
            : "↺  Re-analyse"}
        </button>
      </div>

      {/* Suggestion list */}
      <div style={{ overflowY: "auto", flex: 1 }}>
        {suggestions.length === 0 && (
          <div style={{ padding: 20, fontSize: 13, color: "var(--text-muted)", textAlign: "center" }}>
            No active suggestions
          </div>
        )}
        {suggestions.map((s) => {
          const style    = SEVERITY_STYLES[s.severity];
          const dot      = STATUS_DOT[s.status] || STATUS_DOT.pending;
          const isActive = activeId === s.id;

          return (
            <div
              key={s.id}
              onMouseEnter={() => onHover(s.id)}
              onMouseLeave={() => onHover(null)}
              style={{
                padding: "12px 16px",
                borderBottom: "1px solid var(--border)",
                borderLeft: `3px solid ${isActive ? style.border : "transparent"}`,
                background: isActive ? style.bg : "transparent",
                cursor: "default",
                transition: "all 0.15s",
              }}
            >
              {/* Type + status dot */}
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                <span style={{ color: style.dot, fontSize: 12 }}>{TYPE_ICONS[s.type] || "●"}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: style.dot, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  {style.label}
                </span>
                {/* Status dot */}
                <span
                  title={dot.title}
                  style={{
                    marginLeft: "auto",
                    width: 7, height: 7,
                    borderRadius: "50%",
                    background: dot.color,
                    flexShrink: 0,
                  }}
                />
              </div>

              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", marginBottom: 3 }}>
                {s.message}
              </div>
              <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5 }}>
                {s.type}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
