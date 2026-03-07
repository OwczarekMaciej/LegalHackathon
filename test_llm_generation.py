import requests

url = "http://127.0.0.1:8000/viz/generate-png"
payload = {
  "visualization_type": "chart",
  "context": "Z analizy umowy spółki XYZ i rocznego bilansu za 2025 rok wynika, że zyski wyniosły: w pierwszym kwartale 55 tysięcy, w drugim spadły do 12 tysięcy, w trzecim podskoczyły na 80 tysięcy, a w czwartym zamknęły się na 40 tysięcy. Zrób z tego wykres kosztów kwartalnych."
}

print("Wysyłam zapytanie o Wykres na podstawie samego tekstu do", url, "...")
response = requests.post(url, json=payload)

if response.status_code == 200:
    with open("test_ai_wykres.png", "wb") as f:
        f.write(response.content)
    print("Sukces! Zapisano plik 'test_ai_wykres.png'.")
else:
    print("Błąd:", response.status_code, response.text)
