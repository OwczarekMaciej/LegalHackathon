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
  const [isAnalysing,    setIsAnalysing]    = useState(false);
  // visualizations: { [pageIndex]: { [paragraphIndex]: imgUrl } }
  // Kept separate from pages[] so text offsets are never affected.
  const [visualizations, setVisualizations] = useState({});

  useEffect(() => {
    setPages(initialPages);
    setSuggestions(hydrateSuggestions(initialRawSuggestions, initialPages));
    setIsAnalysing(false);
    setVisualizations({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentKey]);

  const applyEdit = useCallback((suggestionId, pageIndex, newPageText, editStart, delta) => {
    setPages((prev) => prev.map((p, i) => i === pageIndex ? newPageText : p));
    setSuggestions((prev) => shiftOffsets(prev, suggestionId, editStart, delta));
  }, []);

  // Blind accept: replace the highlighted text with proposedFix, resolve
  const acceptSuggestion = useCallback((id) => {
    setSuggestions((prev) => {
      const s = prev.find((x) => x.id === id);
      if (!s || !s.proposedFix) return prev;

      const fix   = s.proposedFix;
      const delta = fix.length - (s.end - s.start);

      setPages((pages) => pages.map((pageText, i) => {
        if (i !== s.page) return pageText;
        return pageText.slice(0, s.start) + fix + pageText.slice(s.end);
      }));

      // Shift offsets on same page, resolve this suggestion
      return prev.map((x) => {
        if (x.id === id) return { ...x, end: x.start + fix.length, status: "resolved" };
        if (x.page === s.page && x.start >= s.start && x.id !== id)
          return { ...x, start: x.start + delta, end: x.end + delta };
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
