import { useState, useCallback, useEffect, useRef } from "react";
import { normalizePageText } from "../utils/textNormalize.js";

function hydrateSuggestions(rawSuggestions, pages) {
  return rawSuggestions.map((s) => ({
    ...s,
    originalSnippet: (pages[s.page] ?? "").slice(s.start, s.end),
    status: "pending",
  }));
}

function shiftOffsets(suggestions, editedId, editStart, delta) {
  const editedPage = suggestions.find((s) => s.id === editedId)?.page;
  return suggestions.map((s) => {
    if (s.id === editedId) return { ...s, end: s.end + delta, status: "edited" };
    if (s.page !== editedPage) return s;
    // Shift suggestion that starts at or after the edit
    if (s.start >= editStart) return { ...s, start: s.start + delta, end: s.end + delta };
    // Suggestion spans the edit: shift only its end
    if (s.end > editStart) return { ...s, end: s.end + delta };
    return s;
  });
}

function normalizedPages(pages) {
  return pages.map((p) => (typeof p === "string" ? normalizePageText(p) : p));
}

export function useDocumentStore(initialPages, initialRawSuggestions, documentKey) {
  const [pages,       setPages]       = useState(() => normalizedPages(initialPages));
  const [suggestions, setSuggestions] = useState(() =>
    hydrateSuggestions(initialRawSuggestions, normalizedPages(initialPages))
  );
  const [isAnalysing,    setIsAnalysing]    = useState(false);
  // visualizations: { [pageIndex]: { [paragraphIndex]: imgUrl } }
  // Kept separate from pages[] so text offsets are never affected.
  const [visualizations, setVisualizations] = useState({});
  const pagesRef = useRef(pages);

  useEffect(() => {
    pagesRef.current = pages;
  }, [pages]);

  useEffect(() => {
    const pagesNorm = normalizedPages(initialPages);
    pagesRef.current = pagesNorm;
    setPages(pagesNorm);
    setSuggestions(hydrateSuggestions(initialRawSuggestions, pagesNorm));
    setIsAnalysing(false);
    setVisualizations({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentKey]);

  const applyEdit = useCallback((suggestionId, pageIndex, newPageText, editStart, delta) => {
    setPages((prev) => {
      const next = prev.map((p, i) => i === pageIndex ? newPageText : p);
      pagesRef.current = next;
      return next;
    });
    setSuggestions((prev) => shiftOffsets(prev, suggestionId, editStart, delta));
  }, []);

  // Accept: replace [s.start, s.end) with proposedFix, realign all suggestions (same logic as typing), apply both updates together
  const acceptSuggestion = useCallback((id) => {
    const currentPages = pagesRef.current;
    setSuggestions((prev) => {
      const s = prev.find((x) => x.id === id);
      if (!s || !s.proposedFix) return prev;

      const fix   = s.proposedFix;
      const delta = fix.length - (s.end - s.start);
      const pageText = currentPages[s.page] ?? "";
      const newPageText = pageText.slice(0, s.start) + fix + pageText.slice(s.end);
      const newPages = currentPages.map((p, i) => (i === s.page ? newPageText : p));
      pagesRef.current = newPages;
      setPages(newPages);

      const shifted = shiftOffsets(prev, id, s.start, delta);
      const fixEnd  = s.start + fix.length;

      return shifted.map((x) => {
        if (x.id === id) return { ...x, status: "resolved" };
        if (x.page === s.page && x.start < fixEnd && x.end > s.start) {
          return { ...x, status: "resolved", end: x.start };
        }
        return x;
      });
    });
  }, []);

  const resolveSuggestion = useCallback((id) => {
    setSuggestions((prev) => prev.map((s) => s.id === id ? { ...s, status: "resolved" } : s));
  }, []);

  const dismissSuggestion = useCallback((id) => {
    setSuggestions((prev) => prev.map((s) => s.id === id ? { ...s, status: "dismissed" } : s));
  }, []);

  const insertVisualization = useCallback((pageIndex, paragraphIndex, imgUrl) => {
    setVisualizations((prev) => ({
      ...prev,
      [pageIndex]: { ...(prev[pageIndex] ?? {}), [paragraphIndex]: imgUrl },
    }));
  }, []);

  const removeVisualization = useCallback((pageIndex, paragraphIndex) => {
    setVisualizations((prev) => {
      const page = { ...(prev[pageIndex] ?? {}) };
      delete page[paragraphIndex];
      return { ...prev, [pageIndex]: page };
    });
  }, []);

  const clearVisualizations = useCallback(() => setVisualizations({}), []);

    const reanalyse = useCallback(async (fetchFn) => {
    setIsAnalysing(true);
    try {
      const fresh = await fetchFn(pages);
      setSuggestions(hydrateSuggestions(fresh, pages));
    } finally {
      setIsAnalysing(false);
    }
  }, [pages]);

  return {
    pages,
    visualizations,
    suggestions: suggestions.filter((s) => s.status !== "dismissed"),
    isAnalysing,
    applyEdit,
    acceptSuggestion,
    insertVisualization,
    removeVisualization,
    resolveSuggestion,
    dismissSuggestion,
    reanalyse,
  };
}
