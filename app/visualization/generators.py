import io
import matplotlib.pyplot as plt
import networkx as nx

# --- KONFIGURACJA STYLU LEGAL DESIGN ---
PRIMARY_COLOR = "#0D253F"     # Bardzo ciemny biznesowy granat
SECONDARY_COLOR = "#125199"   # Znakomity akcentowy niebieski
ACCENT_COLOR = "#E2E8F0"      # Jasny szary obramowań
TEXT_COLOR = "#334155"        # Ciemny grafitowy tekst
FONT_FAMILY = "sans-serif"

def setup_modern_axes(ax):
    """Zdejmuje zbędne ramki (spines) i dodaje delikatny grid na osi Y."""
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    ax.spines['left'].set_visible(False)
    ax.spines['bottom'].set_color(ACCENT_COLOR)
    ax.spines['bottom'].set_linewidth(1.5)
    
    # Gridtylko na Y
    ax.yaxis.grid(True, linestyle="-", color="#F1F5F9", linewidth=1.5, zorder=0)
    ax.xaxis.grid(False)
    
    ax.tick_params(axis='x', colors=TEXT_COLOR, labelsize=12, length=0, pad=10)
    ax.tick_params(axis='y', colors=TEXT_COLOR, labelsize=12, length=0, pad=10)

def generate_chart_png(data: dict) -> bytes:
    """Generuje minimalistyczny, 'premium' PNG dla typu 'chart'"""
    labels = data.get("labels", [])
    if data.get("datasets"):
        values = data["datasets"][0].get("data", [])
        label_name = data["datasets"][0].get("label", "Wartość")
    else:
        values = []
        label_name = "Wartość"

    # Nowoczesne, jasnoszary tło aplikacji (np. Tailwind Slate-50)
    bg_color = "#F8FAFC"
    fig, ax = plt.subplots(figsize=(10, 6.5), facecolor=bg_color)
    ax.set_facecolor(bg_color)
    
    # Całkowite usunięcie ramek (spines) zokoła wykresu
    for spine in ax.spines.values():
        spine.set_visible(False)

    # Kolorowa Paleta Legal Design
    NODE_COLORS = [
        "#D94833", # Elegancka czerwień/cegła
        "#2B6CB0", # Klasyczny Niebieski
        "#38A169", # Profesjonalna zieleń
        "#D69E2E", # Musztardowy żółty
        "#805AD5", # Śliwkowy fiolet
        "#319795"  # Turkusowy
    ]
    
    # Siatka (Grid) - tylko poziome linie, ledwie widoczne w tle
    ax.yaxis.grid(True, linestyle='-', which='major', color='#E2E8F0', alpha=0.8, zorder=0)
    ax.set_axisbelow(True) 
    ax.get_yaxis().set_ticks([]) # Ukrycie brzydkich osi Y
    
    # Twarda "podłoga" (baza) na osi X dla słupków
    ax.axhline(0, color="#CBD5E1", linewidth=1.5, zorder=2)

    # Dostosuj kolory słupków w zależności od ich ilości
    bar_colors = [NODE_COLORS[i % len(NODE_COLORS)] for i in range(len(labels))]

    # Zawijanie zbyt długich etykiet z osi X
    import textwrap
    wrapped_labels = [textwrap.fill(lbl, width=15) for lbl in labels]

    # Klasyczne, profesjonalne słupki bez zaokrągleń
    bars = ax.bar(wrapped_labels, values, color=bar_colors, edgecolor="none", zorder=3, width=0.6)

    # Etykiety z liczbami nad słupkami
    for bar in bars:
        h = bar.get_height()
        formatted_val = f"{int(h):,}".replace(",", " ") if h == int(h) else str(h)
        
        ax.text(
            bar.get_x() + bar.get_width() / 2., 
            h + (max(values) * 0.02),
            formatted_val,
            ha='center', va='bottom',
            fontsize=12, fontweight='bold', color="#334155", # Klasyczny ciemny szary dla czytelności
            zorder=4
        )

    # Ustawienie i modyfikacja wyglądu etykiet osi X
    ax.tick_params(axis='x', colors="#475569", labelsize=11, length=0, pad=10)
    
    for label in ax.get_xticklabels():
        label.set_fontweight('medium')

    # Nowoczesny, czysty tytuł z lewej strony
    wrapped_title = textwrap.fill(label_name.upper(), width=50)
    
    ax.set_title(
        wrapped_title, 
        fontsize=22, 
        fontweight="bold", 
        color="#1E293B",
        loc="left", 
        pad=25
    )
    
    # Skalujemy margines Y z buforem żeby liczby oddychały
    if values:
        ax.set_ylim(0, max(values) * 1.15)
    else:
        ax.set_ylim(0, 1)

    plt.tight_layout(pad=2.0)
    buf = io.BytesIO()
    # Zapis
    plt.savefig(buf, format='png', dpi=200, bbox_inches='tight', facecolor=fig.get_facecolor())
    buf.seek(0)
    plt.close(fig)
    return buf.getvalue()

