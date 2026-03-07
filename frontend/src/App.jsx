import { useState, useCallback } from "react";
import { SAMPLE_PAGES, MOCK_SUGGESTIONS } from "./data/mockData";
import { DARK_THEME, LIGHT_THEME, SEVERITY_STYLES } from "./data/theme";
import { useDocumentStore } from "./hooks/useDocumentStore";
import { Topbar }        from "./components/Topbar";
import { DocumentView }  from "./components/DocumentView";
import { Sidebar }       from "./components/Sidebar";

async function fetchSuggestionsFromBackend(pages) {
  await new Promise((r) => setTimeout(r, 1200));
  return MOCK_SUGGESTIONS.filter((s) => s.end <= (pages[s.page]?.length ?? 0));
}

export default function App() {
  const [activeSuggId,  setActive]      = useState(null);
  const [isDark,        setIsDark]      = useState(true);
  const [documentKey,   setDocumentKey] = useState(0);
  const [initPages,     setInitPages]   = useState(SAMPLE_PAGES);
  const [filename,      setFilename]    = useState("service-agreement (sample)");

  const { pages, suggestions, isAnalysing, applyEdit, dismissSuggestion, reanalyse }
    = useDocumentStore(initPages, MOCK_SUGGESTIONS, documentKey);

  const handleImport = useCallback(({ pages: importedPages, filename: name, pageCount }) => {
    setInitPages(importedPages);
    setFilename(`${name}  ·  ${pageCount}p`);
    setDocumentKey((k) => k + 1);
    setActive(null);
  }, []);

  const theme = isDark ? DARK_THEME : LIGHT_THEME;

  return (
    <div style={{ ...theme, background: "var(--bg)", minHeight: "100vh", display: "flex", flexDirection: "column", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Crimson+Pro:ital,wght@0,400;0,600;1,400&family=DM+Sans:wght@400;500;700&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }
        @keyframes tooltipIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        [contenteditable]:focus { outline: none; }
      `}</style>

      <Topbar
        filename={filename}
        suggestionCount={suggestions.length}
        isDark={isDark}
        onToggleTheme={() => setIsDark((d) => !d)}
        onImport={handleImport}
      />

      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        <div style={{ flex: 1, overflowY: "auto", background: isDark ? "#23272f" : "#e8e6e1", padding: "40px 32px" }}>
          {/* Legend */}
          <div style={{ maxWidth: 760, margin: "0 auto 28px", display: "flex", gap: 16, padding: "9px 14px", background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.06)", borderRadius: 7, flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ fontSize: 11, color: isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.4)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em" }}>
              Underlined = editable · hover to inspect
            </span>
            {Object.entries(SEVERITY_STYLES).map(([key, s]) => (
              <div key={key} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <div style={{ width: 20, height: 3, background: s.border, borderRadius: 2 }} />
                <span style={{ fontSize: 11, color: isDark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.5)" }}>{s.label}</span>
              </div>
            ))}
          </div>

          <DocumentView
            pages={pages}
            suggestions={suggestions}
            onApplyEdit={applyEdit}
            onDismiss={dismissSuggestion}
          />
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
