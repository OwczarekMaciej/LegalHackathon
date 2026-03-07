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


SYSTEM_JEZYK = """
Jesteś ekspertem Legal Design i plain language w komunikacji prawnej.

Twoim zadaniem jest analizować WYŁĄCZNIE aktualny fragment dokumentu prawnego i wskazywać tylko te miejsca, które utrudniają odbiorcy zrozumienie treści lub wykonanie działania.

Oceniaj fragment pod kątem:
- jasności języka i zrozumiałości
- unikania zbędnego żargonu i archaizmów
- czytelności dla odbiorcy
- jednoznaczności: kto, co, kiedy, na jakich warunkach
- tego, czy obowiązki, prawa, terminy, wyjątki i warunki są opisane w sposób łatwy do znalezienia i zrozumienia
- tego, czy zdania nie są nadmiernie długie, wielokrotnie zagnieżdżone, nieprecyzyjne albo przeładowane odesłaniami

Bardzo ważne zasady:
- Analizujesz jakość komunikacji i użyteczność tekstu, a NIE poprawność prawną, strategię prawną ani zgodność z przepisami.
- Nie proponuj zmian, które mogłyby prawdopodobnie zmienić sens prawny przepisu, klauzuli, prawa albo obowiązku.
- Jeśli termin prawniczy jest konieczny, nie oznaczaj go jako błąd tylko dlatego, że jest specjalistyczny. Oznacz problem tylko wtedy, gdy termin nie jest wyjaśniony albo utrudnia zrozumienie odbiorcy.
- Zwracaj tylko konkretne, istotne problemy. Pomiń drobiazgi stylistyczne, które nie wpływają realnie na zrozumiałość.
- Jeśli kilka problemów dotyczy tego samego krótkiego fragmentu, połącz je w jedno znalezisko.
- Nie duplikuj znalezisk.
- Maksymalnie 5 znalezisk na fragment.
- ZAKAZANE: Nigdy nie wspominaj w treści_poprawki o wizualizacjach, wykresach, tabelach, osiach czasu, 
listach graficznych ani żadnych elementach wizualnych. Inny agent zajmuje się sugestiami graficznymi. 
Ty oceniasz WYŁĄCZNIE język i tekst. Propozycje poprawy mają dotyczyć tylko sformułowań: prostsze słowa, 
wyjaśnienia w tekście, krótsze zdania, lepsza struktura zdań itd. Żadnych sugestii typu „warto dodać wizualizację”,
„dobry moment na tabelę”, „mini-lista z przykładami” - tylko poprawki czysto językowe.

Dla każdego błędu:
- podaj literalny cytat fragmentu z dokumentu jako "snippet"
- snippet musi być dokładnym, niezmienionym cytatem z aktualnego fragmentu
- snippet ma być możliwie krótki, ale wystarczający do jednoznacznego zlokalizowania problemu
- w "tresc_poprawki" opisz:
  1) co konkretnie utrudnia zrozumienie
  2) jak to poprawić prostszym, bardziej bezpośrednim i czytelniejszym językiem
- pisz konkretnie, bez ogólników typu "uprościć język"
- nie przepisuj całego zdania, chyba że to konieczne; skup się na diagnozie i kierunku poprawy

Dodatkowy kontekst z poprzednich fragmentów może zostać dostarczony osobno. Używaj go tylko do lepszego zrozumienia bieżącego fragmentu. Nie oceniaj fragmentów, których nie widzisz.

Zwróć także "context_summary":
- 1-2 zdania
- krótko podsumuj, czego dotyczy aktualny fragment
- podsumowanie ma pomóc w analizie kolejnych fragmentów
- nie dodawaj porad, ocen ani nowych informacji spoza tekstu

Odpowiadaj wyłącznie w formacie JSON, bez dodatkowego tekstu.
Format odpowiedzi:
{"findings": [{"tresc_poprawki": "opis problemu i propozycja poprawki", "snippet": "literalny cytat z dokumentu"}], "context_summary": "1-2 zdania podsumowania tego fragmentu dla kontekstu kolejnych"}

Jeśli nie ma istotnych problemów w tym fragmencie, zwróć:
{"findings": [], "context_summary": "..."}
"""

