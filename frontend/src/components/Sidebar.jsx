import { useState, useEffect } from "react";
import { SEVERITY_STYLES, TYPE_ICONS } from "../data/theme";

export function Sidebar({
  suggestions, activeId, onHover,
  onAccept, onResolve, onDismiss, onVerify, onGenerate,
  onReanalyse, isAnalysing,
  apiError, userPrompt, onUserPromptChange,
}) {
  const active   = suggestions.filter((s) => s.status !== "resolved");
  const resolved = suggestions.filter((s) => s.status === "resolved");
  const textCount = active.filter((s) => s.severity === "error").length;
  const vizCount  = active.filter((s) => s.severity === "info").length;
  const editedCount = active.filter((s) => s.status === "edited").length;

  const statItems = [
    { key: "error", count: textCount, style: SEVERITY_STYLES.error, label: "Problemy z tekstem" },
    { key: "info",  count: vizCount,  style: SEVERITY_STYLES.info,  label: "Sugestie wizualizacji" },
  ];

  return (
    <div style={{ width: 280, flexShrink: 0, minHeight: 0, display: "flex", flexDirection: "column", background: "var(--surface-1)", borderLeft: "1px solid var(--border)", overflow: "hidden" }}>

      {/* Stats + controls */}
      <div style={{ flexShrink: 0, padding: "18px 16px 14px", borderBottom: "1px solid var(--border)" }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 10 }}>
          Analiza
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          {statItems.map(({ key, count, style: s, label }) => (
            <div key={key} style={{ flex: 1, textAlign: "center", padding: "7px 4px", background: s.bg, borderRadius: 7, border: `1px solid ${s.border}` }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: s.dot }}>{count}</div>
              <div style={{ fontSize: 10, color: s.dot, opacity: 0.85 }}>
                {label}
              </div>
            </div>
          ))}
        </div>

        <textarea
          value={userPrompt}
          onChange={(e) => onUserPromptChange(e.target.value)}
          placeholder="Opcjonalna instrukcja dla agentów…"
          rows={2}
          spellCheck={false}
          style={{ width: "100%", boxSizing: "border-box", resize: "vertical", padding: "7px 9px", marginBottom: 8, fontSize: 12, fontFamily: "inherit", color: "var(--text-primary)", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 6, outline: "none", lineHeight: 1.5 }}
        />

        <button
          onClick={onReanalyse} disabled={isAnalysing}
          style={{ width: "100%", padding: "8px 0", borderRadius: 7, border: editedCount > 0 ? "1px solid var(--accent)" : "1px solid var(--border)", background: editedCount > 0 ? "var(--accent)" : "var(--surface-2)", color: editedCount > 0 ? "#fff" : "var(--text-secondary)", fontSize: 12, fontWeight: 600, cursor: isAnalysing ? "wait" : "pointer", opacity: isAnalysing ? 0.6 : 1, transition: "all 0.15s", letterSpacing: "0.03em" }}
        >
          {isAnalysing ? "Analizuję…" : editedCount > 0 ? `↺  Ponów analizę (${editedCount} edyt.)` : "↺  Ponów analizę"}
        </button>

        {apiError && (
          <div style={{ marginTop: 8, padding: "7px 9px", background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 6, fontSize: 11, color: "#b91c1c", lineHeight: 1.5 }}>
            {apiError}
          </div>
        )}
      </div>

      {/* List — own scrollbar */}
      <div style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
        {active.length === 0 && resolved.length === 0 && (
          <div style={{ padding: 20, fontSize: 13, color: "var(--text-muted)", textAlign: "center" }}>
            Brak aktywnych sugestii
          </div>
        )}

        {active.map((s) => (
          <SuggestionCard
            key={s.id}
            s={s}
            isActive={activeId === s.id}
            onHover={onHover}
            onAccept={onAccept}
            onVerify={onVerify}
            onResolve={onResolve}
            onDismiss={onDismiss}
            onGenerate={onGenerate}
          />
        ))}

        {resolved.length > 0 && (
          <>
            <div style={{ padding: "8px 16px 4px", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)", borderTop: active.length > 0 ? "1px solid var(--border)" : "none" }}>
              Rozwiązane ({resolved.length})
            </div>
            {resolved.map((s) => (
              <SuggestionCard
                key={s.id} s={s}
                isActive={false} onHover={() => {}}
                onAccept={null} onVerify={null} onResolve={null}
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

function SuggestionCard({ s, isActive, onHover, onAccept, onVerify, onResolve, onDismiss, onGenerate, resolved = false }) {
  const [verifyState, setVerifyState] = useState(null); // null | "loading" | { all_good, issues }
  const style    = SEVERITY_STYLES[resolved ? "resolved" : s.severity] ?? SEVERITY_STYLES.error;
  const isJezyk  = s.kategoria === "JEZYK";
  const isEdited = s.status === "edited";

  const handleVerify = async () => {
    setVerifyState("loading");
    try {
      const result = await onVerify(s);
      setVerifyState(result);
      if (result.all_good) onResolve?.(s.id);
    } catch (err) {
      setVerifyState({ all_good: false, issues: [err.message ?? "Weryfikacja nie powiodła się."] });
    }
  };

  return (
    <div
      onMouseEnter={() => onHover(s.id)}
      onMouseLeave={() => onHover(null)}
      style={{ borderBottom: "1px solid var(--border)", borderLeft: `3px solid ${resolved ? "#22c55e" : isActive ? style.border : "transparent"}`, background: resolved ? "transparent" : isActive ? style.bg : "transparent", opacity: resolved ? 0.55 : 1, transition: "background 0.15s" }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 14px 6px" }}>
        <span style={{ fontSize: 12, color: resolved ? "#22c55e" : style.dot }}>
          {resolved ? "✓" : (TYPE_ICONS[s.type] || "●")}
        </span>
        <span style={{ fontSize: 10, fontWeight: 700, color: resolved ? "#22c55e" : style.dot, textTransform: "uppercase", letterSpacing: "0.06em" }}>
          {resolved ? "Rozwiązane" : style.label}
        </span>
        {isEdited && !resolved && (
          <span style={{ fontSize: 9, fontWeight: 600, color: "#f59e0b", background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: 4, padding: "1px 5px", letterSpacing: "0.04em" }}>
            EDYTOWANO
          </span>
        )}
        {/* Dismiss always available */}
        <button title="Odrzuć" onClick={() => onDismiss(s.id)} style={iconBtn("var(--text-muted)")}>✕</button>
      </div>

      {/* Reasoning — what's wrong */}
      {s.reasoning && (
        <div style={{ padding: "0 14px 6px", fontSize: 12, color: "var(--text-primary)", fontWeight: 500, lineHeight: 1.5, textDecoration: resolved ? "line-through" : "none" }}>
          {s.reasoning}
        </div>
      )}

      {/* Proposed fix — only for JEZYK */}
      {isJezyk && s.proposedFix && !resolved && (
        <div style={{ margin: "0 14px 8px", padding: "7px 10px", background: "rgba(34,197,94,0.07)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 6 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#22c55e", letterSpacing: "0.06em", marginBottom: 3, textTransform: "uppercase" }}>
            Proponowana poprawka
          </div>
          <div style={{ fontSize: 12, color: "var(--text-primary)", lineHeight: 1.55, fontStyle: "italic" }}>
            {s.proposedFix}
          </div>
        </div>
      )}

      {/* Verify result */}
      {verifyState && verifyState !== "loading" && !verifyState.all_good && (
        <div style={{ margin: "0 14px 8px", padding: "7px 10px", background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 6 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#ef4444", marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Wymaga jeszcze pracy
          </div>
          {verifyState.issues.map((iss, i) => (
            <div key={i} style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5 }}>• {iss}</div>
          ))}
        </div>
      )}

      {/* Action buttons — JEZYK only */}
      {isJezyk && !resolved && (
        <div style={{ display: "flex", gap: 6, padding: "0 14px 10px" }}>
          {s.proposedFix && (
            <ActionBtn color="#22c55e" onClick={() => onAccept?.(s.id)} title="Zastąp proponowaną poprawką">
              ✓ Akceptuj
            </ActionBtn>
          )}
          <ActionBtn
            color="#3b82f6"
            onClick={handleVerify}
            disabled={verifyState === "loading"}
            title="Poproś AI o weryfikację Twojej poprawki"
          >
            {verifyState === "loading" ? "Sprawdzam…" : "⟳ Zweryfikuj poprawkę"}
          </ActionBtn>
        </div>
      )}

      {/* GRAF: generate visualisation */}
      {!isJezyk && !resolved && (
        <GrafActions s={s} onResolve={onResolve} onGenerate={onGenerate} />
      )}
    </div>
  );
}


// ─── GrafActions ──────────────────────────────────────────────────────────────

function GrafActions({ s, onResolve, onGenerate }) {
  const [state,    setState]    = useState("idle"); // idle | loading | done | error
  const [imgUrl,   setImgUrl]   = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  // Revoke object URL on unmount to avoid memory leaks
  useEffect(() => () => { if (imgUrl) URL.revokeObjectURL(imgUrl); }, [imgUrl]);

  const handleGenerate = async () => {
    setState("loading");
    setErrorMsg(null);
    try {
      const url = await onGenerate(s); // App passes page-slice context
      setImgUrl(url);
      setState("done");
    } catch (err) {
      setErrorMsg(err.message ?? "Generowanie nie powiodło się.");
      setState("error");
    }
  };

  return (
    <div style={{ padding: "0 14px 10px" }}>
      {/* Generate button */}
      {state !== "done" && (
        <div style={{ display: "flex", gap: 6, marginBottom: imgUrl ? 8 : 0 }}>
          <ActionBtn
            color="#8b5cf6"
            onClick={handleGenerate}
            disabled={state === "loading"}
            title="Generuj wizualizację jako PNG"
          >
            {state === "loading" ? "Generuję…" : "⬡ Generuj"}
          </ActionBtn>
          <ActionBtn color="#9ca3af" onClick={() => onResolve?.(s.id)} title="Oznacz jako odnotowane">
            ✓ Odnotowano
          </ActionBtn>
        </div>
      )}

      {/* Error */}
      {state === "error" && (
        <div style={{ marginBottom: 8, padding: "6px 8px", background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 5, fontSize: 11, color: "#ef4444", lineHeight: 1.5 }}>
          {errorMsg}
        </div>
      )}

      {/* Generated image */}
      {imgUrl && (
        <div style={{ borderRadius: 6, overflow: "hidden", border: "1px solid var(--border)" }}>
          <img src={imgUrl} alt="Wygenerowana wizualizacja" style={{ width: "100%", display: "block" }} />
          <div style={{ display: "flex", gap: 6, padding: 8, background: "var(--surface-2)", borderTop: "1px solid var(--border)" }}>
            <a
              href={imgUrl}
              download={`viz-${s.id}.png`}
              style={{ flex: 1, padding: "5px 0", borderRadius: 5, border: "1px solid rgba(139,92,246,0.4)", background: "rgba(139,92,246,0.1)", color: "#8b5cf6", fontSize: 11, fontWeight: 600, textAlign: "center", textDecoration: "none", letterSpacing: "0.02em" }}
            >
              ↓ Pobierz
            </a>
            <ActionBtn color="#22c55e" onClick={() => onResolve?.(s.id)} title="Oznacz jako rozwiązane">
              ✓ Gotowe
            </ActionBtn>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Primitives ───────────────────────────────────────────────────────────────

function iconBtn(color) {
  return {
    marginLeft: "auto", background: "none", border: "none",
    color, fontSize: 12, cursor: "pointer", padding: "2px 4px",
    borderRadius: 3, lineHeight: 1, opacity: 0.6,
    transition: "opacity 0.1s",
  };
}

function ActionBtn({ children, onClick, color, title, disabled = false }) {
  return (
    <button
      title={title}
      onClick={onClick}
      disabled={disabled}
      style={{
        flex: 1, padding: "5px 0", borderRadius: 5,
        border: `1px solid ${color}44`,
        background: `${color}11`,
        color, fontSize: 11, fontWeight: 600,
        cursor: disabled ? "wait" : "pointer",
        opacity: disabled ? 0.6 : 1,
        transition: "background 0.1s",
        letterSpacing: "0.02em",
      }}
      onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.background = `${color}22`; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = `${color}11`; }}
    >
      {children}
    </button>
  );
}
