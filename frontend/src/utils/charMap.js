/**
 * charMap.js
 *
 * Single source of truth for PDF text extraction and coordinate mapping.
 *
 * Font replication strategy:
 *   textContent.styles[item.fontName] gives { fontFamily, ascent, descent, italic }
 *   We store a canvasFont string per item ("bold italic 14px Times New Roman")
 *   so the patch renderer can call ctx.font = canvasFont exactly.
 */

// ─── Core builder ─────────────────────────────────────────────────────────────

export function buildCharMap(textContent, viewport) {
  const charMap   = [];
  const textParts = [];
  let   prevY     = null;

  const items = [...textContent.items].sort((a, b) => {
    const yDiff = b.transform[5] - a.transform[5];
    return Math.abs(yDiff) > 2 ? yDiff : a.transform[4] - b.transform[4];
  });

  for (const item of items) {
    if (!item.str) continue;

    const [, , , scaleY, tx, ty] = item.transform;
    const charWidth  = item.str.length > 0 ? (item.width || 0) / item.str.length : 0;
    const charHeight = Math.abs(scaleY);
    const fontSize   = charHeight * viewport.scale;

    // Resolve font from textContent.styles — this is what pdf.js rendered with
    const styleEntry  = textContent.styles?.[item.fontName] ?? {};
    const fontFamily  = styleEntry.fontFamily || "serif";
    const isBold      = /bold/i.test(item.fontName) || styleEntry.fontWeight >= 700;
    const isItalic    = /italic|oblique/i.test(item.fontName) || styleEntry.italic;
    const fontStyle   = [isItalic ? "italic" : "", isBold ? "bold" : ""].filter(Boolean).join(" ");
    const canvasFont  = `${fontStyle} ${fontSize.toFixed(1)}px ${fontFamily}`.trim();

    const roundedY = Math.round(ty / 3) * 3;
    if (prevY !== null && Math.abs(roundedY - prevY) > 1) {
      textParts.push("\n");
      charMap.push({ char: "\n", x: 0, y: 0, width: 0, height: 0, canvasFont, fontSize });
    }
    prevY = roundedY;

    for (let ci = 0; ci < item.str.length; ci++) {
      const pdfX = tx + ci * charWidth;
      const [vx, vyTop]    = viewport.convertToViewportPoint(pdfX, ty + charHeight);
      const [,   vyBottom] = viewport.convertToViewportPoint(pdfX, ty);

      charMap.push({
        char:      item.str[ci],
        x:         vx,
        y:         vyTop,
        width:     charWidth * viewport.scale,
        height:    Math.abs(vyBottom - vyTop),
        fontSize,
        canvasFont,   // ← exact font string for ctx.font
        baseline:     vyBottom,  // ← CSS-space baseline Y for fillText
      });
    }
    textParts.push(item.str);
  }

  return { charMap, text: textParts.join("") };
}

export function extractPageText(charMap) {
  return charMap.map((c) => c.char).join("");
}

// ─── Geometry ─────────────────────────────────────────────────────────────────

export function getRects(charMap, start, end) {
  if (start >= end || start >= charMap.length) return [];
  const chars = charMap.slice(start, Math.min(end, charMap.length))
    .filter((c) => c.char !== "\n" && c.width > 0);
  if (!chars.length) return [];

  const lines = new Map();
  for (const c of chars) {
    const lineY = Math.round(c.y);
    if (!lines.has(lineY)) lines.set(lineY, []);
    lines.get(lineY).push(c);
  }

  return [...lines.values()].map((lc) => ({
    x:          Math.min(...lc.map((c) => c.x)),
    y:          lc[0].y,
    width:      Math.max(...lc.map((c) => c.x + c.width)) - Math.min(...lc.map((c) => c.x)),
    height:     lc[0].height,
    fontSize:   lc[0].fontSize,
    canvasFont: lc[0].canvasFont,   // exact font for this line
    baseline:   lc[0].baseline,     // CSS baseline Y for fillText
  }));
}

export function hitTest(charMap, cx, cy) {
  for (let i = 0; i < charMap.length; i++) {
    const c = charMap[i];
    if (c.width <= 0) continue;
    if (cx >= c.x && cx <= c.x + c.width && cy >= c.y && cy <= c.y + c.height) return i;
  }
  return -1;
}
