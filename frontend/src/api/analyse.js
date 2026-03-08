// In dev, use same-origin /api (Vite proxies to backend) to avoid ERR_CONNECTION_RESET
const API_BASE =
  import.meta.env.VITE_API_URL ??
  (import.meta.env.DEV ? "/api" : "http://localhost:8000");

export async function analyseDocument(pages, userPrompt = "") {
  const res = await fetch(`${API_BASE}/analize`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ fragments: pages, user_prompt: userPrompt }),
  });
  if (!res.ok) throw new Error(`Analiza nie powiodła się (${res.status}): ${await res.text()}`);
  const { results } = await res.json();
  return normaliseResults(results, pages);
}

/**
 * verifyImprovement
 * POST /verify-improvement
 * Returns { all_good: bool, issues: string[] }
 */
export async function verifyImprovement(badText, reasoning, updatedText) {
  const res = await fetch(`${API_BASE}/verify-improvement`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ bad_text: badText, reasoning, updated_text: updatedText }),
  });
  if (!res.ok) throw new Error(`Weryfikacja nie powiodła się (${res.status}): ${await res.text()}`);
  return res.json(); // { all_good, issues }
}

function normaliseResults(results, pages) {
  // Backend returns start/end in full-text coordinates (all fragments concatenated).
  // Convert to per-page offsets so the frontend can use pages[page].slice(start, end).
  const pageOffsets = [];
  let pos = 0;
  for (const p of pages) {
    pageOffsets.push(pos);
    pos += (p?.length ?? 0);
  }

  const suggestions = [];
  let id = 1;

  for (const r of results) {
    const page     = r.chunk_index ?? 0;
    const pageText = pages[page] ?? "";
    const { start: globalStart, end: globalEnd, snippet } = r.miejsce ?? {};
    const offset   = pageOffsets[page] ?? 0;
    const start    = globalStart - offset;
    const end      = globalEnd - offset;

    if (typeof globalStart !== "number" || typeof globalEnd !== "number") continue;
    if (start < 0 || end > pageText.length || start >= end) continue;

    const isJezyk = r.kategoria === "JEZYK";

    suggestions.push({
      id,
      page,
      start,
      end,
      kategoria:   r.kategoria,                        // "JEZYK" | "GRAF"
      type:        isJezyk ? "language" : (r.typ ?? "visualisation"),
      severity:    isJezyk ? "error" : "info",
      // LLM's explanation of the problem
      reasoning:   r.tresc_poprawki ?? "",
      // LLM's proposed replacement (JEZYK only)
      proposedFix: r.propozycja_poprawki ?? "",
      // Shown as the card title
      message:     isJezyk
                     ? (r.tresc_poprawki ?? "Language issue")
                     : `Visualisation: ${r.typ ?? "suggestion"}`,
      // Keep for backward compat with Tooltip/Sidebar
      suggestion:  r.propozycja_poprawki ?? r.tresc_poprawki ?? "",
      _snippet:    snippet,
    });
    id++;
  }

  return suggestions;
}

/**
 * generateVisualizationPng
 * POST /viz/generate-png
 * Returns an object URL pointing to the PNG blob (caller is responsible for revoking it).
 */
export async function generateVisualizationPng(context, visualizationType) {
  const res = await fetch(`${API_BASE}/viz/generate-png`, {
    method:  "POST",
    headers: { "Content-Type": "application/json", "accept": "image/png" },
    body:    JSON.stringify({ context, visualization_type: visualizationType }),
  });
  if (!res.ok) throw new Error(`Generowanie wizualizacji nie powiodło się (${res.status}): ${await res.text()}`);
  const blob = await res.blob();
  return URL.createObjectURL(blob);
}

// Map API typ values → /viz/generate-png visualization_type values
export const VIZ_TYPE_MAP = {
  "oś_czasu":       "timeline",
  "tabela":         "table",
  "wykres_kołowy":  "chart",
  "wykres_słupkowy":"chart",
  // fallback for anything else
  "visualisation":  "chart",
};
