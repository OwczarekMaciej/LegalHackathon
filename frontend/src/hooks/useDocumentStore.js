import { useState, useCallback, useEffect } from "react";

/**
 * useDocumentStore
 *
 * Document model is now PAGE-AWARE.
 *
 * pages: string[]  — one string per page, the canonical unit.
 *
 * Suggestion offsets are PAGE-SCOPED:
 *   { page: number (0-indexed), start: number, end: number }
 *
 * This matches how the backend should work: it receives pages[] and returns
 * suggestions with page-scoped offsets. No global offset arithmetic needed.
 *
 * For the sample document (plain text), we treat it as a single page.
 */

// ─── Helpers ─────────────────────────────────────────────────────────────────

function hydrateSuggestions(rawSuggestions, pages) {
  return rawSuggestions.map((s) => {
    const pageText = pages[s.page] ?? "";
    return {
      ...s,
      originalStart:   s.start,
      originalEnd:     s.end,
      originalSnippet: pageText.slice(s.start, s.end),
      status:          "pending",
    };
  });
}

function shiftOffsets(suggestions, editedId, editStart, delta) {
  return suggestions.map((s) => {
    if (s.id === editedId) {
      return { ...s, end: s.end + delta, status: "edited" };
    }
    // Only shift suggestions on the same page that come after the edit
    if (s.page === suggestions.find(x => x.id === editedId)?.page && s.start >= editStart) {
      return { ...s, start: s.start + delta, end: s.end + delta };
    }
    return s;
  });
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useDocumentStore(initialPages, initialRawSuggestions, documentKey) {
  const [pages,       setPages]       = useState(initialPages);
  const [suggestions, setSuggestions] = useState(() =>
    hydrateSuggestions(initialRawSuggestions, initialPages)
  );
  const [isAnalysing, setIsAnalysing] = useState(false);

  // Reset on new document import
  useEffect(() => {
    setPages(initialPages);
    setSuggestions(hydrateSuggestions(initialRawSuggestions, initialPages));
    setIsAnalysing(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentKey]);

  // Called by PageView when user edits a highlighted span
  // pageIndex: which page was edited
  // editStart/delta: character-level offset within that page's string
  const applyEdit = useCallback((suggestionId, pageIndex, newPageText, editStart, delta) => {
    setPages((prev) => prev.map((p, i) => i === pageIndex ? newPageText : p));
    setSuggestions((prev) => shiftOffsets(prev, suggestionId, editStart, delta));
  }, []);

  const dismissSuggestion = useCallback((id) => {
    setSuggestions((prev) =>
      prev.map((s) => s.id === id ? { ...s, status: "dismissed" } : s)
    );
  }, []);

  const reanalyse = useCallback(async (fetchSuggestions) => {
    setIsAnalysing(true);
    try {
      const rawFresh = await fetchSuggestions(pages);
      setSuggestions(hydrateSuggestions(rawFresh, pages));
    } finally {
      setIsAnalysing(false);
    }
  }, [pages]);

  const getSnippetDiff = useCallback((id) => {
    const s = suggestions.find((x) => x.id === id);
    if (!s) return null;
    const current = pages[s.page]?.slice(s.start, s.end) ?? "";
    return { original: s.originalSnippet, current, changed: s.originalSnippet !== current };
  }, [suggestions, pages]);

  const visibleSuggestions = suggestions.filter((s) => s.status !== "dismissed");

  return {
    pages,
    suggestions: visibleSuggestions,
    allSuggestions: suggestions,
    isAnalysing,
    applyEdit,
    dismissSuggestion,
    reanalyse,
    getSnippetDiff,
  };
}
