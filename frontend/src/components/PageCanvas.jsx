import { useRef, useState, useCallback, useEffect, useMemo } from "react";
import { usePageRenderer } from "../hooks/usePageRenderer";
import { getRects, hitTest } from "../utils/charMap";
import { SEVERITY_STYLES } from "../data/theme";

const SEVERITY_ORDER = { error: 0, warning: 1, info: 2 };
function topSeverity(s) {
  return s.slice().sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity])[0];
}

export function PageCanvas({ pdfPage, pageIndex, suggestions, pageText, onApplyEdit, onDismiss }) {
  const containerRef = useRef(null);
  const [hoveredId,  setHoveredId]  = useState(null);
  const [tooltip,    setTooltip]    = useState(null);
  const [editState,  setEditState]  = useState(null);

  // Patches for edited suggestions — renderer resolves rects internally
  const patches = useMemo(() =>
    suggestions
      .filter((s) => s.status === "edited")
      .map((s) => ({ start: s.start, end: s.end, newText: pageText.slice(s.start, s.end) })),
    [suggestions, pageText]
  );

  const { canvasRef, charMap, viewport, isRendering } = usePageRenderer(pdfPage, 1.5, patches);

  const w = viewport?.width  ?? 0;
  const h = viewport?.height ?? 0;

  const highlightGroups = useMemo(() =>
    charMap
      ? suggestions
          .map((s) => ({ suggestion: s, rects: getRects(charMap, s.start, s.end) }))
          .filter((g) => g.rects.length > 0)
      : [],
    [charMap, suggestions]
  );

  const handleSvgMouseMove = useCallback((e) => {
    if (!charMap || !containerRef.current) return;
    const b  = containerRef.current.getBoundingClientRect();
    const cx = e.clientX - b.left;
    const cy = e.clientY - b.top;
    const idx = hitTest(charMap, cx, cy);
    if (idx === -1) { setHoveredId(null); setTooltip(null); return; }
    const hit = suggestions.find((s) => idx >= s.start && idx < s.end);
    if (hit) { setHoveredId(hit.id); setTooltip({ suggestion: hit, x: cx, y: cy }); }
    else     { setHoveredId(null);   setTooltip(null); }
  }, [charMap, suggestions]);

  const handleSvgClick = useCallback((e) => {
    if (!charMap || !containerRef.current) return;
    const b  = containerRef.current.getBoundingClientRect();
    const cx = e.clientX - b.left;
    const cy = e.clientY - b.top;
    const idx = hitTest(charMap, cx, cy);
    if (idx === -1) return;
    const hit = suggestions.find((s) => idx >= s.start && idx < s.end);
    if (!hit) return;
    const rects = getRects(charMap, hit.start, hit.end);
    if (!rects.length) return;
    setEditState({
      suggestion: hit,
      rect: {
        x:      Math.min(...rects.map((r) => r.x)),
        y:      Math.min(...rects.map((r) => r.y)),
        width:  Math.max(...rects.map((r) => r.x + r.width))  - Math.min(...rects.map((r) => r.x)),
        height: Math.max(...rects.map((r) => r.y + r.height)) - Math.min(...rects.map((r) => r.y)),
      },
      value: pageText.slice(hit.start, hit.end),
    });
  }, [charMap, suggestions, pageText]);

  const handleEditConfirm = useCallback((suggestion, newSnippet) => {
    const old = pageText.slice(suggestion.start, suggestion.end);
    if (newSnippet === old) { setEditState(null); return; }
    const delta   = newSnippet.length - old.length;
    const newFull = pageText.slice(0, suggestion.start) + newSnippet + pageText.slice(suggestion.end);
    onApplyEdit(suggestion.id, pageIndex, newFull, suggestion.start, delta);
    setEditState(null);
  }, [pageText, pageIndex, onApplyEdit]);

  return (
    <div ref={containerRef} style={{ position: "relative", width: w, height: isRendering ? 200 : h, margin: "0 auto" }}>
      <canvas ref={canvasRef} style={{ display: "block" }} />

      {isRendering && (
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)",
          backgroundSize: "200% 100%", animation: "shimmer 1.2s infinite",
        }} />
      )}

      {!isRendering && (
        <svg width={w} height={h}
          style={{ position: "absolute", top: 0, left: 0, cursor: "default" }}
          onMouseMove={handleSvgMouseMove}
          onMouseLeave={() => { setHoveredId(null); setTooltip(null); }}
          onClick={handleSvgClick}
        >
          {highlightGroups.map(({ suggestion: s, rects }) => {
            const style    = SEVERITY_STYLES[s.severity];
            const isHovered = s.id === hoveredId;
            const isEdited  = s.status === "edited";
            return rects.map((r, ri) => (
              <g key={`${s.id}-${ri}`}>
                <rect x={r.x} y={r.y} width={r.width} height={r.height}
                  fill={isHovered ? style.bgHover : style.bg} rx={2}
                  style={{ cursor: "pointer", transition: "fill 0.15s" }} />
                <line x1={r.x} y1={r.y + r.height} x2={r.x + r.width} y2={r.y + r.height}
                  stroke={style.border} strokeWidth={1.5}
                  strokeDasharray={isEdited ? "4 2" : undefined} />
              </g>
            ));
          })}
        </svg>
      )}

      {tooltip && !editState && (
        <HoverTooltip
          suggestion={tooltip.suggestion} x={tooltip.x} y={tooltip.y}
          containerWidth={w}
          onDismiss={(id) => { onDismiss(id); setTooltip(null); setHoveredId(null); }}
        />
      )}

      {editState && (
        <EditOverlay
          suggestion={editState.suggestion} rect={editState.rect} value={editState.value}
          onConfirm={handleEditConfirm} onCancel={() => setEditState(null)}
        />
      )}
    </div>
  );
}

