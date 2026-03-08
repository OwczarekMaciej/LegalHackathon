import { useCallback } from "react";

/**
 * useCursorStabilizer
 *
 * The problem: when React re-renders a contentEditable element, the DOM is
 * replaced and the browser loses the cursor position (selection).
 *
 * The fix: before any re-render that could touch the DOM, save the cursor
 * offset as a plain character index. After the render, restore it.
 *
 * Usage:
 *   const { saveCursor, restoreCursor } = useCursorStabilizer(ref);
 *   // call saveCursor() before triggering a state update
 *   // call restoreCursor() in a useLayoutEffect after render
 */
export function useCursorStabilizer(editableRef) {
  const saveCursor = useCallback(() => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return null;
    const range = sel.getRangeAt(0);
    const el = editableRef.current;
    if (!el || !el.contains(range.startContainer)) return null;

    // Walk the text nodes to compute an absolute character offset
    let offset = 0;
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      if (walker.currentNode === range.startContainer) {
        offset += range.startOffset;
        break;
      }
      offset += walker.currentNode.textContent.length;
    }
    return offset;
  }, [editableRef]);

  const restoreCursor = useCallback((savedOffset) => {
    if (savedOffset === null || savedOffset === undefined) return;
    const el = editableRef.current;
    if (!el) return;

    let remaining = savedOffset;
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const len = walker.currentNode.textContent.length;
      if (remaining <= len) {
        const range = document.createRange();
        range.setStart(walker.currentNode, remaining);
        range.collapse(true);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
        return;
      }
      remaining -= len;
    }
  }, [editableRef]);

  return { saveCursor, restoreCursor };
}
