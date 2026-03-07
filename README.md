# Legal Design Hackathon 2026 | TL;DR Law (Too Long; Didn't Read)

Krótki opis: Narzędzie do transformacji skomplikowanych dokumentów prawnych w przejrzyste, zrozumiałe treści z automatyczną wizualizacją procesów.

---

## 🚀 O Projekcie
Projekt rozwiązuje problem niezrozumiałych umów i pism procesowych. System analizuje tekst, wyłapuje żargon i proponuje zmiany w duchu **Plain Language**, jednocześnie generując schematy graficzne ułatwiające zrozumienie logiki dokumentu.

## 🛠 Instalacja i Uruchomienie

1. Utwórz plik `.env` w głównym katalogu projektu:
```env
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-5.4
```

2. Uruchom serwer developerski FastAPI:
```bash
uvicorn app.main:app --reload
```
---

## 🔌 Przykłady użycia API (Wizualizacje AI)

Projekt udostępnia endpoint analizujący treść prawniczą za pomocą LLM w celu wygenerowania estetycznego pliku PNG "Legal Design". Wystarczy podać **dowolny nieustrukturyzowany tekst**.

### 1. Generowanie Harmonogramu (Oś Czasu)

Zwraca gotową oś czasu obrazującą ułożone w czasie wyłapane wydarzenia.

```bash
curl -X 'POST' \
  'http://127.0.0.1:8000/viz/generate-png' \
  -H 'accept: image/png' \
  -H 'Content-Type: application/json' \
  -d '{
  "visualization_type": "timeline",
  "context": "Firma powstała w 2020. W marcu 2021 dostaliśmy 1mln finansowania. We wrześniu 2021 zmieniliśmy zarząd. W maju 2022 weszliśmy do Niemiec. W sierpniu 2022 odeszło 3 dyrektorów. W styczniu 2023 był rebranding. W kwietniu 2023 odpaliliśmy nowy produkt. Pod koniec 2023 zamkneliśmy rundę B. Na początku 2024 podpisaliśmy 5 umów. A w połowie 2024 kupiliśmy mniejszą spółkę X. W sierpniu 2024 otworzyliśmy biuro w USA, we wrześniu zatrudniliśmy 200 osób."
}' --output harmonogram.png
```

### 2. Generowanie Wykresu

Zwraca wykres słupkowy idealny do porównania liczb i kosztów wychwyconych z tekstu prawnego.

```bash
curl -X 'POST' \
  'http://127.0.0.1:8000/viz/generate-png' \
  -H 'accept: image/png' \
  -H 'Content-Type: application/json' \
  -d '{
  "visualization_type": "chart",
  "context": "Z analizy umowy spółki XYZ i rocznego bilansu za 2025 rok wynika, że zyski wyniosły: w pierwszym kwartale 55 tysięcy, w drugim spadły do 12 tysięcy, w trzecim podskoczyły na 80 tysięcy, a w czwartym zamknęły się na 40 tysięcy."
}' --output wykres.png
```

### 3. Ekstrakcja Danych do Tabeli (Zwraca JSON)

Zwraca idealnie zorganizowaną strukturę kolumn i wierszy wyciągniętą z wolnego tekstu. Nie generuje obrazka PNG, lecz gotowy JSON do wyrenderowania tabeli na frontendzie.

```bash
curl -X 'POST' \
  'http://127.0.0.1:8000/viz/generate-png' \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '{
  "visualization_type": "table",
  "context": "Zestawienie pracowników zatrudnionych w dziale IT: Jan Kowalski (Stanowisko: Senior Developer, Wynagrodzenie: 15000 PLN, Data zatrudnienia: 2021-05-10), Anna Nowak (Stanowisko: UX Designer, Wynagrodzenie: 12000 PLN, Data zatrudnienia: 2022-03-01)"
}'
```
