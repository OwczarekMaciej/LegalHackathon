from enum import Enum
from typing import Literal

from pydantic import BaseModel, Field


class Kategoria(str, Enum):
    JEZYK = "JEZYK"
    GRAF = "GRAF"


class TypGraf(str, Enum):
    os_czasu = "oś_czasu"
    tabela = "tabela"
    wykres_kolowy = "wykres_kołowy"
    wykres_slupkowy = "wykres_słupkowy"


class MiejsceOffset(BaseModel):
    start: int = Field(..., description="Indeks początku w pełnym tekście")
    end: int = Field(..., description="Indeks końca w pełnym tekście")
    snippet: str | None = Field(None, description="Cytowany fragment tekstu")


# --- Request ---


class AnalizeRequest(BaseModel):
    fragments: list[str] = Field(
        ...,
        description="Kolejne fragmenty dokumentu (klient przysyła tekst już podzielony). Jeden blok = jedna pozycja, np. [\"cały tekst\"].",
    )
    user_prompt: str | None = Field(
        None,
        description="Doprecyzowanie od użytkownika, co dokładnie analizować",
    )


# --- Response: JEZYK ---


class WynikJezyk(BaseModel):
    kategoria: Literal[Kategoria.JEZYK] = Kategoria.JEZYK
    tresc_poprawki: str = Field(..., description="Co jest źle i co powinno się poprawić")
    miejsce: MiejsceOffset = Field(..., description="Gdzie w tekście (offset + snippet)")
    chunk_index: int | None = Field(None, description="Indeks fragmentu")


# --- Response: GRAF ---


class WynikGraf(BaseModel):
    kategoria: Literal[Kategoria.GRAF] = Kategoria.GRAF
    typ: TypGraf = Field(..., description="Typ wizualizacji")
    miejsce: MiejsceOffset = Field(..., description="Gdzie wstawić (offset + snippet)")
    chunk_index: int | None = Field(None, description="Indeks fragmentu")


# Union for a single result item
class WynikAnalizy(BaseModel):
    kategoria: Kategoria
    tresc_poprawki: str | None = None  # tylko JEZYK
    typ: TypGraf | None = None  # tylko GRAF
    miejsce: MiejsceOffset
    chunk_index: int | None = None


class AnalizeResponse(BaseModel):
    results: list[WynikAnalizy] = Field(..., description="Lista znalezionych problemów i sugestii")
