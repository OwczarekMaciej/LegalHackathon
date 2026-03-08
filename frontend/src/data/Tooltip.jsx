import { useRef, useState, useEffect } from "react";
import { SEVERITY_STYLES, TYPE_ICONS } from "../data/theme";

export function Tooltip({ suggestions, anchorRect, containerRef }) {
  const tooltipRef = useRef(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (!anchorRect || !containerRef.current || !tooltipRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const tt = tooltipRef.current;
    let left = anchorRect.left - containerRect.left;
    let top  = anchorRect.bottom - containerRect.top + 8;
    // clamp to container width
    if (left + tt.offsetWidth > containerRect.width - 8)
      left = containerRect.width - tt.offsetWidth - 8;
    if (left < 8) left = 8;
    setPos({ top, left });
  }, [anchorRect, containerRef]);

  if (!suggestions?.length) return null;

  return (
    <div
      ref={tooltipRef}
      style={{
        position: "absolute",
        top: pos.top,
        left: pos.left,
        zIndex: 100,
        width: 320,
        background: "var(--surface-2)",
        border: "1px solid var(--border)",
        borderRadius: 10,
        boxShadow: "0 8px 32px rgba(0,0,0,0.28), 0 2px 8px rgba(0,0,0,0.18)",
        overflow: "hidden",
        animation: "tooltipIn 0.15s ease",
        pointerEvents: "none",
      }}
    >
      {suggestions.map((s, i) => {
        const style = SEVERITY_STYLES[s.severity];
        return (
          <div
            key={s.id}
            style={{
              padding: "12px 14px",
              borderBottom: i < suggestions.length - 1 ? "1px solid var(--border)" : "none",
              borderLeft: `3px solid ${style.border}`,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 5 }}>
              <span style={{ color: style.dot, fontSize: 13 }}>{TYPE_ICONS[s.type] || "●"}</span>
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", color: style.dot, textTransform: "uppercase" }}>
                {style.label}
              </span>
              <span style={{ fontSize: 11, color: "var(--text-muted)", marginLeft: "auto", fontFamily: "monospace" }}>
                {s.type}
              </span>
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", marginBottom: 4 }}>
              {s.message}
            </div>
            <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.55 }}>
              {s.suggestion}
            </div>
          </div>
        );
      })}
    </div>
  );
}