def generate_graph_png(data: dict) -> bytes:
    """Generuje PNG dla typu 'graf' (nie zmieniane)"""
    G = nx.DiGraph()
    for node in data.get("nodes", []):
        G.add_node(node["id"], label=node.get("label", ""))
    for edge in data.get("edges", []):
        G.add_edge(edge["source"], edge["target"], label=edge.get("label", ""))
        
    fig, ax = plt.subplots(figsize=(10, 8), facecolor="white")
    pos = nx.spring_layout(G, seed=42)
    nx.draw_networkx_nodes(G, pos, ax=ax, node_color=ACCENT_COLOR, node_size=3000, edgecolors=SECONDARY_COLOR, linewidths=2)
    node_labels = nx.get_node_attributes(G, 'label')
    nx.draw_networkx_labels(G, pos, labels=node_labels, ax=ax, font_size=11, font_color=PRIMARY_COLOR, font_weight="bold")
    nx.draw_networkx_edges(G, pos, ax=ax, arrows=True, edge_color=SECONDARY_COLOR, arrowstyle='-|>', arrowsize=25, width=2)
    edge_labels = nx.get_edge_attributes(G, 'label')
    nx.draw_networkx_edge_labels(G, pos, edge_labels=edge_labels, ax=ax, font_color=TEXT_COLOR, font_size=10, bbox=dict(boxstyle="round,pad=0.2", fc="white", ec="none"))
    
    ax.axis('off')
    plt.tight_layout()
    buf = io.BytesIO()
    plt.savefig(buf, format='png', dpi=200)
    buf.seek(0)
    plt.close(fig)
    return buf.getvalue()