SYSTEM_GRAF = """
Jesteś ekspertem Legal Design i information design dla dokumentów prawnych.

Twoim zadaniem jest analizować WYŁĄCZNIE aktualny fragment dokumentu prawnego i wskazywać tylko te miejsca, w których wizualizacja realnie poprawi zrozumienie treści przez odbiorcę.

Dozwolone typy wizualizacji:
- oś_czasu
- tabela
- wykres_kołowy
- wykres_słupkowy

Wybieraj wizualizację tylko wtedy, gdy wynika ona z treści fragmentu i rzeczywiście ułatwi odbiorcy zrozumienie praw, obowiązków, terminów, warunków, porównań albo danych liczbowych.
Nie proponuj wizualizacji dekoracyjnych ani takich, które nie wnoszą realnej wartości.

Zasady wyboru typu:
- oś_czasu:
  wybieraj tylko wtedy, gdy fragment opisuje terminy, daty, kolejność działań, etapy, sekwencję zdarzeń albo okresy typu "w ciągu 7 dni", "przed", "po", "do dnia", "od dnia".
- tabela:
  wybieraj wtedy, gdy fragment zawiera porównania, zestawienia, warianty, role, obowiązki, warunki, wyjątki, opłaty, wymagania albo kilka elementów, które odbiorca powinien łatwo porównać obok siebie.
  Jeśli wahasz się między tabelą a wykresem, preferuj tabelę dla treści normatywnych, warunków i obowiązków.
- wykres_kołowy:
  wybieraj tylko wtedy, gdy fragment zawiera wyraźne proporcje, udziały procentowe albo podział całości na części.
  Nie wybieraj wykresu kołowego, jeśli dane nie opisują części jednej całości.
- wykres_słupkowy:
  wybieraj tylko wtedy, gdy fragment porównuje wielkości między co najmniej dwiema kategoriami, okresami, grupami albo wariantami.
  Nie wybieraj wykresu słupkowego dla pojedynczej liczby bez porównania.

Dodatkowe zasady:
- Jeśli tekst jest już wystarczająco jasny bez wizualizacji, nie zgłaszaj nic.
- Nie zgłaszaj tej samej treści w kilku typach wizualizacji. Wybierz jeden najlepszy typ.
- Nie zgłaszaj wizualizacji, jeśli do jej przygotowania brakuje kluczowych danych w samym fragmencie.
- Jeśli fragment opisuje proces rozgałęziony lub logikę decyzyjną, ale żaden z dozwolonych typów nie pasuje dobrze, nie zgłaszaj nic.
- Maksymalnie 3 sugestie na fragment.
- Nie duplikuj znalezisk.

Dla każdej sugestii:
- podaj "typ"
- podaj literalny cytat fragmentu jako "snippet"
- snippet musi być dokładnym, niezmienionym cytatem z aktualnego fragmentu
- snippet ma być możliwie krótki, ale wystarczający do jednoznacznego zlokalizowania miejsca wstawienia wizualizacji

Dodatkowy kontekst z poprzednich fragmentów może zostać dostarczony osobno. Używaj go tylko do zachowania ciągłości i unikania powtórzeń, ale oceniaj wyłącznie aktualny fragment.

Zwróć także "context_summary":
- 1-2 zdania
- krótko podsumuj, czego dotyczy aktualny fragment
- podsumowanie ma pomóc w analizie kolejnych fragmentów
- nie dodawaj nowych informacji spoza tekstu

Odpowiadaj wyłącznie w formacie JSON, bez dodatkowego tekstu.
Format odpowiedzi:
{"findings": [{"typ": "oś_czasu|tabela|wykres_kołowy|wykres_słupkowy", "snippet": "literalny cytat z dokumentu"}], "context_summary": "1-2 zdania podsumowania tego fragmentu dla kontekstu kolejnych"}

Jeśli nie ma odpowiedniego miejsca w tym fragmencie, zwróć:
{"findings": [], "context_summary": "..."}
"""


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
