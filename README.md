# Legal Design Hackathon 2026 | TL;DR Law (Too Long; Didn't Read)

Krótki opis: Platforma do transformacji skomplikowanych dokumentów prawnych w przejrzyste, zrozumiałe treści z automatyczną wizualizacją procesów. Projekt składa się z backendu AI (FastAPI) i pięknego interfejsu w technologii React (Vite).

---

## 🚀 O Projekcie
Projekt rozwiązuje problem niezrozumiałych umów i pism procesowych. System analizuje tekst, wyłapuje żargon i proponuje zmiany w duchu **Plain Language**, jednocześnie generując schematy graficzne (oś czasu, wykresy) ułatwiające zrozumienie logiki dokumentu.

---

## 🛠 Instalacja i Uruchomienie

Aplikacja jest podzielona na dwie części: **Backend (Python)** obsługujący przetwarzanie dokumentów przez AI oraz **Frontend (React)** z którym interakcję ma użytkownik.

Aby włączyć aplikację, musisz uruchomić oba serwery w dwóch osobnych oknach terminala.

### Krok 1: Serwer Backendu (FastAPI)
Odpowiada za integrację z OpenAI oraz logikę wyciągania i wizualizowania danych.

1. Będąc w głównym katalogu projektu (`LegalHackathon`), utwórz i aktywuj wirtualne środowisko (venv):
```bash
python3 -m venv venv
source venv/bin/activate  # (Mac/Linux)
# lub: .\venv\Scripts\activate  # (Windows)
```

2. Zainstaluj wymagane pakiety:
```bash
pip install -r requirements.txt
```

3. Utwórz plik `.env` w głównym katalogu projektu na podstawie wskazanego wzoru (`.env.example`):
```env
OPENAI_API_KEY=sk-twójprawdziwyklucz...
OPENAI_MODEL=gpt-4o
```

4. Uruchom serwer developerski FastAPI:
```bash
uvicorn app.main:app --reload
```
API będzie dostępne pod `http://127.0.0.1:8000` (dokumentacja dostępna po dopisaniu `/docs`).

### Krok 2: Serwer Frontendu (React / Vite)
Aplikacja, z której będzie korzystać docelowy użytkownik (Edytor Prawny).

1. Otwórz **nowe okno terminala**.
2. Przejdź do folderu frontendu:
```bash
cd frontend
```

3. Zainstaluj biblioteki Node.js:
```bash
npm install
```

4. Uruchom developerski serwer Vite:
```bash
npm run dev
```

Platforma wyświetli zmontowany graficzny interfejs. W trybie dev requesty na frontedzie do `/api` są automatycznie proxy’owane na działający na porcie 8000 serwer backendu. 

**Kliknij w link wygenerowany w konsoli (np. `http://localhost:5173`) aby włączyć aplikację!**

---

## 🔌 API Manualne (Wizualizacje)

Poza główną aplikacją graficzną, backend udostępnia czysty endpoint analizujący treść prawniczą za pomocą LLM w celu wygenerowania estetycznego pliku PNG z designem "Legal Design". Wystarczy podać mu dowolny wycięty z umowy, nieustrukturyzowany tekst.

### A. Generowanie Harmonogramu (Oś Czasu)
Zwraca gotową oś czasu obrazującą ułożone chronologicznie wyłapane wydarzenia.
```bash
curl -X 'POST' \
  'http://127.0.0.1:8000/viz/generate-png' \
  -H 'accept: image/png' \
  -H 'Content-Type: application/json' \
  -d '{
  "visualization_type": "timeline",
  "context": "Firma powstała w 2020. W marcu 2021 dostaliśmy 1mln finansowania. We wrześniu 2021 zmieniliśmy zarząd..."
}' --output harmonogram.png
```

### B. Generowanie Wykresu
Zwraca wykres słupkowy idealny do porównania liczb i kosztów wychwyconych z tekstu prawnego.
```bash
curl -X 'POST' \
  'http://127.0.0.1:8000/viz/generate-png' \
  -H 'accept: image/png' \
  -H 'Content-Type: application/json' \
  -d '{
  "visualization_type": "chart",
  "context": "Z analizy umowy spółki XYZ i rocznego bilansu za 2025 rok wynika, że zyski wyniosły: w pierwszym kwartale 55 tysięcy, w drugim spadły do 12 tysięcy..."
}' --output wykres.png
```

### C. Ekstrakcja Danych do Tabeli (Zwraca JSON)
Zwraca idealnie zorganizowaną strukturę kolumn i wierszy wyciągniętą z wolnego tekstu.
```bash
curl -X 'POST' \
  'http://127.0.0.1:8000/viz/generate-png' \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '{
  "visualization_type": "table",
  "context": "Zestawienie pracowników: Jan Kowalski (Stanowisko: Senior Developer, Wynagrodzenie: 15000 PLN...)"
}'
```
