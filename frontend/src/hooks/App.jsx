import { useState, useCallback } from "react";
import { SAMPLE_DOCUMENT, MOCK_SUGGESTIONS } from "./data/mockData";
import { DARK_THEME, LIGHT_THEME, SEVERITY_STYLES } from "./data/theme";
import { useDocumentStore } from "./hooks/useDocumentStore";
import { Topbar } from "./components/Topbar";
import { DocumentView } from "./components/DocumentView";
import { Sidebar } from "./components/Sidebar";

/**
 * Simulated backend fetch.
 * Replace with a real fetch() when backend is ready.
 *
 * Contract:
 *   POST /api/analyse
 *   Body:     { text: string }
 *   Response: { suggestions: RawSuggestion[] }
 */
async function fetchSuggestionsFromBackend(text) {
  await new Promise((r) => setTimeout(r, 1200));
  return MOCK_SUGGESTIONS.filter((s) => s.end <= text.length);
}

export default function App() {
  const [activeSuggId, setActive] = useState(null);
  const [isDark, setIsDark]       = useState(true);

  // documentKey forces the store to remount when a new file is imported,
  // cleanly resetting all state (text, suggestions, cursor history).
  const [documentKey, setDocumentKey] = useState(0);
  const [initText, setInitText]       = useState(SAMPLE_DOCUMENT);
  const [filename, setFilename]       = useState("service-agreement (sample)");

  const {
    currentText,
    suggestions,
    isAnalysing,
    applyEdit,
    dismissSuggestion,
    reanalyse,
  } = useDocumentStore(initText, MOCK_SUGGESTIONS, documentKey);

  // Called by PdfImportButton when parsing succeeds
  const handleImport = useCallback(({ text, filename: name, pageCount }) => {
    setInitText(text);
    setFilename(`${name}  (${pageCount}p)`);
    setDocumentKey((k) => k + 1); // remount store with fresh text
    setActive(null);
  }, []);

  const theme = isDark ? DARK_THEME : LIGHT_THEME;

  return (
    <div style={{
      ...theme,
      background: "var(--bg)",
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Crimson+Pro:ital,wght@0,400;0,600;1,400&family=DM+Sans:wght@400;500;700&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }
        @keyframes tooltipIn {
          from { opacity: 0; transform: translateY(-4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        [contenteditable]:focus { outline: none; }
        span[contenteditable="true"] { -webkit-user-modify: read-write-plaintext-only; }
      `}</style>

      <Topbar
        filename={filename}
        suggestionCount={suggestions.length}
        isDark={isDark}
        onToggleTheme={() => setIsDark((d) => !d)}
        onImport={handleImport}
      />

      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* Editor pane */}
        <div style={{ flex: 1, overflowY: "auto", padding: "48px 64px" }}>
          <div style={{ maxWidth: 720, margin: "0 auto" }}>

            {/* Legend */}
            <div style={{
              display: "flex", gap: 16, marginBottom: 28,
              padding: "10px 14px",
              background: "var(--surface-1)",
              borderRadius: 8,
              border: "1px solid var(--border)",
              flexWrap: "wrap",
              alignItems: "center",
            }}>
              <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em" }}>
                Underlined regions are editable · hover to inspect
              </span>
              {Object.entries(SEVERITY_STYLES).map(([key, s]) => (
                <div key={key} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <div style={{ width: 24, height: 3, background: s.border, borderRadius: 2 }} />
                  <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>{s.label}</span>
                </div>
              ))}
            </div>

            <DocumentView
              
              text={currentText}
              suggestions={suggestions}
              onApplyEdit={applyEdit}
              onDismiss={dismissSuggestion}
            />
          </div>
        </div>

        <Sidebar
          suggestions={suggestions}
          activeId={activeSuggId}
          onHover={setActive}
          onDismiss={dismissSuggestion}
          onReanalyse={() => reanalyse(fetchSuggestionsFromBackend)}
          isAnalysing={isAnalysing}
        />
      </div>
    </div>
  );
}
