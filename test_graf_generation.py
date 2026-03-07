import requests

url = "http://127.0.0.1:8000/viz/generate-png"
payload = {
  "visualization_type": "graf",
  "context": "Struktura własności XYZ",
  "data": {
    "nodes": [
      {"id": "1", "label": "Wynajmujący"},
      {"id": "2", "label": "Najemca"}
    ],
    "edges": [
      {"source": "1", "target": "2", "label": "Umowa najmu"}
    ]
  },
  "message": "Wizualizacja wygenerowana z dostarczonego kontekstu."
}

print("Wysyłam zapytanie o GRAF do", url, "...")
response = requests.post(url, json=payload)

if response.status_code == 200:
    with open("test_graf.png", "wb") as f:
        f.write(response.content)
    print("Sukces! Zapisano plik 'test_graf.png'. Możesz go otworzyć w folderze projektu.")
else:
    print("Błąd:", response.status_code, response.text)
