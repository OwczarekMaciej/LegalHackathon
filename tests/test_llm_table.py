import requests
import json

url = "http://127.0.0.1:8000/viz/generate-png"
payload = {
  "visualization_type": "table",
  "context": "Zestawienie pracowników zatrudnionych w dziale IT: Jan Kowalski (Stanowisko: Senior Developer, Wynagrodzenie: 15000 PLN, Data zatrudnienia: 2021-05-10), Anna Nowak (Stanowisko: UX Designer, Wynagrodzenie: 12000 PLN, Data zatrudnienia: 2022-03-01), Piotr Wiśniewski (Stanowisko: DevOps Engineer, Wynagrodzenie: 14000 PLN, Data zatrudnienia: 2023-01-15)."
}

print("Wysyłam zapytanie o Tabelę do", url, "...")
response = requests.post(url, json=payload)

if response.status_code == 200:
    print("Sukces! Otrzymano JSON:")
    print(json.dumps(response.json(), indent=2, ensure_ascii=False))
else:
    print("Błąd:", response.status_code, response.text)
