import { useState, useCallback, useEffect } from "react";

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
    if (s.page === editedPage && s.start >= editStart)
      return { ...s, start: s.start + delta, end: s.end + delta };
    return s;
  });
}

export function useDocumentStore(initialPages, initialRawSuggestions, documentKey) {
  const [pages,       setPages]       = useState(initialPages);
  const [suggestions, setSuggestions] = useState(() =>
    hydrateSuggestions(initialRawSuggestions, initialPages)
  );
  const [isAnalysing, setIsAnalysing] = useState(false);

  useEffect(() => {
    setPages(initialPages);
    setSuggestions(hydrateSuggestions(initialRawSuggestions, initialPages));
    setIsAnalysing(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentKey]);

  const applyEdit = useCallback((suggestionId, pageIndex, newPageText, editStart, delta) => {
    setPages((prev) => prev.map((p, i) => i === pageIndex ? newPageText : p));
    setSuggestions((prev) => shiftOffsets(prev, suggestionId, editStart, delta));
  }, []);

  // "I fixed this" — shown as resolved in sidebar then hidden
  const resolveSuggestion = useCallback((id) => {
    setSuggestions((prev) => prev.map((s) => s.id === id ? { ...s, status: "resolved" } : s));
  }, []);

  // "Ignore this" — hidden immediately
  const dismissSuggestion = useCallback((id) => {
    setSuggestions((prev) => prev.map((s) => s.id === id ? { ...s, status: "dismissed" } : s));
  }, []);

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
    // dismissed = hidden entirely; resolved = shown struck-through in sidebar
    suggestions: suggestions.filter((s) => s.status !== "dismissed"),
    isAnalysing,
    applyEdit,
    resolveSuggestion,
    dismissSuggestion,
    reanalyse,
  };
}
