import requests

url = "http://127.0.0.1:8000/viz/generate-png"
payload = {
  "visualization_type": "wykres",
  "context": "jakis kontekst, np o kosztach za ubiegly rok",
  "data": {
    "labels": ["Styczeń", "Luty", "Marzec"],
    "datasets": [
      {
        "label": "Koszty",
        "data": [10, 20, 30]
      }
    ]
  },
  "message": "Wizualizacja wygenerowana z dostarczonego kontekstu."
}

# Wysyłamy żądanie POST do Twojego API
print("Wysyłam zapytanie do", url, "...")
response = requests.post(url, json=payload)

if response.status_code == 200:
    # Zapisujemy odpowiedź (bajtowy PNG) jako plik test_wykres.png
    with open("test_wykres.png", "wb") as f:
        f.write(response.content)
    print("Sukces! Zapisano plik 'test_wykres.png'. Możesz go otworzyć w folderze projektu.")
else:
    print("Błąd:", response.status_code, response.text)