// ── HoverTooltip ──────────────────────────────────────────────────────────────

function HoverTooltip({ suggestion: s, x, y, containerWidth, onDismiss }) {
  const style  = SEVERITY_STYLES[s.severity];
  const width  = 300;
  const left   = Math.min(x + 12, containerWidth - width - 8);
  const STATUS = { edited: { text: "Edited — pending re-analysis", color: "#f59e0b" }, resolved: { text: "Resolved", color: "#22c55e" } }[s.status];
  return (
    <div style={{ position: "absolute", top: y + 20, left: Math.max(8, left), width, background: "#fff", border: "1px solid #e2ddd8", borderLeft: `3px solid ${style.border}`, borderRadius: 8, boxShadow: "0 4px 24px rgba(0,0,0,0.13)", padding: "11px 13px", pointerEvents: "auto", zIndex: 50, animation: "tooltipIn 0.12s ease" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: style.dot, textTransform: "uppercase", letterSpacing: "0.06em" }}>{style.label}</span>
        <span style={{ fontSize: 11, color: "#9e9890", fontFamily: "monospace" }}>{s.type}</span>
        <button onClick={() => onDismiss(s.id)} style={{ marginLeft: "auto", background: "none", border: "none", color: "#9e9890", cursor: "pointer", fontSize: 13 }}>✕</button>
      </div>
      {STATUS && <div style={{ marginBottom: 5, fontSize: 10, color: STATUS.color, fontWeight: 600 }}>● {STATUS.text}</div>}
      <div style={{ fontSize: 13, fontWeight: 600, color: "#1a1814", marginBottom: 4 }}>{s.message}</div>
      <div style={{ fontSize: 12, color: "#5c5650", lineHeight: 1.55 }}>{s.suggestion}</div>
      <div style={{ marginTop: 8, fontSize: 11, color: style.dot, fontWeight: 500 }}>Click highlight to edit ↗</div>
    </div>
  );
}

// ── EditOverlay ───────────────────────────────────────────────────────────────

function EditOverlay({ suggestion, rect, value, onConfirm, onCancel }) {
  const style = SEVERITY_STYLES[suggestion.severity];
  const ref   = useRef(null);
  const [text, setText] = useState(value);
  useEffect(() => { ref.current?.focus(); ref.current?.select(); }, []);
  return (
    <div style={{ position: "absolute", top: rect.y - 4, left: rect.x - 4, width: Math.max(rect.width + 8, 240), zIndex: 60 }}>
      <textarea ref={ref} value={text} onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Escape") onCancel(); if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) onConfirm(suggestion, text); e.stopPropagation(); }}
        style={{ width: "100%", minHeight: Math.max(rect.height + 8, 36), padding: "4px 6px", fontFamily: "'Crimson Pro', Georgia, serif", fontSize: 15, lineHeight: 1.6, color: "#1a1814", background: "#fffef9", border: `2px solid ${style.border}`, borderRadius: 4, boxShadow: `0 0 0 3px ${style.bg}, 0 4px 16px rgba(0,0,0,0.12)`, resize: "vertical", outline: "none" }}
      />
      <div style={{ display: "flex", gap: 6, marginTop: 4, justifyContent: "flex-end" }}>
        <button onClick={onCancel} style={btn("#f5f3ef","#5c5650")}>Cancel <kbd style={{opacity:0.5,fontSize:10}}>Esc</kbd></button>
        <button onClick={() => onConfirm(suggestion, text)} style={btn(style.border,"#fff")}>Save <kbd style={{opacity:0.7,fontSize:10}}>⌘↵</kbd></button>
      </div>
    </div>
  );
}

function btn(bg, color) {
  return { padding: "4px 10px", borderRadius: 5, border: "none", background: bg, color, fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 };
}
