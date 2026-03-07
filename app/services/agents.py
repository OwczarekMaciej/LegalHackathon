"""Agenty LLM: JEZYK (błędy Legal Design w języku) i GRAF (miejsca na wizualizacje)."""

import json
import re
from dataclasses import dataclass

from openai import AsyncOpenAI

from app.settings import settings
from app.services.memory import ContextMemory

# --- Raw output from LLM (before offset resolution) ---


@dataclass
class RawWynikJezyk:
    tresc_poprawki: str
    snippet: str


@dataclass
class RawWynikGraf:
    typ: str  # "oś_czasu" | "tabela" | "wykres_kołowy" | "wykres_słupkowy"
    snippet: str


SYSTEM_JEZYK = """Jesteś ekspertem Legal Design. Oceniasz fragment dokumentu prawnego pod kątem:
- jasności języka i zrozumiałości
- unikania zbędnego żargonu
- czytelności dla odbiorcy

Zwracaj tylko konkretne błędy. Dla każdego błędu podaj literalny cytat fragmentu (snippet) z dokumentu oraz treść poprawki: co jest źle i co powinno się poprawić.
Odpowiadaj wyłącznie w formacie JSON, bez dodatkowego tekstu. Format odpowiedzi:
{"findings": [{"tresc_poprawki": "opis problemu i propozycja poprawki", "snippet": "literalny cytat z dokumentu"}], "context_summary": "1-2 zdania podsumowania tego fragmentu dla kontekstu kolejnych"}

Jeśli nie ma błędów w tym fragmencie: {"findings": [], "context_summary": "..."}."""

SYSTEM_GRAF = """Identyfikujesz miejsca w dokumencie prawnym, gdzie warto dodać wizualizację dla lepszego zrozumienia.
Dozwolone typy: oś_czasu, tabela, wykres_kołowy, wykres_słupkowy.
- oś_czasu: gdy opisane są terminy, daty, sekwencje zdarzeń
- tabela: gdy są zestawienia, porównania, listy warunków
- wykres_kołowy: gdy są proporcje, udziały procentowe
- wykres_słupkowy: gdy są wielkości do porównania

Dla każdej sugestii podaj typ wizualizacji oraz literalny fragment tekstu (snippet), przy którym należy ją wstawić.
Odpowiadaj wyłącznie w formacie JSON, bez dodatkowego tekstu. Format odpowiedzi:
{"findings": [{"typ": "oś_czasu|tabela|wykres_kołowy|wykres_słupkowy", "snippet": "literalny cytat z dokumentu"}], "context_summary": "1-2 zdania podsumowania tego fragmentu dla kontekstu kolejnych"}

Jeśli nie ma odpowiedniego miejsca w tym fragmencie: {"findings": [], "context_summary": "..."}."""


def _parse_jezyk_response(content: str) -> tuple[list[RawWynikJezyk], str]:
    """Parsuje odpowiedź agenta JEZYK. Zwraca (lista wyników, context_summary)."""
    summary = ""
    findings: list[RawWynikJezyk] = []
    content = content.strip()
    # Wyciągnij JSON z odpowiedzi (może być w bloku markdown)
    json_match = re.search(r"\{[\s\S]*\}", content)
    if not json_match:
        return findings, summary
    try:
        data = json.loads(json_match.group())
        for item in data.get("findings") or []:
            if isinstance(item, dict) and item.get("snippet"):
                findings.append(
                    RawWynikJezyk(
                        tresc_poprawki=item.get("tresc_poprawki") or "",
                        snippet=item["snippet"].strip(),
                    )
                )
        summary = (data.get("context_summary") or "").strip()
    except (json.JSONDecodeError, KeyError, TypeError):
        pass
    return findings, summary


def _parse_graf_response(content: str) -> tuple[list[RawWynikGraf], str]:
    """Parsuje odpowiedź agenta GRAF. Zwraca (lista wyników, context_summary)."""
    summary = ""
    findings: list[RawWynikGraf] = []
    content = content.strip()
    json_match = re.search(r"\{[\s\S]*\}", content)
    if not json_match:
        return findings, summary
    valid_typy = {"oś_czasu", "tabela", "wykres_kołowy", "wykres_słupkowy"}
    try:
        data = json.loads(json_match.group())
        for item in data.get("findings") or []:
            if isinstance(item, dict) and item.get("snippet"):
                typ = (item.get("typ") or "").strip()
                if typ in valid_typy:
                    findings.append(
                        RawWynikGraf(typ=typ, snippet=item["snippet"].strip())
                    )
        summary = (data.get("context_summary") or "").strip()
    except (json.JSONDecodeError, KeyError, TypeError):
        pass
    return findings, summary


async def run_agent_jezyk(
    client: AsyncOpenAI,
    fragment: str,
    memory: ContextMemory,
    user_prompt: str | None,
) -> tuple[list[RawWynikJezyk], str]:
    """Uruchamia agenta JEZYK na jednym fragmencie. Zwraca (wyniki, nowy context_summary)."""
    context_block = (
        f"Poprzedni kontekst (skrót): {memory.summary_jezyk}"
        if memory.summary_jezyk
        else "To jest pierwszy fragment dokumentu."
    )
    user_content = f"{context_block}\n\n---\nFragment do analizy:\n\n{fragment}"
    if user_prompt:
        user_content += f"\n\nDoprecyzowanie użytkownika: {user_prompt}"

    response = await client.chat.completions.create(
        model=settings.openai_model,
        messages=[
            {"role": "system", "content": SYSTEM_JEZYK},
            {"role": "user", "content": user_content},
        ],
    )
    content = response.choices[0].message.content or ""
    findings, summary = _parse_jezyk_response(content)
    return findings, summary


async def run_agent_graf(
    client: AsyncOpenAI,
    fragment: str,
    memory: ContextMemory,
    user_prompt: str | None,
) -> tuple[list[RawWynikGraf], str]:
    """Uruchamia agenta GRAF na jednym fragmencie. Zwraca (wyniki, nowy context_summary)."""
    context_block = (
        f"Poprzedni kontekst (skrót): {memory.summary_graf}"
        if memory.summary_graf
        else "To jest pierwszy fragment dokumentu."
    )
    user_content = f"{context_block}\n\n---\nFragment do analizy:\n\n{fragment}"
    if user_prompt:
        user_content += f"\n\nDoprecyzowanie użytkownika: {user_prompt}"

    response = await client.chat.completions.create(
        model=settings.openai_model,
        messages=[
            {"role": "system", "content": SYSTEM_GRAF},
            {"role": "user", "content": user_content},
        ],
    )
    content = response.choices[0].message.content or ""
    findings, summary = _parse_graf_response(content)
    return findings, summary
