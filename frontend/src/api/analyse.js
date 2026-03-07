/**
 * analyseDocument
 *
 * Calls POST /analize and converts the response into the internal suggestion
 * shape used by useDocumentStore.
 *
 * API input:
 *   fragments: string[]   — one string per page (plain text)
 *   user_prompt: string   — optional instruction to the agents
 *
 * API output per result:
 *   kategoria:     "JEZYK" | "GRAF"
 *   tresc_poprawki: string   — correction text (JEZYK) or description (GRAF)
 *   typ:           string   — visualisation type for GRAF items
 *   miejsce:       { start, end, snippet }  — offsets within the fragment
 *   chunk_index:   number   — which fragment (= page index)
 *
 * Internal suggestion shape:
 *   id, page, start, end, type, severity, message, suggestion
 */

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export async function analyseDocument(pages, userPrompt = "") {
  const response = await fetch(`${API_BASE}/analize`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fragments:   pages,
      user_prompt: userPrompt,
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Analysis failed (${response.status}): ${detail}`);
  }

  const { results } = await response.json();
  return normaliseResults(results, pages);
}

/**
 * Map raw API results → internal suggestion array.
 *
 * Severity:
 *   JEZYK → "error"  (language issues, actionable)
 *   GRAF  → "info"   (visualisation hints, optional)
 *
 * Offset validation:
 *   start < end, both within the page string length.
 *   Silently drops results that fail validation rather than crashing.
 */
function normaliseResults(results, pages) {
  const suggestions = [];
  let   id          = 1;

  for (const r of results) {
    const page     = r.chunk_index ?? 0;
    const pageText = pages[page] ?? "";
    const { start, end, snippet } = r.miejsce ?? {};

    if (typeof start !== "number" || typeof end !== "number") continue;
    if (start < 0 || end > pageText.length || start >= end)   continue;

    const isJezyk = r.kategoria === "JEZYK";

    suggestions.push({
      id:         id++,
      page,
      start,
      end,
      type:       isJezyk ? "language" : (r.typ ?? "visualisation"),
      severity:   isJezyk ? "error" : "info",
      message:    isJezyk
                    ? "Language issue"
                    : `Visualisation: ${r.typ ?? "suggestion"}`,
      suggestion: r.tresc_poprawki ?? "",
      _snippet:   snippet, // for offset drift debugging
    });
  }

  return suggestions;
}
