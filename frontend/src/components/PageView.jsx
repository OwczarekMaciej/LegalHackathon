import { useRef, useState, useLayoutEffect, useCallback } from "react";
import { buildSegments, topSeverity } from "../utils/segments";
import { SEVERITY_STYLES } from "../data/theme";
import { Tooltip } from "./Tooltip";

export function PageView({ pageIndex, text, suggestions, onApplyEdit, onDismiss, visualizations, onRemoveViz }) {
  const containerRef = useRef(null);
  const [hoveredSuggIds, setHoveredSuggIds] = useState([]);
  const [anchorRect,     setAnchorRect]     = useState(null);

  const spanRefs      = useRef({});  // suggestion.id → span DOM element
  const pendingCursor = useRef(null); // { suggId, offset } — set before state update

  // Single layout effect: after every render, if a cursor restore is pending,
  // look up the (possibly new) span DOM node and place the cursor.
  useLayoutEffect(() => {
    const p = pendingCursor.current;
    if (!p) return;
    const el = spanRefs.current[p.suggId];
    if (!el) return;
    const textNode = el.firstChild;
    if (!textNode || textNode.nodeType !== Node.TEXT_NODE) return;
    pendingCursor.current = null; // clear only after we've successfully resolved el
    try {
      const off   = Math.min(Math.max(p.offset, 0), textNode.length);
      const range = document.createRange();
      range.setStart(textNode, off);
      range.collapse(true);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    } catch {}
  });

  const handleKeyDown = useCallback((e, suggestion) => {
    const allowedKeys = ["ArrowLeft","ArrowRight","ArrowUp","ArrowDown","Home","End","Tab"];
    if (allowedKeys.includes(e.key)) return;
    if ((e.ctrlKey || e.metaKey) && ["a","c","z","y"].includes(e.key.toLowerCase())) return;
    e.preventDefault();

    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);

    const spanEl = spanRefs.current[suggestion.id];
    if (!spanEl) return;

    // Measure cursor position within this span by walking only its own text nodes.
    // This avoids any coordinate mismatch with the \n\n paragraph structure.
    let relStart = 0, relEnd = 0, counted = 0;
    const walker = document.createTreeWalker(spanEl, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const node = walker.currentNode;
      const len  = node.textContent.length;
      if (node === range.startContainer) relStart = counted + range.startOffset;
      if (node === range.endContainer)   relEnd   = counted + range.endOffset;
      counted += len;
    }

    const spanLen = spanEl.textContent.length;
    relStart = Math.max(0, Math.min(relStart, spanLen));
    relEnd   = Math.max(relStart, Math.min(relEnd, spanLen));

    const absStart = suggestion.start + relStart;
    const absEnd   = suggestion.start + relEnd;

    let newText = text, newCursorRel = relStart, delta = 0;

    if (e.key === "Backspace") {
      if (relStart < relEnd) {
        delta = -(relEnd - relStart);
        newText = text.slice(0, absStart) + text.slice(absEnd);
        newCursorRel = relStart;
      } else if (relStart > 0) {
        delta = -1;
        newText = text.slice(0, absStart - 1) + text.slice(absStart);
        newCursorRel = relStart - 1;
      } else return;
    } else if (e.key === "Delete") {
      if (relStart < relEnd) {
        delta = -(relEnd - relStart);
        newText = text.slice(0, absStart) + text.slice(absEnd);
        newCursorRel = relStart;
      } else if (relEnd < spanLen) {
        delta = -1;
        newText = text.slice(0, absStart) + text.slice(absStart + 1);
        newCursorRel = relStart;
      } else return;
    } else if (e.key.length === 1) {
      delta = 1 - (relEnd - relStart);
      newText = text.slice(0, absStart) + e.key + text.slice(absEnd);
      newCursorRel = relStart + 1;
    } else return;

    if (newText === text) return;

    // Store cursor target before the state update triggers re-render
    pendingCursor.current = { suggId: suggestion.id, offset: newCursorRel };
    onApplyEdit(suggestion.id, pageIndex, newText, absStart, delta);
  }, [text, pageIndex, onApplyEdit]);

  const handleMouseEnter = useCallback((e, suggList) => {
    setHoveredSuggIds(suggList.map((s) => s.id));
    setAnchorRect(e.currentTarget.getBoundingClientRect());
  }, []);
  const handleMouseLeave = useCallback(() => {
    setHoveredSuggIds([]); setAnchorRect(null);
  }, []);

  const hoveredSuggestions = suggestions.filter((s) => hoveredSuggIds.includes(s.id));

  const segments = buildSegments(text, suggestions);
  let absPos = 0;
  const annotatedSegments = segments.map((seg) => {
    const start = absPos;
    absPos += seg.text.length;
    return { ...seg, absStart: start, absEnd: absPos };
  });

  const paragraphs = [];
  let offset = 0;
  for (const chunk of text.split("\n")) {
    paragraphs.push({ text: chunk, offset });
    offset += chunk.length + 1; // +1 for the single \n separator
  }

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      <div style={{ outline: "none" }}>
        {paragraphs.map((para, pi) => (
          <div key={pi}>
            <p style={paraStyle}>
              <ParagraphContent
                para={para}
                annotatedSegments={annotatedSegments}
                hoveredSuggIds={hoveredSuggIds}
                spanRefs={spanRefs}
                onKeyDown={handleKeyDown}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
              />
            </p>
            {visualizations?.[pi] && (
              <VizBlock
                imgUrl={visualizations[pi]}
                onRemove={() => onRemoveViz?.(pageIndex, pi)}
              />
            )}
          </div>
        ))}
      </div>

      {hoveredSuggestions.length > 0 && anchorRect && (
        <Tooltip
          suggestions={hoveredSuggestions}
          anchorRect={anchorRect}
          containerRef={containerRef}
          onDismiss={onDismiss}
        />
      )}
    </div>
  );
}

