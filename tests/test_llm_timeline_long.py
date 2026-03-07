import requests
import os

url = "http://127.0.0.1:8000/viz/generate-png"
payload = {
  "visualization_type": "timeline",
  "context": "Firma powstała w 2020. W marcu 2021 dostaliśmy 1mln finansowania. We wrześniu 2021 zmieniliśmy zarząd. W maju 2022 weszliśmy do Niemiec. W sierpniu 2022 odeszło 3 dyrektorów. W styczniu 2023 był rebranding. W kwietniu 2023 odpaliliśmy nowy produkt. Pod koniec 2023 zamkneliśmy rundę B. Na początku 2024 podpisaliśmy 5 umów. A w połowie 2024 kupiliśmy mniejszą spółkę X. W sierpniu 2024 otworzyliśmy biuro w USA, we wrześniu zatrudniliśmy 200 osób."
}

print("Wysyłam zapytanie o Długą Oś Czasu (LLM) do", url, "...")
response = requests.post(url, json=payload)

if response.status_code == 200:
    out_path = os.path.join(os.path.dirname(__file__), "test_ai_timeline_long.png")
    with open(out_path, "wb") as f:
        f.write(response.content)
    print(f"Sukces! Zapisano plik '{out_path}'.")
else:
    print("Błąd:", response.status_code, response.text)
