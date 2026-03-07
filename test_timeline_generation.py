import requests

url = "http://127.0.0.1:8000/viz/generate-png"
payload = {
  "visualization_type": "oś czasu",
  "context": "Wydarzenia dotyczące umowy najmu",
  "data": {
    "events": [
      {"date": "2023-01-01", "title": "Podpisanie umowy"},
      {"date": "2023-06-15", "title": "Aneks nr 1"},
      {"date": "2024-01-01", "title": "Zakończenie współpracy"},
      {"date": "2023-10-01", "title": "Wezwanie do zapłaty"}
    ]
  },
  "message": "Wizualizacja wygenerowana z dostarczonego kontekstu."
}

print("Wysyłam zapytanie o OŚ CZASU do", url, "...")
response = requests.post(url, json=payload)

if response.status_code == 200:
    with open("test_timeline.png", "wb") as f:
        f.write(response.content)
    print("Sukces! Zapisano plik 'test_timeline.png'. Możesz go otworzyć w folderze projektu.")
else:
    print("Błąd:", response.status_code, response.text)
