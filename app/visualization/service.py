import json
import os
from enum import Enum
from typing import Any, Dict
from openai import OpenAI
from dotenv import load_dotenv

from app.visualization.schemas import VisualizationRequest, VisualizationResponse

# Wczytywanie zmiennych środowiskowych z pliku .env
load_dotenv()

# Inicjalizacja klienta OpenAI (klucz brany automatycznie z OPENAI_API_KEY)
# Jeśli nie ma klucza, rzuci wyjątek lub nie zainicjalizuje poprawnie.
client = OpenAI()

def _get_system_prompt_for_type(vis_type: str) -> str:
    """Zwraca dedykowany system prompt (wymagający formatu JSON) w zależności od typu wizualizacji."""
    base_instruction = (
        "Jesteś pomocnym asystentem Legal Design. Twoim zadaniem jest parsowanie nieustrukturyzowanego tekstu prawnego/biznesowego "
        "na odpowiedni, ścisły format JSON, gotowy do wygenerowania obrazka.\n\n"
        "Wymagane jest zwrócenie TYLKO i WYŁĄCZNIE poprawnego, czystego pliku JSON, bez formatowania Markdown (bez ```json), bez wstępów ani komentarzy.\n\n"
    )
    
    if vis_type == "wykres":
        return base_instruction + (
            "Zwróck JSON w formacie:\n"
            "{\n"
            '  "labels": ["nazwa1", "nazwa2", "nazwa3"],\n'
            '  "datasets": [\n'
            "    {\n"
            '      "label": "Tytuł całej osi / Nazwa grupy",\n'
            '      "data": [10, 20, 30]\n'
            "    }\n"
            "  ]\n"
            "}\n"
            "Odpowiedz TYLKO i WYŁĄCZNIE surowym plikiem JSON pasującym dokładnie do tego schematu."
        )
    elif vis_type == "graf":
        return base_instruction + (
            "Zwróć JSON dla grafu w formacie:\n"
            "{\n"
            '  "nodes": [\n'
            '    {"id": "1", "label": "Wynajmujący"},\n'
            '    {"id": "2", "label": "Najemca"}\n'
            "  ],\n"
            '  "edges": [\n'
            '    {"source": "1", "target": "2", "label": "zawarli umowę najmu"}\n'
            "  ]\n"
            "}\n"
            "Odpowiedz TYLKO i WYŁĄCZNIE surowym plikiem JSON pasującym dokładnie do tego schematu."
        )
    elif vis_type == "oś czasu":
        return base_instruction + (
            "Zwróć JSON dla Osi Czasu (Harmonogramu) w formacie:\n"
            "{\n"
            '  "events": [\n'
            '    {"date": "YYYY-MM-DD", "title": "Krótki tytuł/opis wydarzenia"},\n'
            '    {"date": "YYYY-MM-DD", "title": "Krótki tytuł/opis wydarzenia"}\n'
            "  ]\n"
            "}\n"
            "Upewnij się, że pole 'date' jest zawsze poprawnie sformatowane jako YYYY-MM-DD. "
            "Odpowiedz TYLKO i WYŁĄCZNIE surowym plikiem JSON pasującym dokładnie do tego schematu."
        )
    else:
        # Fallback na jakikolwiek ustrukturyzowany ekstrakt
        return base_instruction + "Zwróć jako JSON prosty słownik, próbując podsumować przekazany tekst."

def generate_visualization(request: VisualizationRequest) -> VisualizationResponse:
    vis_type = request.visualization_type.lower()
    
    # 1. Pobranie odpowiedniego promptu systemowego
    system_prompt = _get_system_prompt_for_type(vis_type)
    
    # 2. Strzał do modelu OpenAI
    try:
        model_name = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
        
        completion = client.chat.completions.create(
            model=model_name,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Przeanalizuj i sformatuj na JSON ten tekst:\n\n{request.context}"}
            ],
            temperature=0.1,  # Niska temperatura dla deterministycznego JSON-a
        )
        
        # 3. Wyciągnięcie odpowiedzi i oczyszczenie z ewentualnych znaczników markdown
        response_content = completion.choices[0].message.content.strip()
        
        if response_content.startswith("```json"):
            response_content = response_content[7:]
        if response_content.startswith("```"):
            response_content = response_content[3:]
        if response_content.endswith("```"):
            response_content = response_content[:-3]
            
        response_content = response_content.strip()
        
        # 4. Parsowanie z powrotem na Pythonowy słownik
        extracted_data = json.loads(response_content)
        
        message = "Dane zostały pomyślnie przetworzone przez model AI i sformatowane pod wybraną wizualizację."
        
    except json.JSONDecodeError as e:
        extracted_data = {"error": "Model UI zwrócił niepoprawny JSON", "raw_response": response_content}
        message = f"Błąd parsowania odpowiedzi modelu: {str(e)}"
    except Exception as e:
        extracted_data = {"error": str(e)}
        message = "Wystąpił błąd podczas komunikacji z API OpenAI."

    return VisualizationResponse(
        visualization_type=request.visualization_type,
        data=extracted_data,
        message=message
    )
