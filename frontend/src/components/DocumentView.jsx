import { useRef } from "react";
import { PageView } from "./PageView";

/**
 * DocumentView
 *
 * Orchestrates the paginated document. Each page is rendered as a paper card
 * with a shadow, page number, and realistic margins.
 *
 * Props:
 *   pages        string[]
 *   suggestions  Array    — all visible suggestions, page-scoped
 *   onApplyEdit  fn(suggestionId, pageIndex, newPageText, editStart, delta)
 *   onDismiss    fn(id)
 */
export function DocumentView({ pages, suggestions, onApplyEdit, onDismiss }) {
  const pageRefs = useRef([]);

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      gap: 32,
      alignItems: "center",
      paddingBottom: 64,
    }}>
      {pages.map((pageText, pageIndex) => {
        // Only pass suggestions that belong to this page
        const pageSuggestions = suggestions.filter((s) => s.page === pageIndex);

        return (
          <div
            key={pageIndex}
            ref={(el) => (pageRefs.current[pageIndex] = el)}
            style={{ width: "100%", maxWidth: 760 }}
          >
            {/* Paper card */}
            <div style={{
              background: "#ffffff",
              borderRadius: 3,
              boxShadow: "0 1px 3px rgba(0,0,0,0.12), 0 4px 16px rgba(0,0,0,0.10), 0 0 0 1px rgba(0,0,0,0.04)",
              padding: "72px 88px",
              position: "relative",
              minHeight: 400,
            }}>
              <PageView
                pageIndex={pageIndex}
                text={pageText}
                suggestions={pageSuggestions}
                onApplyEdit={onApplyEdit}
                onDismiss={onDismiss}
              />
            </div>

            {/* Page number */}
            <div style={{
              textAlign: "center",
              marginTop: 10,
              fontSize: 11,
              color: "var(--text-muted)",
              fontFamily: "'DM Mono', monospace",
              letterSpacing: "0.06em",
            }}>
              {pageIndex + 1} / {pages.length}
            </div>
          </div>
        );
      })}
    </div>
  );
}
