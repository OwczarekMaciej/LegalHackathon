/**
 * debugFonts
 *
 * Call this from usePageRenderer right after getTextContent() to log
 * exactly what pdf.js gives us for font data.
 *
 * Remove once font matching is working correctly.
 */
export function debugFonts(textContent) {
  console.group("PDF font debug");

  console.log("styles object:", textContent.styles);

  const seen = new Set();
  for (const item of textContent.items) {
    if (!item.str?.trim() || seen.has(item.fontName)) continue;
    seen.add(item.fontName);

    const style = textContent.styles?.[item.fontName];
    const [,,,scaleY,,] = item.transform;

    console.log({
      fontName:   item.fontName,
      style,
      scaleY:     Math.abs(scaleY).toFixed(2),
      sampleText: item.str.slice(0, 30),
    });
  }

  console.groupEnd();
}
