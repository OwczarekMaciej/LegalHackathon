from fastapi import APIRouter, Response
from fastapi.responses import JSONResponse
from app.visualization.schemas import VisualizationRequest, VisualizationResponse
from app.visualization.service import generate_visualization
from app.visualization.generators import generate_chart_png, generate_graph_png, generate_timeline_png

router = APIRouter(prefix="/viz", tags=["Visualization"])

@router.post("/generate", response_model=VisualizationResponse)
async def create_visualizationEndpoint(request: VisualizationRequest):
    """
    Agent, który otrzymuje kontekst z dokumentu prawnego oraz typ wizualizacji
    (graf, wykres, tabela) i na tej podstawie zwraca ustrukturyzowane 
    dane gotowe do wyświetlenia na frontendzie.
    """
    return generate_visualization(request)

@router.post("/generate-png")
async def get_visualization_as_png(request: VisualizationRequest):
    """
    Endpoint, który przyjmuje te same dane wejściowe ale zamiast surowego
    JSON-a zwraca wygenerowany na ich podstawie obraz PNG (wykres albo graf).
    """
    vis_response = generate_visualization(request)
    vis_type = vis_response.visualization_type.lower()
    data = vis_response.data
    
    if vis_type == "wykres":
        img_bytes = generate_chart_png(data)
        return Response(content=img_bytes, media_type="image/png")
        
    elif vis_type == "graf":
        img_bytes = generate_graph_png(data)
        return Response(content=img_bytes, media_type="image/png")
        
    elif vis_type == "oś czasu":
        img_bytes = generate_timeline_png(data)
        return Response(content=img_bytes, media_type="image/png")
        
    else:
        return JSONResponse(status_code=400, content={"error": f"Generowanie PNG dla typu '{vis_type}' nie jest wspierane."})
