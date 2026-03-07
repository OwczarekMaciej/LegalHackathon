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
    """Generuje niesamowicie czysty PNG dla typu 'wykres'"""
    labels = data.get("labels", [])
    if data.get("datasets"):
        values = data["datasets"][0].get("data", [])
        label_name = data["datasets"][0].get("label", "Wartość")
    else:
        values = []
        label_name = "Wartość"

    fig, ax = plt.subplots(figsize=(9, 6), facecolor="white")
    ax.set_facecolor("white")
    
    setup_modern_axes(ax)

    # Rysowanie słupków z pięknym kolorem
    bars = ax.bar(labels, values, color=SECONDARY_COLOR, edgecolor="none", zorder=3, width=0.55)

    # Etykiety nad słupkami
    for bar in bars:
        h = bar.get_height()
        ax.text(
            bar.get_x() + bar.get_width() / 2., 
            h + (max(values) * 0.02),
            f'{h}',
            ha='center', va='bottom',
            fontsize=12, fontweight='bold', color=PRIMARY_COLOR
        )

    # Tytuł wyrównany do lewej (styl raportowy)
    ax.set_title(
        label_name.upper(), 
        fontsize=22, 
        fontweight="bold", 
        color=PRIMARY_COLOR, 
        loc="left", 
        pad=25
    )

    plt.tight_layout(pad=3.0)
    buf = io.BytesIO()
    plt.savefig(buf, format='png', dpi=200, bbox_inches='tight')
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
    """Generuje piękną minimalistyczną oś czasu"""
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

    # 2. Rysowanie węzłów i adnotacji
    levels = [1.2, -1.2, 1.2, -1.2, 1.2, -1.2] * (len(parsed_events) // 6 + 1)
    
    for i, (x_pos, d_str, l_str, lvl) in enumerate(zip(x_positions, dates_str, labels, levels)):
        # Kropka na osi (duża, estetyczna)
        ax.plot(x_pos, 0, marker="o", markersize=18, color=SECONDARY_COLOR, markeredgecolor="white", markeredgewidth=3, zorder=3)
        
        # Cienka kreska łącząca z tekstem
        ax.plot([x_pos, x_pos], [0, lvl * 0.7], color=SECONDARY_COLOR, linestyle=":", linewidth=2, zorder=2)
        
        # Pudełko tekstowe z datą i tytułem (zostawiamy puste miejsce na pogrubioną datę u samej góry/z samego dołu pudełka)
        box_va = "bottom" if lvl > 0 else "top"
        text_content = f" \n {l_str} " if box_va == "bottom" else f" {l_str} \n "
        
        ax.text(
            x_pos, lvl * 0.8,
            text_content,
            ha="center", va=box_va,
            fontsize=12,
            color=PRIMARY_COLOR,
            fontweight="normal",
            bbox=dict(
                boxstyle="round,pad=0.8,rounding_size=0.4",
                facecolor="white",
                edgecolor=ACCENT_COLOR,
                linewidth=1.5
            )
        )
        # Pogrubienie samej daty w osobistym renderze plt:
        ax.text(
            x_pos, lvl * 0.8 + (0.3 if box_va == "top" else -0.3),  
            d_str,  # Pogrubiona wstawka
            ha="center", va=box_va,
            fontsize=12,
            fontweight="bold",
            color=SECONDARY_COLOR,
        )

    # Tytuł
    ax.set_title(
        "HARMONOGRAM", 
        fontsize=22, 
        fontweight="bold", 
        color=PRIMARY_COLOR, 
        loc="left", 
        pad=30
    )

    # Powiększ limity osi by pudła nie ucinało
    ax.set_ylim(-3, 3)
    margin = (x_positions[-1] - x_positions[0]) * 0.1
    ax.set_xlim(x_positions[0] - margin, x_positions[-1] + margin)

    plt.tight_layout()
    buf = io.BytesIO()
    plt.savefig(buf, format='png', dpi=200, bbox_inches='tight')
    buf.seek(0)
    plt.close(fig)
    return buf.getvalue()


