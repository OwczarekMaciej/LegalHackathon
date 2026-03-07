import { useRef, useState, useLayoutEffect, useCallback } from "react";
import { buildSegments, topSeverity } from "../utils/segments";
import { useCursorStabilizer } from "../hooks/useCursorStabilizer";
import { SEVERITY_STYLES } from "../data/theme";
import { Tooltip } from "./Tooltip";

/**
 * PageView
 *
 * Renders a single page as a paper card. Internally identical editing logic
 * to the old DocumentView, but scoped to one page's text and suggestions.
 *
 * Props:
 *   pageIndex    number
 *   text         string   — this page's text
 *   suggestions  Array    — only suggestions where s.page === pageIndex
 *   onApplyEdit  fn(suggestionId, pageIndex, newPageText, editStart, delta)
 *   onDismiss    fn(id)
 */
export function PageView({ pageIndex, text, suggestions, onApplyEdit, onDismiss }) {
  const containerRef  = useRef(null);
  const editableRef   = useRef(null);
  const savedCursorRef = useRef(null);

  const [hoveredSuggIds, setHoveredSuggIds] = useState([]);
  const [anchorRect, setAnchorRect]         = useState(null);

  const { restoreCursor } = useCursorStabilizer(editableRef);

  useLayoutEffect(() => {
    if (savedCursorRef.current !== null) {
      restoreCursor(savedCursorRef.current);
      savedCursorRef.current = null;
    }
  });

  const segments = buildSegments(text, suggestions);

  const handleKeyDown = useCallback((e, suggestion) => {
    const allowedKeys = ["ArrowLeft","ArrowRight","ArrowUp","ArrowDown","Home","End","Tab"];
    if (allowedKeys.includes(e.key)) return;
    if ((e.ctrlKey || e.metaKey) && ["a","c","z","y"].includes(e.key.toLowerCase())) return;

    e.preventDefault();

    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;

    const el = editableRef.current;
    let anchorOff = 0, focusOff = 0, count = 0;
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const node = walker.currentNode;
      const len  = node.textContent.length;
      if (node === sel.anchorNode) anchorOff = count + sel.anchorOffset;
      if (node === sel.focusNode)  focusOff  = count + sel.focusOffset;
      count += len;
    }
    const rawStart = Math.min(anchorOff, focusOff);
    const rawEnd   = Math.max(anchorOff, focusOff);

    // Clamp to suggestion bounds
    const bStart   = suggestion.start;
    const bEnd     = suggestion.end;
    const selStart = Math.max(rawStart, bStart);
    const selEnd   = Math.min(rawEnd,   bEnd);

    let newText = text, newCursor = selStart, delta = 0, editStart = selStart;

    if (e.key === "Backspace") {
      if (rawStart < selEnd) {
        const from = Math.max(rawStart, bStart);
        delta   = -(selEnd - from);
        newText = text.slice(0, from) + text.slice(selEnd);
        newCursor = from; editStart = from;
      } else if (selStart > bStart) {
        delta = -1; editStart = selStart - 1;
        newText   = text.slice(0, selStart - 1) + text.slice(selStart);
        newCursor = selStart - 1;
      }
    } else if (e.key === "Delete") {
      if (rawStart < selEnd) {
        const from = Math.max(rawStart, bStart);
        delta   = -(selEnd - from);
        newText = text.slice(0, from) + text.slice(selEnd);
        newCursor = from; editStart = from;
      } else if (selEnd < bEnd) {
        delta = -1;
        newText   = text.slice(0, selStart) + text.slice(selStart + 1);
        newCursor = selStart;
      }
    } else if (e.key === "Enter") {
      delta   = 1 - (selEnd - selStart);
      newText = text.slice(0, selStart) + "\n" + text.slice(selEnd);
      newCursor = selStart + 1;
    } else if (e.key.length === 1) {
      delta   = 1 - (selEnd - selStart);
      newText = text.slice(0, selStart) + e.key + text.slice(selEnd);
      newCursor = selStart + 1;
    } else {
      return;
    }

    if (newText === text) return;
    savedCursorRef.current = newCursor;
    onApplyEdit(suggestion.id, pageIndex, newText, editStart, delta);
  }, [text, pageIndex, onApplyEdit]);

  const handleMouseEnter = useCallback((e, suggList) => {
    if (!suggList.length) return;
    setHoveredSuggIds(suggList.map((s) => s.id));
    setAnchorRect(e.currentTarget.getBoundingClientRect());
  }, []);

  const handleMouseLeave = useCallback(() => {
    setHoveredSuggIds([]);
    setAnchorRect(null);
  }, []);

  const hoveredSuggestions = suggestions.filter((s) => hoveredSuggIds.includes(s.id));

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      <div
        ref={editableRef}
        style={{
          fontFamily: "'Crimson Pro', Georgia, serif",
          fontSize: 15.5,
          lineHeight: 1.9,
          color: "#1a1814",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          outline: "none",
          userSelect: "text",
        }}
      >
        {segments.map((seg, i) => {
          if (!seg.suggestions.length) {
            return <span key={i} style={{ cursor: "default" }}>{seg.text}</span>;
          }
          const top      = topSeverity(seg.suggestions);
          const style    = SEVERITY_STYLES[top.severity];
          const isHovered = seg.suggestions.some((s) => hoveredSuggIds.includes(s.id));
          const isEdited  = seg.suggestions.some((s) => s.status === "edited");

          return (
            <span
              key={i}
              contentEditable
              suppressContentEditableWarning
              tabIndex={0}
              onKeyDown={(e) => handleKeyDown(e, top)}
              onMouseEnter={(e) => handleMouseEnter(e, seg.suggestions)}
              onMouseLeave={handleMouseLeave}
              style={{
                background: isHovered ? style.bgHover : style.bg,
                borderBottom: `2px ${isEdited ? "dashed" : "solid"} ${style.border}`,
                borderRadius: "2px 2px 0 0",
                cursor: "text",
                outline: "none",
                caretColor: style.dot,
                transition: "background 0.15s",
                paddingBottom: 1,
              }}
            >
              {seg.text}
            </span>
          );
        })}
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
