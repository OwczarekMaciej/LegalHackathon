export const SEVERITY_STYLES = {
  error: {
    bg:      "rgba(239,68,68,0.18)",
    bgHover: "rgba(239,68,68,0.32)",
    border:  "rgba(239,68,68,0.7)",
    dot:     "#ef4444",
    label:   "Issue",
  },
  warning: {
    bg:      "rgba(245,158,11,0.18)",
    bgHover: "rgba(245,158,11,0.32)",
    border:  "rgba(245,158,11,0.7)",
    dot:     "#f59e0b",
    label:   "Warning",
  },
  info: {
    bg:      "rgba(59,130,246,0.18)",
    bgHover: "rgba(59,130,246,0.32)",
    border:  "rgba(59,130,246,0.7)",
    dot:     "#3b82f6",
    label:   "Suggestion",
  },
  resolved: {
    bg:      "rgba(156,163,175,0.13)",
    bgHover: "rgba(156,163,175,0.13)",
    border:  "rgba(156,163,175,0.45)",
    dot:     "#9ca3af",
    label:   "Resolved",
  },
};

export const TYPE_ICONS = {
  clarity:          "◈",
  "plain-language": "⌘",
  readability:      "◎",
  definition:       "◆",
  language:         "⌘",
  visualisation:    "◉",
};

export const DARK_THEME = {
  "--bg":             "#0f1117",
  "--surface-1":      "#161b27",
  "--surface-2":      "#1e2535",
  "--border":         "#2a3245",
  "--text-primary":   "#e8eaf0",
  "--text-secondary": "#8b95aa",
  "--text-muted":     "#505a70",
  "--accent":         "#4f7fff",
};

export const LIGHT_THEME = {
  "--bg":             "#f5f3ef",
  "--surface-1":      "#ffffff",
  "--surface-2":      "#f9f8f5",
  "--border":         "#e2ddd8",
  "--text-primary":   "#1a1814",
  "--text-secondary": "#5c5650",
  "--text-muted":     "#9e9890",
  "--accent":         "#2d5be3",
};
