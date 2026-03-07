# Legal Design Hackathon 2026 | TL;DR Law (Too Long; Didn't Read)

Krótki opis: Narzędzie do transformacji skomplikowanych dokumentów prawnych w przejrzyste, zrozumiałe treści z automatyczną wizualizacją procesów.

---

## 🚀 O Projekcie
Projekt rozwiązuje problem niezrozumiałych umów i pism procesowych. System analizuje tekst, wyłapuje żargon i proponuje zmiany w duchu **Plain Language**, jednocześnie generując schematy graficzne ułatwiające zrozumienie logiki dokumentu.

uvicorn app.main:app --reload

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
  "visualization_type": "oś czasu",
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
  "visualization_type": "wykres",
  "context": "Z analizy umowy spółki XYZ i rocznego bilansu za 2025 rok wynika, że zyski wyniosły: w pierwszym kwartale 55 tysięcy, w drugim spadły do 12 tysięcy, w trzecim podskoczyły na 80 tysięcy, a w czwartym zamknęły się na 40 tysięcy."
}' --output wykres.png
```
