from pydantic import BaseModel, Field
from typing import Any, Dict, Optional

class VisualizationRequest(BaseModel):
    context: str = Field(..., description="Tekst z dokumentu z danymi do analizy")
    visualization_type: str = Field(..., description="Rodzaj wizualizacji: graph, chart, table, timeline itp.")

class VisualizationResponse(BaseModel):
    visualization_type: str
    data: Dict[str, Any] = Field(..., description="Struktura JSON reprezentująca wizualizator dla frontendu")
    message: Optional[str] = Field(None, description="Opcjonalna wiadomość lub opisy dla użytkownika")
