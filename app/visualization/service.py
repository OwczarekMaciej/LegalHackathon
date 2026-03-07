import json
from enum import Enum
from typing import Any, Dict
from app.visualization.schemas import VisualizationRequest, VisualizationResponse

def generate_visualization(request: VisualizationRequest) -> VisualizationResponse:
    # TODO: Podłączyć tutaj agenta AI odpowiedzialnego za parsowanie kontekstu i dobór danych
    # Na razie mockujemy odpowiedź w zależności od przekazanego typu
    
    vis_type = request.visualization_type.lower()
    
    mock_data: Dict[str, Any] = {}
    
    if vis_type == "tabela":
        mock_data = {
            "columns": ["id", "nazwa", "wartość"],
            "rows": [
                [1, "Przykładowa opłata", "100 PLN"],
                [2, "Kara umowna", "500 PLN"]
            ]
        }
    elif vis_type == "wykres":
        mock_data = {
            "labels": ["Styczeń", "Luty", "Marzec"],
            "datasets": [
                {
                    "label": "Koszty",
                    "data": [10, 20, 30]
                }
            ]
        }
    elif vis_type == "graf":
        mock_data = {
            "nodes": [
                {"id": "1", "label": "Wynajmujący"},
                {"id": "2", "label": "Najemca"}
            ],
            "edges": [
                {"source": "1", "target": "2", "label": "Umowa najmu"}
            ]
        }
    elif vis_type == "oś czasu":
        mock_data = {
            "events": [
                {"date": "2023-01-01", "title": "Podpisanie umowy"},
                {"date": "2023-06-15", "title": "Aneks nr 1"},
                {"date": "2024-01-01", "title": "Zakończenie współpracy"}
            ]
        }
    else:
        mock_data = {"raw_content": request.context}
        
    return VisualizationResponse(
        visualization_type=request.visualization_type,
        data=mock_data,
        message="Wizualizacja wygenerowana z dostarczonego kontekstu."
    )
