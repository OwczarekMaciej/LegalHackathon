/**
 * buildSegments
 *
 * Splits a flat string into an ordered array of segments, each tagged with
 * which suggestions (if any) overlap that range.
 *
 * @param {string} text
 * @param {Array}  suggestions  — each must have { id, start, end }
 * @returns {Array<{ text: string, suggestions: Array }>}
 */
export function buildSegments(text, suggestions) {
  const events = [];
  suggestions.forEach((s) => {
    events.push({ pos: s.start, type: "open",  id: s.id });
    events.push({ pos: s.end,   type: "close", id: s.id });
  });
  // Sort by position; close before open at the same position to avoid zero-width spans
  events.sort((a, b) => a.pos - b.pos || (a.type === "close" ? -1 : 1));

  const segments = [];
  let cursor = 0;
  const active = new Set();

  const flush = (end) => {
    if (cursor < end) {
      segments.push({
        text: text.slice(cursor, end),
        suggestions: [...active].map((id) => suggestions.find((s) => s.id === id)),
      });
      cursor = end;
    }
  };

  for (const ev of events) {
    flush(ev.pos);
    if (ev.type === "open")  active.add(ev.id);
    else                     active.delete(ev.id);
  }
  flush(text.length);
  return segments;
}

/**
 * topSeverity
 * Returns the most severe suggestion from a list: text issues first, then visualization suggestions.
 */
const SEVERITY_ORDER = { error: 0, info: 1 };
export function topSeverity(suggestions) {
  return suggestions.slice().sort(
    (a, b) => (SEVERITY_ORDER[a.severity] ?? 0) - (SEVERITY_ORDER[b.severity] ?? 1)
  )[0];
}
