"""Endpoint POST /analize – analiza Legal Design (język + miejsca na wizualizacje)."""

import asyncio

from fastapi import APIRouter, HTTPException

from app.schemas import (
    AnalizeRequest,
    AnalizeResponse,
    Kategoria,
    MiejsceOffset,
    TypGraf,
    VerifyImprovementRequest,
    VerifyImprovementResponse,
    WynikAnalizy,
)
from app.services.agents import (
    RawWynikGraf,
    RawWynikJezyk,
    run_agent_graf,
    run_agent_jezyk,
    run_verify_improvement,
)
from app.services.memory import ContextMemory
from app.services.offset import find_snippet_offset
from app.settings import settings
from openai import AsyncOpenAI

router = APIRouter(tags=["analize"])


def _chunk_boundaries(fragments: list[str]) -> list[tuple[int, int]]:
    """Zwraca listę (start, end) w pełnym tekście dla każdego fragmentu."""
    boundaries = []
    pos = 0
    for f in fragments:
        start = pos
        pos += len(f)
        boundaries.append((start, pos))
    return boundaries


def _resolve_jezyk_to_result(
    full_text: str,
    boundaries: list[tuple[int, int]],
    raw: RawWynikJezyk,
    chunk_index: int,
) -> WynikAnalizy | None:
    start, end = boundaries[chunk_index]
    miejsce = find_snippet_offset(full_text, raw.snippet, start_from=start, end_before=end)
    if miejsce is None:
        miejsce = MiejsceOffset(start=start, end=end, snippet=raw.snippet)
    return WynikAnalizy(
        kategoria=Kategoria.JEZYK,
        tresc_poprawki=raw.tresc_poprawki,
        propozycja_poprawki=raw.propozycja_poprawki or None,
        typ=None,
        miejsce=miejsce,
        chunk_index=chunk_index,
    )


def _resolve_graf_to_result(
    full_text: str,
    boundaries: list[tuple[int, int]],
    raw: RawWynikGraf,
    chunk_index: int,
) -> WynikAnalizy | None:
    start, end = boundaries[chunk_index]
    miejsce = find_snippet_offset(full_text, raw.snippet, start_from=start, end_before=end)
    if miejsce is None:
        miejsce = MiejsceOffset(start=start, end=end, snippet=raw.snippet)
    try:
        typ = TypGraf(raw.typ)
    except ValueError:
        typ = TypGraf.tabela
    return WynikAnalizy(
        kategoria=Kategoria.GRAF,
        tresc_poprawki=None,
        typ=typ,
        miejsce=miejsce,
        chunk_index=chunk_index,
    )


@router.post("/analize", response_model=AnalizeResponse)
async def analize(request: AnalizeRequest) -> AnalizeResponse:
    """
    Analiza dokumentu pod kątem Legal Design:
    - Agent JEZYK: błędy języka, niejasności, żargon → treść_poprawki + miejsce (offset).
    - Agent GRAF: miejsca na wizualizacje (oś czasu, tabela, wykres kołowy/słupkowy) → typ + miejsce.
    """
    fragments = request.fragments
    if not fragments:
        raise HTTPException(422, detail="Pole 'fragments' nie może być puste.")

    if not settings.openai_api_key:
        raise HTTPException(500, detail="Brak OPENAI_API_KEY w konfiguracji.")

    full_text = "".join(fragments)
    boundaries = _chunk_boundaries(fragments)
    memory = ContextMemory()
    client = AsyncOpenAI(api_key=settings.openai_api_key)
    all_results: list[WynikAnalizy] = []

    for chunk_index, fragment in enumerate(fragments):
        (jezyk_findings, jezyk_summary), (graf_findings, graf_summary) = await asyncio.gather(
            run_agent_jezyk(client, fragment, memory, request.user_prompt),
            run_agent_graf(client, fragment, memory, request.user_prompt),
        )

        memory.update_jezyk(jezyk_summary)
        memory.update_graf(graf_summary)

        for raw in jezyk_findings:
            r = _resolve_jezyk_to_result(full_text, boundaries, raw, chunk_index)
            if r:
                all_results.append(r)
        for raw in graf_findings:
            r = _resolve_graf_to_result(full_text, boundaries, raw, chunk_index)
            if r:
                all_results.append(r)

    return AnalizeResponse(results=all_results)


@router.post("/verify-improvement", response_model=VerifyImprovementResponse)
async def verify_improvement(request: VerifyImprovementRequest) -> VerifyImprovementResponse:
    """
    Weryfikacja poprawek użytkownika: przekazujesz oryginalny zły fragment, reasoning (czemu był źle)
    oraz zaktualizowany tekst. LLM sprawdza, czy poprawki są wystarczające.
    Zwraca all_good=true (wtedy issues=[]) albo all_good=false i listę pozostałych problemów.
    """
    if not settings.openai_api_key:
        raise HTTPException(500, detail="Brak OPENAI_API_KEY w konfiguracji.")

    client = AsyncOpenAI(api_key=settings.openai_api_key)
    all_good, issues = await run_verify_improvement(
        client,
        bad_text=request.bad_text,
        reasoning=request.reasoning,
        updated_text=request.updated_text,
    )
    return VerifyImprovementResponse(all_good=all_good, issues=issues)
