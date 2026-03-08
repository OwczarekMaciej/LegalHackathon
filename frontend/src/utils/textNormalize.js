/**
 * Normalize page text so character indices stay aligned with the backend.
 * - Unicode NFC (consistent composed characters)
 * - Collapse whitespace: single space within lines, single \n between lines.
 * Backend matches snippets with " ".join(snippet.split()); we must store the same.
 */
export function normalizePageText(raw) {
  if (typeof raw !== "string" || !raw.length) return raw;
  const nfc = raw.normalize("NFC");
  return nfc
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .join("\n")
    .trim();
}
