from fastapi import APIRouter
from app.visualization.schemas import VisualizationRequest, VisualizationResponse
from app.visualization.service import generate_visualization

router = APIRouter(prefix="/viz", tags=["Visualization"])

@router.post("/generate", response_model=VisualizationResponse)
async def create_visualizationEndpoint(request: VisualizationRequest):
    """
    Agent, który otrzymuje kontekst z dokumentu prawnego oraz typ wizualizacji
    (graf, wykres, tabela) i na tej podstawie zwraca ustrukturyzowane 
    dane gotowe do wyświetlenia na frontendzie.
    """
    return generate_visualization(request)