def generate_timeline_png(data: dict) -> bytes:
    """Generuje piękną kolorową i minimalistyczną oś czasu"""
    events = data.get("events", [])
    
    if not events:
        fig, ax = plt.subplots(figsize=(8, 2))
        ax.text(0.5, 0.5, "Brak danych do osi czasu", horizontalalignment='center')
        ax.axis('off')
        buf = io.BytesIO()
        plt.savefig(buf, format='png')
        buf.seek(0)
        plt.close(fig)
        return buf.getvalue()
        
    from datetime import datetime
    
    parsed_events = []
    for e in events:
        try:
            date_obj = datetime.strptime(e["date"], "%Y-%m-%d")
            parsed_events.append({"date": date_obj, "title": e.get("title", "")})
        except ValueError:
            pass
            
    parsed_events.sort(key=lambda x: x["date"])
    
    # Przygotowanie osi X (numerycznie zamiast dat, dla równych odstępów)
    x_positions = list(range(len(parsed_events)))
    dates_str = [e["date"].strftime("%Y-%m-%d") for e in parsed_events]
    labels = [e["title"] for e in parsed_events]
    
    fig, ax = plt.subplots(figsize=(12, 5), facecolor="white")
    ax.set_facecolor("white")
    
    # Wyłączenie klasycznych osi
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    ax.spines['left'].set_visible(False)
    ax.spines['bottom'].set_visible(False)
    ax.get_yaxis().set_visible(False)
    ax.get_xaxis().set_visible(False)

    # 1. Rysowanie linii kręgosłupa
    ax.plot([x_positions[0], x_positions[-1]], [0, 0], color=ACCENT_COLOR, linewidth=4, zorder=1)

    # Kolorowa Paleta Legal Design (rozszerzona do urozmaicania węzłów na osi)
    NODE_COLORS = [
        "#D94833", # Elegancka czerwień/cegła
        "#2B6CB0", # Klasyczny Niebieski
        "#38A169", # Profesjonalna zieleń
        "#D69E2E", # Musztardowy żółty
        "#805AD5", # Śliwkowy fiolet
        "#319795"  # Turkusowy
    ]

    # Dinamiczne skalowanie dla dużej liczby punktów
    num_events = len(parsed_events)
    base_font_size = max(8, 12 - (num_events // 3))
    base_marker_size = max(10, 18 - (num_events // 2))
    
    # Rozrzucenie poziomów Y bardziej zróżnicowanie jeśli punktów jest dużo
    if num_events > 6:
        pattern = [1.2, -1.2, 1.8, -1.8, 2.4, -2.4]
    elif num_events > 4:
        pattern = [1.2, -1.2, 1.6, -1.6]
    else:
        pattern = [1.2, -1.2]
        
    levels = (pattern * (num_events // len(pattern) + 1))[:num_events]
    
    for i, (x_pos, d_str, l_str, lvl) in enumerate(zip(x_positions, dates_str, labels, levels)):
        current_color = NODE_COLORS[i % len(NODE_COLORS)]
        
        # Kropka na osi (zmniejszana dynamicznie)
        ax.plot(x_pos, 0, marker="o", markersize=base_marker_size, color=current_color, markeredgecolor="white", markeredgewidth=2, zorder=3)
        
        # Cienka kreska łącząca z tekstem pod kolor węzła
        ax.plot([x_pos, x_pos], [0, lvl * 0.7], color=current_color, linestyle=":", linewidth=2, zorder=2)
        
        # Nakładka Daty (Rysowana najpierw, przytulona do głównego poziomu pudełka)
        date_y_offset = 0.12 if lvl > 0 else -0.12
        date_y_offset = date_y_offset * (base_font_size / 10)
        
        ax.text(
            x_pos, lvl * 0.82 + date_y_offset,  
            d_str,
            ha="center", va="center",
            fontsize=base_font_size + 1,
            fontweight="bold",
            color=current_color,
            zorder=6,
            bbox=dict(
                boxstyle="square,pad=0.2",
                facecolor="white", # Daty leżą na osobnym czystym białym prostokącie
                edgecolor="none",  # Brak widocznej ramki dla samej daty
            ),
        )
        
        import textwrap
        wrapped_text = textwrap.fill(l_str, width=25)
        if len(wrapped_text) > 80:
             wrapped_text = wrapped_text[:80] + "..."
             
        # Liczymy ile jest faktycznie linijek po zawinięciu
        num_lines = wrapped_text.count("\n") + 1
             
        # Pudełko opisowe tytułu (Przesunięte głębiej na zewnątrz od daty, tym dalej im więcej linijek)
        # Baza 0.40, a za każdą dodatkową linijkę dodajemy 0.15 odległości
        base_offset = 0.40 + (0.15 * (num_lines - 1))
        box_y_offset = base_offset if lvl > 0 else -base_offset
        box_y_offset = box_y_offset * (base_font_size / 10)
             
        ax.text(
            x_pos, lvl * 0.82 + date_y_offset + box_y_offset,
            wrapped_text,
            ha="center", va="center",
            multialignment="center",
            fontsize=base_font_size,
            color=PRIMARY_COLOR,
            fontweight="normal",
            bbox=dict(
                boxstyle="round,pad=0.6,rounding_size=0.3",
                facecolor="#F8FAFC",
                edgecolor=current_color,
                linewidth=1.2
            ),
            zorder=4
        )
        
        # Grubaa linia spinająca pudełka ze sobą i z osią (dla spójności)
        ax.plot([x_pos, x_pos], [lvl * 0.82 + date_y_offset, lvl * 0.82 + date_y_offset + box_y_offset], color=current_color, linestyle="-", linewidth=1.2, zorder=2)

    # Tytuł
    ax.set_title(
        "HARMONOGRAM", 
        fontsize=22, 
        fontweight="bold", 
        color=PRIMARY_COLOR, 
        loc="left", 
        pad=30
    )

    # Zwiększenie limitów dla bardzo obszernego marginesu oddychającego na osi Y
    # Oblicz z max i min levelsa, żeby upewnić się, że nie utnie!
    max_lvl = max([abs(l) for l in levels]) if levels else 1.2
    ax.set_ylim(-(max_lvl + 2.0), (max_lvl + 2.0))
    
    # Znacznie szerszy margines na osi X
    margin = (x_positions[-1] - x_positions[0]) * 0.15 + 0.5
    ax.set_xlim(x_positions[0] - margin, x_positions[-1] + margin)

    # Duży ogólny padding całej figury
    plt.tight_layout(pad=2.0)
    buf = io.BytesIO()
    plt.savefig(buf, format='png', dpi=200, bbox_inches='tight')
    buf.seek(0)
    plt.close(fig)
    return buf.getvalue()


