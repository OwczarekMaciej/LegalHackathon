import { PageView } from "./PageView";

// A4 at 96dpi = 794px. With 72px side padding that gives ~650px text column.
const PAGE_WIDTH = 794;

export function DocumentView({ pages, suggestions, onApplyEdit, onDismiss, visualizations, onRemoveViz }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32, alignItems: "center", paddingBottom: 64 }}>
      {pages.map((pageText, pageIndex) => (
        <div key={pageIndex} style={{ width: PAGE_WIDTH, maxWidth: "100%" }}>
          <div style={{
            background:   "#ffffff",
            borderRadius: 3,
            boxShadow:    "0 1px 3px rgba(0,0,0,0.12), 0 4px 20px rgba(0,0,0,0.10), 0 0 0 1px rgba(0,0,0,0.04)",
            padding:      "72px 80px",
            width:        "100%",
            boxSizing:    "border-box",
          }}>
            <PageView
              pageIndex={pageIndex}
              text={pageText}
              suggestions={suggestions.filter((s) => s.page === pageIndex)}
              onApplyEdit={onApplyEdit}
              onDismiss={onDismiss}
              visualizations={visualizations?.[pageIndex] ?? {}}
              onRemoveViz={onRemoveViz}
            />
          </div>
          <div style={{
            textAlign:     "center",
            marginTop:     10,
            fontSize:      11,
            color:         "var(--text-muted)",
            fontFamily:    "'DM Mono', monospace",
            letterSpacing: "0.06em",
          }}>
            {pageIndex + 1} / {pages.length}
          </div>
        </div>
      ))}
    </div>
  );
}