// ─── ParagraphContent ─────────────────────────────────────────────────────────

function ParagraphContent({ para, annotatedSegments, hoveredSuggIds, spanRefs, onKeyDown, onMouseEnter, onMouseLeave }) {
  const paraStart = para.offset;
  const paraEnd   = para.offset + para.text.length;
  const nodes     = [];
  let   cursor    = paraStart;

  for (const seg of annotatedSegments) {
    if (seg.absEnd <= paraStart || seg.absStart >= paraEnd) continue;

    const clipStart = Math.max(seg.absStart, paraStart);
    const clipEnd   = Math.min(seg.absEnd,   paraEnd);
    if (clipStart >= clipEnd) continue;

    if (cursor < clipStart) {
      nodes.push(<span key={`g-${cursor}`}>{para.text.slice(cursor - paraStart, clipStart - paraStart)}</span>);
    }

    const segText = para.text.slice(clipStart - paraStart, clipEnd - paraStart);
    if (!segText) { cursor = clipEnd; continue; }

    if (!seg.suggestions.length) {
      nodes.push(<span key={`p-${clipStart}`}>{segText}</span>);
    } else {
      const top        = topSeverity(seg.suggestions);
      const isResolved = seg.suggestions.every((s) => s.status === "resolved");
      const style      = SEVERITY_STYLES[isResolved ? "resolved" : top.severity] ?? SEVERITY_STYLES.error;
      const isHovered  = !isResolved && seg.suggestions.some((s) => hoveredSuggIds.includes(s.id));
      const isEdited   = seg.suggestions.some((s) => s.status === "edited");

      nodes.push(
        <span
          key={`h-${clipStart}`}
          ref={(el) => { if (el) spanRefs.current[top.id] = el; }}
          contentEditable={!isResolved} suppressContentEditableWarning tabIndex={isResolved ? -1 : 0} spellCheck={false}
          onKeyDown={(e) => !isResolved && onKeyDown(e, top)}
          onMouseEnter={(e) => !isResolved && onMouseEnter(e, seg.suggestions)}
          onMouseLeave={onMouseLeave}
          style={{
            background:    isHovered ? style.bgHover : style.bg,
            borderBottom:  `2px ${isEdited ? "dashed" : "solid"} ${style.border}`,
            borderRadius:  "2px 2px 0 0",
            cursor:        isResolved ? "default" : "text",
            outline:       "none",
            caretColor:    style.dot,
            transition:    "background 0.15s",
            paddingBottom: 1,
          }}
        >
          {segText}
        </span>
      );
    }
    cursor = clipEnd;
  }

  if (cursor < paraEnd) {
    nodes.push(<span key={`t-${cursor}`}>{para.text.slice(cursor - paraStart)}</span>);
  }

  return nodes.length ? nodes : <span>{para.text}</span>;
}

function VizBlock({ imgUrl, onRemove }) {
  return (
    <div style={{ margin: "16px 0 20px", position: "relative" }}>
      <img
        src={imgUrl}
        alt="Wygenerowana wizualizacja"
        style={{ width: "100%", borderRadius: 6, display: "block", border: "1px solid rgba(0,0,0,0.08)" }}
      />
      <button
        onClick={onRemove}
        title="Usuń wizualizację"
        style={{
          position: "absolute", top: 6, right: 6,
          background: "rgba(0,0,0,0.45)", border: "none", borderRadius: 4,
          color: "#fff", fontSize: 12, lineHeight: 1,
          width: 22, height: 22, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}
      >
        ✕
      </button>
    </div>
  );
}

const paraStyle = {
  margin:     "0 0 1.15em 0",
  padding:    0,
  lineHeight: 1.85,
  fontSize:   14.5,
  color:      "#1a1814",
  fontFamily: "'Crimson Pro', Georgia, serif",
  textAlign:  "justify",
  hyphens:    "auto",
};
