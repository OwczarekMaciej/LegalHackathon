import { useState, useCallback } from "react";
import { SAMPLE_PAGES } from "./data/mockData";
import { DARK_THEME, LIGHT_THEME, SEVERITY_STYLES } from "./data/theme";
import { useDocumentStore }  from "./hooks/useDocumentStore";
import { analyseDocument, verifyImprovement, generateVisualizationPng, VIZ_TYPE_MAP } from "./api/analyse";
import { Topbar }            from "./components/Topbar";
import { DocumentView }      from "./components/DocumentView";
import { Sidebar }           from "./components/Sidebar";

export default function App() {
  const [isDark,        setIsDark]      = useState(true);
  const [documentKey,   setDocumentKey] = useState(0);
  const [initPages,     setInitPages]   = useState(SAMPLE_PAGES);
  const [filename,      setFilename]    = useState("service-agreement (sample)");
  const [apiError,      setApiError]    = useState(null);
  const [userPrompt,    setUserPrompt]  = useState("");

  const {
    pages, suggestions, isAnalysing,
    applyEdit, acceptSuggestion, resolveSuggestion, dismissSuggestion, reanalyse,
    visualizations, insertVisualization, removeVisualization,
  } = useDocumentStore(initPages, [], documentKey);

  const handleImport = useCallback(({ pages: importedPages, filename: name, pageCount }) => {
    setInitPages(importedPages);
    setFilename(`${name}  ·  ${pageCount}p`);
    setDocumentKey((k) => k + 1);
    setApiError(null);
  }, []);

  const handleReanalyse = useCallback(() => {
    setApiError(null);
    reanalyse((pages) => analyseDocument(pages, userPrompt))
      .catch((err) => setApiError(err.message ?? "Analysis failed."));
  }, [reanalyse, userPrompt]);

  // Called by Sidebar card — gets the live edited text from pages
  const handleVerify = useCallback(async (suggestion) => {
    const currentText = pages[suggestion.page]?.slice(suggestion.start, suggestion.end) ?? "";
    return verifyImprovement(suggestion.originalSnippet, suggestion.reasoning, currentText);
  }, [pages]);

  // Called by GRAF cards — generates PNG and inserts it after the paragraph
  // that contains suggestion.start.
  const handleGenerate = useCallback(async (suggestion) => {
    const pageText = pages[suggestion.page] ?? "";
    const context  = pageText.slice(suggestion.start, suggestion.end) || suggestion._snippet || "";
    const vizType  = VIZ_TYPE_MAP[suggestion.type] ?? "chart";

    const imgUrl = await generateVisualizationPng(context, vizType);

    // Find which paragraph (split by \n) contains suggestion.start
    const paragraphs = pageText.split("\n");
    let paraIndex = 0, charCount = 0;
    for (let i = 0; i < paragraphs.length; i++) {
      charCount += paragraphs[i].length + 1; // +1 for the \n
      if (charCount > suggestion.start) { paraIndex = i; break; }
    }

    insertVisualization(suggestion.page, paraIndex, imgUrl);
    return imgUrl;
  }, [pages, insertVisualization]);

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
        suggestionCount={suggestions.filter(s => s.status !== "resolved").length}
        isDark={isDark}
        onToggleTheme={() => setIsDark((d) => !d)}
        onImport={handleImport}
      />

      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        <div style={{ flex: 1, overflowY: "auto", background: isDark ? "#23272f" : "#e8e6e1", padding: "40px 32px" }}>
          {/* Legend — skip "resolved" entry */}
          <div style={{ maxWidth: 794, margin: "0 auto 28px", display: "flex", gap: 16, padding: "9px 14px", background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.06)", borderRadius: 7, flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ fontSize: 11, color: isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.4)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em" }}>
              Underlined = editable · hover to inspect
            </span>
            {Object.entries(SEVERITY_STYLES).filter(([k]) => k !== "resolved").map(([key, s]) => (
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
            visualizations={visualizations}
            onRemoveViz={removeVisualization}
          />
        </div>

        <Sidebar
          suggestions={suggestions}
          onHover={() => {}}
          onAccept={acceptSuggestion}
          onResolve={resolveSuggestion}
          onDismiss={dismissSuggestion}
          onVerify={handleVerify}
          onGenerate={handleGenerate}
          onReanalyse={handleReanalyse}
          isAnalysing={isAnalysing}
          apiError={apiError}
          userPrompt={userPrompt}
          onUserPromptChange={setUserPrompt}
        />
      </div>
    </div>
  );
}
