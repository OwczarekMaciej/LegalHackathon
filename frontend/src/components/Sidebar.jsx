import { SEVERITY_STYLES, TYPE_ICONS } from "../data/theme";

const STATUS_DOT = {
  pending:  { color: "var(--text-muted)", title: "Pending" },
  edited:   { color: "#f59e0b",           title: "Edited — awaiting re-analysis" },
  resolved: { color: "#22c55e",           title: "Resolved" },
};

export function Sidebar({
  suggestions, activeId, onHover, onDismiss, onResolve,
  onReanalyse, isAnalysing,
  apiError, userPrompt, onUserPromptChange,
}) {
  const active    = suggestions.filter((s) => s.status !== "resolved");
  const resolved  = suggestions.filter((s) => s.status === "resolved");
  const counts = {
    error:   active.filter((s) => s.severity === "error").length,
    warning: active.filter((s) => s.severity === "warning").length,
    info:    active.filter((s) => s.severity === "info").length,
  };
  const editedCount = active.filter((s) => s.status === "edited").length;

  return (
    <div style={{ width: 260, flexShrink: 0, display: "flex", flexDirection: "column", background: "var(--surface-1)", borderLeft: "1px solid var(--border)", overflow: "hidden" }}>

      {/* Stats */}
      <div style={{ padding: "20px 18px 16px", borderBottom: "1px solid var(--border)" }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 12 }}>
          Analysis
        </div>

        <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
          {Object.entries(counts).map(([sev, count]) => {
            const s = SEVERITY_STYLES[sev];
            return (
              <div key={sev} style={{ flex: 1, textAlign: "center", padding: "8px 4px", background: s.bg, borderRadius: 7, border: `1px solid ${s.border}` }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: s.dot }}>{count}</div>
                <div style={{ fontSize: 10, color: s.dot, opacity: 0.85, textTransform: "capitalize" }}>
                  {sev === "error" ? "Issues" : sev === "warning" ? "Warnings" : "Tips"}
                </div>
              </div>
            );
          })}
        </div>

        <textarea
          value={userPrompt}
          onChange={(e) => onUserPromptChange(e.target.value)}
          placeholder="Optional instruction to agents…"
          rows={2}
          style={{ width: "100%", boxSizing: "border-box", resize: "vertical", padding: "7px 9px", marginBottom: 10, fontSize: 12, fontFamily: "inherit", color: "var(--text-primary)", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 6, outline: "none", lineHeight: 1.5 }}
        />

        <button
          onClick={onReanalyse}
          disabled={isAnalysing}
          style={{ width: "100%", padding: "8px 0", borderRadius: 7, border: editedCount > 0 ? "1px solid var(--accent)" : "1px solid var(--border)", background: editedCount > 0 ? "var(--accent)" : "var(--surface-2)", color: editedCount > 0 ? "#fff" : "var(--text-secondary)", fontSize: 12, fontWeight: 600, cursor: isAnalysing ? "wait" : "pointer", opacity: isAnalysing ? 0.6 : 1, transition: "all 0.15s", letterSpacing: "0.03em" }}
        >
          {isAnalysing ? "Analysing…" : editedCount > 0 ? `↺  Re-analyse  (${editedCount} edited)` : "↺  Re-analyse"}
        </button>

        {apiError && (
          <div style={{ marginTop: 8, padding: "7px 9px", background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 6, fontSize: 11, color: "#b91c1c", lineHeight: 1.5 }}>
            {apiError}
          </div>
        )}
      </div>

      {/* Suggestion list */}
      <div style={{ overflowY: "auto", flex: 1 }}>
        {active.length === 0 && resolved.length === 0 && (
          <div style={{ padding: 20, fontSize: 13, color: "var(--text-muted)", textAlign: "center" }}>
            No active suggestions
          </div>
        )}

        {active.map((s) => (
          <SuggestionCard
            key={s.id}
            s={s}
            isActive={activeId === s.id}
            onHover={onHover}
            onResolve={onResolve}
            onDismiss={onDismiss}
          />
        ))}

        {/* Resolved section */}
        {resolved.length > 0 && (
          <>
            <div style={{ padding: "8px 16px 4px", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)", borderTop: active.length > 0 ? "1px solid var(--border)" : "none" }}>
              Resolved ({resolved.length})
            </div>
            {resolved.map((s) => (
              <SuggestionCard
                key={s.id}
                s={s}
                isActive={false}
                onHover={() => {}}
                onResolve={null}    // no re-resolve
                onDismiss={onDismiss}
                resolved
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
}

// ─── SuggestionCard ───────────────────────────────────────────────────────────

function SuggestionCard({ s, isActive, onHover, onResolve, onDismiss, resolved = false }) {
  const style = SEVERITY_STYLES[s.severity];

  return (
    <div
      onMouseEnter={() => onHover(s.id)}
      onMouseLeave={() => onHover(null)}
      style={{
        padding: "11px 14px",
        borderBottom: "1px solid var(--border)",
        borderLeft: `3px solid ${isActive ? style.border : resolved ? "#22c55e" : "transparent"}`,
        background: resolved ? "transparent" : isActive ? style.bg : "transparent",
        opacity: resolved ? 0.55 : 1,
        transition: "all 0.15s",
      }}
    >
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
        <span style={{ color: resolved ? "#22c55e" : style.dot, fontSize: 12 }}>
          {resolved ? "✓" : (TYPE_ICONS[s.type] || "●")}
        </span>
        <span style={{ fontSize: 11, fontWeight: 700, color: resolved ? "#22c55e" : style.dot, textTransform: "uppercase", letterSpacing: "0.05em", textDecoration: resolved ? "line-through" : "none" }}>
          {resolved ? "Resolved" : style.label}
        </span>

        {/* Action buttons — appear on hover via CSS trick using group */}
        <div style={{ marginLeft: "auto", display: "flex", gap: 4 }}>
          {onResolve && (
            <ActionBtn
              title="Mark as resolved"
              onClick={(e) => { e.stopPropagation(); onResolve(s.id); }}
              color="#22c55e"
            >
              ✓
            </ActionBtn>
          )}
          <ActionBtn
            title="Dismiss"
            onClick={(e) => { e.stopPropagation(); onDismiss(s.id); }}
            color="#9e9890"
          >
            ✕
          </ActionBtn>
        </div>
      </div>

      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", marginBottom: 2, textDecoration: resolved ? "line-through" : "none" }}>
        {s.message}
      </div>
      <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5 }}>
        {s.suggestion
          ? <span style={{ fontStyle: "italic" }}>{s.suggestion}</span>
          : s.type}
      </div>
    </div>
  );
}

function ActionBtn({ children, onClick, title, color }) {
  return (
    <button
      title={title}
      onClick={onClick}
      style={{
        background: "none",
        border: `1px solid ${color}22`,
        borderRadius: 4,
        color,
        fontSize: 11,
        fontWeight: 700,
        width: 22,
        height: 22,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        opacity: 0.7,
        transition: "opacity 0.1s, background 0.1s",
        padding: 0,
        lineHeight: 1,
      }}
      onMouseEnter={(e) => { e.currentTarget.style.opacity = 1; e.currentTarget.style.background = `${color}18`; }}
      onMouseLeave={(e) => { e.currentTarget.style.opacity = 0.7; e.currentTarget.style.background = "none"; }}
    >
      {children}
    </button>
  );
}
